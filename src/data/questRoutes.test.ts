import { describe, expect, it } from "vitest";
import { getRouteQuests, questRoutes } from "./questRoutes";

describe("Quest Route artwork", () => {
  it("uses a different mission image for every Quest within each route", () => {
    for (const route of questRoutes) {
      const routeQuests = getRouteQuests(route);
      expect(routeQuests, `${route.title} resolves every Quest id`).toHaveLength(route.questIds.length);
      expect(new Set(routeQuests.map((quest) => quest.image)).size, route.title).toBe(routeQuests.length);
    }
  });

  it("uses a different cover for every route", () => {
    expect(new Set(questRoutes.map((route) => route.coverImage)).size).toBe(questRoutes.length);
  });
});
