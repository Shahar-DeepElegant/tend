import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
    GardenCard,
    GardenText,
    PillButton,
} from "@/components/ui/garden-primitives";
import {
    GardenColors,
    GardenFonts,
    GardenRadius,
    GardenSpacing,
} from "@/constants/design-system";
import {
    formatLastSpokeLabel,
    getUpNextContacts,
    type UpNextContactRow,
} from "@/lib/db";

import { AddContactModal } from "./up-next/add-contact-modal";

type ReminderSection = {
  title: string;
  items: UpNextContactRow[];
};

export function UpNextScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [contacts, setContacts] = useState<UpNextContactRow[]>([]);
  const [addOpen, setAddOpen] = useState(false);

  const reload = useCallback(async () => {
    const rows = await getUpNextContacts();
    setContacts(rows);
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const sections = useMemo(() => {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const nextDay = now + dayMs;
    const nextWeek = now + dayMs * 7;

    const needsWater = contacts.filter((item) => item.overdueSeconds > 0);
    const today = contacts.filter(
      (item) =>
        item.overdueSeconds <= 0 &&
        item.dueAt &&
        new Date(item.dueAt).getTime() <= nextDay,
    );
    const thisWeek = contacts.filter(
      (item) =>
        item.overdueSeconds <= 0 &&
        item.dueAt &&
        new Date(item.dueAt).getTime() > nextDay &&
        new Date(item.dueAt).getTime() <= nextWeek,
    );
    return [
      { title: "Needs Water", items: needsWater },
      { title: "Today", items: today },
      { title: "This Week", items: thisWeek },
    ] as ReminderSection[];
  }, [contacts]);

  const thirstyCount = contacts.filter(
    (item) => item.overdueSeconds > 0,
  ).length;
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const nextDay = now + dayMs;
  const nextWeek = now + dayMs * 7;
  const waterTodayCount = contacts.filter(
    (item) =>
      item.overdueSeconds <= 0 &&
      item.dueAt &&
      new Date(item.dueAt).getTime() <= nextDay,
  ).length;
  const waterThisWeekCount = contacts.filter(
    (item) =>
      item.overdueSeconds <= 0 &&
      item.dueAt &&
      new Date(item.dueAt).getTime() > nextDay &&
      new Date(item.dueAt).getTime() <= nextWeek,
  ).length;

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: insets.bottom,
            paddingTop: insets.top,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <GardenText variant="meta" style={styles.dateText}>
              Relationship queue
            </GardenText>
            <GardenText variant="title">Up Next</GardenText>
          </View>
          <View style={styles.statsWrap}>
            <View style={[styles.statCard, styles.statPrimary]}>
              <GardenText variant="section" color={GardenColors.sage}>
                {thirstyCount}
              </GardenText>
              <GardenText variant="meta" color={GardenColors.sage}>
                THIRSTY
              </GardenText>
            </View>
            <View style={styles.statCard}>
              <GardenText variant="section">{waterTodayCount}</GardenText>
              <GardenText variant="meta">TODAY</GardenText>
            </View>
            <View style={styles.statCard}>
              <GardenText variant="section">{waterThisWeekCount}</GardenText>
              <GardenText variant="meta">THIS WEEK</GardenText>
            </View>
          </View>
        </View>

        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <GardenText
              variant="section"
              style={[
                styles.sectionTitle,
                section.title === "Needs Water"
                  ? { color: GardenColors.terracotta }
                  : null,
              ]}
            >
              {section.title}
            </GardenText>
            {section.items.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyOrb}>
                  <MaterialIcons
                    name="local-florist"
                    size={42}
                    color={GardenColors.sage}
                  />
                </View>
                <GardenText
                  variant="body"
                  style={styles.emptyCopy}
                  color={GardenColors.stone}
                >
                  Everything is watered and growing.
                </GardenText>
              </View>
            ) : (
              section.items.map((item) => (
                <ReminderRow
                  key={item.systemId}
                  item={item}
                  onOpenProfile={() =>
                    router.push({
                      pathname: "/leaf-profile",
                      params: { contactId: item.systemId },
                    })
                  }
                  onWater={() =>
                    router.push({
                      pathname: "/watering",
                      params: { contactId: item.systemId },
                    })
                  }
                />
              ))
            )}
          </View>
        ))}
      </ScrollView>

      <Pressable
        style={[styles.fab, { bottom: insets.bottom }]}
        onPress={() => setAddOpen(true)}
      >
        <MaterialIcons name="add" size={30} color={GardenColors.white} />
      </Pressable>

      <AddContactModal
        visible={addOpen}
        onClose={() => setAddOpen(false)}
        onAdded={reload}
      />
    </SafeAreaView>
  );
}

