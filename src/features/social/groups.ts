import { supabase } from "@/integrations/supabase/client";
import { ensureMvpUser } from "@/features/quests/questCompletion";

export interface GroupSummary {
  id: string;
  name: string;
  description: string;
  emoji: string;
  memberCount: number;
  isMember: boolean;
}

export async function fetchGroups(): Promise<GroupSummary[]> {
  const user = await ensureMvpUser();
  const [{ data: groupRows, error: groupError }, { data: memberRows, error: memberError }] = await Promise.all([
    supabase.from("groups").select("*").order("name"),
    supabase.from("group_members").select("group_id, user_id"),
  ]);
  if (groupError) throw new Error(`Could not load groups: ${groupError.message}`);
  if (memberError) throw new Error(`Could not load group members: ${memberError.message}`);

  const memberCounts = new Map<string, number>();
  const myGroupIds = new Set<string>();
  for (const row of memberRows ?? []) {
    memberCounts.set(row.group_id, (memberCounts.get(row.group_id) ?? 0) + 1);
    if (row.user_id === user.id) myGroupIds.add(row.group_id);
  }

  return (groupRows ?? []).map((g) => ({
    id: g.id,
    name: g.name,
    description: g.description,
    emoji: g.emoji,
    memberCount: memberCounts.get(g.id) ?? 0,
    isMember: myGroupIds.has(g.id),
  }));
}

export async function fetchMyGroups(): Promise<GroupSummary[]> {
  const groups = await fetchGroups();
  return groups.filter((g) => g.isMember);
}

export async function fetchGroupInfo(groupId: string): Promise<GroupSummary | null> {
  const groups = await fetchGroups();
  return groups.find((g) => g.id === groupId) ?? null;
}

export async function joinGroup(groupId: string): Promise<void> {
  const user = await ensureMvpUser();
  const { error } = await supabase
    .from("group_members")
    .upsert({ group_id: groupId, user_id: user.id }, { onConflict: "group_id,user_id" });
  if (error) throw new Error(`Could not join group: ${error.message}`);
}

export async function leaveGroup(groupId: string): Promise<void> {
  const user = await ensureMvpUser();
  const { error } = await supabase.from("group_members").delete().eq("group_id", groupId).eq("user_id", user.id);
  if (error) throw new Error(`Could not leave group: ${error.message}`);
}

export interface GroupMessage {
  id: string;
  groupId: string;
  userId: string;
  content: string;
  createdAt: string;
  author: { displayName: string; countryFlag: string };
}

export async function fetchGroupMessages(groupId: string): Promise<GroupMessage[]> {
  const { data, error } = await supabase
    .from("group_messages")
    .select("id, group_id, user_id, content, created_at")
    .eq("group_id", groupId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`Could not load messages: ${error.message}`);

  const userIds = [...new Set((data ?? []).map((row) => row.user_id))];
  const { data: profileRows, error: profileError } = userIds.length
    ? await supabase.from("profiles").select("user_id, display_name, country_flag").in("user_id", userIds)
    : { data: [], error: null };
  if (profileError) throw new Error(`Could not load message authors: ${profileError.message}`);
  const profileById = new Map((profileRows ?? []).map((p) => [p.user_id, p]));

  return (data ?? []).map((row) => ({
    id: row.id,
    groupId: row.group_id,
    userId: row.user_id,
    content: row.content,
    createdAt: row.created_at,
    author: {
      displayName: profileById.get(row.user_id)?.display_name ?? "Traveler",
      countryFlag: profileById.get(row.user_id)?.country_flag ?? "🌍",
    },
  }));
}

export async function sendGroupMessage(groupId: string, content: string): Promise<void> {
  const trimmed = content.trim();
  if (!trimmed) return;
  const user = await ensureMvpUser();
  const { error } = await supabase.from("group_messages").insert({ group_id: groupId, user_id: user.id, content: trimmed });
  if (error) throw new Error(`Could not send message: ${error.message}`);
}
