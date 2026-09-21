import { describe, expect, it } from "vitest";
import { quests } from "@/data/quests";
import { matchesQuestSearch } from "./questSearch";

describe("matchesQuestSearch", () => {
  it("finds quests by title regardless of case", () => {
    expect(matchesQuestSearch(quests[0], "snack master")).toBe(true);
    expect(matchesQuestSearch(quests[0], "SNACK MASTER")).toBe(true);
  });

  it("finds quests by location", () => {
    expect(matchesQuestSearch(quests[0], "Euljiro")).toBe(true);
    expect(matchesQuestSearch(quests[0], "Seoul")).toBe(true);
  });

  it("requires every search term to match", () => {
    expect(matchesQuestSearch(quests[0], "Euljiro master")).toBe(true);
    expect(matchesQuestSearch(quests[0], "Euljiro badminton")).toBe(false);
  });

  it("matches live quest region and district fields", () => {
    const liveQuest = { ...quests[0], region: "Busan", district: "Haeundae-gu" };
    expect(matchesQuestSearch(liveQuest, "Busan Haeundae")).toBe(true);
  });
});