function ReminderRow({
  item,
  onOpenProfile,
  onWater,
}: {
  item: UpNextContactRow;
  onOpenProfile: () => void;
  onWater: () => void;
}) {
  const initials = initialsFromName(item.nickName || item.fullName);
  return (
    <GardenCard overdue={item.isOverdue} style={styles.card}>
      <View style={styles.row}>
        <Pressable style={styles.touchArea} onPress={onOpenProfile}>
          <View style={styles.avatarWrap}>
            {item.imageUri ? (
              <Image source={item.imageUri} style={styles.avatar} />
            ) : (
              <View style={styles.initialAvatar}>
                <GardenText variant="button" color={GardenColors.sage}>
                  {initials}
                </GardenText>
              </View>
            )}
            {item.isOverdue ? (
              <View style={styles.overdueBadge}>
                <GardenText variant="button" color="#fff">
                  !
                </GardenText>
              </View>
            ) : null}
          </View>
          <View style={styles.copyCol}>
            <GardenText variant="section" style={styles.nameText}>
              {item.fullName}
            </GardenText>
            <GardenText
              variant="meta"
              color={
                item.isOverdue ? GardenColors.terracotta : GardenColors.stone
              }
            >
              {formatLastSpokeLabel(item.lastSpokeAt)}
            </GardenText>
          </View>
        </Pressable>
        <PillButton
          tone={item.isOverdue ? "primary" : "ghost"}
          onPress={onWater}
        >
          <MaterialIcons
            name="water-drop"
            size={22}
            color={item.isOverdue ? GardenColors.white : GardenColors.sage}
          />
        </PillButton>
      </View>
    </GardenCard>
  );
}

function initialsFromName(name: string) {
  const parts = name.split(" ").filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0].slice(0, 1)}${parts[parts.length - 1].slice(0, 1)}`.toUpperCase();
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: GardenColors.cream,
  },
  content: {
    paddingHorizontal: GardenSpacing.md,
    paddingTop: GardenSpacing.sm,
    gap: GardenSpacing.lg,
  },
  header: {
    gap: GardenSpacing.md,
  },
  dateText: {
    fontFamily: GardenFonts.ui,
  },
  statsWrap: {
    flexDirection: "row",
    gap: GardenSpacing.sm,
  },
  statCard: {
    flex: 1,
    minWidth: 0,
    borderRadius: GardenRadius.card,
    borderWidth: 1,
    borderColor: GardenColors.border,
    backgroundColor: GardenColors.white,
    padding: GardenSpacing.md,
    gap: 4,
  },
  statPrimary: {
    backgroundColor: "#EBF2EA",
    borderColor: "#D6E5D5",
  },
  section: {
    gap: GardenSpacing.sm,
  },
  sectionTitle: {
    fontStyle: "italic",
  },
  card: {
    marginBottom: GardenSpacing.sm,
    paddingVertical: GardenSpacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: GardenSpacing.sm,
  },
  touchArea: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: GardenSpacing.sm,
  },
  avatarWrap: {
    position: "relative",
  },
  initialAvatar: {
    width: 56,
    height: 56,
    borderRadius: GardenRadius.chip,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E9F1E8",
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: GardenRadius.chip,
  },
  overdueBadge: {
    position: "absolute",
    right: -4,
    bottom: -4,
    width: 20,
    height: 20,
    borderRadius: GardenRadius.chip,
    backgroundColor: GardenColors.terracotta,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#fff",
  },
  copyCol: {
    flex: 1,
    gap: 2,
  },
  nameText: {
    fontSize: 22,
    lineHeight: 26,
  },
  emptyState: {
    alignItems: "center",
    gap: GardenSpacing.sm,
    paddingVertical: GardenSpacing.lg,
  },
  emptyOrb: {
    width: 112,
    height: 112,
    borderRadius: 56,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E9F2E8",
  },
  emptyCopy: {
    textAlign: "center",
    maxWidth: 220,
  },
  fab: {
    position: "absolute",
    right: GardenSpacing.md,
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: GardenColors.sage,
    shadowColor: GardenColors.sage,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 7,
  },
});
