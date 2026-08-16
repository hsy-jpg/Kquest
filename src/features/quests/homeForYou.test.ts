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
});
