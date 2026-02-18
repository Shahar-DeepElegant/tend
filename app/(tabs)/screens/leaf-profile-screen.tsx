import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Contacts from "expo-contacts";
import { Image } from "expo-image";
import * as Linking from "expo-linking";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    Alert,
    Modal,
    Platform,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GardenText } from "@/components/ui/garden-primitives";
import {
    GardenColors,
    GardenRadius,
    GardenSpacing,
} from "@/constants/design-system";
import {
    deleteContact,
    getFirstContactId,
    getLeafProfileData,
    updateContactFields,
} from "@/lib/db";
import type { ContactLogRecord, LeafProfileData } from "@/lib/db/types";

type GrowthRingType = "coffee" | "call" | "text" | "email";
type MessageChannel = "whatsapp" | "telegram" | "instagram" | "mail";

type ContactChannels = {
  phone: string | null;
  email: string | null;
  telegramUsername: string | null;
  instagramUsername: string | null;
};

const CADENCE_PRESETS = [7, 14, 30, 90];

const MESSAGE_CHANNEL_OPTIONS: {
  key: MessageChannel;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
}[] = [
  { key: "whatsapp", label: "WhatsApp", icon: "chat" },
  { key: "telegram", label: "Telegram", icon: "send" },
  { key: "instagram", label: "Instagram", icon: "photo-camera" },
  { key: "mail", label: "Mail", icon: "mail" },
];

const ringIconByType: Record<
  GrowthRingType,
  keyof typeof MaterialIcons.glyphMap
> = {
  coffee: "local-cafe",
  call: "call",
  text: "chat-bubble",
  email: "mail",
};

