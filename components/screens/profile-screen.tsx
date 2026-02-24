import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Constants from "expo-constants";
import * as Sharing from "expo-sharing";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
    Alert,
    Platform,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Switch,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GardenText } from "@/components/ui/garden-primitives";
import {
    GardenColors,
    GardenRadius,
    GardenSpacing,
} from "@/constants/design-system";
import { getConfig, updateConfig, type AppConfig } from "@/lib/db";
import {
  createDatabaseBackupFile,
  createXlsxExportFile,
} from "@/lib/export/profile-export";
import {
  refreshReminderNotificationSchedule,
  rescheduleOnConfigChange,
} from "@/lib/notifications";

import {
    profileActions,
    profileHeader,
    profileSections,
    type ProfileRow,
    type ProfileToggleId,
} from "./profile.data";
import { CustomCirclesModal } from "./profile/custom-circles-modal";
import { PrivacyPolicyModal } from "./profile/privacy-policy-modal";
import { ReminderFrequencyModal } from "./profile/reminder-frequency-modal";

export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const appVersion = Constants.expoConfig?.version ?? "Unknown";
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [customCirclesOpen, setCustomCirclesOpen] = useState(false);
  const [reminderFrequencyOpen, setReminderFrequencyOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [busyActionId, setBusyActionId] = useState<"backup" | "export" | null>(
    null,
  );

  const reload = useCallback(async () => {
    const value = await getConfig();
    setConfig(value);
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const updateToggle = async (toggleId: ProfileToggleId, value: boolean) => {
    if (!config) return;
    if (toggleId === "fuzzyReminders") {
      await updateConfig({ fuzzyRemindersEnabled: value });
      await refreshReminderNotificationSchedule({ reason: "data" });
      setConfig({ ...config, fuzzyRemindersEnabled: value });
      return;
    }
    await updateConfig({ automaticLogging: value });
    setConfig({ ...config, automaticLogging: value });
  };

  const handleRowPress = (rowId: string) => {
    if (rowId === "custom-circles") {
      setCustomCirclesOpen(true);
      return;
    }
    if (rowId === "reminder-frequency") {
      setReminderFrequencyOpen(true);
    }
  };

  const toggles: Record<ProfileToggleId, boolean> = {
    fuzzyReminders: config?.fuzzyRemindersEnabled ?? true,
    automaticLogMode: config?.automaticLogging ?? false,
  };

  const handleActionPress = async (actionId: "backup" | "export") => {
    if (busyActionId) return;

    if (Platform.OS === "web") {
      Alert.alert(
        "Unavailable on web",
        "Backup and export are currently supported on iOS and Android only.",
      );
      return;
    }

    setBusyActionId(actionId);
    try {
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        throw new Error("File sharing is not available on this device.");
      }

      const file =
        actionId === "backup"
          ? await createDatabaseBackupFile()
          : await createXlsxExportFile();

      await Sharing.shareAsync(file.uri, {
        dialogTitle:
          actionId === "backup"
            ? "Share database backup"
            : "Share contacts and logs export",
        mimeType:
          actionId === "backup"
            ? "application/octet-stream"
            : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        UTI:
          actionId === "backup"
            ? "public.database"
            : "org.openxmlformats.spreadsheetml.sheet",
      });
    } catch (error) {
      console.error(`Failed to ${actionId}`, error);
      Alert.alert(
        `Unable to ${actionId}`,
        "Something went wrong while preparing this file. Please try again.",
      );
    } finally {
      setBusyActionId(null);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top, paddingBottom: 120 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <GardenText variant="title" style={styles.title}>
            {profileHeader.title}
          </GardenText>
          <GardenText variant="meta" style={styles.subtitle} color="#5F6E5E">
            {profileHeader.subtitle}
          </GardenText>
        </View>

        {profileSections
          .filter((section) => section.id !== "interaction-logging")
          .map((section) => (
            <View key={section.id} style={styles.section}>
              <GardenText variant="section" style={styles.sectionTitle}>
                {section.title}
              </GardenText>
              <View style={styles.card}>
                {section.rows.map((row, index) => (
                  <View key={row.id}>
                    <ProfileRowItem
                      row={row}
                      toggleValue={
                        row.type === "toggle" ? toggles[row.toggleId] : false
                      }
                      onToggle={updateToggle}
                      onPress={
                        row.type === "chevron"
                          ? () => handleRowPress(row.id)
                          : undefined
                      }
                    />
                    {index < section.rows.length - 1 ? (
                      <View style={styles.rowDivider} />
                    ) : null}
                  </View>
                ))}
              </View>
            </View>
          ))}

        <View style={styles.section}>
          <GardenText variant="section" style={styles.sectionTitle}>
            Data and Growth
          </GardenText>
          <View style={styles.actionGrid}>
            {profileActions.map((action) => (
              <Pressable
                key={action.id}
                style={[
                  styles.actionButton,
                  busyActionId ? styles.actionButtonDisabled : null,
                ]}
                onPress={() =>
                  handleActionPress(action.id as "backup" | "export")
                }
                disabled={busyActionId !== null}
              >
                <View
                  style={[
                    styles.actionIconWrap,
                    action.tone === "blue"
                      ? styles.actionIconBlue
                      : styles.actionIconOrange,
                  ]}
                >
                  <MaterialIcons
                    name={action.icon as keyof typeof MaterialIcons.glyphMap}
                    size={22}
                    color={action.tone === "blue" ? "#2B6BE8" : "#D67A2C"}
                  />
                </View>
                <GardenText variant="body" style={styles.actionTitle}>
                  {action.title}
                </GardenText>
                <GardenText variant="meta" style={styles.actionSubtitle}>
                  {action.subtitle}
                </GardenText>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.aboutSection}>
          <View style={styles.versionBadge}>
            <MaterialIcons
              name="info-outline"
              size={16}
              color={GardenColors.sage}
            />
            <GardenText variant="meta" color="#5F6E5E">
              {`Version ${appVersion}`}
            </GardenText>
          </View>
          <View style={styles.aboutLinks}>
            <Pressable>
              <GardenText
                variant="meta"
                style={styles.aboutLink}
                color={GardenColors.forest}
              >
                Support
              </GardenText>
            </Pressable>
            <Pressable onPress={() => setPrivacyOpen(true)}>
              <GardenText
                variant="meta"
                style={styles.aboutLink}
                color={GardenColors.forest}
              >
                Privacy
              </GardenText>
            </Pressable>
          </View>
          <MaterialIcons name="eco" size={30} color="#9AAC98" />
        </View>
      </ScrollView>

      <CustomCirclesModal
        visible={customCirclesOpen}
        onClose={() => setCustomCirclesOpen(false)}
        initialCadenceDays={{
          inner: config?.defaultCadenceInnerDays ?? 14,
          mid: config?.defaultCadenceMidDays ?? 30,
          outer: config?.defaultCadenceOuterDays ?? 90,
        }}
        onSave={(value) => {
          updateConfig({
            defaultCadenceInnerDays: value.inner,
            defaultCadenceMidDays: value.mid,
            defaultCadenceOuterDays: value.outer,
          })
            .then(async () => {
              await reload();
              await refreshReminderNotificationSchedule({ reason: "data" });
            })
            .catch((error) => {
              console.error("Failed to update default cadence", error);
            });
        }}
      />
      <ReminderFrequencyModal
        visible={reminderFrequencyOpen}
        onClose={() => setReminderFrequencyOpen(false)}
        initialKeepPersistent={config?.shouldKeepRemindersPersistent ?? true}
        initialReminderTime={config?.reminderNotificationTime ?? "10:00"}
        initialContactEventsReminderDays={
          config?.contactEventsReminderDays ?? 7
        }
        onSave={(value) => {
          updateConfig(value)
            .then(async () => {
              await reload();
              await rescheduleOnConfigChange();
            })
            .catch((error) => {
              console.error("Failed to update reminder settings", error);
            });
        }}
      />
      <PrivacyPolicyModal visible={privacyOpen} onClose={() => setPrivacyOpen(false)} />
    </SafeAreaView>
  );
}

function ProfileRowItem({
  row,
  toggleValue,
  onToggle,
  onPress,
}: {
  row: ProfileRow;
  toggleValue: boolean;
  onToggle: (toggleId: ProfileToggleId, value: boolean) => void;
  onPress?: () => void;
}) {
  return (
    <Pressable
      style={styles.row}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? "button" : undefined}
    >
      <View style={styles.rowLeft}>
        <View style={styles.rowIconWrap}>
          <MaterialIcons name={row.icon} size={20} color={GardenColors.sage} />
        </View>
        <View style={styles.rowCopy}>
          <GardenText variant="body" style={styles.rowTitle}>
            {row.title}
          </GardenText>
          <GardenText variant="meta" color="#6D7B6C">
            {row.subtitle}
          </GardenText>
        </View>
      </View>
      {row.type === "toggle" ? (
        <Switch
          value={toggleValue}
          onValueChange={(value) => onToggle(row.toggleId, value)}
          trackColor={{ false: "#D9E2D6", true: GardenColors.sage }}
          thumbColor={GardenColors.white}
        />
      ) : null}
      {row.type === "chevron" ? (
        <MaterialIcons name="chevron-right" size={24} color="#A2AEA0" />
      ) : null}
      {row.type === "status" ? (
        <View style={styles.statusPill}>
          <GardenText variant="button" color="#4A9A2D">
            {row.status}
          </GardenText>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: GardenColors.cream,
  },
  content: {
    paddingHorizontal: GardenSpacing.md,
    paddingTop: GardenSpacing.sm,
    paddingBottom: 120,
    gap: GardenSpacing.lg,
  },
  header: {
    gap: 8,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backAction: {
    width: 40,
    height: 40,
    borderRadius: GardenRadius.chip,
    backgroundColor: "#E8F0E8",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarWrap: {
    width: 40,
    height: 40,
    borderRadius: GardenRadius.chip,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(90,125,88,0.2)",
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  title: {
    color: GardenColors.forest,
  },
  subtitle: {
    fontStyle: "italic",
  },
  section: {
    gap: GardenSpacing.sm,
  },
  sectionTitle: {
    fontSize: 27,
    lineHeight: 31,
    color: "#253325",
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: GardenColors.white,
    borderWidth: 1,
    borderColor: "rgba(90,125,88,0.08)",
    borderRadius: 22,
    paddingVertical: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  rowLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rowIconWrap: {
    width: 40,
    height: 40,
    borderRadius: GardenRadius.chip,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8F0E8",
  },
  rowCopy: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 18,
    lineHeight: 22,
    color: "#213021",
  },
  rowDivider: {
    height: 1,
    marginLeft: 64,
    backgroundColor: "rgba(90,125,88,0.08)",
  },
  statusPill: {
    backgroundColor: "rgba(74,154,45,0.12)",
    borderRadius: GardenRadius.chip,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  actionGrid: {
    flexDirection: "row",
    gap: 10,
  },
  actionButton: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 20,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(90,125,88,0.08)",
    backgroundColor: GardenColors.white,
    gap: 6,
  },
  actionButtonDisabled: {
    opacity: 0.65,
  },
  actionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: GardenRadius.chip,
    alignItems: "center",
    justifyContent: "center",
  },
  actionIconBlue: {
    backgroundColor: "#EAF2FF",
  },
  actionIconOrange: {
    backgroundColor: "#FFF1E4",
  },
  actionTitle: {
    fontSize: 17,
    lineHeight: 22,
  },
  actionSubtitle: {
    textTransform: "uppercase",
    letterSpacing: 0.6,
    fontSize: 11,
    textAlign: "center",
  },
  aboutSection: {
    alignItems: "center",
    gap: 14,
    paddingBottom: 24,
  },
  versionBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: GardenRadius.chip,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "rgba(90,125,88,0.08)",
    borderWidth: 1,
    borderColor: "rgba(90,125,88,0.1)",
  },
  aboutLinks: {
    flexDirection: "row",
    gap: 28,
  },
  aboutLink: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(44,54,43,0.18)",
    paddingBottom: 2,
  },
});
