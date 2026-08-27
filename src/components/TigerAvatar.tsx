import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { WardrobeItem } from "@/data/items";
import { tigerPoseSrc, TigerPose, FaceAnchor, FACE_ANCHORS, BODY_ANCHORS, HAND_ANCHORS } from "@/lib/tigerPoses";
import { equipmentFor, placementFor, type EquipmentVisual } from "@/lib/tigerEquipment";

const EQUIP_ANIMATION_CLASS = {
  HEAD: "animate-equip-head",
  FACE: "animate-equip-face",
  HAND: "animate-equip-hand",
  BACK: "animate-equip-back",
  BODY: "animate-equip-body",
} as const;

interface TigerAvatarProps {
  items?: WardrobeItem[];
  size?: number;
  className?: string;
  animated?: boolean;
  pose?: TigerPose;
  equipEffect?: boolean;
}

/** Rough emoji size relative to the avatar box, before pose/head scaling. */
const BASE_SIZE_RATIO: Record<string, number> = {
  "text-3xl": 0.18,
  "text-4xl": 0.22,
  "text-5xl": 0.28,
};

/**
 * Tiger mascot with equipped wardrobe items overlaid.
 * `pose` picks one of the character-sheet illustrations.
 */
const TigerAvatar = ({
  items = [],
  size = 240,
  className = "",
  animated = false,
  pose = "wave",
  equipEffect = false,
}: TigerAvatarProps) => {
  const layered = [...items].sort((a, b) => slotOrder(a.slot) - slotOrder(b.slot));
  const src = tigerPoseSrc[pose];
  const faceAnchor = FACE_ANCHORS[pose];
  const bodyAnchor = BODY_ANCHORS[pose];
  const itemSignature = layered.map((item) => item.id).join("|");
  const previousSignature = useRef(itemSignature);
  const [equipPulse, setEquipPulse] = useState(equipEffect && items.length > 0);

  useEffect(() => {
    if (!equipEffect || items.length === 0) return;
    const timer = window.setTimeout(() => setEquipPulse(false), 650);
    return () => window.clearTimeout(timer);
  }, [equipEffect, items.length]);

  useEffect(() => {
    if (previousSignature.current === itemSignature) return;
    previousSignature.current = itemSignature;
    setEquipPulse(true);
    const timer = window.setTimeout(() => setEquipPulse(false), 650);
    return () => window.clearTimeout(timer);
  }, [itemSignature]);

  const pngLayers = layered
    .map((item) => ({ item, visual: equipmentFor(item.id) }))
    .filter((entry): entry is { item: WardrobeItem; visual: EquipmentVisual } => Boolean(entry.visual));
  const emojiLayers = layered.filter((item) => !equipmentFor(item.id));
  const backLayers = pngLayers.filter(({ visual }) => visual.slot === "BACK");
  const frontLayers = pngLayers.filter(({ visual }) => visual.slot !== "BACK");

  return (
    <div
      className={`relative inline-block ${className}`}
      style={{ width: size, height: size }}
    >
      <div className={`absolute inset-0 ${animated ? "animate-tiger-wiggle" : ""}`}>
        <div className={`relative h-full w-full ${equipPulse ? "animate-tiger-equip-react" : ""}`}>
          {backLayers.map(({ item, visual }) => (
            <EquipmentLayer key={item.id} item={item} visual={visual} pose={pose} animate={equipPulse} />
          ))}

          <img
            src={src}
            alt="Tiger mascot"
            className="absolute inset-0 z-20 h-full w-full object-contain"
            draggable={false}
          />

          {frontLayers.map(({ item, visual }) => (
            <EquipmentLayer key={item.id} item={item} visual={visual} pose={pose} animate={equipPulse} />
          ))}

          {emojiLayers.map((item) => {
            const onFace = item.slot === "hat" || item.slot === "glasses";
            const onBody = (item.slot === "outfit" || item.slot === "backpack") && bodyAnchor;

            const style = onFace
              ? faceItemStyle(item.slot, faceAnchor)
              : onBody
                ? bodyItemStyle(bodyAnchor)
                : item.style;
            const headScale = onFace ? faceAnchor.width / 40 : 1;
            const fontSize = size * (BASE_SIZE_RATIO[item.sizeClass] ?? 0.18) * headScale;

            return (
              <span
                key={item.id}
                className="absolute z-40 drop-shadow-md select-none pointer-events-none animate-stamp-in leading-none"
                style={{ ...style, fontSize }}
                aria-hidden
              >
                {item.emoji}
              </span>
            );
          })}

          {equipPulse && (
            <div className="pointer-events-none absolute inset-0 z-50" aria-hidden>
              {["22% 30%", "79% 27%", "76% 68%", "28% 72%"].map((position, index) => {
                const [left, top] = position.split(" ");
                return <span key={position} className={`tiger-equip-sparkle tiger-equip-sparkle-${index + 1}`} style={{ left, top }} />;
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function EquipmentLayer({
  item,
  visual,
  pose,
  animate,
}: {
  item: WardrobeItem;
  visual: EquipmentVisual;
  pose: TigerPose;
  animate: boolean;
}) {
  const placement = placementFor(visual, pose);
  const anchor = placement.anchor === "face"
    ? FACE_ANCHORS[pose]
    : placement.anchor === "hand"
      ? HAND_ANCHORS[pose]
      : BODY_ANCHORS[pose];
  if (!anchor) return null;

  const width = anchor.width * placement.scale;
  const style: CSSProperties = {
    top: `${anchor.top + placement.y}%`,
    left: `${anchor.left + placement.x}%`,
    width: `${width}%`,
    zIndex: placement.zIndex,
    transform: `translate(-50%, -50%) rotate(${placement.rotation}deg)`,
  };

  return (
    <span className="absolute pointer-events-none select-none" style={style} aria-hidden>
      <img
        src={visual.src}
        alt=""
        draggable={false}
        className={`block h-auto w-full drop-shadow-md ${animate ? EQUIP_ANIMATION_CLASS[visual.slot] : ""}`}
      />
    </span>
  );
}

/** Positions hats/glasses on the pose's actual eye line, instead of the item's own generic style. */
function faceItemStyle(slot: WardrobeItem["slot"], anchor: FaceAnchor): CSSProperties {
  // Glasses sit right on the eye line; a hat needs to clear the whole head above it.
  const verticalOffset = slot === "glasses" ? anchor.width * 0.05 : -anchor.width * 0.55;
  return {
    top: `${anchor.top + verticalOffset}%`,
    left: `${anchor.left}%`,
    transform: "translate(-50%, -50%)",
  };
}

/** Positions outfit/backpack items on the pose's torso, instead of the item's own generic style. */
function bodyItemStyle(anchor: { top: number; left: number }): CSSProperties {
  return {
    top: `${anchor.top}%`,
    left: `${anchor.left}%`,
    transform: "translate(-50%, -50%)",
  };
}

function slotOrder(slot: WardrobeItem["slot"]) {
  switch (slot) {
    case "outfit":
      return 0;
    case "backpack":
      return 1;
    case "accessory":
      return 2;
    case "glasses":
      return 3;
    case "hat":
      return 4;
  }
}

export default TigerAvatar;
