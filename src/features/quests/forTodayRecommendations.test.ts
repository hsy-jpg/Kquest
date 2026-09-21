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
  it("selects only dated festivals that are active today", () => {
    const festival: SupabaseQuestCard = {
      ...candidates[4],
      availability: { startAt: "2026-08-17T00:00:00+09:00", endAt: "2026-08-18T23:59:59+09:00" },
    };
    const ranked = rankForTodayQuests([...candidates.slice(0, 4), festival], [], new Set(), 3, new Date("2026-08-17T14:00:00+09:00"));
    expect(ranked.map((item) => item.questType)).toEqual(["FESTIVAL"]);
    expect(ranked[0].forTodayRecommendation.breakdown.eventActiveToday).toBe(3);
  });

  it("excludes general places, undated Festivals, and completed Festivals", () => {
    const activeFestival: SupabaseQuestCard = {
      ...candidates[4],
      availability: { startAt: "2026-08-01T00:00:00+09:00", endAt: "2026-08-31T23:59:59+09:00" },
    };
    const events: QuestEventSignal[] = [{ quest_id: activeFestival.databaseId, event_type: "COMPLETE", created_at: "2026-08-17T01:00:00Z" }];
    const ranked = rankForTodayQuests([...candidates, activeFestival], events, new Set(), 5, new Date("2026-08-17T14:00:00+09:00"));
    expect(ranked).toEqual([]);
  });

  it("boosts an in-progress active Festival and penalizes For You overlap", () => {
    const availability = { startAt: "2026-08-01T00:00:00+09:00", endAt: "2026-08-31T23:59:59+09:00" };
    const first = { ...candidates[4], availability };
    const second = { ...candidates[3], questType: "FESTIVAL", availability };
    const events: QuestEventSignal[] = [{ quest_id: second.databaseId, event_type: "START", created_at: "2026-08-17T01:00:00Z" }];
    const ranked = rankForTodayQuests([first, second], events, new Set([first.databaseId]), 2, new Date("2026-08-17T14:00:00+09:00"));
    expect(ranked[0].databaseId).toBe(second.databaseId);
    expect(ranked.find((item) => item.databaseId === first.databaseId)?.forTodayRecommendation.breakdown.forYouOverlap).toBe(-2);
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
