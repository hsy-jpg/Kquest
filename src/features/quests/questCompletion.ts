import { supabase } from "@/integrations/supabase/client";
import type { SupabaseQuestCard } from "./supabaseQuestAdapter";

const PROOF_BUCKET = "quest-proofs";
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export interface QuestCompletionResult {
  userQuestId: string;
  proofId: string;
  questStatus: "COMPLETED";
  proofStatus: "PASS";
}

let anonymousSignInPromise: ReturnType<typeof supabase.auth.signInAnonymously> | null = null;

export async function ensureMvpUser() {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw new Error(`Could not restore user session: ${sessionError.message}`);
  if (sessionData.session?.user) return sessionData.session.user;

  anonymousSignInPromise ??= supabase.auth.signInAnonymously();
  const { data, error } = await anonymousSignInPromise.finally(() => {
    anonymousSignInPromise = null;
  });
  if (error || !data.user) throw new Error(`Anonymous sign-in failed: ${error?.message ?? "No user returned"}`);
  return data.user;
}

async function saveProgress(questId: string, rpc: "start_quest" | "mark_quest_in_progress") {
  await ensureMvpUser();
  const { data, error } = await supabase.rpc(rpc, { p_quest_id: questId });
  if (error || !data?.[0]) throw new Error(`Quest progress save failed: ${error?.message ?? "No result returned"}`);
  return data[0];
}

export const startQuest = (questId: string) => saveProgress(questId, "start_quest");
export const markQuestInProgress = (questId: string) => saveProgress(questId, "mark_quest_in_progress");

export function validateProofPhoto(file: File): void {
  if (!ALLOWED_PHOTO_TYPES.has(file.type)) throw new Error("Use a JPG, PNG, or WEBP image.");
  if (file.size <= 0 || file.size > MAX_PHOTO_BYTES) throw new Error("Photo must be 10 MB or smaller.");
}

function extensionFor(file: File): string {
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

export async function submitQuestPhoto(
  quest: SupabaseQuestCard,
  file: File,
): Promise<QuestCompletionResult> {
  validateProofPhoto(file);

  const user = await ensureMvpUser();

  const storagePath = `${user.id}/${quest.questId}/${crypto.randomUUID()}.${extensionFor(file)}`;
  const { error: uploadError } = await supabase.storage
    .from(PROOF_BUCKET)
    .upload(storagePath, file, { contentType: file.type, upsert: false });

  if (uploadError) throw new Error(`Photo upload failed: ${uploadError.message}`);

  const { data, error } = await supabase.rpc("submit_quest_photo", {
    p_quest_id: quest.databaseId,
    p_storage_path: storagePath,
    p_mime_type: file.type,
    p_size_bytes: file.size,
  });

  if (error || !data?.[0]) {
    await supabase.storage.from(PROOF_BUCKET).remove([storagePath]);
    throw new Error(`Completion save failed: ${error?.message ?? "No result returned"}`);
  }

  const result = data[0];
  return {
    userQuestId: result.user_quest_id,
    proofId: result.proof_id,
    questStatus: result.quest_status as "COMPLETED",
    proofStatus: result.proof_status as "PASS",
  };
}

export interface MockQuestCompletionResult {
  mockQuestId: number;
  xpAwarded: number;
}

/**
 * Demo quests (src/data/quests.ts) have no row in public.quests, so they
 * can't go through submit_quest_photo. This records the same completion
 * signal (XP, streak, proof) through a parallel table instead.
 */
export async function submitMockQuestPhoto(mockQuestId: number, file: File): Promise<MockQuestCompletionResult> {
  validateProofPhoto(file);

  const user = await ensureMvpUser();

  const storagePath = `${user.id}/mock/${mockQuestId}/${crypto.randomUUID()}.${extensionFor(file)}`;
  const { error: uploadError } = await supabase.storage
    .from(PROOF_BUCKET)
    .upload(storagePath, file, { contentType: file.type, upsert: false });

  if (uploadError) throw new Error(`Photo upload failed: ${uploadError.message}`);

  const { data, error } = await supabase.rpc("complete_mock_quest", {
    p_mock_quest_id: mockQuestId,
    p_storage_path: storagePath,
    p_mime_type: file.type,
    p_size_bytes: file.size,
  });

  if (error || !data?.[0]) {
    await supabase.storage.from(PROOF_BUCKET).remove([storagePath]);
    throw new Error(`Completion save failed: ${error?.message ?? "No result returned"}`);
  }

  return { mockQuestId: data[0].mock_quest_id, xpAwarded: data[0].xp_awarded };
}
