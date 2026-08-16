import type { Prefs } from "@/lib/personalization";
import { adaptPublishedQuest, type PublishedQuestRecord } from "./supabaseQuestAdapter";
import { rankForYouQuests, type QuestEventSignal } from "./forYouRecommendations";

function quest(id: number, title: string, type: string, region: string, localScore: number) {
  const record: PublishedQuestRecord = {
    id: `00000000-0000-0000-0000-${String(id).padStart(12, "0")}`,
    quest_id: `quest-${id}`,
    source_content_id: String(id),
    title,
    description: `Discover a local ${title.toLowerCase()} in ${region}.`,
    quest_type: type,
    secondary_tags: [],
    template_id: `TEMPLATE_${id}`,
    steps: [{ order: 1, kind: "PHOTO", prompt: "Capture a local detail." }],
    classification_confidence: 0.9,
    region,
    district: null,
    latitude: null,
    longitude: null,
    image: "image.jpg",
    status: "PUBLISHED",
    source_modified_time: "2026-08-01T00:00:00Z",
    created_at: `2026-08-${String(id).padStart(2, "0")}T00:00:00Z`,
    published_at: `2026-08-${String(id).padStart(2, "0")}T01:00:00Z`,
    proof_type: "PHOTO",
    proof_requirement: "Capture a local detail.",
    completion_rule: { requiredStepOrders: [1], minimumCompletedSteps: 1, proofRequired: true, proofType: "PHOTO" },
    tour_places: {
      title, description: null, content_type: "12", local_score: localScore,
      quality_score: 85, selection_status: "AUTO_ACCEPTED",
    },
  };
  return adaptPublishedQuest(record);
}

const candidates = [
  quest(1, "Seoul Forest Walk", "NATURE", "Seoul", 82),
  quest(2, "Jeonnam Local Market", "MARKET", "Jeollanam-do", 94),
  quest(3, "Busan Night Festival", "FESTIVAL", "Busan", 78),
  quest(4, "Seoul Heritage Village", "CULTURAL_HERITAGE", "Seoul", 88),
  quest(5, "Jeju Coastal Trail", "NATURE", "Jeju", 96),
  quest(6, "Seoul Neighborhood Market", "MARKET", "Seoul", 75),
  quest(7, "Seoul Nature Garden", "NATURE", "Seoul", 80),
  quest(8, "Bupyeong Pungmul Festival", "FESTIVAL", "Incheon", 98),
];

const prefs = (moods: string[], activities: string[], region: string): Prefs => ({ moods, activities, region });

describe("rankForYouQuests", () => {
  it.each([
    ["relaxing Seoul nature user", prefs(["relax"], ["nature"], "seoul"), "Seoul Forest Walk"],
    ["curious Jeonnam food user", prefs(["discover"], ["food"], "jeonnam"), "Jeonnam Local Market"],
    ["exciting Busan festival user", prefs(["exciting"], ["festival"], "busan"), "Busan Night Festival"],
  ])("ranks the expected first Quest for %s", (_name, userPrefs, expected) => {
    expect(rankForYouQuests(candidates, userPrefs, [], 6)[0].title).toBe(expected);
  });

  it("downranks completed and recent view-only Quests and exposes a score breakdown", () => {
    const events: QuestEventSignal[] = [
      { quest_id: candidates[0].databaseId, event_type: "COMPLETE", created_at: "2026-08-16T00:00:00Z" },
      { quest_id: candidates[3].databaseId, event_type: "VIEW", created_at: "2026-08-16T00:00:00Z" },
    ];
    const ranked = rankForYouQuests(candidates, prefs(["relax"], ["nature"], "seoul"), events, 7, new Date("2026-08-17T00:00:00Z"));
    expect(ranked[0].title).toBe("Seoul Nature Garden");
    expect(ranked.find((item) => item.title === "Seoul Forest Walk")?.recommendation.breakdown.currentQuestBehavior).toBe(-8);
    expect(ranked.find((item) => item.title === "Seoul Heritage Village")?.recommendation.breakdown.currentQuestBehavior).toBe(-2);
    expect(ranked[0].recommendation.reasons.length).toBeGreaterThan(0);
  });

  it("limits one Quest type to two until diverse candidates are selected", () => {
    const ranked = rankForYouQuests(candidates, prefs(["relax"], ["nature"], "seoul"), [], 6);
    expect(ranked.filter((item) => item.questType === "NATURE")).toHaveLength(2);
  });

  it("never includes an Incheon Quest in a Jeonnam-scoped recommendation", () => {
    const ranked = rankForYouQuests(candidates, prefs(["exciting"], ["festival"], "jeonnam"), [], 6);
    expect(ranked.some((item) => item.title.includes("Bupyeong"))).toBe(false);
    expect(ranked.every((item) => item.region === "Jeollanam-do")).toBe(true);
  });

  it("matches Bupyeong correctly when Incheon is selected", () => {
    const ranked = rankForYouQuests(candidates, prefs(["exciting"], ["festival"], "incheon"), [], 6);
    expect(ranked[0].title).toBe("Bupyeong Pungmul Festival");
  });

  it("keeps preference relevance above novelty while recording a repetition penalty", () => {
    const userPrefs = prefs(["relax"], ["nature"], "seoul");
    const first = rankForYouQuests(candidates, userPrefs, [], 2);
    const recentIds = new Set(first.map((item) => item.databaseId));
    const rotated = rankForYouQuests(candidates, userPrefs, [], 2, new Date("2026-08-17T00:00:00Z"), recentIds);
    expect(rotated[0].questType).toBe("NATURE");
    expect(rotated[0].recommendation.fallbackStage).toBe(1);
    expect(rotated[0].recommendation.breakdown.recentRecommendation).toBe(-4);
  });
});
