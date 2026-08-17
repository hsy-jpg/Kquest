import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

function parseEnv(source) {
  return Object.fromEntries(source.split(/\r?\n/).flatMap((line) => {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match) return [];
    let value = match[2];
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    return [[match[1], value]];
  }));
}

const env = parseEnv(await readFile(new URL("../.env", import.meta.url), "utf8"));
const url = env.VITE_SUPABASE_URL;
const publishableKey = env.VITE_SUPABASE_PUBLISHABLE_KEY;
const secretKey = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !publishableKey || !secretKey) throw new Error("Supabase environment variables are incomplete.");

const admin = createClient(url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } });
let userId;
let storagePath;

try {
  const userClient = createClient(url, publishableKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: signedIn, error: signInError } = await userClient.auth.signInAnonymously();
  if (signInError || !signedIn.user) throw signInError ?? new Error("Anonymous test user was not created.");
  userId = signedIn.user.id;

  const { data: quest, error: questError } = await userClient
    .from("quests")
    .select("id,quest_id,proof_type,proof_requirement,completion_rule")
    .eq("status", "PUBLISHED")
    .neq("proof_type", "PHOTO")
    .limit(1)
    .single();
  if (questError || !quest) throw questError ?? new Error("No non-photo metadata Quest is available for the compatibility test.");

  const { data: started, error: startError } = await userClient.rpc("start_quest", { p_quest_id: quest.id });
  if (startError || started?.[0]?.quest_status !== "STARTED") throw startError ?? new Error("STARTED was not stored.");

  const { data: progressed, error: progressSaveError } = await userClient.rpc("mark_quest_in_progress", { p_quest_id: quest.id });
  if (progressSaveError || progressed?.[0]?.quest_status !== "IN_PROGRESS") throw progressSaveError ?? new Error("IN_PROGRESS was not stored.");

  const png = Uint8Array.from(Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    "base64",
  ));
  storagePath = `${userId}/${quest.quest_id}/${crypto.randomUUID()}.png`;
  const { error: uploadError } = await userClient.storage
    .from("quest-proofs")
    .upload(storagePath, png, { contentType: "image/png", upsert: false });
  if (uploadError) throw uploadError;

  const { data: submitted, error: submitError } = await userClient.rpc("submit_quest_photo", {
    p_quest_id: quest.id,
    p_storage_path: storagePath,
    p_mime_type: "image/png",
    p_size_bytes: png.byteLength,
  });
  if (submitError || !submitted?.[0]) throw submitError ?? new Error("Completion RPC returned no result.");

  const { data: progress, error: progressError } = await userClient
    .from("user_quests")
    .select("id,status,started_at,completed_at")
    .eq("id", submitted[0].user_quest_id)
    .single();
  if (progressError) throw progressError;

  const { data: proof, error: proofError } = await userClient
    .from("quest_proofs")
    .select("id,proof_type,proof_status,storage_bucket,storage_path,proof_requirement_snapshot,completion_rule_snapshot")
    .eq("id", submitted[0].proof_id)
    .single();
  if (proofError) throw proofError;

  console.log(JSON.stringify({
    ok: progress.status === "COMPLETED" && proof.proof_status === "PASS",
    anonymousAuthSucceeded: Boolean(userId),
    startedStatusStored: started[0].quest_status === "STARTED",
    inProgressStatusStored: progressed[0].quest_status === "IN_PROGRESS",
    uploadSucceeded: true,
    questStatus: progress.status,
    proofStatus: proof.proof_status,
    proofType: proof.proof_type,
    privateBucket: proof.storage_bucket === "quest-proofs",
    requirementSnapshotted: Boolean(proof.proof_requirement_snapshot),
    completionRuleSnapshotted: Boolean(proof.completion_rule_snapshot),
    startedAtStored: Boolean(progress.started_at),
    completedAtStored: Boolean(progress.completed_at),
    rlsOwnerReadSucceeded: true,
  }, null, 2));
} finally {
  if (storagePath) await admin.storage.from("quest-proofs").remove([storagePath]);
  if (userId) await admin.auth.admin.deleteUser(userId);
}
