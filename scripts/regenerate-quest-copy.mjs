#!/usr/bin/env node

// Regenerates title/description/steps for quests already stored in Supabase using the
// fixed action-led title + grounded description logic, WITHOUT calling the live TourAPI.
// Source-of-truth taxonomy fields (lclsSystm3/cat3) are not persisted in tour_places, so
// variant selection here relies on title/overview/detail text signals only. questType and
// templateId are left untouched (read from the existing quest row, never re-derived).

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { catalog, fill, selectVariant, buildDescription } from "./test-tour-quest-generation.mjs";

function parseArgs(argv) {
  const value = (name, fallback) => {
    const index = argv.indexOf(name);
    return index >= 0 && argv[index + 1] ? argv[index + 1] : fallback;
  };
  return {
    dryRun: argv.includes("--dry-run"),
    limit: Number(value("--limit", "5000")),
    concurrency: Number(value("--concurrency", "6")),
  };
}

function parseEnv(source) {
  const values = {};
  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;
    let val = match[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
    values[match[1]] = val;
  }
  return values;
}

function authHeaders(serviceRoleKey, extra = {}) {
  const headers = { apikey: serviceRoleKey, ...extra };
  if (!serviceRoleKey.startsWith("sb_secret_")) headers.Authorization = `Bearer ${serviceRoleKey}`;
  return headers;
}

async function restError(response, operation) {
  const body = await response.text();
  let message = body.slice(0, 500);
  try {
    const parsed = JSON.parse(body);
    message = parsed.message ?? parsed.hint ?? message;
  } catch {
    // keep bounded text
  }
  throw new Error(`${operation} failed with HTTP ${response.status}: ${message}`);
}

async function fetchAllQuests(url, serviceRoleKey, limit) {
  const pageSize = 500;
  const rows = [];
  for (let offset = 0; offset < limit; offset += pageSize) {
    const query = new URLSearchParams({
      select: "id,quest_id,source_content_id,title,description,template_id,quest_type,secondary_tags,region,status,tour_places(title,description,detail_data)",
      status: "eq.PUBLISHED",
      order: "source_content_id.asc",
      limit: String(Math.min(pageSize, limit - offset)),
      offset: String(offset),
    });
    const response = await fetch(`${url}/rest/v1/quests?${query}`, {
      headers: authHeaders(serviceRoleKey, { Accept: "application/json" }),
      signal: AbortSignal.timeout(45_000),
    });
    if (!response.ok) await restError(response, "Fetch quests page");
    const page = await response.json();
    rows.push(...page);
    if (page.length < pageSize) break;
  }
  return rows;
}

function detailStringFrom(detailData) {
  const info = Array.isArray(detailData?.detailInfo) ? detailData.detailInfo : [];
  return info.map((entry) => `${entry?.name ?? ""} ${entry?.text ?? ""}`).join(" ");
}

function regenerate(row, recentVariantIds) {
  const place = row.tour_places;
  if (!place) return { skip: "MISSING_TOUR_PLACE" };
  if (!catalog[row.template_id]) return { skip: `UNKNOWN_TEMPLATE:${row.template_id}` };

  const item = {
    contentid: row.source_content_id,
    title: place.title,
    region: row.region,
    lclsSystm3: "",
    cat3: "",
    questType: row.quest_type,
    templateId: row.template_id,
    secondaryTags: Array.isArray(row.secondary_tags) ? row.secondary_tags : [],
    overview: place.description ?? null,
    detail: detailStringFrom(place.detail_data),
  };

  const selected = selectVariant(item, recentVariantIds);
  const selectedVariantId = `${row.template_id}:${selected.v.id}`;
  recentVariantIds.unshift(selectedVariantId);
  if (recentVariantIds.length > 20) recentVariantIds.pop();

  const slots = selected.g.slots;
  const title = fill(selected.v.title, slots);
  const description = buildDescription(item.overview, selected.v.explore, slots);
  const steps = [
    { order: 1, kind: "VISIT", prompt: `Visit ${place.title} and check in at the public entrance or mapped point.`, verification: "GEOFENCE" },
    { order: 2, kind: "EXPLORE", prompt: fill(selected.v.explore, slots), verification: "SELF_CONFIRM" },
    { order: 3, kind: "PHOTO", prompt: fill(selected.v.photo, slots), verification: "USER_PHOTO" },
    { order: 4, kind: "ACTION", prompt: fill(selected.v.action, slots), verification: "TEXT_OR_CHOICE" },
  ];

  return { title, description, steps, selectedVariantId };
}

async function patchQuest(url, serviceRoleKey, sourceContentId, payload) {
  const query = new URLSearchParams({ source_content_id: `eq.${sourceContentId}` });
  const response = await fetch(`${url}/rest/v1/quests?${query}`, {
    method: "PATCH",
    headers: authHeaders(serviceRoleKey, { Accept: "application/json", "Content-Type": "application/json", Prefer: "return=minimal" }),
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(45_000),
  });
  if (!response.ok) await restError(response, `Patch quest ${sourceContentId}`);
}

async function mapLimit(values, limit, mapper) {
  const results = new Array(values.length);
  let cursor = 0;
  async function worker() {
    while (cursor < values.length) {
      const index = cursor++;
      results[index] = await mapper(values[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, values.length) }, worker));
  return results;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const env = parseEnv(await readFile(resolve(".env"), "utf8"));
  const url = env.SUPABASE_URL ?? env.VITE_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error("SUPABASE_URL or VITE_SUPABASE_URL is missing from .env");
  if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing from .env");

  console.log("Fetching published quests...");
  const rows = await fetchAllQuests(url, serviceRoleKey, args.limit);
  console.log(`Fetched ${rows.length} published quests.`);

  const recentVariantIds = [];
  const results = rows.map((row) => ({ row, next: regenerate(row, recentVariantIds) }));

  const skipped = results.filter((r) => r.next.skip);
  const changed = results.filter((r) => !r.next.skip && r.next.title !== r.row.title);
  const unchanged = results.filter((r) => !r.next.skip && r.next.title === r.row.title);

  console.log(`To update: ${changed.length}, unchanged: ${unchanged.length}, skipped: ${skipped.length}`);
  for (const s of skipped.slice(0, 10)) console.log(`  [SKIP ${s.next.skip}] ${s.row.source_content_id} ${s.row.title}`);

  console.log("\nSample of changes:");
  for (const c of changed.slice(0, 8)) {
    console.log(`- ${c.row.title}\n  -> ${c.next.title}`);
  }

  if (args.dryRun) {
    console.log("\nDry run complete. No writes performed.");
    return;
  }

  console.log(`\nPatching ${changed.length} quest rows in Supabase...`);
  let done = 0;
  await mapLimit(changed, args.concurrency, async ({ row, next }) => {
    await patchQuest(url, serviceRoleKey, row.source_content_id, {
      title: next.title,
      description: next.description,
      steps: next.steps,
    });
    done += 1;
    if (done % 50 === 0 || done === changed.length) console.log(`[PATCH] ${done}/${changed.length}`);
  });
  console.log("Done.");
}

main().catch((error) => {
  console.error(`Regeneration failed: ${String(error?.message ?? error).replace(/eyJ[A-Za-z0-9._-]+/g, "[REDACTED]")}`);
  process.exitCode = 1;
});
