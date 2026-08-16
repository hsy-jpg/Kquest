#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const DEFAULT_INPUT_DIR = "artifacts/kquest-pipeline-validation";
const BATCH_SIZE = 50;

function parseArgs(argv) {
  const value = (name, fallback) => {
    const index = argv.indexOf(name);
    return index >= 0 && argv[index + 1] ? argv[index + 1] : fallback;
  };
  return {
    inputDir: resolve(value("--input-dir", DEFAULT_INPUT_DIR)),
    dryRun: argv.includes("--dry-run"),
    verifyOnly: argv.includes("--verify-only"),
    allowBatch: argv.includes("--allow-batch"),
  };
}

function parseEnv(source) {
  const values = {};
  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    values[match[1]] = value;
  }
  return values;
}

const present = value => value !== undefined && value !== null && String(value).trim() !== "";

function parseKtoTime(value) {
  if (!present(value)) return null;
  const text = String(value).trim();
  if (/^\d{14}$/.test(text)) {
    const iso = `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6, 8)}T${text.slice(8, 10)}:${text.slice(10, 12)}:${text.slice(12, 14)}+09:00`;
    const date = new Date(iso);
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid sourceModifiedTime: ${text}`);
  return date.toISOString();
}

function requireFields(item, fields, label) {
  const missing = fields.filter(field => !present(item[field]));
  if (missing.length) throw new Error(`${label} is missing required fields: ${missing.join(", ")}`);
}

function assertUnique(items, field, label) {
  const seen = new Set();
  for (const item of items) {
    const value = String(item[field]);
    if (seen.has(value)) throw new Error(`${label} contains duplicate ${field}: ${value}`);
    seen.add(value);
  }
}

async function loadJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function loadInputs(inputDir) {
  const [placesDocument, questsDocument, reviewsDocument] = await Promise.all([
    loadJson(resolve(inputDir, "tour-places.json")),
    loadJson(resolve(inputDir, "accepted-quests.json")),
    loadJson(resolve(inputDir, "review-items.json")),
  ]);
  const places = Array.isArray(placesDocument.places) ? placesDocument.places : [];
  const quests = Array.isArray(questsDocument.quests) ? questsDocument.quests : [];
  const reviews = Array.isArray(reviewsDocument.items) ? reviewsDocument.items : [];
  return { places, quests, reviews };
}

function validateInputs({ places, quests, reviews }, allowBatch = false) {
  if (!allowBatch && places.length !== 10) {
    throw new Error(`Fixture safety check failed: expected exactly 10 tour places, received ${places.length}`);
  }
  if (allowBatch && (places.length < 1 || places.length > 20000)) {
    throw new Error(`Batch safety check failed: tour place count must be between 1 and 20000, received ${places.length}`);
  }
  for (const item of places) requireFields(item, ["sourceContentId", "title", "region", "contentTypeId", "localScore", "qualityScore", "selectionStatus"], `tour place ${item.sourceContentId ?? "unknown"}`);
  for (const item of quests) requireFields(item, ["questId", "sourceContentId", "title", "questType", "templateId", "steps", "classificationConfidence", "region"], `quest ${item.sourceContentId ?? "unknown"}`);
  for (const item of reviews) {
    requireFields(item, ["sourceContentId", "localScore", "qualityScore"], `review item ${item.sourceContentId ?? "unknown"}`);
    if (!Array.isArray(item.reviewFlags)) {
      throw new Error(`review item ${item.sourceContentId ?? "unknown"} must provide reviewFlags as an array`);
    }
  }
  assertUnique(places, "sourceContentId", "tour-places.json");
  assertUnique(quests, "sourceContentId", "accepted-quests.json");
  assertUnique(reviews, "sourceContentId", "review-items.json");
  assertUnique(quests, "questId", "accepted-quests.json");

  const placeIds = new Set(places.map(item => String(item.sourceContentId)));
  const missingQuestPlaces = quests.map(item => String(item.sourceContentId)).filter(id => !placeIds.has(id));
  const missingReviewPlaces = reviews.map(item => String(item.sourceContentId)).filter(id => !placeIds.has(id));
  if (missingQuestPlaces.length || missingReviewPlaces.length) {
    throw new Error(`Source relationship check failed. Missing quest places: ${missingQuestPlaces.join(", ") || "none"}; missing review places: ${missingReviewPlaces.join(", ") || "none"}`);
  }
  const overlap = quests.map(item => String(item.sourceContentId)).filter(id => reviews.some(review => String(review.sourceContentId) === id));
  if (overlap.length) throw new Error(`A source cannot be both accepted and pending review in one batch: ${overlap.join(", ")}`);
}

function mapTourPlace(item) {
  return {
    source_provider: "KTO_ENG_SERVICE_2",
    source_content_id: String(item.sourceContentId),
    title: item.title,
    description: item.description ?? item.overview ?? null,
    region: item.region,
    district: item.district ?? null,
    latitude: item.latitude ?? null,
    longitude: item.longitude ?? null,
    image: item.image ?? null,
    content_type: String(item.contentTypeId),
    source_modified_time: parseKtoTime(item.sourceModifiedTime),
    local_score: Number(item.localScore),
    quality_score: Number(item.qualityScore),
    selection_status: item.selectionStatus,
    detail_data: item.detailData && typeof item.detailData === "object" ? item.detailData : {},
    last_synced_at: new Date().toISOString(),
  };
}

function mapQuest(item, existingPublishedAt) {
  return {
    quest_id: item.questId,
    source_content_id: String(item.sourceContentId),
    title: item.title,
    description: item.description ?? null,
    quest_type: item.questType,
    secondary_tags: Array.isArray(item.secondaryTags) ? item.secondaryTags : [],
    template_id: item.templateId,
    steps: Array.isArray(item.steps) ? item.steps : [],
    classification_confidence: Number(item.classificationConfidence),
    region: item.region,
    district: item.district ?? null,
    latitude: item.latitude ?? null,
    longitude: item.longitude ?? null,
    image: item.image ?? null,
    status: "PUBLISHED",
    source_modified_time: parseKtoTime(item.sourceModifiedTime),
    published_at: existingPublishedAt ?? new Date().toISOString(),
  };
}

function mapReview(item) {
  return {
    source_content_id: String(item.sourceContentId),
    proposed_quest_type: item.proposedQuestType ?? null,
    proposed_template_id: item.proposedTemplateId ?? null,
    local_score: Number(item.localScore),
    quality_score: Number(item.qualityScore),
    review_reasons: Array.isArray(item.reviewFlags) ? item.reviewFlags : [],
    raw_data: {
      title: item.title ?? null,
      description: item.description ?? null,
      region: item.region ?? null,
      district: item.district ?? null,
      latitude: item.latitude ?? null,
      longitude: item.longitude ?? null,
      image: item.image ?? null,
      contentTypeId: item.contentTypeId ?? null,
      taxonomy: item.taxonomy ?? null,
      scoreReasons: item.scoreReasons ?? [],
    },
    detail_data: {
      event: item.event ?? null,
      operating: item.operating ?? null,
      experience: item.experience ?? null,
      detailInfo: item.detailInfo ?? [],
    },
    status: "PENDING",
    source_modified_time: parseKtoTime(item.sourceModifiedTime),
  };
}

function newerOrEqual(incoming, existing) {
  if (!existing?.source_modified_time || !incoming.source_modified_time) return true;
  return new Date(incoming.source_modified_time).getTime() >= new Date(existing.source_modified_time).getTime();
}

function createRestClient(url, serviceRoleKey) {
  return { url: url.replace(/\/$/, ""), serviceRoleKey };
}

function authHeaders(client, extra = {}) {
  const headers = {
    apikey: client.serviceRoleKey,
    ...extra,
  };

  // Legacy service-role keys are JWTs and can be used as a Bearer token.
  // Supabase's newer sb_secret_* keys authenticate through `apikey` only.
  if (!client.serviceRoleKey.startsWith("sb_secret_")) {
    headers.Authorization = `Bearer ${client.serviceRoleKey}`;
  }

  return headers;
}

async function restError(response, operation) {
  const body = await response.text();
  let message = body.slice(0, 500);
  try {
    const parsed = JSON.parse(body);
    message = parsed.message ?? parsed.hint ?? message;
  } catch {
    // Keep the bounded response text.
  }
  throw new Error(`${operation} failed with HTTP ${response.status}: ${message}`);
}

async function existingBySource(client, table, sourceIds, columns = "source_content_id,source_modified_time") {
  if (!sourceIds.length) return new Map();
  const quoted = sourceIds.map(id => `"${String(id).replaceAll('"', '\\"')}"`).join(",");
  const query = new URLSearchParams({ select: columns, source_content_id: `in.(${quoted})` });
  const response = await fetch(`${client.url}/rest/v1/${table}?${query}`, {
    headers: authHeaders(client, { Accept: "application/json" }),
    signal: AbortSignal.timeout(45_000),
  });
  if (!response.ok) await restError(response, `Read existing ${table}`);
  const data = await response.json();
  return new Map(data.map(row => [String(row.source_content_id), row]));
}

async function upsertBatches(client, table, rows) {
  for (let index = 0; index < rows.length; index += BATCH_SIZE) {
    const batch = rows.slice(index, index + BATCH_SIZE);
    const query = new URLSearchParams({ on_conflict: "source_content_id" });
    const response = await fetch(`${client.url}/rest/v1/${table}?${query}`, {
      method: "POST",
      headers: authHeaders(client, {
        Accept: "application/json",
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      }),
      body: JSON.stringify(batch),
      signal: AbortSignal.timeout(45_000),
    });
    if (!response.ok) await restError(response, `Upsert ${table}`);
  }
}

async function tableCount(client, table) {
  const response = await fetch(`${client.url}/rest/v1/${table}?select=id`, {
    method: "HEAD",
    headers: authHeaders(client, { Prefer: "count=exact" }),
    signal: AbortSignal.timeout(45_000),
  });
  if (!response.ok) await restError(response, `Count ${table}`);
  const contentRange = response.headers.get("content-range") ?? "*/0";
  const total = Number(contentRange.split("/").at(-1));
  return Number.isFinite(total) ? total : 0;
}

async function verifyImport(client, inputs) {
  const placeIds = inputs.places.map(item => String(item.sourceContentId));
  const questIds = inputs.quests.map(item => String(item.sourceContentId));
  const reviewIds = inputs.reviews.map(item => String(item.sourceContentId));
  const [placeRows, questRows, reviewRows, totalPlaces, totalQuests, totalReviews] = await Promise.all([
    existingBySource(client, "tour_places", placeIds, "source_content_id,selection_status"),
    existingBySource(client, "quests", questIds, "source_content_id,status"),
    existingBySource(client, "review_items", reviewIds, "source_content_id,status"),
    tableCount(client, "tour_places"), tableCount(client, "quests"), tableCount(client, "review_items"),
  ]);
  const missingQuestLinks = questIds.filter(id => !placeRows.has(id) || !questRows.has(id));
  const missingReviewLinks = reviewIds.filter(id => !placeRows.has(id) || !reviewRows.has(id));
  const wrongQuestStatus = questIds.filter(id => questRows.get(id)?.status !== "PUBLISHED");
  const wrongReviewStatus = reviewIds.filter(id => reviewRows.get(id)?.status !== "PENDING");
  const ok = placeRows.size === placeIds.length && questRows.size === questIds.length && reviewRows.size === reviewIds.length
    && !missingQuestLinks.length && !missingReviewLinks.length && !wrongQuestStatus.length && !wrongReviewStatus.length;
  return {
    ok,
    batch: { tourPlaces: placeRows.size, quests: questRows.size, reviewItems: reviewRows.size },
    totals: { tourPlaces: totalPlaces, quests: totalQuests, reviewItems: totalReviews },
    relationships: { missingQuestLinks, missingReviewLinks },
    statuses: { wrongQuestStatus, wrongReviewStatus },
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const inputs = await loadInputs(args.inputDir);
  validateInputs(inputs, args.allowBatch);
  console.log(`Validated fixture: ${inputs.places.length} places, ${inputs.quests.length} quests, ${inputs.reviews.length} review items.`);
  if (args.dryRun) {
    console.log("Dry run complete. No Supabase connection or write was performed.");
    return;
  }

  const env = parseEnv(await readFile(resolve(".env"), "utf8"));
  const supabaseUrl = env.SUPABASE_URL ?? env.VITE_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl) throw new Error("SUPABASE_URL or VITE_SUPABASE_URL is missing from .env");
  if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing from .env");

  const supabase = createRestClient(supabaseUrl, serviceRoleKey);

  if (args.verifyOnly) {
    const verification = await verifyImport(supabase, inputs);
    console.log(JSON.stringify({ verification }, null, 2));
    if (!verification.ok) throw new Error("Verification failed for one or more fixture rows or relationships.");
    return;
  }

  const placeRows = inputs.places.map(mapTourPlace);
  const placeExisting = await existingBySource(supabase, "tour_places", placeRows.map(row => row.source_content_id));
  const placesToUpsert = placeRows.filter(row => newerOrEqual(row, placeExisting.get(row.source_content_id)));
  await upsertBatches(supabase, "tour_places", placesToUpsert);

  const questExisting = await existingBySource(supabase, "quests", inputs.quests.map(item => String(item.sourceContentId)), "source_content_id,source_modified_time,published_at");
  const questRows = inputs.quests.map(item => mapQuest(item, questExisting.get(String(item.sourceContentId))?.published_at));
  const questsToUpsert = questRows.filter(row => newerOrEqual(row, questExisting.get(row.source_content_id)));
  await upsertBatches(supabase, "quests", questsToUpsert);

  const reviewRows = inputs.reviews.map(mapReview);
  const reviewExisting = await existingBySource(supabase, "review_items", reviewRows.map(row => row.source_content_id));
  const reviewsToUpsert = reviewRows.filter(row => newerOrEqual(row, reviewExisting.get(row.source_content_id)));
  await upsertBatches(supabase, "review_items", reviewsToUpsert);

  const verification = await verifyImport(supabase, inputs);
  console.log(JSON.stringify({
    upserted: { tourPlaces: placesToUpsert.length, quests: questsToUpsert.length, reviewItems: reviewsToUpsert.length },
    skippedAsOlder: {
      tourPlaces: placeRows.length - placesToUpsert.length,
      quests: questRows.length - questsToUpsert.length,
      reviewItems: reviewRows.length - reviewsToUpsert.length,
    },
    verification,
  }, null, 2));
  if (!verification.ok) throw new Error("Post-import verification failed. No existing rows were deleted; fix the reported issue and rerun the idempotent import.");
}

main().catch(error => {
  // Never print connection URLs, service-role keys, or full request objects.
  console.error(`Import failed: ${String(error?.message ?? error).replace(/eyJ[A-Za-z0-9._-]+/g, "[REDACTED]")}`);
  process.exitCode = 1;
});
