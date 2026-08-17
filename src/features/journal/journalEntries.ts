import { supabase } from "@/integrations/supabase/client";
import { ensureMvpUser } from "@/features/quests/questCompletion";

const PHOTO_BUCKET = "journal-photos";
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export interface JournalAuthor {
  displayName: string;
  countryFlag: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  questId: string | null;
  content: string;
  photoUrl: string | null;
  likeCount: number;
  likedByMe: boolean;
  commentCount: number;
  createdAt: string;
  isMine: boolean;
  author: JournalAuthor;
}

type EntryRow = {
  id: string;
  user_id: string;
  quest_id: string | null;
  content: string;
  photo_path: string | null;
  created_at: string;
  like_count: number;
  comment_count: number;
};

function photoUrlFor(path: string | null): string | null {
  if (!path) return null;
  return supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl;
}

async function hydrateEntries(rows: EntryRow[], viewerId: string | null): Promise<JournalEntry[]> {
  if (rows.length === 0) return [];

  const userIds = [...new Set(rows.map((r) => r.user_id))];
  const { data: profileRows, error: profileError } = await supabase
    .from("profiles")
    .select("user_id, display_name, country_flag")
    .in("user_id", userIds);
  if (profileError) throw new Error(`Could not load journal authors: ${profileError.message}`);
  const profileById = new Map((profileRows ?? []).map((p) => [p.user_id, p]));

  let likedEntryIds = new Set<string>();
  if (viewerId) {
    const { data: likeRows, error: likeError } = await supabase
      .from("journal_likes")
      .select("entry_id")
      .eq("user_id", viewerId)
      .in(
        "entry_id",
        rows.map((r) => r.id),
      );
    if (likeError) throw new Error(`Could not load likes: ${likeError.message}`);
    likedEntryIds = new Set((likeRows ?? []).map((l) => l.entry_id));
  }

  return rows.map((row) => {
    const author = profileById.get(row.user_id);
    return {
      id: row.id,
      userId: row.user_id,
      questId: row.quest_id,
      content: row.content,
      photoUrl: photoUrlFor(row.photo_path),
      likeCount: row.like_count,
      likedByMe: likedEntryIds.has(row.id),
      commentCount: row.comment_count,
      createdAt: row.created_at,
      isMine: row.user_id === viewerId,
      author: {
        displayName: author?.display_name ?? "Traveler",
        countryFlag: author?.country_flag ?? "🌍",
      },
    };
  });
}

export async function fetchMyJournalEntries(): Promise<JournalEntry[]> {
  const user = await ensureMvpUser();
  const { data, error } = await supabase
    .from("journal_entries_with_counts")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Could not load journal entries: ${error.message}`);
  return hydrateEntries(data ?? [], user.id);
}

export async function fetchJournalFeed(limit = 20): Promise<JournalEntry[]> {
  const user = await ensureMvpUser();
  const { data, error } = await supabase
    .from("journal_entries_with_counts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Could not load journal feed: ${error.message}`);
  return hydrateEntries(data ?? [], user.id);
}

export async function fetchJournalEntriesByUser(userId: string): Promise<JournalEntry[]> {
  const viewer = await ensureMvpUser();
  const { data, error } = await supabase
    .from("journal_entries_with_counts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Could not load journal entries: ${error.message}`);
  return hydrateEntries(data ?? [], viewer.id);
}

export async function fetchJournalEntry(id: string): Promise<JournalEntry | null> {
  const user = await ensureMvpUser();
  const { data, error } = await supabase
    .from("journal_entries_with_counts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Could not load journal entry: ${error.message}`);
  if (!data) return null;
  const [entry] = await hydrateEntries([data], user.id);
  return entry;
}

export interface CreateJournalEntryInput {
  content: string;
  photoFile?: File | null;
  questId?: string | null;
}

export async function createJournalEntry({ content, photoFile, questId }: CreateJournalEntryInput): Promise<void> {
  const trimmed = content.trim();
  if (!trimmed) throw new Error("Write something before posting.");

  const user = await ensureMvpUser();
  let photoPath: string | null = null;

  if (photoFile) {
    if (!ALLOWED_PHOTO_TYPES.has(photoFile.type)) throw new Error("Use a JPG, PNG, or WEBP image.");
    if (photoFile.size <= 0 || photoFile.size > MAX_PHOTO_BYTES) throw new Error("Photo must be 10 MB or smaller.");
    const ext = photoFile.type === "image/png" ? "png" : photoFile.type === "image/webp" ? "webp" : "jpg";
    photoPath = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from(PHOTO_BUCKET)
      .upload(photoPath, photoFile, { contentType: photoFile.type, upsert: false });
    if (uploadError) throw new Error(`Photo upload failed: ${uploadError.message}`);
  }

  const { error } = await supabase.from("journal_entries").insert({
    user_id: user.id,
    quest_id: questId ?? null,
    content: trimmed,
    photo_path: photoPath,
  });
  if (error) throw new Error(`Could not post journal entry: ${error.message}`);
}

export async function toggleJournalLike(entryId: string): Promise<void> {
  const user = await ensureMvpUser();
  const { data: existing, error: readError } = await supabase
    .from("journal_likes")
    .select("entry_id")
    .eq("entry_id", entryId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (readError) throw new Error(`Could not update like: ${readError.message}`);

  if (existing) {
    const { error } = await supabase.from("journal_likes").delete().eq("entry_id", entryId).eq("user_id", user.id);
    if (error) throw new Error(`Could not remove like: ${error.message}`);
  } else {
    const { error } = await supabase.from("journal_likes").insert({ entry_id: entryId, user_id: user.id });
    if (error) throw new Error(`Could not like entry: ${error.message}`);
  }
}

export interface JournalComment {
  id: string;
  entryId: string;
  userId: string;
  content: string;
  createdAt: string;
  author: JournalAuthor;
}

export async function fetchComments(entryId: string): Promise<JournalComment[]> {
  const { data, error } = await supabase
    .from("journal_comments")
    .select("id, entry_id, user_id, content, created_at")
    .eq("entry_id", entryId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`Could not load comments: ${error.message}`);

  const userIds = [...new Set((data ?? []).map((row) => row.user_id))];
  const { data: profileRows, error: profileError } = userIds.length
    ? await supabase.from("profiles").select("user_id, display_name, country_flag").in("user_id", userIds)
    : { data: [], error: null };
  if (profileError) throw new Error(`Could not load comment authors: ${profileError.message}`);
  const profileById = new Map((profileRows ?? []).map((p) => [p.user_id, p]));

  return (data ?? []).map((row) => ({
    id: row.id,
    entryId: row.entry_id,
    userId: row.user_id,
    content: row.content,
    createdAt: row.created_at,
    author: {
      displayName: profileById.get(row.user_id)?.display_name ?? "Traveler",
      countryFlag: profileById.get(row.user_id)?.country_flag ?? "🌍",
    },
  }));
}

export async function postComment(entryId: string, content: string): Promise<void> {
  const trimmed = content.trim();
  if (!trimmed) return;
  const user = await ensureMvpUser();
  const { error } = await supabase.from("journal_comments").insert({ entry_id: entryId, user_id: user.id, content: trimmed });
  if (error) throw new Error(`Could not post comment: ${error.message}`);
}
