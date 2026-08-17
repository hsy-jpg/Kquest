import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchQuestReviews, submitQuestReview, QuestReviewTarget, SubmitQuestReviewInput } from "./questReviews";

const reviewsQueryKey = (target: QuestReviewTarget) => ["questReviews", target.questId ?? `mock-${target.mockQuestId}`] as const;

export function useQuestReviews(target: QuestReviewTarget) {
  const key = reviewsQueryKey(target);
  return useQuery({
    queryKey: key,
    queryFn: () => fetchQuestReviews(target),
    enabled: Boolean(target.questId ?? target.mockQuestId != null),
  });
}

export function useSubmitQuestReview(target: QuestReviewTarget) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SubmitQuestReviewInput) => submitQuestReview(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: reviewsQueryKey(target) }),
  });
}
