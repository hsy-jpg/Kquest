import { supabase } from "@/integrations/supabase/client";
import { ensureMvpUser } from "@/features/quests/questCompletion";

export interface QuestReviewTarget {
  questId?: string | null;
  mockQuestId?: number | null;
}

export interface QuestReview {
  id: string;
  rating: number;
  reviewText: string;
  createdAt: string;
  isMine: boolean;
  author: { displayName: string; countryFlag: string };
}

export async function fetchQuestReviews(target: QuestReviewTarget): Promise<QuestReview[]> {
  const user = await ensureMvpUser();
  let query = supabase.from("quest_reviews").select("id, user_id, rating, review_text, created_at");
  query = target.questId ? query.eq("quest_id", target.questId) : query.eq("mock_quest_id", target.mockQuestId!);

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw new Error(`Could not load reviews: ${error.message}`);

  const userIds = [...new Set((data ?? []).map((row) => row.user_id))];
  const { data: profileRows, error: profileError } = userIds.length
    ? await supabase.from("profiles").select("user_id, display_name, country_flag").in("user_id", userIds)
    : { data: [], error: null };
  if (profileError) throw new Error(`Could not load reviewers: ${profileError.message}`);
  const profileById = new Map((profileRows ?? []).map((p) => [p.user_id, p]));

  return (data ?? []).map((row) => ({
    id: row.id,
    rating: row.rating,
    reviewText: row.review_text,
    createdAt: row.created_at,
    isMine: row.user_id === user.id,
    author: {
      displayName: profileById.get(row.user_id)?.display_name ?? "Traveler",
      countryFlag: profileById.get(row.user_id)?.country_flag ?? "🌍",
    },
  }));
}

export interface SubmitQuestReviewInput extends QuestReviewTarget {
  rating: number;
  reviewText: string;
}

export async function submitQuestReview({ questId, mockQuestId, rating, reviewText }: SubmitQuestReviewInput): Promise<void> {
  const trimmed = reviewText.trim();
  if (!trimmed) throw new Error("Write something before submitting.");
  if (rating < 1 || rating > 5) throw new Error("Pick a star rating.");

  const user = await ensureMvpUser();
  const { error } = await supabase.from("quest_reviews").insert({
    user_id: user.id,
    quest_id: questId ?? null,
    mock_quest_id: mockQuestId ?? null,
    rating,
    review_text: trimmed,
  });
  if (error) throw new Error(`Could not save review: ${error.message}`);
}