export function LeafProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ contactId?: string }>();
  const [profile, setProfile] = useState<LeafProfileData | null>(null);
  const [messageModalVisible, setMessageModalVisible] = useState(false);
  const [cadenceModalVisible, setCadenceModalVisible] = useState(false);
  const [cadenceDraft, setCadenceDraft] = useState("");
  const [cadenceSaving, setCadenceSaving] = useState(false);
  const [soilDraft, setSoilDraft] = useState("");
  const [soilSaving, setSoilSaving] = useState(false);
  const [contactActionBusy, setContactActionBusy] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [actionsMenuVisible, setActionsMenuVisible] = useState(false);
  const currentSystemId = profile?.contact.systemId ?? null;
  const currentDescription = profile?.contact.description ?? null;

  const reload = useCallback(async () => {
    const targetId =
      typeof params.contactId === "string"
        ? params.contactId
        : await getFirstContactId();
    if (!targetId) {
      setProfile(null);
      return;
    }
    const data = await getLeafProfileData(targetId);
    setProfile(data);
  }, [params.contactId]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  useEffect(() => {
    if (!currentSystemId) {
      setSoilDraft("");
      return;
    }
    setSoilDraft(currentDescription ?? "");
  }, [currentDescription, currentSystemId]);

  const handleCallPress = useCallback(async () => {
    if (!profile || contactActionBusy) return;
    setContactActionBusy(true);
    try {
      const channels = await loadChannelsForSystemContact(
        profile.contact.systemId,
      );
      const opened = await openFirstUrl([
        channels.phone ? `tel:${channels.phone}` : "",
        "tel:",
      ]);
      if (!opened) {
        Alert.alert(
          "Unable to open call",
          "Could not open the dialer on this device.",
        );
      }
    } finally {
      setContactActionBusy(false);
    }
  }, [contactActionBusy, profile]);

  const handleSelectMessageChannel = useCallback(
    async (channel: MessageChannel) => {
      if (!profile || contactActionBusy) return;
      setMessageModalVisible(false);
      setContactActionBusy(true);
      try {
        const channels = await loadChannelsForSystemContact(
          profile.contact.systemId,
        );
        const candidates = buildMessageChannelUrls(channel, channels);
        const opened = await openFirstUrl(candidates);
        if (!opened) {
          Alert.alert(
            "Unable to open app",
            "Could not open the selected messaging app on this device.",
          );
        }
      } finally {
        setContactActionBusy(false);
      }
    },
    [contactActionBusy, profile],
  );

  const openCadenceModal = useCallback(() => {
    if (!profile) return;
    setCadenceDraft(String(profile.effectiveCadenceDays));
    setCadenceModalVisible(true);
  }, [profile]);

  const handleSaveCadence = useCallback(async () => {
    if (!profile || cadenceSaving) return;
    const parsedDays = Number.parseInt(cadenceDraft.trim(), 10);
    if (!Number.isFinite(parsedDays) || parsedDays < 1 || parsedDays > 3650) {
      Alert.alert("Invalid interval", "Enter a valid number of days (1-3650).");
      return;
    }

    setCadenceSaving(true);
    try {
      await updateContactFields(profile.contact.systemId, {
        customReminderDays: parsedDays,
      });
      setCadenceModalVisible(false);
      await reload();
    } catch {
      Alert.alert("Unable to save cadence", "Please try again.");
    } finally {
      setCadenceSaving(false);
    }
  }, [cadenceDraft, cadenceSaving, profile, reload]);

  const handleResetCadence = useCallback(async () => {
    if (!profile || cadenceSaving) return;
    setCadenceSaving(true);
    try {
      await updateContactFields(profile.contact.systemId, {
        customReminderDays: null,
      });
      setCadenceModalVisible(false);
      await reload();
    } catch {
      Alert.alert("Unable to reset cadence", "Please try again.");
    } finally {
      setCadenceSaving(false);
    }
  }, [cadenceSaving, profile, reload]);

  const handleSoilBlur = useCallback(async () => {
    if (!profile || soilSaving) return;
    const normalizedDescription =
      soilDraft.trim().length === 0 ? null : soilDraft.trim();
    if ((profile.contact.description ?? null) === normalizedDescription) return;

    setSoilSaving(true);
    try {
      await updateContactFields(profile.contact.systemId, {
        description: normalizedDescription,
      });
      setProfile((current) =>
        current
          ? {
              ...current,
              contact: {
                ...current.contact,
                description: normalizedDescription,
              },
            }
          : current,
      );
    } catch {
      Alert.alert(
        "Unable to update soil",
        "Could not save this note. Please try again.",
      );
    } finally {
      setSoilSaving(false);
    }
  }, [profile, soilDraft, soilSaving]);

  const handleDeleteContact = useCallback(() => {
    if (!profile || deleteBusy) return;
    Alert.alert(
      "Remove from Friendly Reminder?",
      "This deletes the contact only here. It will not delete your device contact.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void (async () => {
              setDeleteBusy(true);
              try {
                await deleteContact(profile.contact.systemId);
                router.replace("/");
              } catch {
                Alert.alert("Unable to delete contact", "Please try again.");
              } finally {
                setDeleteBusy(false);
              }
            })();
          },
        },
      ],
    );
  }, [deleteBusy, profile, router]);

  if (!profile) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.emptyState}>
          <GardenText variant="section">No contact selected</GardenText>
          <GardenText variant="meta">
            Add a contact from Up Next to view profile details.
          </GardenText>
        </View>
      </SafeAreaView>
    );
  }

  const growthRings = profile.logs.map(toGrowthRing);
  const lastSpokeText = profile.lastSpokeAt
    ? formatShortDate(profile.lastSpokeAt)
    : "Never";
  const cadenceText = `Every ${profile.effectiveCadenceDays} day${profile.effectiveCadenceDays === 1 ? "" : "s"}`;
  const nextReminderText = profile.dueAt
    ? formatShortDate(profile.dueAt)
    : "Any time";

  return (
    <SafeAreaView style={styles.screen}>
      <View
        style={[
          styles.topArea,
          { paddingTop: insets.top, minHeight: insets.top },
        ]}
      >
        <Pressable
          style={[
            styles.topMenuButton,
            deleteBusy ? styles.disabledAction : null,
          ]}
          onPress={() => setActionsMenuVisible(true)}
          disabled={deleteBusy}
        >
          <MaterialIcons name="more-vert" size={22} color={GardenColors.sage} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileSection}>
          <View style={styles.avatarGlow} />
          <View style={styles.avatarRing}>
            {profile.contact.imageUri ? (
              <Image
                source={profile.contact.imageUri}
                style={styles.avatarImage}
              />
            ) : (
              <View style={styles.avatarFallback}>
                <GardenText variant="section">
                  {initialsFromName(
                    profile.contact.nickName || profile.contact.fullName,
                  )}
                </GardenText>
              </View>
            )}
          </View>
          <View style={styles.statusBadge}>
            <MaterialIcons name="eco" size={18} color="#7A9D78" />
          </View>

          <GardenText variant="title" style={styles.name}>
            {profile.contact.fullName}
          </GardenText>
          <View style={styles.relationPill}>
            <GardenText variant="button" color="#3A5D38">
              {profile.contact.circleId.toUpperCase()} CIRCLE
            </GardenText>
          </View>
        </View>

        <View style={styles.quickActions}>
          <Pressable
            style={[
              styles.quickAction,
              contactActionBusy ? styles.disabledAction : null,
            ]}
            onPress={handleCallPress}
            disabled={contactActionBusy}
          >
            <MaterialIcons name="call" size={20} color="#3A5D38" />
            <GardenText variant="meta" color="#3A5D38">
              Call
            </GardenText>
          </Pressable>
          <Pressable
            style={[
              styles.quickAction,
              contactActionBusy ? styles.disabledAction : null,
            ]}
            onPress={() => setMessageModalVisible(true)}
            disabled={contactActionBusy}
          >
            <MaterialIcons name="chat-bubble" size={20} color="#3A5D38" />
            <GardenText variant="meta" color="#3A5D38">
              Message
            </GardenText>
          </Pressable>
          <Pressable
            style={styles.quickActionPrimary}
            onPress={() =>
              router.push({
                pathname: "/watering",
                params: { contactId: profile.contact.systemId },
              })
            }
          >
            <MaterialIcons
              name="water-drop"
              size={20}
              color={GardenColors.white}
            />
            <GardenText variant="meta" color={GardenColors.white}>
              Log Water
            </GardenText>
          </Pressable>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <GardenText variant="meta" color="#5A7D58">
              LAST SPOKE
            </GardenText>
            <GardenText variant="section" style={styles.statValue}>
              {lastSpokeText}
            </GardenText>
          </View>
          <View style={styles.statCard}>
            <GardenText variant="meta" color="#5A7D58">
              STREAK
            </GardenText>
            <GardenText variant="section" style={styles.statValue}>
              {profile.streakCount}
            </GardenText>
          </View>
        </View>

        <Pressable style={styles.scheduleCard} onPress={openCadenceModal}>
          <View style={styles.scheduleLeft}>
            <View style={styles.scheduleIcon}>
              <MaterialIcons
                name="autorenew"
                size={22}
                color={GardenColors.sage}
              />
            </View>
            <View>
              <GardenText variant="meta" color="#5A7D58">
                Nurture cadence.
              </GardenText>
              <GardenText variant="section" style={styles.scheduleTitle}>
                {cadenceText}
              </GardenText>
              <GardenText variant="meta" color="#5A7D58">
                Next: {nextReminderText}
              </GardenText>
            </View>
          </View>
          <MaterialIcons
            name="chevron-right"
            size={22}
            color={GardenColors.sage}
          />
        </Pressable>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons
              name="psychology-alt"
              size={20}
              color={GardenColors.sage}
            />
            <GardenText variant="section" style={styles.sectionTitle}>
              The Soil
            </GardenText>
          </View>
          <View style={styles.noteCard}>
            <TextInput
              value={soilDraft}
              onChangeText={setSoilDraft}
              onBlur={handleSoilBlur}
              editable={!soilSaving}
              multiline
              placeholder="No notes yet. Add memories during watering logs."
              placeholderTextColor="#728072"
              style={styles.noteInput}
            />
            {soilSaving ? (
              <GardenText variant="meta" color="#5A7D58">
                Saving...
              </GardenText>
            ) : null}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons
              name="history-edu"
              size={20}
              color={GardenColors.sage}
            />
            <GardenText variant="section" style={styles.sectionTitle}>
              Growth Rings
            </GardenText>
          </View>
          <View style={styles.timeline}>
            <View style={styles.timelineLine} />
            {growthRings.map((item) => (
              <View key={item.id} style={styles.timelineItem}>
                <View
                  style={[
                    styles.timelineDot,
                    item.highlighted ? styles.timelineDotActive : null,
                  ]}
                >
                  <MaterialIcons
                    name={ringIconByType[item.type]}
                    size={14}
                    color={
                      item.highlighted ? GardenColors.white : GardenColors.sage
                    }
                  />
                </View>
                <View style={styles.timelineBody}>
                  <View style={styles.timelineHeader}>
                    <GardenText variant="body" style={styles.timelineTitle}>
                      {item.title}
                    </GardenText>
                    <GardenText variant="meta" color="#5A7D58">
                      {item.date}
                    </GardenText>
                  </View>
                  <GardenText variant="meta" color="#5A655A">
                    {item.note}
                  </GardenText>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <Pressable
        style={styles.fab}
        onPress={() =>
          router.push({
            pathname: "/watering",
            params: { contactId: profile.contact.systemId },
          })
        }
      >
        <MaterialIcons name="water-drop" size={32} color={GardenColors.white} />
      </Pressable>

      <Modal
        transparent
        visible={messageModalVisible}
        animationType="slide"
        onRequestClose={() => setMessageModalVisible(false)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <GardenText variant="section">Contact via</GardenText>
              <Pressable
                onPress={() => setMessageModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <MaterialIcons
                  name="close"
                  size={20}
                  color={GardenColors.forest}
                />
              </Pressable>
            </View>
            <View style={styles.messageOptions}>
              {MESSAGE_CHANNEL_OPTIONS.map((option) => (
                <Pressable
                  key={option.key}
                  style={styles.messageOption}
                  onPress={() => handleSelectMessageChannel(option.key)}
                >
                  <View style={styles.messageOptionIcon}>
                    <MaterialIcons
                      name={option.icon}
                      size={18}
                      color={GardenColors.sage}
                    />
                  </View>
                  <GardenText variant="body">{option.label}</GardenText>
                </Pressable>
              ))}
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      <Modal
        transparent
        visible={cadenceModalVisible}
        animationType="slide"
        onRequestClose={() => setCadenceModalVisible(false)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <GardenText variant="section">Nurture cadence</GardenText>
              <Pressable
                onPress={() => setCadenceModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <MaterialIcons
                  name="close"
                  size={20}
                  color={GardenColors.forest}
                />
              </Pressable>
            </View>

            <GardenText variant="meta" color="#617260">
              Select a custom interval in days for this person.
            </GardenText>

            <View style={styles.cadenceChips}>
              {CADENCE_PRESETS.map((days) => {
                const selected = cadenceDraft.trim() === String(days);
                return (
                  <Pressable
                    key={days}
                    style={[
                      styles.cadenceChip,
                      selected ? styles.cadenceChipActive : null,
                    ]}
                    onPress={() => setCadenceDraft(String(days))}
                  >
                    <GardenText
                      variant="meta"
                      color={
                        selected ? GardenColors.white : GardenColors.forest
                      }
                    >
                      {days} days
                    </GardenText>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.cadenceInputWrap}>
              <GardenText variant="meta" color="#5A7D58">
                Custom days
              </GardenText>
              <TextInput
                value={cadenceDraft}
                onChangeText={setCadenceDraft}
                keyboardType="number-pad"
                editable={!cadenceSaving}
                style={styles.cadenceInput}
                placeholder="Enter days"
                placeholderTextColor="#7A8B79"
              />
            </View>

            <View style={styles.modalActions}>
              <Pressable
                style={[
                  styles.secondaryBtn,
                  cadenceSaving ? styles.disabledAction : null,
                ]}
                onPress={handleResetCadence}
                disabled={cadenceSaving}
              >
                <GardenText variant="button" color={GardenColors.sage}>
                  Reset to circle default
                </GardenText>
              </Pressable>
              <Pressable
                style={[
                  styles.primaryBtn,
                  cadenceSaving ? styles.disabledAction : null,
                ]}
                onPress={handleSaveCadence}
                disabled={cadenceSaving}
              >
                <GardenText variant="button" color={GardenColors.white}>
                  Save cadence
                </GardenText>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      <Modal
        transparent
        visible={actionsMenuVisible}
        animationType="fade"
        onRequestClose={() => setActionsMenuVisible(false)}
      >
        <SafeAreaView style={styles.menuOverlay}>
          <Pressable
            style={styles.menuBackdrop}
            onPress={() => setActionsMenuVisible(false)}
          />
          <View style={styles.menuPanel}>
            <Pressable
              style={styles.menuItem}
              onPress={() => {
                setActionsMenuVisible(false);
                handleDeleteContact();
              }}
            >
              <MaterialIcons
                name="delete-outline"
                size={20}
                color={GardenColors.terracotta}
              />
              <GardenText variant="body" color={GardenColors.terracotta}>
                Delete contact
              </GardenText>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function toGrowthRing(log: ContactLogRecord, index: number) {
  const lower = log.summary.toLowerCase();
  const type: GrowthRingType = lower.includes("call")
    ? "call"
    : lower.includes("email")
      ? "email"
      : lower.includes("coffee")
        ? "coffee"
        : "text";
  return {
    id: String(log.id),
    type,
    title: type.charAt(0).toUpperCase() + type.slice(1),
    date: formatShortDate(log.createdAt),
    note: log.summary,
    highlighted: index === 0,
  };
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
}

function initialsFromName(name: string) {
  const parts = name.split(" ").filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0].slice(0, 1)}${parts[parts.length - 1].slice(0, 1)}`.toUpperCase();
}

async function openFirstUrl(candidates: string[]) {
  for (const url of candidates) {
    if (!url) continue;
    try {
      await Linking.openURL(url);
      return true;
    } catch {
      // try next candidate
    }
  }
  return false;
}

async function loadChannelsForSystemContact(
  systemId: string,
): Promise<ContactChannels> {
  if (Platform.OS === "web") {
    return {
      phone: null,
      email: null,
      telegramUsername: null,
      instagramUsername: null,
    };
  }

  try {
    const permission = await Contacts.requestPermissionsAsync();
    if (permission.status !== "granted") {
      return {
        phone: null,
        email: null,
        telegramUsername: null,
        instagramUsername: null,
      };
    }

    const contact = await Contacts.getContactByIdAsync(systemId, [
      Contacts.Fields.PhoneNumbers,
      Contacts.Fields.Emails,
      Contacts.Fields.InstantMessageAddresses,
      Contacts.Fields.SocialProfiles,
      Contacts.Fields.UrlAddresses,
    ]);

    if (!contact) {
      return {
        phone: null,
        email: null,
        telegramUsername: null,
        instagramUsername: null,
      };
    }

    const preferredPhone = pickPreferred(
      contact.phoneNumbers ?? [],
      (entry) => entry.number ?? entry.digits ?? null,
    );
    const phoneRaw = preferredPhone?.digits ?? preferredPhone?.number ?? null;
    const email =
      pickPreferred(contact.emails ?? [], (entry) => entry.email ?? null)
        ?.email ?? null;

    const telegramFromIM =
      pickByService(contact.instantMessageAddresses ?? [], ["telegram"])
        ?.username ??
      pickByService(contact.socialProfiles ?? [], ["telegram"])?.username ??
      usernameFromUrls(contact.urlAddresses ?? [], ["t.me", "telegram.me"]);

    const instagramFromSocial =
      pickByService(contact.socialProfiles ?? [], ["instagram"])?.username ??
      usernameFromUrls(contact.urlAddresses ?? [], ["instagram.com"]);

    return {
      phone: normalizePhone(phoneRaw),
      email,
      telegramUsername: sanitizeUsername(telegramFromIM),
      instagramUsername: sanitizeUsername(instagramFromSocial),
    };
  } catch {
    return {
      phone: null,
      email: null,
      telegramUsername: null,
      instagramUsername: null,
    };
  }
}

function pickPreferred<T extends { isPrimary?: boolean }>(
  entries: T[],
  valueGetter: (entry: T) => string | null,
): T | null {
  const withValue = entries.filter((entry) => Boolean(valueGetter(entry)));
  if (withValue.length === 0) return null;
  return withValue.find((entry) => entry.isPrimary) ?? withValue[0];
}

function pickByService<
  T extends {
    service?: string;
    localizedService?: string;
    label?: string;
    username?: string;
  },
>(entries: T[], services: string[]) {
  const lowerServices = services.map((service) => service.toLowerCase());
  return (
    entries.find((entry) => {
      const haystack =
        `${entry.service ?? ""} ${entry.localizedService ?? ""} ${entry.label ?? ""}`.toLowerCase();
      return lowerServices.some((service) => haystack.includes(service));
    }) ?? null
  );
}

function usernameFromUrls(urls: { url?: string }[], hosts: string[]) {
  const lowerHosts = hosts.map((host) => host.toLowerCase());
  for (const entry of urls) {
    const urlValue = (entry.url ?? "").trim();
    if (!urlValue) continue;
    try {
      const parsed = new URL(
        urlValue.startsWith("http") ? urlValue : `https://${urlValue}`,
      );
      if (
        !lowerHosts.some((host) => parsed.hostname.toLowerCase().includes(host))
      )
        continue;
      const firstSegment = parsed.pathname.split("/").filter(Boolean)[0];
      if (firstSegment) return firstSegment;
    } catch {
      continue;
    }
  }
  return null;
}

function sanitizeUsername(value: string | null | undefined) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.replace(/^@+/, "").split("/")[0] || null;
}

function normalizePhone(phoneRaw: string | null | undefined) {
  if (!phoneRaw) return null;
  const trimmed = phoneRaw.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("+")) {
    const withPlus = `+${trimmed.slice(1).replace(/\D/g, "")}`;
    return withPlus.length > 1 ? withPlus : null;
  }
  const digits = trimmed.replace(/\D/g, "");
  return digits || null;
}

function digitsOnly(phone: string | null) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  return digits || null;
}

function buildMessageChannelUrls(
  channel: MessageChannel,
  channels: ContactChannels,
) {
  if (channel === "whatsapp") {
    const digits = digitsOnly(channels.phone);
    return digits
      ? [
          `whatsapp://send?phone=${digits}`,
          `https://wa.me/${digits}`,
          "whatsapp://send",
        ]
      : ["whatsapp://send"];
  }

  if (channel === "telegram") {
    return channels.telegramUsername
      ? [
          `tg://resolve?domain=${channels.telegramUsername}`,
          `https://t.me/${channels.telegramUsername}`,
          "tg://",
        ]
      : ["tg://"];
  }

  if (channel === "instagram") {
    return channels.instagramUsername
      ? [
          `instagram://user?username=${channels.instagramUsername}`,
          `https://instagram.com/${channels.instagramUsername}`,
          "instagram://app",
        ]
      : ["instagram://app"];
  }

  return channels.email
    ? [`mailto:${encodeURIComponent(channels.email)}`, "mailto:"]
    : ["mailto:"];
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: GardenColors.cream,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 24,
  },
  topArea: {
    paddingHorizontal: GardenSpacing.md,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  topMenuButton: {
    width: 40,
    height: 40,
    borderRadius: GardenRadius.chip,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: GardenColors.white,
    borderWidth: 1,
    borderColor: GardenColors.border,
  },
  content: {
    paddingHorizontal: GardenSpacing.md,
    paddingBottom: 120,
    gap: GardenSpacing.lg,
  },
  profileSection: {
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  avatarGlow: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: GardenRadius.chip,
    backgroundColor: "rgba(122,157,120,0.2)",
    top: -4,
  },
  avatarRing: {
    width: 132,
    height: 132,
    borderRadius: GardenRadius.chip,
    borderWidth: 4,
    borderColor: GardenColors.white,
    overflow: "hidden",
  },
  avatarFallback: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8F0E8",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  statusBadge: {
    position: "absolute",
    right: 2,
    top: 98,
    width: 32,
    height: 32,
    borderRadius: GardenRadius.chip,
    backgroundColor: GardenColors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    marginTop: 6,
    fontSize: 36,
    lineHeight: 40,
    color: "#1E2B1F",
  },
  relationPill: {
    borderRadius: GardenRadius.chip,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: "#E8F0E8",
  },
  quickActions: {
    flexDirection: "row",
    gap: 10,
  },
  quickAction: {
    flex: 1,
    minHeight: 76,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(90,125,88,0.2)",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    backgroundColor: GardenColors.white,
  },
  quickActionPrimary: {
    flex: 1,
    minHeight: 76,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    backgroundColor: GardenColors.sage,
  },
  disabledAction: {
    opacity: 0.6,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: GardenColors.white,
    borderWidth: 1,
    borderColor: "rgba(90,125,88,0.1)",
    borderRadius: 24,
    padding: GardenSpacing.md,
    gap: 4,
  },
  statValue: {
    fontSize: 24,
    lineHeight: 28,
    color: "#1E2B1F",
  },
  scheduleCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(90,125,88,0.1)",
    backgroundColor: GardenColors.white,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  scheduleLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  scheduleIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#E8F0E8",
    alignItems: "center",
    justifyContent: "center",
  },
  scheduleTitle: {
    fontSize: 24,
    lineHeight: 28,
    color: "#1E2B1F",
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 30,
    lineHeight: 34,
    color: "#1E2B1F",
  },
  noteCard: {
    gap: 8,
    borderRadius: 24,
    backgroundColor: "#F2EFE9",
    borderWidth: 1,
    borderColor: "rgba(90,125,88,0.05)",
    padding: GardenSpacing.md,
    paddingTop: 22,
  },
  noteInput: {
    minHeight: 92,
    textAlignVertical: "top",
    color: "#4A554A",
    fontSize: 16,
    fontStyle: "italic",
    lineHeight: 22,
  },
  timeline: {
    position: "relative",
    paddingLeft: 6,
    gap: GardenSpacing.md,
  },
  timelineLine: {
    position: "absolute",
    left: 16,
    top: 8,
    bottom: 8,
    width: 2,
    borderRadius: 999,
    backgroundColor: "rgba(90,125,88,0.2)",
  },
  timelineItem: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  timelineDot: {
    width: 22,
    height: 22,
    borderRadius: GardenRadius.chip,
    borderWidth: 2,
    borderColor: GardenColors.sage,
    backgroundColor: GardenColors.cream,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    marginTop: 2,
  },
  timelineDotActive: {
    backgroundColor: GardenColors.sage,
  },
  timelineBody: {
    flex: 1,
    gap: 4,
  },
  timelineHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 8,
  },
  timelineTitle: {
    fontSize: 19,
    color: "#1E2B1F",
  },
  menuOverlay: {
    flex: 1,
  },
  menuBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
  },
  menuPanel: {
    marginTop: 62,
    marginRight: GardenSpacing.md,
    alignSelf: "flex-end",
    minWidth: 180,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: GardenColors.border,
    backgroundColor: GardenColors.white,
    paddingVertical: 6,
  },
  menuItem: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
  },
  fab: {
    position: "absolute",
    right: GardenSpacing.md,
    bottom: 24,
    width: 64,
    height: 64,
    borderRadius: GardenRadius.chip,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: GardenColors.sage,
    shadowColor: GardenColors.sage,
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 18,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(44,54,43,0.34)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: GardenColors.cream,
    paddingHorizontal: GardenSpacing.md,
    paddingTop: GardenSpacing.md,
    paddingBottom: GardenSpacing.md,
    gap: GardenSpacing.sm,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: GardenColors.white,
    borderWidth: 1,
    borderColor: GardenColors.border,
  },
  messageOptions: {
    gap: 8,
  },
  messageOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: GardenColors.border,
    backgroundColor: GardenColors.white,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  messageOptionIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#E8F0E8",
    alignItems: "center",
    justifyContent: "center",
  },
  cadenceChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  cadenceChip: {
    borderWidth: 1,
    borderColor: GardenColors.border,
    borderRadius: GardenRadius.chip,
    backgroundColor: GardenColors.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  cadenceChipActive: {
    borderColor: GardenColors.sage,
    backgroundColor: GardenColors.sage,
  },
  cadenceInputWrap: {
    gap: 6,
  },
  cadenceInput: {
    height: 44,
    borderWidth: 1,
    borderColor: GardenColors.border,
    borderRadius: 12,
    backgroundColor: GardenColors.white,
    color: GardenColors.forest,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  modalActions: {
    gap: 8,
    marginTop: 4,
  },
  secondaryBtn: {
    height: 48,
    borderRadius: GardenRadius.chip,
    borderWidth: 1,
    borderColor: GardenColors.sage,
    backgroundColor: GardenColors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtn: {
    height: 48,
    borderRadius: GardenRadius.chip,
    backgroundColor: GardenColors.sage,
    alignItems: "center",
    justifyContent: "center",
  },
});
