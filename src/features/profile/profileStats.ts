import { supabase } from "@/integrations/supabase/client";
import { ensureMvpUser } from "@/features/quests/questCompletion";
import { CATEGORY_BY_TYPE } from "@/features/quests/supabaseQuestAdapter";
import { quests as mockQuests, type Quest } from "@/data/quests";
import type { ProfileStats } from "@/data/badges";

export interface ProfileRow {
  userId: string;
  isAnonymous: boolean;
  displayName: string;
  countryFlag: string;
  currentStreak: number;
  joinedAt: string;
}

export interface CompletedQuestSummary {
  userQuestId: string;
  questId: string;
  title: string;
  category: Quest["category"];
  emoji: string;
  xpAwarded: number;
  completedAt: string;
}

export interface ProfileData {
  profile: ProfileRow;
  stats: ProfileStats;
  completedQuests: CompletedQuestSummary[];
}

export const CATEGORY_EMOJI: Record<Quest["category"], string> = {
  Food: "🍜",
  Culture: "🏛️",
  Nature: "🌿",
  Nightlife: "🌙",
  Shopping: "🛍️",
  Festival: "🎉",
};

export async function fetchProfileData(): Promise<ProfileData> {
  const user = await ensureMvpUser();

  const [
    { data: profileRow, error: profileError },
    { data: userQuestRows, error: questError },
    { data: mockCompletionRows, error: mockQuestError },
    { count: questPhotoCount, error: questPhotoError },
    { count: mockQuestPhotoCount, error: mockQuestPhotoError },
    { count: journalPhotoCount, error: journalPhotoError },
    { data: friendRows, error: friendError },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("user_quests")
      .select("id, quest_id, xp_awarded, completed_at")
      .eq("user_id", user.id)
      .eq("status", "COMPLETED")
      .order("completed_at", { ascending: false }),
    supabase
      .from("mock_quest_completions")
      .select("mock_quest_id, xp_awarded, completed_at")
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false }),
    supabase.from("quest_proofs").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("mock_quest_proofs").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase
      .from("journal_entries")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .not("photo_path", "is", null),
    supabase.from("friendships").select("user_id_a, user_id_b").or(`user_id_a.eq.${user.id},user_id_b.eq.${user.id}`),
  ]);

  if (profileError) throw new Error(`Could not load profile: ${profileError.message}`);
  if (questError) throw new Error(`Could not load quest history: ${questError.message}`);
  if (mockQuestError) throw new Error(`Could not load demo quest history: ${mockQuestError.message}`);
  if (questPhotoError) throw new Error(`Could not load photo count: ${questPhotoError.message}`);
  if (mockQuestPhotoError) throw new Error(`Could not load photo count: ${mockQuestPhotoError.message}`);
  if (journalPhotoError) throw new Error(`Could not load photo count: ${journalPhotoError.message}`);
  if (friendError) throw new Error(`Could not load friends: ${friendError.message}`);

  const questIds = [...new Set((userQuestRows ?? []).map((row) => row.quest_id))];
  const { data: questRows, error: questDetailError } = questIds.length
    ? await supabase.from("quests").select("id, title, quest_type").in("id", questIds)
    : { data: [], error: null };
  if (questDetailError) throw new Error(`Could not load quest details: ${questDetailError.message}`);

  const questById = new Map((questRows ?? []).map((q) => [q.id, q]));

  const realCompletedQuests: CompletedQuestSummary[] = (userQuestRows ?? []).map((row) => {
    const quest = questById.get(row.quest_id);
    const category = CATEGORY_BY_TYPE[quest?.quest_type ?? ""] ?? "Culture";
    return {
      userQuestId: row.id,
      questId: row.quest_id,
      title: quest?.title ?? "Quest",
      category,
      emoji: CATEGORY_EMOJI[category],
      xpAwarded: row.xp_awarded,
      completedAt: row.completed_at ?? "",
    };
  });

  const mockCompletedQuests: CompletedQuestSummary[] = (mockCompletionRows ?? []).map((row) => {
    const quest = mockQuests.find((q) => q.id === row.mock_quest_id);
    const category = quest?.category ?? "Culture";
    return {
      userQuestId: `mock-${row.mock_quest_id}`,
      questId: `mock-${row.mock_quest_id}`,
      title: quest?.title ?? "Quest",
      category,
      emoji: CATEGORY_EMOJI[category],
      xpAwarded: row.xp_awarded,
      completedAt: row.completed_at,
    };
  });

  const completedQuests = [...realCompletedQuests, ...mockCompletedQuests].sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
  );

  const categoryCounts: Partial<Record<Quest["category"], number>> = {};
  for (const q of completedQuests) categoryCounts[q.category] = (categoryCounts[q.category] ?? 0) + 1;

  const stats: ProfileStats = {
    completedQuestCount: completedQuests.length,
    totalXp: completedQuests.reduce((sum, q) => sum + q.xpAwarded, 0),
    categoryCounts,
    photoCount: (questPhotoCount ?? 0) + (mockQuestPhotoCount ?? 0) + (journalPhotoCount ?? 0),
    friendCount: (friendRows ?? []).length,
  };

  const profile: ProfileRow = {
    userId: user.id,
    isAnonymous: user.is_anonymous ?? false,
    displayName: profileRow?.display_name ?? "Traveler",
    countryFlag: profileRow?.country_flag ?? "🌍",
    currentStreak: profileRow?.current_streak ?? 0,
    joinedAt: profileRow?.created_at ?? user.created_at,
  };

  return { profile, stats, completedQuests };
}

export interface ProofPhoto {
  id: string;
  url: string;
  submittedAt: string;
}

export async function fetchMyProofPhotos(): Promise<ProofPhoto[]> {
  const user = await ensureMvpUser();
  const [{ data: questProofRows, error: questProofError }, { data: mockProofRows, error: mockProofError }] =
    await Promise.all([
      supabase.from("quest_proofs").select("id, storage_path, submitted_at").eq("user_id", user.id),
      supabase.from("mock_quest_proofs").select("id, storage_path, submitted_at").eq("user_id", user.id),
    ]);
  if (questProofError) throw new Error(`Could not load photos: ${questProofError.message}`);
  if (mockProofError) throw new Error(`Could not load photos: ${mockProofError.message}`);

  const rows = [...(questProofRows ?? []), ...(mockProofRows ?? [])].sort(
    (a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime(),
  );

  const signed = await Promise.all(
    rows.map(async (row) => {
      const { data: signedUrl } = await supabase.storage.from("quest-proofs").createSignedUrl(row.storage_path, 3600);
      if (!signedUrl) return null;
      return { id: row.id, url: signedUrl.signedUrl, submittedAt: row.submitted_at };
    }),
  );

  return signed.filter((photo): photo is ProofPhoto => Boolean(photo));
}
