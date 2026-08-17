import type { Quest } from "@/data/quests";
import { selectHomeForYouQuests } from "./homeForYou";

const quest = (id: number): Quest => ({
  id,
  title: `Quest ${id}`,
  subtitle: "Subtitle",
  xp: 100,
  emoji: "📍",
  image: "image.jpg",
  category: "Culture",
  difficulty: "Easy",
  time: "1 hr",
  distance: "On-site",
  location: "Korea",
  story: "Story",
  description: "Description",
  mission: "Mission",
  steps: [],
});

describe("selectHomeForYouQuests", () => {
  const fallback = [quest(1), quest(2)];

  it("shows at most six published quests", () => {
    const published = Array.from({ length: 8 }, (_, index) => quest(index + 10));
    expect(selectHomeForYouQuests(published, fallback, false)).toHaveLength(6);
    expect(selectHomeForYouQuests(published, fallback, false)[0].id).toBe(10);
  });

  it("uses mock recommendations after an error", () => {
    expect(selectHomeForYouQuests(undefined, fallback, true)).toEqual(fallback);
  });

  it("uses mock recommendations for an empty response", () => {
    expect(selectHomeForYouQuests([], fallback, false)).toEqual(fallback);
  });

  it("preserves an intentional empty result for a strict region filter", () => {
    expect(selectHomeForYouQuests([], fallback, false, 6, true)).toEqual([]);
  });

  it("never leaks nationwide mock fallback into a strict region after an API error", () => {
    expect(selectHomeForYouQuests(undefined, fallback, true, 6, true)).toEqual([]);
  });
});
