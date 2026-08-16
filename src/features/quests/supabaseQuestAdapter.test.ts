import { adaptPublishedQuest, type PublishedQuestRecord } from "./supabaseQuestAdapter";

const record: PublishedQuestRecord = {
  id: "00000000-0000-0000-0000-000000000123",
  quest_id: "kq-kto-123-test",
  source_content_id: "123",
  title: "Discover a Local Market",
  description: "Walk through a neighborhood market. Meet its everyday rhythm.",
  quest_type: "MARKET",
  secondary_tags: ["LOCAL_FOOD"],
  template_id: "MARKET_DETAIL_HUNT_V1",
  steps: [
    { order: 1, kind: "VISIT", prompt: "Visit the market.", verification: "GEOFENCE" },
    { order: 2, kind: "PHOTO", prompt: "Photograph a permitted detail.", verification: "USER_PHOTO" },
  ],
  classification_confidence: 0.9,
  region: "Seoul",
  district: "Jongno-gu",
  latitude: 37.5,
  longitude: 127,
  image: "https://example.com/image.jpg",
  status: "PUBLISHED",
  source_modified_time: "2026-08-16T00:00:00Z",
  created_at: "2026-08-16T00:00:00Z",
  published_at: "2026-08-16T01:00:00Z",
  proof_type: "PHOTO",
  proof_requirement: "Photograph a permitted detail.",
  completion_rule: {
    requiredStepOrders: [1, 2],
    minimumCompletedSteps: 2,
    proofRequired: true,
    proofType: "PHOTO",
  },
  tour_places: {
    title: "Local Market",
    description: "Source overview",
    content_type: "38",
    local_score: 80,
    quality_score: 90,
    selection_status: "AUTO_ACCEPTED",
  },
};

describe("adaptPublishedQuest", () => {
  it("maps a published Supabase row to the existing Quest card shape", () => {
    const quest = adaptPublishedQuest(record);

    expect(quest.id).toBe(123);
    expect(quest.category).toBe("Shopping");
    expect(quest.location).toBe("Jongno-gu, Seoul");
    expect(quest.steps.map((step) => step.type)).toEqual(["location", "photo"]);
    expect(quest.questId).toBe(record.quest_id);
    expect(quest.sourceContentId).toBe(record.source_content_id);
    expect(quest.actionTypes).toContain("CAPTURE");
    expect(quest.durationMinutes).toBe(10);
    expect(quest.proofType).toBe("PHOTO");
    expect(quest.completionRule.requiredStepOrders).toEqual([1, 2]);
  });
});
