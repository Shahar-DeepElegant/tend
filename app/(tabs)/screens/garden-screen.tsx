import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
    PanResponder,
    Pressable,
    SafeAreaView,
    StyleProp,
    StyleSheet,
    TextInput,
    View,
    ViewStyle,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GardenText } from "@/components/ui/garden-primitives";
import {
    GardenColors,
    GardenRadius,
    GardenSpacing,
} from "@/constants/design-system";
import {
    getGardenContacts,
    type CircleId,
    type GardenContactRow,
} from "@/lib/db";

import { AddContactModal } from "./up-next/add-contact-modal";

type OrbitContact = GardenContactRow & {
  left: number;
  top: number;
};

export function GardenScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const MIN_ZOOM = 0.8;
  const MAX_ZOOM = 2.2;
  const ZOOM_STEP = 0.2;
  const [zoom, setZoom] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [contacts, setContacts] = useState<GardenContactRow[]>([]);
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const reportedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const dragStart = useRef({ x: 0, y: 0 });

  const reload = useCallback(async () => {
    const rows = await getGardenContacts();
    setContacts(rows);
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const contactsByRing = useMemo(
    () => ({
      inner: withPositions(
        contacts.filter((contact) => contact.circleId === "inner"),
        "inner",
      ),
      mid: withPositions(
        contacts.filter((contact) => contact.circleId === "mid"),
        "mid",
      ),
      outer: withPositions(
        contacts.filter((contact) => contact.circleId === "outer"),
        "outer",
      ),
    }),
    [contacts],
  );

  const setAbsoluteZoom = (target: number) => {
    const next = Math.max(MIN_ZOOM, Math.min(target, MAX_ZOOM));
    scale.value = next;
    savedScale.value = next;
    reportedScale.value = next;
    if (next <= 1.02) {
      translateX.value = 0;
      translateY.value = 0;
    }
    setZoom(next);
  };

  const resetViewport = () => {
    scale.value = 1;
    savedScale.value = 1;
    reportedScale.value = 1;
    translateX.value = 0;
    translateY.value = 0;
    setZoom(1);
  };

  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      const nextScale = Math.max(
        MIN_ZOOM,
        Math.min(savedScale.value * event.scale, MAX_ZOOM),
      );
      scale.value = nextScale;
      if (Math.abs(nextScale - reportedScale.value) > 0.06) {
        reportedScale.value = nextScale;
        runOnJS(setZoom)(nextScale);
      }
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      reportedScale.value = scale.value;
      runOnJS(setZoom)(scale.value);
    });

  const composedGesture = Gesture.Simultaneous(pinchGesture);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          zoom > 1.02 &&
          (Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2),
        onPanResponderGrant: () => {
          dragStart.current = { x: translateX.value, y: translateY.value };
        },
        onPanResponderMove: (_, gestureState) => {
          if (scale.value <= 1.02) return;
          const limit = 130 * scale.value;
          const nextX = dragStart.current.x + gestureState.dx;
          const nextY = dragStart.current.y + gestureState.dy;
          translateX.value = Math.max(-limit, Math.min(nextX, limit));
          translateY.value = Math.max(-limit, Math.min(nextY, limit));
        },
      }),
    [scale, translateX, translateY, zoom],
  );

  const orbitAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <SafeAreaView style={styles.screen}>
      <View
        style={[styles.header, { paddingTop: insets.top + GardenSpacing.sm }]}
      >
        <View style={styles.titleRow}>
          <View style={styles.titleWrap}>
            <MaterialIcons
              name="local-florist"
              size={28}
              color={GardenColors.sage}
            />
            <GardenText variant="title" style={styles.title}>
              My Garden
            </GardenText>
          </View>
          <Pressable style={styles.iconButton}>
            <MaterialIcons
              name="notifications-none"
              size={20}
              color={GardenColors.sage}
            />
          </Pressable>
        </View>
        <View style={styles.searchWrap}>
          <MaterialIcons name="search" size={20} color={GardenColors.stone} />
          <TextInput
            placeholder="Find someone in your rings..."
            placeholderTextColor={GardenColors.stone}
            style={styles.searchInput}
          />
        </View>
      </View>

      <View style={styles.orbitSection}>
        <GestureDetector gesture={composedGesture}>
          <Animated.View
            style={[styles.orbitCanvas, orbitAnimatedStyle]}
            {...panResponder.panHandlers}
          >
            <Ring style={styles.outerRing} label="Outer Circle" />
            <Ring style={styles.midRing} label="Mid Circle" />
            <Ring style={styles.innerRing} label="Inner Circle" />

            <View style={styles.core}>
              <MaterialIcons name="yard" size={30} color={GardenColors.white} />
            </View>

            {renderContacts(contactsByRing.outer, "outer", router, zoom)}
            {renderContacts(contactsByRing.mid, "mid", router, zoom)}
            {renderContacts(contactsByRing.inner, "inner", router, zoom)}
          </Animated.View>
        </GestureDetector>

        <View style={[styles.zoomControls, { bottom: insets.bottom }]}>
          <Pressable
            style={styles.zoomButton}
            onPress={() => setAbsoluteZoom(zoom - ZOOM_STEP)}
          >
            <MaterialIcons name="remove" size={18} color={GardenColors.sage} />
          </Pressable>
          <Pressable
            style={styles.zoomButton}
            onPress={() => setAbsoluteZoom(zoom + ZOOM_STEP)}
          >
            <MaterialIcons name="add" size={18} color={GardenColors.sage} />
          </Pressable>
          <Pressable style={styles.zoomButton} onPress={resetViewport}>
            <MaterialIcons
              name="center-focus-strong"
              size={16}
              color={GardenColors.sage}
            />
          </Pressable>
          <View style={styles.zoomValue}>
            <GardenText variant="meta" color={GardenColors.sage}>
              {zoom.toFixed(1)}x
            </GardenText>
          </View>
        </View>
      </View>

      <View style={[styles.legend, { bottom: insets.bottom }]}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendDotSolid]} />
          <GardenText variant="meta">Needs Water</GardenText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendDotMuted]} />
          <GardenText variant="meta">Thriving</GardenText>
        </View>
      </View>

      <Pressable
        style={[styles.fab, { bottom: insets.bottom + 72 }]}
        onPress={() => setAddOpen(true)}
        accessibilityLabel="Add person to circle"
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

