import type { Quest } from "@/data/quests";

export interface ProfileStats {
  completedQuestCount: number;
  totalXp: number;
  categoryCounts: Partial<Record<Quest["category"], number>>;
  photoCount: number;
  friendCount: number;
}

export interface Badge {
  id: string;
  label: string;
  emoji: string;
  isUnlocked: (stats: ProfileStats) => boolean;
}

export const badges: Badge[] = [
  { id: "first-quest", label: "First Quest", emoji: "⭐", isUnlocked: (s) => s.completedQuestCount >= 1 },
  { id: "foodie", label: "Foodie", emoji: "🍜", isUnlocked: (s) => (s.categoryCounts.Food ?? 0) >= 3 },
  { id: "explorer", label: "Explorer", emoji: "🧭", isUnlocked: (s) => s.completedQuestCount >= 10 },
  { id: "night-owl", label: "Night Owl", emoji: "🦉", isUnlocked: (s) => (s.categoryCounts.Nightlife ?? 0) >= 2 },
  { id: "socialite", label: "Socialite", emoji: "🤝", isUnlocked: (s) => s.friendCount >= 3 },
  { id: "photographer", label: "Photographer", emoji: "📸", isUnlocked: (s) => s.photoCount >= 5 },
];

export function computeUnlockedBadges(stats: ProfileStats): (Badge & { unlocked: boolean })[] {
  return badges.map((badge) => ({ ...badge, unlocked: badge.isUnlocked(stats) }));
}
