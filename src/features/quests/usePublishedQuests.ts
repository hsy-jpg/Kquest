import { useQuery } from "@tanstack/react-query";
import { fetchPublishedQuest, fetchPublishedQuests } from "./publishedQuests";

export const publishedQuestsQueryKey = ["quests", "published"] as const;

export function usePublishedQuests() {
  return useQuery({
    queryKey: publishedQuestsQueryKey,
    queryFn: fetchPublishedQuests,
    staleTime: 5 * 60 * 1000,
  });
}

export function usePublishedQuest(routeId: string | undefined) {
  return useQuery({
    queryKey: [...publishedQuestsQueryKey, routeId],
    queryFn: () => fetchPublishedQuest(routeId!),
    enabled: Boolean(routeId),
    staleTime: 5 * 60 * 1000,
  });
}
