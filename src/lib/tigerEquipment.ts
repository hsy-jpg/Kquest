import sunglasses from "@/assets/wardrobe/sunglasses.png";
import hikingStick from "@/assets/wardrobe/hiking-stick.png";
import picnicBackpack from "@/assets/wardrobe/picnic-backpack.png";
import bananaMilk from "@/assets/wardrobe/banana-milk.png";
import camera from "@/assets/wardrobe/camera.png";
import fan from "@/assets/wardrobe/fan.png";
import tteokbokkiBowl from "@/assets/wardrobe/tteokbokki-bowl.png";
import sojuGlass from "@/assets/wardrobe/soju-glass.png";
import explorerCap from "@/assets/wardrobe/explorer-cap.png";
import karaokeMicrophone from "@/assets/wardrobe/karaoke-microphone.png";
import ramyeonBowl from "@/assets/wardrobe/ramyeon-bowl.png";
import vintageJacket from "@/assets/wardrobe/vintage-jacket.png";
import coffeeCup from "@/assets/wardrobe/coffee-cup.png";
import triangleKimbap from "@/assets/wardrobe/triangle-kimbap.png";
import gimbapCharm from "@/assets/wardrobe/gimbap-charm.png";
import marketTote from "@/assets/wardrobe/market-tote.png";
import roseCrown from "@/assets/wardrobe/rose-crown.png";
import rainbowCharm from "@/assets/wardrobe/rainbow-charm.png";
import freshCut from "@/assets/wardrobe/fresh-cut.png";
import indieBook from "@/assets/wardrobe/indie-book.png";
import soboroBun from "@/assets/wardrobe/soboro-bun.png";
import badmintonRacket from "@/assets/wardrobe/badminton-racket.png";
import towelHat from "@/assets/wardrobe/towel-hat.png";
import type { TigerPose } from "@/lib/tigerPoses";

export type EquipmentVisualSlot = "HEAD" | "FACE" | "HAND" | "BACK" | "BODY";

export interface EquipmentPlacement {
  /** Visual anchor within the selected tiger pose. */
  anchor: "face" | "body" | "hand";
  /** Item width relative to the anchor width. */
  scale: number;
  x: number;
  y: number;
  rotation: number;
  zIndex: number;
}

export interface EquipmentVisual {
  src: string;
  slot: EquipmentVisualSlot;
  placement: EquipmentPlacement;
  poseOverrides?: Partial<Record<TigerPose, Partial<EquipmentPlacement>>>;
}

const SUNGLASSES: EquipmentVisual = {
  src: sunglasses,
  slot: "FACE",
  placement: {
    anchor: "face",
    scale: 0.74,
    x: 0,
    y: 0,
    rotation: 0,
    zIndex: 30,
  },
  poseOverrides: {
    face: { scale: 0.72, y: 0 },
  },
};

const HIKING_STICK: EquipmentVisual = {
  src: hikingStick,
  slot: "HAND",
  placement: {
    anchor: "hand",
    scale: 1.24,
    x: -14,
    y: 10,
    rotation: 4,
    zIndex: 34,
  },
};

const PICNIC_BACKPACK: EquipmentVisual = {
  src: picnicBackpack,
  slot: "BACK",
  placement: {
    anchor: "body",
    scale: 1.52,
    x: 11,
    y: 1,
    rotation: 3,
    zIndex: 10,
  },
};

const BANANA_MILK: EquipmentVisual = {
  src: bananaMilk,
  slot: "HAND",
  placement: {
    anchor: "hand",
    scale: 0.84,
    x: -1,
    y: 7,
    rotation: 8,
    zIndex: 35,
  },
};

const CAMERA: EquipmentVisual = {
  src: camera,
  slot: "HAND",
  placement: {
    anchor: "hand",
    scale: 0.96,
    x: 0,
    y: 8,
    rotation: -6,
    zIndex: 35,
  },
};

const TRADITIONAL_FAN: EquipmentVisual = {
  src: fan,
  slot: "HAND",
  placement: {
    anchor: "hand",
    scale: 0.82,
    x: 5,
    y: 12,
    rotation: -6,
    zIndex: 35,
  },
};

const TTEOKBOKKI_BOWL: EquipmentVisual = {
  src: tteokbokkiBowl,
  slot: "HAND",
  placement: {
    anchor: "hand",
    scale: 0.88,
    x: -1,
    y: 8,
    rotation: -4,
    zIndex: 35,
  },
};

const SOJU_GLASS: EquipmentVisual = {
  src: sojuGlass,
  slot: "HAND",
  placement: {
    anchor: "hand",
    scale: 0.58,
    x: -1,
    y: 7,
    rotation: 5,
    zIndex: 35,
  },
};

