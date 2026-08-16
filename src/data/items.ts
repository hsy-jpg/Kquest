export type ItemSlot = "hat" | "glasses" | "accessory" | "backpack" | "outfit";

export interface WardrobeItem {
  id: string;
  name: string;
  emoji: string;
  slot: ItemSlot;
  /** Absolute position on tiger (percentages of container) */
  style: React.CSSProperties;
  /** Tailwind text size for emoji */
  sizeClass: string;
  /** Short description for cards */
  description: string;
}

/**
 * Every quest awards ONE specific item — never random.
 * Keyed by quest id from `src/data/quests.ts`.
 */
export const questItems: Record<number, WardrobeItem> = {
  0: {
    id: "soju-bottle",
    name: "Soju Bottle Charm",
    emoji: "🍶",
    slot: "accessory",
    style: { bottom: "22%", right: "8%", transform: "rotate(12deg)" },
    sizeClass: "text-3xl",
    description: "Earned at Euljiro pojangmacha",
  },
  1: {
    id: "ramyeon-bowl",
    name: "Ramyeon Bowl",
    emoji: "🍜",
    slot: "accessory",
    style: { bottom: "20%", left: "6%", transform: "rotate(-8deg)" },
    sizeClass: "text-3xl",
    description: "Convenience store chef trophy",
  },
  2: {
    id: "vintage-jacket",
    name: "Dongmyo Vintage Jacket",
    emoji: "🧥",
    slot: "outfit",
    style: { top: "38%", left: "50%", transform: "translateX(-50%)" },
    sizeClass: "text-5xl",
    description: "Thrifted at Dongmyo Flea Market",
  },
  3: {
    id: "microphone",
    name: "Golden Microphone",
    emoji: "🎤",
    slot: "accessory",
    style: { top: "44%", right: "4%", transform: "rotate(20deg)" },
    sizeClass: "text-3xl",
    description: "Noraebang high score reward",
  },
  4: {
    id: "baduk-glasses",
    name: "Baduk Master Glasses",
    emoji: "👓",
    slot: "glasses",
    style: { top: "22%", left: "50%", transform: "translateX(-50%)" },
    sizeClass: "text-3xl",
    description: "Earned at Tapgol Park",
  },
  5: {
    id: "towel-hat",
    name: "Bathhouse Towel Hat",
    emoji: "🧖",
    slot: "hat",
    style: { top: "-2%", left: "50%", transform: "translateX(-50%)" },
    sizeClass: "text-5xl",
    description: "Classic jjimjilbang sheep towel",
  },
  6: {
    id: "coffee-cup",
    name: "Signature Latte",
    emoji: "☕",
    slot: "accessory",
    style: { bottom: "24%", right: "6%", transform: "rotate(-10deg)" },
    sizeClass: "text-3xl",
    description: "From Seoul's hidden cafe",
  },
  7: {
    id: "night-cap",
    name: "Night Walk Cap",
    emoji: "🧢",
    slot: "hat",
    style: { top: "0%", left: "50%", transform: "translateX(-50%)" },
    sizeClass: "text-5xl",
    description: "Apartment park stroll souvenir",
  },
  8: {
    id: "picnic-backpack",
    name: "Han River Picnic Backpack",
    emoji: "🎒",
    slot: "backpack",
    style: { top: "32%", left: "2%", transform: "rotate(-6deg)" },
    sizeClass: "text-4xl",
    description: "Riverside picnic gear",
  },
  9: {
    id: "triangle-kimbap",
    name: "Triangle Kimbap",
    emoji: "🍙",
    slot: "accessory",
    style: { bottom: "22%", left: "4%", transform: "rotate(-12deg)" },
    sizeClass: "text-3xl",
    description: "Convenience store feast",
  },
  10: {
    id: "gimbap-charm",
    name: "Gimbap Roll Charm",
    emoji: "🥢",
    slot: "accessory",
    style: { bottom: "26%", right: "6%", transform: "rotate(14deg)" },
    sizeClass: "text-3xl",
    description: "Bunsikjip lunch token",
  },
  11: {
    id: "neon-shades",
    name: "Hongdae Neon Shades",
    emoji: "🕶️",
    slot: "glasses",
    style: { top: "22%", left: "50%", transform: "translateX(-50%)" },
    sizeClass: "text-3xl",
    description: "Survived a night in Hongdae",
  },
  12: {
    id: "market-tote",
    name: "Market Tote Bag",
    emoji: "🛍️",
    slot: "backpack",
    style: { top: "36%", left: "2%", transform: "rotate(-4deg)" },
    sizeClass: "text-4xl",
    description: "From a real ajumma market",
  },
  13: {
    id: "rose-crown",
    name: "Rose Crown",
    emoji: "🌹",
    slot: "hat",
    style: { top: "-2%", left: "50%", transform: "translateX(-50%)" },
    sizeClass: "text-4xl",
    description: "Jungnang rose tunnel keepsake",
  },
  14: {
    id: "rainbow-charm",
    name: "Rainbow Fountain Charm",
    emoji: "💦",
    slot: "accessory",
    style: { bottom: "28%", right: "6%" },
    sizeClass: "text-3xl",
    description: "Banpo summer night memory",
  },
  15: {
    id: "lantern",
    name: "Cheonggye Lantern",
    emoji: "🏮",
    slot: "accessory",
    style: { bottom: "30%", left: "4%" },
    sizeClass: "text-3xl",
    description: "Seoul Lantern Festival glow",
  },
  16: {
    id: "cycling-helmet",
    name: "Riverside Cycling Helmet",
    emoji: "⛑️",
    slot: "hat",
    style: { top: "-2%", left: "50%", transform: "translateX(-50%)" },
    sizeClass: "text-5xl",
    description: "Han River bike road badge",
  },
  17: {
    id: "fresh-cut",
    name: "Fresh K-Cut Styling",
    emoji: "💇",
    slot: "hat",
    style: { top: "-4%", left: "50%", transform: "translateX(-50%)" },
    sizeClass: "text-5xl",
    description: "Neighborhood salon makeover",
  },
  18: {
    id: "hiking-cap",
    name: "Inwangsan Hiking Cap",
    emoji: "🧢",
    slot: "hat",
    style: { top: "-2%", left: "50%", transform: "translateX(-50%)" },
    sizeClass: "text-5xl",
    description: "Summit + makgeolli reward",
  },
  19: {
    id: "indie-book",
    name: "Indie Bookstore Find",
    emoji: "📖",
    slot: "accessory",
    style: { bottom: "28%", left: "4%", transform: "rotate(-10deg)" },
    sizeClass: "text-3xl",
    description: "Curated by a real Seoul reader",
  },
  20: {
    id: "soboro-bun",
    name: "Soboro-ppang Charm",
    emoji: "🥖",
    slot: "accessory",
    style: { bottom: "24%", right: "6%", transform: "rotate(12deg)" },
    sizeClass: "text-3xl",
    description: "Neighborhood bakery classic",
  },
  21: {
    id: "badminton-racket",
    name: "Park Badminton Racket",
    emoji: "🏸",
    slot: "accessory",
    style: { top: "44%", right: "4%", transform: "rotate(25deg)" },
    sizeClass: "text-3xl",
    description: "Earned on a neighborhood court",
  },
  22: {
    id: "tteokbokki-bowl",
    name: "Spicy Tteokbokki Bowl",
    emoji: "🥘",
    slot: "accessory",
    style: { bottom: "22%", right: "6%", transform: "rotate(-10deg)" },
    sizeClass: "text-3xl",
    description: "Bunsikjip lunch trophy",
  },
};



export function getItemForQuest(questId: number): WardrobeItem {
  return questItems[questId] ?? questItems[0];
}

export const allItems: WardrobeItem[] = Object.values(questItems);

export const slotLabels: Record<ItemSlot, string> = {
  hat: "Hat",
  glasses: "Glasses",
  accessory: "Accessory",
  backpack: "Backpack",
  outfit: "Outfit",
};