function renderContacts(
  contacts: OrbitContact[],
  ring: CircleId,
  router: ReturnType<typeof useRouter>,
  zoom: number,
) {
  const visibleLimit = getVisibleLimit(ring, zoom);
  const visibleContacts = contacts.slice(0, visibleLimit);
  const hiddenCount = Math.max(contacts.length - visibleContacts.length, 0);
  const size = ring === "inner" ? 48 : ring === "mid" ? 40 : 30;
  const borderWidth = ring === "inner" ? 2 : 1;

  return (
    <>
      {visibleContacts.map((contact) => (
        <Pressable
          key={contact.systemId}
          onPress={() =>
            router.push({
              pathname: "/leaf-profile",
              params: { contactId: contact.systemId },
            })
          }
          style={[
            styles.contactAvatar,
            {
              left: `${contact.left}%`,
              top: `${contact.top}%`,
              width: size,
              height: size,
              marginLeft: -size / 2,
              marginTop: -size / 2,
              borderRadius: size / 2,
              borderWidth,
              borderColor: contact.isOverdue ? GardenColors.sage : "#C6D9C5",
              opacity: ring === "outer" ? 0.85 : 1,
            },
          ]}
        >
          {contact.imageUri ? (
            <Image source={contact.imageUri} style={styles.contactImage} />
          ) : (
            <View style={styles.contactInitials}>
              <GardenText variant="meta" color={GardenColors.sage}>
                {initialsFromName(contact.nickName || contact.fullName)}
              </GardenText>
            </View>
          )}
          {contact.isOverdue ? <View style={styles.waterBadge} /> : null}
        </Pressable>
      ))}
      {hiddenCount > 0 ? (
        <OverflowAvatar ring={ring} hiddenCount={hiddenCount} />
      ) : null}
    </>
  );
}

function OverflowAvatar({
  ring,
  hiddenCount,
}: {
  ring: CircleId;
  hiddenCount: number;
}) {
  const size = ring === "inner" ? 42 : ring === "mid" ? 36 : 30;
  const position: StyleProp<ViewStyle> =
    ring === "inner"
      ? ({ left: "82%" as const, top: "16%" as const } satisfies ViewStyle)
      : ring === "mid"
        ? ({ left: "83%" as const, top: "82%" as const } satisfies ViewStyle)
        : ({ left: "14%" as const, top: "14%" as const } satisfies ViewStyle);

  return (
    <View
      style={[
        styles.overflowAvatar,
        position,
        {
          width: size,
          height: size,
          marginLeft: -size / 2,
          marginTop: -size / 2,
          borderRadius: size / 2,
        },
      ]}
    >
      <GardenText
        variant="meta"
        style={styles.overflowText}
        color={GardenColors.sage}
      >
        +{hiddenCount}
      </GardenText>
    </View>
  );
}