const KARAOKE_MICROPHONE: EquipmentVisual = {
  src: karaokeMicrophone,
  slot: "HAND",
  placement: {
    anchor: "hand",
    scale: 1.05,
    x: 0,
    y: 5,
    rotation: -10,
    zIndex: 35,
  },
};

const EXPLORER_CAP: EquipmentVisual = {
  src: explorerCap,
  slot: "HEAD",
  placement: {
    anchor: "face",
    scale: 1.2,
    x: 0,
    y: -23,
    rotation: 0,
    zIndex: 36,
  },
  poseOverrides: {
    face: { scale: 1.06, y: -30 },
  },
};

const RAMYEON_BOWL = handVisual(ramyeonBowl, 0.9, -1, 8, -3);
const COFFEE_CUP = handVisual(coffeeCup, 0.72, -1, 7, 4);
const TRIANGLE_KIMBAP = handVisual(triangleKimbap, 0.72, -1, 7, -5);
const GIMBAP_CHARM = handVisual(gimbapCharm, 0.78, -1, 7, -7);
const RAINBOW_CHARM = handVisual(rainbowCharm, 0.68, -1, 6, 4);
const INDIE_BOOK = handVisual(indieBook, 0.88, -1, 7, -5);
const SOBORO_BUN = handVisual(soboroBun, 0.76, -1, 7, 4);
const BADMINTON_RACKET = handVisual(badmintonRacket, 1.12, 0, 5, -8);

const VINTAGE_JACKET: EquipmentVisual = {
  src: vintageJacket,
  slot: "BODY",
  placement: { anchor: "body", scale: 1.5, x: 0, y: 1, rotation: 0, zIndex: 25 },
};

const MARKET_TOTE: EquipmentVisual = {
  src: marketTote,
  slot: "BACK",
  placement: { anchor: "body", scale: 1.42, x: 10, y: 3, rotation: 2, zIndex: 10 },
};

const ROSE_CROWN = headVisual(roseCrown, 1.12, -22);
const FRESH_CUT = headVisual(freshCut, 1.02, -20);
const TOWEL_HAT = headVisual(towelHat, 1.12, -23);

function handVisual(src: string, scale: number, x: number, y: number, rotation: number): EquipmentVisual {
  return {
    src,
    slot: "HAND",
    placement: { anchor: "hand", scale, x, y, rotation, zIndex: 35 },
  };
}

function headVisual(src: string, scale: number, y: number): EquipmentVisual {
  return {
    src,
    slot: "HEAD",
    placement: { anchor: "face", scale, x: 0, y, rotation: 0, zIndex: 36 },
  };
}

/**
 * Visual-only equipment mapping. Item ids and persisted wardrobe slots remain
 * unchanged; adding a PNG here progressively upgrades an emoji reward.
 */
export const TIGER_EQUIPMENT: Record<string, EquipmentVisual> = {
  "hiking-stick": HIKING_STICK,
  "picnic-backpack": PICNIC_BACKPACK,
  "banana-milk": BANANA_MILK,
  "camera-charm": CAMERA,
  "traditional-fan": TRADITIONAL_FAN,
  "baduk-glasses": SUNGLASSES,
  "neon-shades": SUNGLASSES,
  "picnic-sunglasses": SUNGLASSES,
  "tteokbokki-bowl": TTEOKBOKKI_BOWL,
  "soju-bottle": SOJU_GLASS,
  microphone: KARAOKE_MICROPHONE,
  "night-cap": EXPLORER_CAP,
  "hiking-cap": EXPLORER_CAP,
  "ramyeon-bowl": RAMYEON_BOWL,
  "vintage-jacket": VINTAGE_JACKET,
  "coffee-cup": COFFEE_CUP,
  "triangle-kimbap": TRIANGLE_KIMBAP,
  "gimbap-charm": GIMBAP_CHARM,
  "market-tote": MARKET_TOTE,
  "rose-crown": ROSE_CROWN,
  "rainbow-charm": RAINBOW_CHARM,
  "fresh-cut": FRESH_CUT,
  "indie-book": INDIE_BOOK,
  "soboro-bun": SOBORO_BUN,
  "badminton-racket": BADMINTON_RACKET,
  "towel-hat": TOWEL_HAT,
};

export function equipmentFor(itemId: string): EquipmentVisual | undefined {
  return TIGER_EQUIPMENT[itemId];
}

export function placementFor(visual: EquipmentVisual, pose: TigerPose): EquipmentPlacement {
  return { ...visual.placement, ...visual.poseOverrides?.[pose] };
}
