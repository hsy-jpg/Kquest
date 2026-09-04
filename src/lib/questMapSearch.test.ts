import { describe, expect, it } from "vitest";
import { quests } from "@/data/quests";
import {
  getMockQuestMapSearchQuery,
  getMockQuestMapUrls,
  MOCK_QUEST_MAP_SEARCH_TERMS,
} from "@/lib/questMapSearch";

describe("mock Quest map search terms", () => {
  it("uses a searchable Korean place/category instead of the English Quest title", () => {
    expect(getMockQuestMapSearchQuery(quests[0])).toBe("을지로 포장마차");
    expect(getMockQuestMapSearchQuery(quests[0])).not.toContain("Snack Master");
    expect(getMockQuestMapSearchQuery(quests[7])).toContain("공원");
    expect(getMockQuestMapSearchQuery(quests[7])).not.toContain("Apartment Park Night Walk");
  });

  it("covers every current Seoul/local mock Quest", () => {
    for (const quest of quests) {
      expect(MOCK_QUEST_MAP_SEARCH_TERMS[quest.id], quest.title).toBeTruthy();
      expect(getMockQuestMapSearchQuery(quest).trim(), quest.title).not.toBe("");
    }
  });

  it("creates valid Google and Kakao search URLs for multi-word Korean terms", () => {
    const urls = getMockQuestMapUrls(quests[1]);

    expect(urls.google).toBe(
      "https://www.google.com/maps/search/?api=1&query=%EC%84%9C%EC%9A%B8%20%ED%8E%B8%EC%9D%98%EC%A0%90",
    );
    expect(urls.kakao).toBe(
      "https://map.kakao.com/?q=%EC%84%9C%EC%9A%B8%20%ED%8E%B8%EC%9D%98%EC%A0%90",
    );
    expect(urls.kakao).not.toContain("/link/search/");
  });
});
