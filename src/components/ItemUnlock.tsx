import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import TigerAvatar from "@/components/TigerAvatar";
import { WardrobeItem } from "@/data/items";
import { getItemForQuest } from "@/data/items";
import { unlockItem, equipItem } from "@/lib/wardrobe";

// Backward-compat export so other callers keep working.
export function pickItemForQuest(questId: number): WardrobeItem {
  return getItemForQuest(questId);
}

const CONFETTI_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--xp))",
  "hsl(var(--accent))",
  "hsl(var(--success))",
];

interface Props {
  item: WardrobeItem;
  onDone: () => void;
}

const ItemUnlock = ({ item, onDone }: Props) => {
  const [stage, setStage] = useState<"unlock" | "equipped">("unlock");

  // Save unlock + auto-equip on the tiger as soon as the screen opens.
  useEffect(() => {
    unlockItem(item.id);
    equipItem(item);
  }, [item]);

  useEffect(() => {
    const t = setTimeout(() => setStage("equipped"), 1800);
    return () => clearTimeout(t);
  }, []);

  const confetti = useMemo(
    () =>
      Array.from({ length: 28 }).map((_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        duration: 2.2 + Math.random() * 1.2,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        size: 6 + Math.random() * 8,
        rounded: Math.random() > 0.5,
      })),
    [],
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6 text-center overflow-hidden bg-gradient-to-b from-[hsl(var(--accent))]/40 via-[hsl(var(--korean-cloud))] to-background animate-fade-in">
      {/* Confetti */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {confetti.map((c, i) => (
          <span
            key={i}
            className="absolute top-0 block animate-confetti-fall"
            style={{
              left: `${c.left}%`,
              width: c.size,
              height: c.size,
              background: c.color,
              borderRadius: c.rounded ? "9999px" : "2px",
              animationDelay: `${c.delay}s`,
              animationDuration: `${c.duration}s`,
            }}
          />
        ))}
      </div>

      {/* Title */}
      <div key={stage} className="animate-title-pop mb-6">
        <p className="text-xs font-extrabold tracking-[0.3em] text-primary mb-1">
          {stage === "unlock" ? "ITEM UNLOCKED" : "NEW OUTFIT EQUIPPED"}
        </p>
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-primary to-[hsl(var(--korean-deep))] bg-clip-text text-transparent">
          {item.name}
        </h1>
      </div>

      {/* Mascot + single new item */}
      <div className="relative w-72 h-72 flex items-center justify-center mb-6">
        <div className="absolute inset-0 -m-4 rounded-full bg-gradient-to-br from-[hsl(var(--accent))]/60 to-[hsl(var(--primary))]/30 blur-2xl" />

        {stage === "unlock" ? (
          <>
            <TigerAvatar size={260} pose="cheer" animated />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-7xl animate-item-drop drop-shadow-lg">{item.emoji}</div>
            </div>
          </>
        ) : (
          <TigerAvatar size={260} pose="wave" items={[item]} animated />
        )}

      </div>

      <Button
        className="w-full max-w-xs rounded-xl font-extrabold h-12 shadow-[var(--shadow-soft)] animate-fade-in"
        style={{ animationDelay: "1s" }}
        onClick={onDone}
      >
        Awesome!
      </Button>
    </div>
  );
};

export default ItemUnlock;
