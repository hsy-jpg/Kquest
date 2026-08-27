import { describe, expect, it } from "vitest";
import { questItems, allItems, getItemForQuest } from "@/data/items";
import { equipmentFor, placementFor } from "@/lib/tigerEquipment";

describe("tiger equipment visuals", () => {
  it("maps the supported PNG rewards to the intended visual slots", () => {
    expect(equipmentFor("hiking-stick")?.slot).toBe("HAND");
    expect(equipmentFor("picnic-sunglasses")?.slot).toBe("FACE");
    expect(equipmentFor("picnic-backpack")?.slot).toBe("BACK");
    expect(equipmentFor("banana-milk")?.slot).toBe("HAND");
    expect(equipmentFor("camera-charm")?.slot).toBe("HAND");
    expect(equipmentFor("traditional-fan")?.slot).toBe("HAND");
    expect(equipmentFor("tteokbokki-bowl")?.slot).toBe("HAND");
    expect(equipmentFor("soju-bottle")?.slot).toBe("HAND");
    expect(equipmentFor("microphone")?.slot).toBe("HAND");
    expect(equipmentFor("night-cap")?.slot).toBe("HEAD");
    expect(equipmentFor("ramyeon-bowl")?.slot).toBe("HAND");
    expect(equipmentFor("vintage-jacket")?.slot).toBe("BODY");
    expect(equipmentFor("market-tote")?.slot).toBe("BACK");
    expect(equipmentFor("rose-crown")?.slot).toBe("HEAD");
    expect(equipmentFor("fresh-cut")?.slot).toBe("HEAD");
    expect(equipmentFor("towel-hat")?.slot).toBe("HEAD");
  });

  it("matches forests and the existing local quest rewards before generic camera fallback", () => {
    expect(getItemForQuest({ id: 1201, title: "Healing Walk in a Recreational Forest", category: "Nature" }).id).toBe(
      "hiking-stick",
    );
    expect(getItemForQuest({ id: 1202, title: "Seoul Forest Woodland Trail", category: "Nature" }).id).toBe(
      "hiking-stick",
    );
    expect(getItemForQuest({ id: 1203, title: "Local Tteokbokki Stop", category: "Food" }).id).toBe(
      "tteokbokki-bowl",
    );
    expect(getItemForQuest({ id: 1204, title: "Euljiro Pojangmacha Night", category: "Food" }).id).toBe(
      "soju-bottle",
    );
    expect(getItemForQuest({ id: 1205, title: "Coin Noraebang Challenge", category: "Nightlife" }).id).toBe(
      "microphone",
    );
  });

  it("awards the fan only to explicitly traditional real quests", () => {
    expect(getItemForQuest({ id: 1001, title: "Bukchon Hanok Heritage Walk", category: "Culture" }).id).toBe(
      "traditional-fan",
    );
    expect(getItemForQuest({ id: 1002, title: "Modern Art Gallery", category: "Culture" }).id).toBe(
      "camera-charm",
    );
    expect(getItemForQuest({ id: 1003, title: "Danyang Bobaljae Pass", category: "Culture" }).id).toBe(
      "traditional-fan",
    );
  });

  it("applies the six-item reward priority to real quest titles", () => {
    expect(getItemForQuest({ id: 1101, title: "Seoraksan Mountain Trail", category: "Nature" }).id).toBe(
      "hiking-stick",
    );
    expect(getItemForQuest({ id: 1102, title: "Haeundae Beach Walk", category: "Nature" }).id).toBe(
      "picnic-sunglasses",
    );
    expect(getItemForQuest({ id: 1103, title: "Hangang Riverside Picnic", category: "Nature" }).id).toBe(
      "picnic-backpack",
    );
    expect(getItemForQuest({ id: 1104, title: "Local Jjimjilbang Visit", category: "Culture" }).id).toBe(
      "banana-milk",
    );
    expect(getItemForQuest({ id: 1105, title: "City Observatory", category: "Culture" }).id).toBe(
      "camera-charm",
    );
    expect(questItems[18].id).toBe("hiking-stick");
    expect(allItems.some((item) => item.id === "hiking-cap")).toBe(true);
  });

  it("awards banana milk for the jjimjilbang quest without orphaning legacy saves", () => {
    expect(questItems[5].id).toBe("banana-milk");
    expect(questItems[5].slot).toBe("accessory");
    expect(allItems.some((item) => item.id === "towel-hat")).toBe(true);
  });

  it("keeps back equipment behind the tiger and face/hand equipment in front", () => {
    expect(equipmentFor("picnic-backpack")!.placement.zIndex).toBeLessThan(20);
    expect(equipmentFor("picnic-sunglasses")!.placement.zIndex).toBeGreaterThan(20);
    expect(equipmentFor("camera-charm")!.placement.zIndex).toBeGreaterThan(20);
  });

  it("keeps tall hand rewards below or beside the wardrobe face", () => {
    const stick = placementFor(equipmentFor("hiking-stick")!, "wardrobe");
    const fan = placementFor(equipmentFor("traditional-fan")!, "wardrobe");
    const hair = placementFor(equipmentFor("fresh-cut")!, "wardrobe");

    expect(stick.scale).toBeLessThanOrEqual(1.25);
    expect(stick.x).toBeLessThanOrEqual(-12);
    expect(stick.y).toBeGreaterThanOrEqual(9);
    expect(fan.scale).toBeLessThanOrEqual(0.85);
    expect(fan.y).toBeGreaterThanOrEqual(11);
    expect(hair.scale).toBeLessThanOrEqual(1.05);
    expect(hair.y).toBeLessThanOrEqual(-18);
  });

  it("keeps every required placement inside the adjustable config contract", () => {
    const ids = [
      "hiking-stick",
      "picnic-sunglasses",
      "picnic-backpack",
      "banana-milk",
      "traditional-fan",
      "camera-charm",
      "tteokbokki-bowl",
      "soju-bottle",
      "microphone",
      "night-cap",
      "ramyeon-bowl",
      "vintage-jacket",
      "coffee-cup",
      "triangle-kimbap",
      "gimbap-charm",
      "market-tote",
      "rose-crown",
      "rainbow-charm",
      "fresh-cut",
      "indie-book",
      "soboro-bun",
      "badminton-racket",
      "towel-hat",
    ];

    for (const id of ids) {
      const visual = equipmentFor(id);
      expect(visual, `${id} visual`).toBeDefined();
      const placement = placementFor(visual!, "wave");
      expect(placement.scale).toBeGreaterThan(0);
      expect(placement.scale).toBeLessThanOrEqual(2);
      expect(Math.abs(placement.x)).toBeLessThanOrEqual(25);
      expect(Math.abs(placement.y)).toBeLessThanOrEqual(visual!.slot === "HEAD" ? 35 : 15);
      expect(Math.abs(placement.rotation)).toBeLessThanOrEqual(15);
      if (visual!.slot === "BACK") expect(placement.zIndex).toBeLessThan(20);
      else expect(placement.zIndex).toBeGreaterThan(20);
    }
  });
});
