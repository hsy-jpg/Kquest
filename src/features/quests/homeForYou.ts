import type { Quest } from "@/data/quests";

export function selectHomeForYouQuests(
  published: Quest[] | undefined,
  fallback: Quest[],
  failed: boolean,
  limit = 6,
  preserveEmpty = false,
): Quest[] {
  if (failed) return preserveEmpty ? [] : fallback.slice(0, limit);
  if (published === undefined || (!published.length && !preserveEmpty)) return fallback.slice(0, limit);
  return published.slice(0, limit);
}
