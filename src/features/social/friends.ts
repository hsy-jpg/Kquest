import { supabase } from "@/integrations/supabase/client";
import { ensureMvpUser } from "@/features/quests/questCompletion";

export interface DiscoverableProfile {
  userId: string;
  displayName: string;
  countryFlag: string;
  isFriend: boolean;
}

async function fetchFriendIds(userId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("friendships")
    .select("user_id_a, user_id_b")
    .or(`user_id_a.eq.${userId},user_id_b.eq.${userId}`);
  if (error) throw new Error(`Could not load friends: ${error.message}`);
  return new Set((data ?? []).map((row) => (row.user_id_a === userId ? row.user_id_b : row.user_id_a)));
}

export async function fetchDiscoverableProfiles(limit = 20): Promise<DiscoverableProfile[]> {
  const user = await ensureMvpUser();
  const [{ data: profileRows, error }, friendIds] = await Promise.all([
    supabase
      .from("profiles")
      .select("user_id, display_name, country_flag")
      .neq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit),
    fetchFriendIds(user.id),
  ]);
  if (error) throw new Error(`Could not load travelers: ${error.message}`);

  return (profileRows ?? []).map((row) => ({
    userId: row.user_id,
    displayName: row.display_name,
    countryFlag: row.country_flag,
    isFriend: friendIds.has(row.user_id),
  }));
}

export async function toggleFriend(otherUserId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("toggle_friend", { p_other_user_id: otherUserId });
  if (error || !data?.[0]) throw new Error(`Could not update friend status: ${error?.message ?? "No result returned"}`);
  return data[0].is_friend;
}

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  countryFlag: string;
  totalXp: number;
}

export async function fetchXpLeaderboard(limit = 3): Promise<LeaderboardEntry[]> {
  await ensureMvpUser();
  const { data: totalsRows, error } = await supabase
    .from("public_xp_totals")
    .select("user_id, total_xp")
    .order("total_xp", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Could not load leaderboard: ${error.message}`);
  if (!totalsRows?.length) return [];

  const { data: profileRows, error: profileError } = await supabase
    .from("profiles")
    .select("user_id, display_name, country_flag")
    .in(
      "user_id",
      totalsRows.map((row) => row.user_id),
    );
  if (profileError) throw new Error(`Could not load leaderboard profiles: ${profileError.message}`);
  const profileById = new Map((profileRows ?? []).map((p) => [p.user_id, p]));

  return totalsRows.map((row) => ({
    userId: row.user_id,
    displayName: profileById.get(row.user_id)?.display_name ?? "Traveler",
    countryFlag: profileById.get(row.user_id)?.country_flag ?? "🌍",
    totalXp: row.total_xp,
  }));
}
