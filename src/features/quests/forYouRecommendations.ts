import type { Prefs } from "@/lib/personalization";
import type { SupabaseQuestCard } from "./supabaseQuestAdapter";

export type QuestEventSignal = {
  quest_id: string;
  event_type: "VIEW" | "START" | "COMPLETE";
  created_at: string;
};

export type RecommendationBreakdown = {
  region: number;
  mood: number;
  activity: number;
  local: number;
  season: number;
  duration: number;
  distance: number;
  learnedPreference: number;
  currentQuestBehavior: number;
  recentRecommendation: number;
  qualityTieBreaker: number;
  confidenceTieBreaker: number;
};

export type RecommendedQuest = SupabaseQuestCard & {
  recommendation: {
    score: number;
    breakdown: RecommendationBreakdown;
    reasons: string[];
    fallbackStage: 1 | 2 | 3 | 4 | 5 | 6;
  };
};

const ACTIVITY_TYPES: Record<string, string[]> = {
  nature: ["NATURE"],
  wellness: ["NATURE", "CULTURE", "CRAFT_EXPERIENCE"],
  food: ["LOCAL_FOOD", "MARKET"],
  culture: ["CULTURE", "CULTURAL_HERITAGE", "NEIGHBORHOOD", "CRAFT_EXPERIENCE"],
  festival: ["FESTIVAL", "NIGHTLIFE"],
  art: ["CULTURE", "CRAFT_EXPERIENCE", "SHOPPING"],
};

const MOOD_TYPES: Record<string, string[]> = {
  alone: ["NATURE", "CULTURE", "CULTURAL_HERITAGE", "NEIGHBORHOOD"],
  relax: ["NATURE", "CULTURE", "LOCAL_FOOD"],
  exciting: ["FESTIVAL", "NIGHTLIFE", "NATURE"],
  discover: ["MARKET", "SHOPPING", "CULTURE", "NEIGHBORHOOD", "LOCAL_FOOD", "GENERIC_LOCAL_DISCOVERY"],
};

const MOOD_KEYWORDS: Record<string, string[]> = {
  alone: ["quiet", "walk", "garden", "forest", "museum", "village"],
  relax: ["healing", "relax", "tea", "cafe", "park", "river", "coast", "garden"],
  exciting: ["festival", "night", "hike", "trail", "performance", "event"],
  discover: ["local", "market", "alley", "village", "heritage", "craft", "hidden"],
};

const REGION_ALIASES: Record<string, string[]> = {
  seoul: ["seoul"], incheon: ["incheon"], busan: ["busan"],
  daegu: ["daegu"], gwangju: ["gwangju"], daejeon: ["daejeon"],
  ulsan: ["ulsan"], sejong: ["sejong"], gyeonggi: ["gyeonggi"],
  gangwon: ["gangwon"], chungbuk: ["chungbuk", "chungcheongbuk", "north chungcheong"],
  chungnam: ["chungnam", "chungcheongnam", "south chungcheong"],
  jeonbuk: ["jeonbuk", "jeollabuk", "north jeolla"],
  jeonnam: ["jeollanam", "jeonnam", "south jeolla"],
  gyeongbuk: ["gyeongbuk", "gyeongsangbuk", "north gyeongsang"],
  gyeongnam: ["gyeongnam", "gyeongsangnam", "south gyeongsang"],
  jeju: ["jeju"],
};

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

function regionMatches(prefRegion: string, quest: SupabaseQuestCard): boolean {
  const target = normalize(`${quest.location} ${quest.region ?? ""} ${quest.district ?? ""}`);
  if (prefRegion === "korea" || prefRegion === "near") return false;
  return (REGION_ALIASES[prefRegion] ?? [prefRegion]).some((alias) => target.includes(normalize(alias)));
}

function questText(quest: SupabaseQuestCard): string {
  return normalize(`${quest.title} ${quest.description} ${quest.questType} ${quest.secondaryTags.join(" ")}`);
}

function matchesAnyType(values: string[], quest: SupabaseQuestCard): boolean {
  const types = new Set([quest.questType.toUpperCase(), quest.category.toUpperCase(), ...quest.secondaryTags.map((tag) => tag.toUpperCase())]);
  return values.some((value) => types.has(value));
}

function groupEvents(events: QuestEventSignal[]) {
  const byQuest = new Map<string, QuestEventSignal[]>();
  for (const event of events) byQuest.set(event.quest_id, [...(byQuest.get(event.quest_id) ?? []), event]);
  return byQuest;
}

