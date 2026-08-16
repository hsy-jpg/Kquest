import { adaptPublishedQuest, type PublishedQuestRecord, type SupabaseQuestCard } from "./supabaseQuestAdapter";
import { rankForTodayQuests } from "./forTodayRecommendations";
import type { QuestEventSignal } from "./forYouRecommendations";

function quest(id: number, type: string, localScore: number, publishedAt = "2026-08-10T00:00:00Z") {
  const record: PublishedQuestRecord = {
    id: `10000000-0000-0000-0000-${String(id).padStart(12, "0")}`,
    quest_id: `today-${id}`,
    source_content_id: String(100 + id),
    title: `${type} Quest ${id}`,
    description: "A locally grounded Quest that can be completed on site.",
    quest_type: type,
    secondary_tags: [], template_id: `TODAY_${id}`,
    steps: [{ order: 1, kind: "PHOTO", prompt: "Capture one permitted detail." }],
    classification_confidence: 0.9, region: "Seoul", district: null,
    latitude: 37.5, longitude: 127, image: "image.jpg", status: "PUBLISHED",
    source_modified_time: publishedAt, created_at: publishedAt, published_at: publishedAt,
    proof_type: "PHOTO", proof_requirement: "Capture one permitted detail.",
    completion_rule: { requiredStepOrders: [1], minimumCompletedSteps: 1, proofRequired: true, proofType: "PHOTO" },
    tour_places: { title: `Quest ${id}`, description: null, content_type: "12", local_score: localScore, quality_score: 90, selection_status: "AUTO_ACCEPTED" },
  };
  return adaptPublishedQuest(record);
}

const candidates = [
  quest(1, "NATURE", 95), quest(2, "MARKET", 90), quest(3, "CULTURE", 85),
  quest(4, "NATURE", 80), quest(5, "FESTIVAL", 98),
];

describe("rankForTodayQuests", () => {
  it("selects up to three executable, diverse PUBLISHED Quest types", () => {
    const ranked = rankForTodayQuests(candidates, [], new Set(), 3, new Date("2026-08-17T14:00:00+09:00"));
    expect(ranked.map((item) => item.questType)).toEqual(["NATURE", "MARKET", "CULTURE"]);
    expect(ranked.every((item) => item.forTodayRecommendation.breakdown.recommendedTime === 2)).toBe(true);
  });

  it("excludes completed Quests and undated Festivals", () => {
    const events: QuestEventSignal[] = [{ quest_id: candidates[0].databaseId, event_type: "COMPLETE", created_at: "2026-08-17T01:00:00Z" }];
    const ranked = rankForTodayQuests(candidates, events, new Set(), 5, new Date("2026-08-17T14:00:00+09:00"));
    expect(ranked.some((item) => item.databaseId === candidates[0].databaseId)).toBe(false);
    expect(ranked.some((item) => item.questType === "FESTIVAL")).toBe(false);
  });

  it("boosts an in-progress Quest and penalizes overlap with For You", () => {
    const events: QuestEventSignal[] = [{ quest_id: candidates[1].databaseId, event_type: "START", created_at: "2026-08-17T01:00:00Z" }];
    const ranked = rankForTodayQuests(candidates, events, new Set([candidates[0].databaseId]), 4, new Date("2026-08-17T14:00:00+09:00"));
    expect(ranked[0].databaseId).toBe(candidates[1].databaseId);
    expect(ranked.find((item) => item.databaseId === candidates[0].databaseId)?.forTodayRecommendation.breakdown.forYouOverlap).toBe(-2);
    expect(ranked[0].forTodayRecommendation.reasons.length).toBeGreaterThan(0);
  });

  it("supports a dated Festival only while its event is active", () => {
    const festival: SupabaseQuestCard = {
      ...candidates[4],
      availability: { startAt: "2026-08-17T00:00:00+09:00", endAt: "2026-08-18T23:59:59+09:00" },
    };
    const ranked = rankForTodayQuests([festival], [], new Set(), 3, new Date("2026-08-17T14:00:00+09:00"));
    expect(ranked[0].forTodayRecommendation.breakdown.eventActiveToday).toBe(3);
    expect(ranked[0].forTodayRecommendation.breakdown.eventBoundaryToday).toBe(3);
  });
});
