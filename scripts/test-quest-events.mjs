import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

function parseEnv(source) {
  return Object.fromEntries(source.split(/\r?\n/).flatMap((line) => {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match) return [];
    let value = match[2];
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    return [[match[1], value]];
  }));
}

const env = parseEnv(await readFile(new URL("../.env", import.meta.url), "utf8"));
const url = env.VITE_SUPABASE_URL;
const publishableKey = env.VITE_SUPABASE_PUBLISHABLE_KEY;
const secretKey = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !publishableKey || !secretKey) throw new Error("Supabase environment variables are incomplete.");

const admin = createClient(url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } });
const userClient = createClient(url, publishableKey, { auth: { persistSession: false, autoRefreshToken: false } });
let userId;
let storagePath;

try {
  const { data: signedIn, error: signInError } = await userClient.auth.signInAnonymously();
  if (signInError || !signedIn.user) throw signInError ?? new Error("Anonymous test user was not created.");
  userId = signedIn.user.id;

  const { data: quest, error: questError } = await userClient.from("quests")
    .select("id,quest_id").eq("status", "PUBLISHED").eq("proof_type", "PHOTO").limit(1).single();
  if (questError || !quest) throw questError ?? new Error("No photo Quest is available.");

  const firstView = await userClient.rpc("record_quest_view", { p_quest_id: quest.id });
  const secondView = await userClient.rpc("record_quest_view", { p_quest_id: quest.id });
  if (firstView.error || secondView.error) throw firstView.error ?? secondView.error;

  const firstStart = await userClient.rpc("start_quest", { p_quest_id: quest.id });
  const secondStart = await userClient.rpc("start_quest", { p_quest_id: quest.id });
  if (firstStart.error || secondStart.error) throw firstStart.error ?? secondStart.error;
  const progressed = await userClient.rpc("mark_quest_in_progress", { p_quest_id: quest.id });
  if (progressed.error) throw progressed.error;

  const png = Uint8Array.from(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64"));
  storagePath = `${userId}/${quest.quest_id}/${crypto.randomUUID()}.png`;
  const uploaded = await userClient.storage.from("quest-proofs").upload(storagePath, png, { contentType: "image/png" });
  if (uploaded.error) throw uploaded.error;

  const completed = await userClient.rpc("submit_quest_photo", {
    p_quest_id: quest.id, p_storage_path: storagePath, p_mime_type: "image/png", p_size_bytes: png.byteLength,
  });
  if (completed.error) throw completed.error;

  const { data: events, error: eventsError } = await userClient.from("quest_events")
    .select("event_type,user_id,quest_id,created_at").eq("quest_id", quest.id).order("created_at");
  if (eventsError) throw eventsError;
  const counts = Object.fromEntries(["VIEW", "START", "COMPLETE"].map((type) => [type, events.filter((event) => event.event_type === type).length]));

  console.log(JSON.stringify({
    ok: counts.VIEW === 1 && counts.START === 1 && counts.COMPLETE === 1,
    anonymousAuthSucceeded: true,
    firstViewRecorded: firstView.data?.[0]?.recorded === true,
    duplicateViewSuppressed: secondView.data?.[0]?.recorded === false,
    duplicateStartSuppressed: counts.START === 1,
    duplicateCompletePreventedByUniqueIndex: counts.COMPLETE === 1,
    eventCounts: counts,
    progressBeforeCompletion: progressed.data?.[0]?.quest_status,
    completionStatus: completed.data?.[0]?.quest_status,
    proofStatus: completed.data?.[0]?.proof_status,
    storageUploadSucceeded: true,
    rlsOwnerReadSucceeded: events.every((event) => event.user_id === userId),
  }, null, 2));
} finally {
  if (storagePath) await admin.storage.from("quest-proofs").remove([storagePath]);
  if (userId) await admin.auth.admin.deleteUser(userId);
}
