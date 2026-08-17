import { WardrobeItem } from "@/data/items";
import { tigerPoseSrc, TigerPose, FaceAnchor, FACE_ANCHORS, BODY_ANCHORS } from "@/lib/tigerPoses";

interface TigerAvatarProps {
  items?: WardrobeItem[];
  size?: number;
  className?: string;
  animated?: boolean;
  pose?: TigerPose;
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
}: TigerAvatarProps) => {
  const layered = [...items].sort((a, b) => slotOrder(a.slot) - slotOrder(b.slot));
  const src = tigerPoseSrc[pose];
  const faceAnchor = FACE_ANCHORS[pose];
  const bodyAnchor = BODY_ANCHORS[pose];

  return (
    <div
      className={`relative inline-block ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={src}
        alt="Tiger mascot"
        className={`absolute inset-0 w-full h-full object-contain ${animated ? "animate-tiger-wiggle" : ""}`}
        draggable={false}
      />

      {layered.map((item) => {
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
            className="absolute drop-shadow-md select-none pointer-events-none animate-stamp-in leading-none"
            style={{ ...style, fontSize }}
            aria-hidden
          >
            {item.emoji}
          </span>
        );
      })}
    </div>
  );
};

/** Positions hats/glasses on the pose's actual eye line, instead of the item's own generic style. */
function faceItemStyle(slot: WardrobeItem["slot"], anchor: FaceAnchor): React.CSSProperties {
  // Glasses sit right on the eye line; a hat needs to clear the whole head above it.
  const verticalOffset = slot === "glasses" ? anchor.width * 0.05 : -anchor.width * 0.55;
  return {
    top: `${anchor.top + verticalOffset}%`,
    left: `${anchor.left}%`,
    transform: "translate(-50%, -50%)",
  };
}

/** Positions outfit/backpack items on the pose's torso, instead of the item's own generic style. */
function bodyItemStyle(anchor: { top: number; left: number }): React.CSSProperties {
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
