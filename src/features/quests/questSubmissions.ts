import { supabase } from "@/integrations/supabase/client";
import type { Quest } from "@/data/quests";

export interface QuestSubmissionInput {
  title: string;
  location: string;
  mission: string;
  category: Quest["category"];
  photo: File;
}

const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);

async function ensureUserId(): Promise<string> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw new Error(sessionError.message);
  if (sessionData.session?.user.id) return sessionData.session.user.id;

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error || !data.user) throw new Error(error?.message ?? "Could not start a submission session.");
  return data.user.id;
}

export async function submitQuestProposal(input: QuestSubmissionInput): Promise<void> {
  if (!ALLOWED_PHOTO_TYPES.has(input.photo.type)) throw new Error("Please upload a JPG, PNG, WebP, HEIC, or HEIF image.");
  if (input.photo.size > MAX_PHOTO_BYTES) throw new Error("Photo must be 8 MB or smaller.");

  const userId = await ensureUserId();
  const extension = input.photo.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const photoPath = `${userId}/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage
    .from("quest-submission-photos")
    .upload(photoPath, input.photo, { contentType: input.photo.type, upsert: false });
  if (uploadError) throw new Error(`Photo upload failed: ${uploadError.message}`);

  const { error: insertError } = await supabase.from("quest_submissions").insert({
    user_id: userId,
    title: input.title.trim(),
    location: input.location.trim(),
    mission: input.mission.trim(),
    category: input.category,
    photo_path: photoPath,
  });

  if (insertError) {
    await supabase.storage.from("quest-submission-photos").remove([photoPath]);
    throw new Error(`Quest submission failed: ${insertError.message}`);
  }
}
