import { describe, expect, it } from "vitest";
import { localQuests } from "./quests";

describe("local quest catalogue", () => {
  it("has enough nationwide quests to fill a sparse regional Local tab", () => {
    expect(localQuests.length).toBeGreaterThanOrEqual(10);
  });

  it("contains location-flexible everyday Korean experiences", () => {
    expect(localQuests.map((quest) => quest.id)).toEqual(expect.arrayContaining([0, 7, 23, 24, 25, 26, 27, 28]));
  });

  it("keeps Pojangmacha Snack Master at the end of Trending local quests", () => {
    expect(localQuests.at(-1)?.id).toBe(0);
  });

  it("has nationwide Shopping fallbacks for sparse regions", () => {
    expect(localQuests.filter((quest) => quest.category === "Shopping").map((quest) => quest.id))
      .toEqual(expect.arrayContaining([25, 28]));
  });
});
