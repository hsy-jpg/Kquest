import { useState } from "react";
import { Shirt, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import TigerAvatar from "@/components/TigerAvatar";
import { allItems, ItemSlot, slotLabels, WardrobeItem } from "@/data/items";
import { useWardrobe } from "@/lib/wardrobe";

const SLOTS: ItemSlot[] = ["hat", "glasses", "accessory", "backpack", "outfit"];

const TigerWardrobe = () => {
  const { unlocked, unlockedItems, equipped, equippedItems, equip, unequip } = useWardrobe();
  const [filter, setFilter] = useState<"all" | ItemSlot>("all");

  const visibleItems: WardrobeItem[] =
    filter === "all" ? allItems : allItems.filter((i) => i.slot === filter);

  return (
    <div className="mt-5 mx-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Shirt size={18} className="text-primary" />
          <h2 className="font-bold">Tiger Wardrobe</h2>
        </div>
        <span className="text-xs font-bold text-primary">
          {unlocked.length}/{allItems.length} unlocked
        </span>
      </div>

      <div className="rounded-2xl bg-card border border-border p-4 shadow-sm">
        {/* Full-body tiger preview */}
        <div className="flex flex-col items-center">
          <div
            className="relative w-72 h-72 rounded-3xl flex items-center justify-center overflow-hidden"
            style={{ background: "var(--gradient-blossom)" }}
          >
            <TigerAvatar items={equippedItems} size={288} animated />
          </div>
          <p className="mt-3 text-sm font-extrabold">K-Explorer Tiger</p>
          <p className="text-[11px] text-muted-foreground">
            {equippedItems.length} item{equippedItems.length === 1 ? "" : "s"} equipped
          </p>
        </div>

        {/* Equipped slot row */}
        <div className="mt-4 grid grid-cols-5 gap-2">
          {SLOTS.map((slot) => {
            const equippedId = equipped[slot];
            const item = equippedId ? allItems.find((i) => i.id === equippedId) : undefined;
            return (
              <div key={slot} className="flex flex-col items-center gap-1">
                <button
                  onClick={() => item && unequip(slot)}
                  className={`relative w-12 h-12 rounded-xl border-2 flex items-center justify-center text-xl transition ${
                    item
                      ? "bg-primary/10 border-primary"
                      : "bg-muted/40 border-dashed border-border opacity-60"
                  }`}
                  aria-label={item ? `Unequip ${item.name}` : `${slot} empty`}
                >
                  {item ? item.emoji : "·"}
                  {item && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center">
                      <X size={10} strokeWidth={3} />
                    </span>
                  )}
                </button>
                <span className="text-[9px] font-semibold text-muted-foreground capitalize">
                  {slotLabels[slot]}
                </span>
              </div>
            );
          })}
        </div>

        {/* Collection */}
        <div className="mt-5">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <TabsList className="w-full h-9 rounded-xl bg-muted overflow-x-auto flex justify-start">
              <TabsTrigger value="all" className="rounded-lg text-[11px] font-bold">All</TabsTrigger>
              {SLOTS.map((s) => (
                <TabsTrigger key={s} value={s} className="rounded-lg text-[11px] font-bold capitalize">
                  {slotLabels[s]}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={filter} className="mt-3">
              <div className="grid grid-cols-3 gap-2">
                {visibleItems.map((item) => {
                  const isUnlocked = unlocked.includes(item.id);
                  const isEquipped = equipped[item.slot] === item.id;
                  return (
                    <button
                      key={item.id}
                      disabled={!isUnlocked}
                      onClick={() => equip(item)}
                      className={`relative rounded-xl border-2 p-2 flex flex-col items-center gap-1 transition text-center ${
                        isEquipped
                          ? "border-primary bg-primary/10 shadow-sm"
                          : isUnlocked
                          ? "border-border bg-background hover:border-primary/50"
                          : "border-dashed border-border bg-muted/30 opacity-60"
                      }`}
                    >
                      <div className="h-10 w-10 rounded-lg bg-accent/30 flex items-center justify-center text-2xl">
                        {isUnlocked ? item.emoji : "🔒"}
                      </div>
                      <p className="text-[10px] font-bold leading-tight line-clamp-2">
                        {isUnlocked ? item.name : "Locked"}
                      </p>
                      <span className="text-[9px] text-muted-foreground capitalize">
                        {slotLabels[item.slot]}
                      </span>
                      {isEquipped && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow">
                          <Check size={12} strokeWidth={3} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {unlocked.length === 0 && (
                <p className="text-center text-xs text-muted-foreground mt-4">
                  Complete quests to unlock outfits for your tiger! 🐯
                </p>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default TigerWardrobe;
