import type { Quest } from "@/data/quests";

type SearchableQuest = Quest & {
  region?: string | null;
  district?: string | null;
};

const normalizeSearchText = (value: string) =>
  value
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

export function matchesQuestSearch(quest: SearchableQuest, query: string): boolean {
  const terms = normalizeSearchText(query).split(/\s+/).filter(Boolean);
  if (!terms.length) return true;

  const searchableText = normalizeSearchText([
    quest.title,
    quest.subtitle,
    quest.location,
    quest.region,
    quest.district,
  ].filter(Boolean).join(" "));

  return terms.every((term) => searchableText.includes(term));
}
