import { supabase } from "@/integrations/supabase/client";
import { ensureMvpUser } from "@/features/quests/questCompletion";

export interface PublicProfile {
  userId: string;
  displayName: string;
  countryFlag: string;
  totalXp: number;
  completedQuestCount: number;
  isFriend: boolean;
  isSelf: boolean;
}

export async function fetchPublicProfile(userId: string): Promise<PublicProfile | null> {
  const viewer = await ensureMvpUser();
  const isSelf = viewer.id === userId;
  const [a, b] = viewer.id < userId ? [viewer.id, userId] : [userId, viewer.id];

  const [{ data: profileRow, error: profileError }, { data: totalsRow, error: totalsError }, { data: friendRow, error: friendError }] =
    await Promise.all([
      supabase.from("profiles").select("user_id, display_name, country_flag").eq("user_id", userId).maybeSingle(),
      supabase.from("public_xp_totals").select("total_xp, completed_quest_count").eq("user_id", userId).maybeSingle(),
      isSelf
        ? Promise.resolve({ data: null, error: null })
        : supabase.from("friendships").select("user_id_a").eq("user_id_a", a).eq("user_id_b", b).maybeSingle(),
    ]);

  if (profileError) throw new Error(`Could not load traveler: ${profileError.message}`);
  if (totalsError) throw new Error(`Could not load traveler stats: ${totalsError.message}`);
  if (friendError) throw new Error(`Could not load friend status: ${friendError.message}`);
  if (!profileRow) return null;

  return {
    userId,
    displayName: profileRow.display_name,
    countryFlag: profileRow.country_flag,
    totalXp: totalsRow?.total_xp ?? 0,
    completedQuestCount: totalsRow?.completed_quest_count ?? 0,
    isFriend: Boolean(friendRow),
    isSelf,
  };
}