export function rankForYouQuests(
  quests: SupabaseQuestCard[],
  prefs: Prefs,
  events: QuestEventSignal[],
  limit = 6,
  now = new Date(),
  recentRecommendedIds: ReadonlySet<string> = new Set(),
): RecommendedQuest[] {
  const hasStrictRegion = prefs.region !== "korea" && prefs.region !== "near";
  const eligibleQuests = hasStrictRegion
    ? quests.filter((quest) => regionMatches(prefs.region, quest))
    : quests;
  const byQuest = groupEvents(events);
  const questById = new Map(eligibleQuests.map((quest) => [quest.databaseId, quest]));
  const learnedTypes = new Map<string, number>();

  for (const event of events) {
    const source = questById.get(event.quest_id);
    if (!source) continue;
    const weight = event.event_type === "COMPLETE" ? 2 : event.event_type === "START" ? 1 : 0.25;
    learnedTypes.set(source.questType, Math.min(2, (learnedTypes.get(source.questType) ?? 0) + weight));
  }

  const scored = eligibleQuests.map((quest): RecommendedQuest => {
    const text = questText(quest);
    const region = regionMatches(prefs.region, quest) ? 4 : 0;
    const activity = prefs.activities.some((value) => matchesAnyType(ACTIVITY_TYPES[value] ?? [], quest)) ? 3 : 0;
    const moodType = prefs.moods.some((value) => matchesAnyType(MOOD_TYPES[value] ?? [], quest));
    const moodKeyword = prefs.moods.some((value) => (MOOD_KEYWORDS[value] ?? []).some((keyword) => text.includes(keyword)));
    const mood = moodType ? 3 : moodKeyword ? 1.5 : 0;
    const local = Math.round(Math.max(0, Math.min(3, quest.localScore * 0.03)) * 100) / 100;
    const season = quest.season.includes("ALL") ? 2 : 0;
    const ownEvents = byQuest.get(quest.databaseId) ?? [];
    const completed = ownEvents.some((event) => event.event_type === "COMPLETE");
    const started = ownEvents.some((event) => event.event_type === "START");
    const recentViewOnly = !started && ownEvents.some((event) =>
      event.event_type === "VIEW" && now.getTime() - new Date(event.created_at).getTime() <= 7 * 86_400_000,
    );
    const currentQuestBehavior = completed ? -8 : recentViewOnly ? -2 : started ? 1 : 0;
    const recentRecommendation = recentRecommendedIds.has(quest.databaseId) ? -4 : 0;
    const learnedPreference = completed ? 0 : learnedTypes.get(quest.questType) ?? 0;
    const qualityTieBreaker = Math.max(0, Math.min(0.5, quest.qualityScore / 200));
    const confidenceTieBreaker = Math.max(0, Math.min(0.5, quest.classificationConfidence * 0.5));
    const breakdown: RecommendationBreakdown = {
      region, mood, activity, local, season, duration: 0, distance: 0,
      learnedPreference, currentQuestBehavior, recentRecommendation, qualityTieBreaker, confidenceTieBreaker,
    };
    const score = Math.round(Object.values(breakdown).reduce((sum, value) => sum + value, 0) * 100) / 100;
    const reasons = Object.entries(breakdown).filter(([, value]) => value !== 0).map(([key, value]) => `${key}:${value > 0 ? "+" : ""}${value}`);
    const fallbackStage: RecommendedQuest["recommendation"]["fallbackStage"] = completed
      ? 6
      : region > 0 && mood > 0 && activity > 0
        ? 1
        : region > 0 && activity > 0
          ? 2
          : region > 0 && mood > 0
            ? 3
            : region > 0
              ? 4
              : local >= 2.1
                ? 5
                : 6;
    return Object.assign({}, quest, { recommendation: { score, breakdown, reasons, fallbackStage } });
  });

  scored.sort((a, b) =>
    a.recommendation.fallbackStage - b.recommendation.fallbackStage
    || b.recommendation.score - a.recommendation.score
    || new Date(b.publishedAt ?? b.createdAt).getTime() - new Date(a.publishedAt ?? a.createdAt).getTime(),
  );

  // Repetition is only a tie-breaker inside the same relevance stage. A fresh
  // but poorly matched Quest must never outrank a relevant local Quest.
  const orderedForRotation = scored;
  const selected: RecommendedQuest[] = [];
  const categoryCounts = new Map<string, number>();
  for (const quest of orderedForRotation) {
    if ((categoryCounts.get(quest.questType) ?? 0) >= 2) continue;
    selected.push(quest);
    categoryCounts.set(quest.questType, (categoryCounts.get(quest.questType) ?? 0) + 1);
    if (selected.length === limit) return selected;
  }
  for (const quest of orderedForRotation) {
    if (!selected.includes(quest)) selected.push(quest);
    if (selected.length === limit) break;
  }
  return selected;
}
