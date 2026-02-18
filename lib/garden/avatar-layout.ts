import type { CircleId } from "@/lib/db";

const ORBIT_CANVAS_BASE_PX = 420;
const ZOOM_BOOST_FACTOR = 4;

export type RingLayoutConfig = {
  diameterPx: number;
  avatarSizePx: number;
  borderWidthPx: number;
  insidePaddingPx: number;
  minGapPx: number;
  angleOffsetDeg: number;
};

export type OrbitPoint = {
  leftPercent: number;
  topPercent: number;
};

export type RingSlotResult<T> = {
  visibleItems: Array<{ item: T; point: OrbitPoint }>;
  overflow: null | { hiddenCount: number; point: OrbitPoint };
};

export const RING_LAYOUT: Record<CircleId, RingLayoutConfig> = {
  inner: {
    diameterPx: 180,
    avatarSizePx: 48,
    borderWidthPx: 2,
    insidePaddingPx: 3,
    minGapPx: 6,
    angleOffsetDeg: -90,
  },
  mid: {
    diameterPx: 300,
    avatarSizePx: 40,
    borderWidthPx: 1,
    insidePaddingPx: 3,
    minGapPx: 6,
    angleOffsetDeg: -65,
  },
  outer: {
    diameterPx: 380,
    avatarSizePx: 30,
    borderWidthPx: 1,
    insidePaddingPx: 3,
    minGapPx: 6,
    angleOffsetDeg: -120,
  },
};

function getOrbitRadiusPx(ring: CircleId) {
  const config = RING_LAYOUT[ring];
  return config.diameterPx / 2 - config.avatarSizePx / 2 - config.insidePaddingPx;
}

function getSlotPoint(ring: CircleId, slotIndex: number, slotCount: number): OrbitPoint {
  const config = RING_LAYOUT[ring];
  const angleDeg = config.angleOffsetDeg + (360 / Math.max(slotCount, 1)) * slotIndex;
  const angleRad = (angleDeg * Math.PI) / 180;
  const radiusPercent = (getOrbitRadiusPx(ring) / ORBIT_CANVAS_BASE_PX) * 100;
  return {
    leftPercent: 50 + Math.cos(angleRad) * radiusPercent,
    topPercent: 50 + Math.sin(angleRad) * radiusPercent,
  };
}

export function getRingCapacity(ring: CircleId, zoom: number): number {
  const config = RING_LAYOUT[ring];
  const radiusPx = getOrbitRadiusPx(ring);
  const circumferencePx = 2 * Math.PI * radiusPx;
  const footprintPx = config.avatarSizePx + config.minGapPx;
  const baseCapacity = Math.max(1, Math.floor(circumferencePx / footprintPx));
  const zoomBoost = Math.max(0, Math.floor((zoom - 1) * ZOOM_BOOST_FACTOR));
  return baseCapacity + zoomBoost;
}

export function layoutRingItems<T>(ring: CircleId, items: T[], zoom: number): RingSlotResult<T> {
  const capacity = getRingCapacity(ring, zoom);

  if (items.length <= capacity) {
    return {
      visibleItems: items.map((item, index) => ({
        item,
        point: getSlotPoint(ring, index, items.length),
      })),
      overflow: null,
    };
  }

  const visibleCount = Math.max(capacity - 1, 0);
  const hiddenCount = items.length - visibleCount;
  const occupiedSlots = visibleCount + 1;

  return {
    visibleItems: items.slice(0, visibleCount).map((item, index) => ({
      item,
      point: getSlotPoint(ring, index, occupiedSlots),
    })),
    overflow: {
      hiddenCount,
      point: getSlotPoint(ring, visibleCount, occupiedSlots),
    },
  };
}