function getVisibleLimit(ring: CircleId, zoom: number) {
  const base = ring === "inner" ? 3 : ring === "mid" ? 4 : 4;
  const boost = Math.max(0, Math.floor((zoom - 1) * 8));
  return base + boost;
}

function Ring({
  style,
  label,
}: {
  style: StyleProp<ViewStyle>;
  label: string;
}) {
  return (
    <View style={[styles.ring, style]}>
      <GardenText variant="meta" style={styles.ringLabel}>
        {label}
      </GardenText>
    </View>
  );
}

function withPositions(
  contacts: GardenContactRow[],
  ring: CircleId,
): OrbitContact[] {
  return contacts.map((contact, index) => {
    const hash = hashString(contact.systemId);
    const angle = (hash % 360) + index * 17;
    const ringRadius = ring === "inner" ? 20 : ring === "mid" ? 34 : 45;
    const variance = ((hash % 17) - 8) * 0.4;
    const radius = ringRadius + variance;
    const radians = (angle * Math.PI) / 180;
    const left = 50 + Math.cos(radians) * radius;
    const top = 50 + Math.sin(radians) * radius;
    return { ...contact, left, top };
  });
}

function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
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
    backgroundColor: "#F6F8F6",
  },
  header: {
    paddingHorizontal: GardenSpacing.md,
    paddingTop: GardenSpacing.sm,
    gap: GardenSpacing.sm,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 34,
    lineHeight: 36,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: GardenRadius.chip,
    backgroundColor: "#E9F2E9",
    alignItems: "center",
    justifyContent: "center",
  },
  searchWrap: {
    height: 46,
    borderRadius: 14,
    backgroundColor: GardenColors.white,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: GardenColors.forest,
  },
  orbitSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: GardenSpacing.md,
  },
  orbitCanvas: {
    width: "100%",
    maxWidth: 420,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginBottom: 56,
  },
  zoomControls: {
    position: "absolute",
    left: 18,
    bottom: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: GardenRadius.chip,
    borderWidth: 1,
    borderColor: "#D9E3D5",
    backgroundColor: "rgba(255,255,255,0.95)",
    padding: 6,
  },
  zoomButton: {
    width: 30,
    height: 30,
    borderRadius: GardenRadius.chip,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EAF3E9",
  },
  zoomValue: {
    minWidth: 46,
    height: 30,
    borderRadius: GardenRadius.chip,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    backgroundColor: GardenColors.white,
  },
  ring: {
    position: "absolute",
    borderRadius: GardenRadius.chip,
    borderWidth: 1,
    borderColor: "rgba(90, 125, 88, 0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  innerRing: {
    width: 180,
    height: 180,
  },
  midRing: {
    width: 300,
    height: 300,
  },
  outerRing: {
    width: 380,
    height: 380,
    borderStyle: "dashed",
  },
  ringLabel: {
    position: "absolute",
    top: -22,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: GardenColors.sage,
    opacity: 0.7,
  },
  core: {
    width: 64,
    height: 64,
    borderRadius: GardenRadius.chip,
    backgroundColor: GardenColors.sage,
    borderWidth: 4,
    borderColor: GardenColors.white,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5,
  },
  contactAvatar: {
    position: "absolute",
    overflow: "hidden",
    backgroundColor: "#DBE9DB",
    alignItems: "center",
    justifyContent: "center",
  },
  contactInitials: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  contactImage: {
    width: "100%",
    height: "100%",
  },
  overflowAvatar: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E9F2E9",
    borderWidth: 1,
    borderColor: "#BCD4BB",
    borderStyle: "dashed",
  },
  overflowText: {
    fontSize: 12,
    lineHeight: 14,
  },
  waterBadge: {
    position: "absolute",
    right: 1,
    bottom: 1,
    width: 8,
    height: 8,
    borderRadius: GardenRadius.chip,
    backgroundColor: GardenColors.sage,
    borderWidth: 1,
    borderColor: GardenColors.white,
  },
  legend: {
    position: "absolute",
    right: 16,
    bottom: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2EADF",
    backgroundColor: "rgba(255,255,255,0.94)",
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 6,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: GardenRadius.chip,
  },
  legendDotSolid: {
    backgroundColor: GardenColors.sage,
  },
  legendDotMuted: {
    backgroundColor: "#BBD2BA",
  },
  fab: {
    position: "absolute",
    right: GardenSpacing.md,
    bottom: 96,
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
