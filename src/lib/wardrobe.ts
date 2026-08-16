import { useEffect, useState, useCallback } from "react";
import { allItems, ItemSlot, WardrobeItem } from "@/data/items";

const UNLOCKED_KEY = "kquest.wardrobe.unlocked";
const EQUIPPED_KEY = "kquest.wardrobe.equipped";

export type EquippedMap = Partial<Record<ItemSlot, string>>;

const safeRead = <T,>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const emit = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("wardrobe:change"));
  }
};

export const getUnlocked = (): string[] => safeRead<string[]>(UNLOCKED_KEY, []);
export const getEquipped = (): EquippedMap => safeRead<EquippedMap>(EQUIPPED_KEY, {});

export const unlockItem = (itemId: string) => {
  const current = getUnlocked();
  if (!current.includes(itemId)) {
    localStorage.setItem(UNLOCKED_KEY, JSON.stringify([...current, itemId]));
  }
  emit();
};

export const equipItem = (item: WardrobeItem) => {
  const current = getEquipped();
  current[item.slot] = item.id;
  localStorage.setItem(EQUIPPED_KEY, JSON.stringify(current));
  emit();
};

export const unequipSlot = (slot: ItemSlot) => {
  const current = getEquipped();
  delete current[slot];
  localStorage.setItem(EQUIPPED_KEY, JSON.stringify(current));
  emit();
};

export function useWardrobe() {
  const [unlocked, setUnlocked] = useState<string[]>(() => getUnlocked());
  const [equipped, setEquipped] = useState<EquippedMap>(() => getEquipped());

  useEffect(() => {
    const handler = () => {
      setUnlocked(getUnlocked());
      setEquipped(getEquipped());
    };
    window.addEventListener("wardrobe:change", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("wardrobe:change", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const equip = useCallback((item: WardrobeItem) => equipItem(item), []);
  const unequip = useCallback((slot: ItemSlot) => unequipSlot(slot), []);

  const equippedItems: WardrobeItem[] = (Object.values(equipped) as string[])
    .map((id) => allItems.find((i) => i.id === id))
    .filter((i): i is WardrobeItem => Boolean(i));

  const unlockedItems: WardrobeItem[] = unlocked
    .map((id) => allItems.find((i) => i.id === id))
    .filter((i): i is WardrobeItem => Boolean(i));

  return { unlocked, unlockedItems, equipped, equippedItems, equip, unequip };
}
