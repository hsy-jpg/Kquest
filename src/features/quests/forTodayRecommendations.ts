import type { QuestEventSignal } from "./forYouRecommendations";
import type { SupabaseQuestCard } from "./supabaseQuestAdapter";

export type ForTodayBreakdown = {
  eventActiveToday: number;
  eventBoundaryToday: number;
  season: number;
  recommendedTime: number;
  local: number;
  freshness: number;
  nearby: number;
  resumeInProgress: number;
  qualityTieBreaker: number;
  confidenceTieBreaker: number;
  forYouOverlap: number;
};

export type ForTodayQuest = SupabaseQuestCard & {
  forTodayRecommendation: {
    score: number;
    breakdown: ForTodayBreakdown;
    reasons: string[];
    fallbackStage: 1 | 2 | 3;
  };
};

const DAY_MS = 86_400_000;

function seasonAt(date: Date): "SPRING" | "SUMMER" | "FALL" | "WINTER" {
  const month = date.getMonth() + 1;
  if (month >= 3 && month <= 5) return "SPRING";
  if (month >= 6 && month <= 8) return "SUMMER";
  if (month >= 9 && month <= 11) return "FALL";
  return "WINTER";
}

function timeAt(date: Date): "MORNING" | "AFTERNOON" | "SUNSET" | "EVENING" | "NIGHT" {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return "MORNING";
  if (hour >= 12 && hour < 17) return "AFTERNOON";
  if (hour >= 17 && hour < 19) return "SUNSET";
  if (hour >= 19 && hour < 22) return "EVENING";
  return "NIGHT";
}

function sameLocalDay(left: Date, right: Date): boolean {
  return left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate();
}

function eventAvailability(quest: SupabaseQuestCard, now: Date) {
  if (!quest.availability) return { active: false, boundary: false, known: false };
  const start = quest.availability.startAt ? new Date(quest.availability.startAt) : null;
  const end = quest.availability.endAt ? new Date(quest.availability.endAt) : null;
  if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { active: false, boundary: false, known: false };
  }
  return {
    active: start <= now && now <= end,
    boundary: sameLocalDay(start, now) || sameLocalDay(end, now),
    known: true,
  };
}

export function rankForTodayQuests(
  quests: SupabaseQuestCard[],
  events: QuestEventSignal[],
  forYouQuestIds: ReadonlySet<string> = new Set(),
  limit = 3,
  now = new Date(),
): ForTodayQuest[] {
  const eventsByQuest = new Map<string, QuestEventSignal[]>();
  for (const event of events) eventsByQuest.set(event.quest_id, [...(eventsByQuest.get(event.quest_id) ?? []), event]);
  const currentSeason = seasonAt(now);
  const currentTime = timeAt(now);

  const scored = quests.flatMap((quest): ForTodayQuest[] => {
    const ownEvents = eventsByQuest.get(quest.databaseId) ?? [];
    if (ownEvents.some((event) => event.event_type === "COMPLETE")) return [];

    const availability = eventAvailability(quest, now);
    if (availability.known && !availability.active) return [];
    // A Festival without dates cannot be asserted to be executable today.
    if (quest.questType === "FESTIVAL" && !availability.known) return [];

    const eventActiveToday = availability.active ? 3 : 0;
    const eventBoundaryToday = availability.boundary ? 3 : 0;
    const season = quest.season.includes("ALL") || quest.season.includes(currentSeason) ? 2 : 0;
    if (season === 0) return [];
    const recommendedTime = quest.recommendedTimes.includes("ANYTIME") || quest.recommendedTimes.includes(currentTime) ? 2 : 0;
    const local = Math.round(Math.max(0, Math.min(3, quest.localScore * 0.03)) * 100) / 100;
    const publishedAt = new Date(quest.publishedAt ?? quest.createdAt);
    const freshness = !Number.isNaN(publishedAt.getTime()) && now.getTime() - publishedAt.getTime() <= 30 * DAY_MS ? 1 : 0;
    const started = ownEvents.some((event) => event.event_type === "START");
    const resumeInProgress = started ? 1 : 0;
    const qualityTieBreaker = Math.max(0, Math.min(0.5, quest.qualityScore / 200));
    const confidenceTieBreaker = Math.max(0, Math.min(0.5, quest.classificationConfidence * 0.5));
    const forYouOverlap = forYouQuestIds.has(quest.databaseId) ? -2 : 0;
    const breakdown: ForTodayBreakdown = {
      eventActiveToday, eventBoundaryToday, season, recommendedTime, local, freshness,
      nearby: 0, resumeInProgress, qualityTieBreaker, confidenceTieBreaker, forYouOverlap,
    };
    const score = Math.round(Object.values(breakdown).reduce((sum, value) => sum + value, 0) * 100) / 100;
    const fallbackStage: ForTodayQuest["forTodayRecommendation"]["fallbackStage"] =
      recommendedTime > 0 && season > 0 ? 1 : local >= 2.1 ? 2 : 3;
    const reasons = Object.entries(breakdown).filter(([, value]) => value !== 0).map(([key, value]) => `${key}:${value > 0 ? "+" : ""}${value}`);
    return [Object.assign({}, quest, { forTodayRecommendation: { score, breakdown, reasons, fallbackStage } })];
  });

  scored.sort((a, b) =>
    a.forTodayRecommendation.fallbackStage - b.forTodayRecommendation.fallbackStage
    || b.forTodayRecommendation.score - a.forTodayRecommendation.score
    || new Date(b.publishedAt ?? b.createdAt).getTime() - new Date(a.publishedAt ?? a.createdAt).getTime(),
  );

  const selected: ForTodayQuest[] = [];
  const types = new Set<string>();
  for (const quest of scored) {
    if (types.has(quest.questType)) continue;
    selected.push(quest);
    types.add(quest.questType);
    if (selected.length === limit) return selected;
  }
  for (const quest of scored) {
    if (!selected.includes(quest)) selected.push(quest);
    if (selected.length === limit) break;
  }
  return selected;
}
