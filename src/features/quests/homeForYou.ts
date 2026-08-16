import type { Quest } from "@/data/quests";

export function selectHomeForYouQuests(
  published: Quest[] | undefined,
  fallback: Quest[],
  failed: boolean,
  limit = 6,
): Quest[] {
  if (failed || !published?.length) return fallback.slice(0, limit);
  return published.slice(0, limit);
}
