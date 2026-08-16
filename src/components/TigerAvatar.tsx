import { WardrobeItem } from "@/data/items";
import { tigerPoseSrc, TigerPose } from "@/lib/tigerPoses";

interface TigerAvatarProps {
  items?: WardrobeItem[];
  size?: number;
  className?: string;
  animated?: boolean;
  pose?: TigerPose;
}

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

      {layered.map((item) => (
        <span
          key={item.id}
          className={`absolute ${item.sizeClass} drop-shadow-md select-none pointer-events-none animate-stamp-in`}
          style={item.style}
          aria-hidden
        >
          {item.emoji}
        </span>
      ))}
    </div>
  );
};

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
