import { Quest, quests } from "@/data/quests";

export const MOODS = [
  { id: "alone", emoji: "😮‍💨", label: "I need some alone time" },
  { id: "relax", emoji: "🌿", label: "I want to relax" },
  { id: "exciting", emoji: "⚡", label: "I want something exciting" },
  { id: "discover", emoji: "🔎", label: "I want to discover something new" },
] as const;

export const ACTIVITIES = [
  { id: "nature", emoji: "🌿", label: "Nature & Hiking" },
  { id: "wellness", emoji: "🧘", label: "Wellness & Healing" },
  { id: "food", emoji: "🍜", label: "Local Food" },
  { id: "culture", emoji: "🏛️", label: "Culture & History" },
  { id: "festival", emoji: "🎉", label: "Festivals & Events" },
  { id: "art", emoji: "🎨", label: "Art & Creativity" },
] as const;

export const REGIONS = [
  { id: "near", emoji: "📍", label: "Near me" },
  { id: "korea", emoji: "🇰🇷", label: "Anywhere in Korea" },
  { id: "seoul", emoji: "🏙️", label: "Seoul" },
  { id: "busan", emoji: "🌊", label: "Busan" },
  { id: "jeju", emoji: "🍊", label: "Jeju" },
  { id: "jeonnam", emoji: "🍵", label: "Jeollanam-do" },
  { id: "other", emoji: "🧭", label: "Other" },
] as const;

export type Prefs = {
  moods: string[];
  activities: string[];
  region: string;
};

const KEY = "kquest.prefs";

export const loadPrefs = (): Prefs | null => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Prefs) : null;
  } catch {
    return null;
  }
};

export const savePrefs = (p: Prefs) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
};

const activityCategories: Record<string, Quest["category"][]> = {
  nature: ["Nature"],
  wellness: ["Nature", "Culture"],
  food: ["Food"],
  culture: ["Culture"],
  festival: ["Festival", "Nightlife"],
  art: ["Culture", "Shopping"],
};

const moodCategories: Record<string, Quest["category"][]> = {
  alone: ["Nature", "Culture"],
  relax: ["Nature", "Culture", "Food"],
  exciting: ["Nightlife", "Festival"],
  discover: ["Shopping", "Culture", "Food"],
};

const moodKeywords: Record<string, string[]> = {
  alone: ["walk", "book", "tea", "park", "quiet", "bath", "night"],
  relax: ["bath", "tea", "cafe", "picnic", "walk", "river", "bakery"],
  exciting: ["festival", "noraebang", "night", "bike", "hike", "badminton"],
  discover: ["market", "hidden", "local", "alley", "flea", "salon"],
};

const regionMatches = (region: string, quest: Quest) => {
  const loc = quest.location.toLowerCase();
  switch (region) {
    case "seoul":
    case "near":
      return loc.includes("seoul") || loc.includes("jongno");
    case "korea":
    case "other":
      return true;
    default:
      return loc.includes(region);
  }
};

export const scoreQuest = (quest: Quest, prefs: Prefs) => {
  let score = 0;
  if (regionMatches(prefs.region, quest)) score += 3;

  for (const a of prefs.activities) {
    if (activityCategories[a]?.includes(quest.category)) score += 2;
  }

  const text = `${quest.title} ${quest.subtitle} ${quest.description ?? ""}`.toLowerCase();
  for (const m of prefs.moods) {
    if (moodCategories[m]?.includes(quest.category)) score += 2;
    if (moodKeywords[m]?.some((k) => text.includes(k))) score += 1;
  }
  return score;
};

export const recommendedQuests = (prefs: Prefs | null, limit = 6): Quest[] => {
  if (!prefs) return [];
  return quests
    .map((q) => ({ q, s: scoreQuest(q, prefs) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || b.q.xp - a.q.xp)
    .slice(0, limit)
    .map((x) => x.q);
};
