import { WardrobeItem } from "@/data/items";
import { tigerPoseSrc, TigerPose, FaceAnchor, FACE_ANCHORS } from "@/lib/tigerPoses";

interface TigerAvatarProps {
  items?: WardrobeItem[];
  size?: number;
  className?: string;
  animated?: boolean;
  pose?: TigerPose;
}

/** Rough emoji size relative to the avatar box, before pose/head scaling. */
const BASE_SIZE_RATIO: Record<string, number> = {
  "text-3xl": 0.16,
  "text-4xl": 0.2,
  "text-5xl": 0.26,
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
  const anchor = FACE_ANCHORS[pose];

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
        const style = onFace ? faceItemStyle(item.slot, anchor) : item.style;
        const headScale = onFace ? anchor.width / 40 : 1;
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

/** Positions hats/glasses relative to the pose's actual face, instead of the item's own generic style. */
function faceItemStyle(slot: WardrobeItem["slot"], anchor: FaceAnchor): React.CSSProperties {
  const verticalOffset = slot === "glasses" ? anchor.width * 0.12 : -anchor.width * 0.24;
  return {
    top: `${anchor.top + verticalOffset}%`,
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
