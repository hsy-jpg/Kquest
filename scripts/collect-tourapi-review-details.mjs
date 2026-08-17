#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const API_BASE = "https://apis.data.go.kr/B551011/EngService2";
const DEFAULT_OUTPUT = "artifacts/tourapi-review-details.json";

// REVIEW items from the current local Quest-generation validation.
const TARGETS = [
  { contentId: "3544280", contentTypeId: "85", title: "100 Years Market 100 Years Night", reviewReasons: ["EVENT_PERIOD_MISSING", "VENUE_MISSING"] },
  { contentId: "3544517", contentTypeId: "76", title: "ARTEASPOON", reviewReasons: ["PROGRAM_AVAILABILITY_UNKNOWN"] },
  { contentId: "3516784", contentTypeId: "76", title: "B-Con Ground", reviewReasons: ["PLACE_IDENTITY_NOT_CONFIRMED"] },
  { contentId: "264591", contentTypeId: "76", title: "Baengnokdam Lake", reviewReasons: ["ROUTE_DIFFICULTY_ENTRY_WEATHER_NOT_VERIFIED"] },
  { contentId: "697123", contentTypeId: "85", title: "Andong Maskdance Festival", reviewReasons: ["EVENT_PERIOD_MISSING", "VENUE_MISSING"] },
  { contentId: "697439", contentTypeId: "85", title: "Anseong Namsadang Baudeogi Festival", reviewReasons: ["EVENT_PERIOD_MISSING", "VENUE_MISSING"] },
  { contentId: "293144", contentTypeId: "85", title: "Bucheon International Comics Festival", reviewReasons: ["EVENT_PERIOD_MISSING", "VENUE_MISSING"] },
  { contentId: "1273884", contentTypeId: "85", title: "Bupyeong Pungmul Festival", reviewReasons: ["EVENT_PERIOD_MISSING", "VENUE_MISSING"] },
  { contentId: "293091", contentTypeId: "85", title: "Busan International Rock Festival", reviewReasons: ["EVENT_PERIOD_MISSING", "VENUE_MISSING"] },
  { contentId: "4020637", contentTypeId: "85", title: "Cheonan K-Culture Expo", reviewReasons: ["EVENT_PERIOD_MISSING", "VENUE_MISSING"] },
];

function parseArgs(argv) {
  const outputIndex = argv.indexOf("--output");
  return {
    output: resolve(outputIndex >= 0 && argv[outputIndex + 1] ? argv[outputIndex + 1] : DEFAULT_OUTPUT),
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

const sleep = ms => new Promise(resolvePromise => setTimeout(resolvePromise, ms));
const compact = value => value === undefined || value === null || value === "" ? null : value;

function redact(value, serviceKey) {
  return String(value ?? "Unknown error")
    .split(serviceKey).join("[REDACTED]")
    .replace(/serviceKey=[^&\s]+/gi, "serviceKey=[REDACTED]");
}

function getItems(payload) {
  const item = payload?.response?.body?.items?.item;
  if (!item) return [];
  return Array.isArray(item) ? item : [item];
}

async function requestApi(operation, parameters, serviceKey) {
  const query = new URLSearchParams({
    serviceKey,
    MobileOS: "ETC",
    MobileApp: "KQuestDetailValidation",
    _type: "json",
    ...parameters,
  });

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(`${API_BASE}/${operation}?${query}`, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(45_000),
      });
      const bodyText = await response.text();
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      let payload;
      try {
        payload = JSON.parse(bodyText);
      } catch {
        throw new Error(`Non-JSON response: ${bodyText.slice(0, 160)}`);
      }

      const resultCode = payload?.response?.header?.resultCode;
      if (resultCode && resultCode !== "0000") {
        throw new Error(`API ${resultCode}: ${payload?.response?.header?.resultMsg ?? "Unknown API error"}`);
      }

      return {
        ok: true,
        operation,
        header: payload?.response?.header ?? null,
        totalCount: payload?.response?.body?.totalCount ?? getItems(payload).length,
        items: getItems(payload),
      };
    } catch (error) {
      if (attempt === 3) {
        return { ok: false, operation, error: redact(error?.message, serviceKey), items: [] };
      }
      await sleep(500 * (2 ** (attempt - 1)));
    }
  }
}

function allValues(items, keys) {
  return items.flatMap(item => keys.map(key => compact(item?.[key]))).filter(Boolean);
}

function firstValue(items, keys) {
  return allValues(items, keys)[0] ?? null;
}

function normalize(target, commonItems, introItems, infoItems) {
  const common = commonItems[0] ?? {};
  const intro = introItems[0] ?? {};

  const eventStartDate = compact(intro.eventstartdate);
  const eventEndDate = compact(intro.eventenddate);
  const venue = firstValue([intro, common], ["eventplace", "placeinfo", "addr1"]);

  const operatingInformation = {
    useTime: firstValue([intro], ["usetime", "playtime", "spendtimefestival"]),
    restDate: firstValue([intro], ["restdate"]),
    openingDate: firstValue([intro], ["opendate"]),
    informationCenter: firstValue([intro, common], ["infocenter", "tel"]),
    parking: firstValue([intro], ["parking"]),
    reservation: firstValue([intro], ["reservation", "reservationurl", "bookingplace"]),
    fee: firstValue([intro], ["usefee", "spendtimefestival"]),
  };

  const experienceInformation = {
    experienceGuide: firstValue([intro], ["expguide"]),
    program: firstValue([intro], ["program", "programinfo"]),
    ageLimit: firstValue([intro], ["agelimit"]),
    organizer: firstValue([intro], ["sponsor1", "sponsor2"]),
  };

  const safetyAndAccess = {
    parking: operatingInformation.parking,
    stroller: firstValue([intro], ["chkbabycarriage"]),
    pets: firstValue([intro], ["chkpet"]),
    accessibility: firstValue([intro], ["accessibility", "disabledaccess"]),
    routeOrSafetyDetails: allValues(infoItems, ["infoname", "infotext", "subdetailoverview"]),
  };

  const uniqueFeatures = [
    compact(common.overview),
    experienceInformation.experienceGuide,
    experienceInformation.program,
    ...allValues(infoItems, ["infoname", "infotext", "subdetailoverview", "subname"]),
  ].filter(Boolean);

  return {
    contentId: target.contentId,
    contentTypeId: target.contentTypeId,
    title: compact(common.title) ?? target.title,
    overview: compact(common.overview),
    address: [compact(common.addr1), compact(common.addr2)].filter(Boolean).join(" ") || null,
    homepage: compact(common.homepage),
    telephone: compact(common.tel),
    coordinates: {
      longitude: compact(common.mapx),
      latitude: compact(common.mapy),
    },
    event: {
      startDate: eventStartDate,
      endDate: eventEndDate,
      venue,
      periodComplete: Boolean(eventStartDate && eventEndDate),
      venueComplete: Boolean(venue),
    },
    operatingInformation,
    experienceInformation,
    safetyAndAccess,
    uniqueFeatures,
  };
}

async function collectTarget(target, serviceKey) {
  const [common, intro, info] = await Promise.all([
    // Service2 detailCommon2 no longer accepts contentTypeId/defaultYN/overviewYN flags.
    requestApi("detailCommon2", { contentId: target.contentId }, serviceKey),
    requestApi("detailIntro2", { contentId: target.contentId, contentTypeId: target.contentTypeId }, serviceKey),
    requestApi("detailInfo2", { contentId: target.contentId, contentTypeId: target.contentTypeId, numOfRows: "100", pageNo: "1" }, serviceKey),
  ]);

  const normalized = normalize(target, common.items, intro.items, info.items);
  const successfulEndpoints = [common, intro, info].filter(result => result.ok).length;

  return {
    target,
    fetchStatus: successfulEndpoints === 3 ? "COMPLETE" : successfulEndpoints > 0 ? "PARTIAL" : "FAILED",
    successfulEndpoints,
    normalized,
    raw: { detailCommon2: common, detailIntro2: intro, detailInfo2: info },
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const env = parseEnv(await readFile(resolve(".env"), "utf8"));
  const serviceKey = env.TOURAPI_SERVICE_KEY;
  if (!serviceKey) throw new Error("TOURAPI_SERVICE_KEY is missing from .env");

  console.log(`Collecting TourAPI details for ${TARGETS.length} REVIEW items...`);
  const results = [];

  // Two items at a time keeps request pressure modest; each item fetches its three detail endpoints together.
  for (let index = 0; index < TARGETS.length; index += 2) {
    const batch = TARGETS.slice(index, index + 2);
    const collected = await Promise.all(batch.map(target => collectTarget(target, serviceKey)));
    results.push(...collected);
    for (const result of collected) {
      console.log(`[${result.fetchStatus}] ${result.target.contentId} ${result.target.title}`);
    }
    if (index + 2 < TARGETS.length) await sleep(250);
  }

  const document = {
    metadata: {
      source: "KTO EngService2",
      collectedAt: new Date().toISOString(),
      targetCount: TARGETS.length,
      completeCount: results.filter(result => result.fetchStatus === "COMPLETE").length,
      partialCount: results.filter(result => result.fetchStatus === "PARTIAL").length,
      failedCount: results.filter(result => result.fetchStatus === "FAILED").length,
      apiKeyStored: false,
      endpoints: ["detailCommon2", "detailIntro2", "detailInfo2"],
    },
    results,
  };

  await mkdir(dirname(args.output), { recursive: true });
  await writeFile(args.output, `${JSON.stringify(document, null, 2)}\n`, "utf8");
  console.log(`Saved: ${args.output}`);
  console.log(`Complete ${document.metadata.completeCount}, partial ${document.metadata.partialCount}, failed ${document.metadata.failedCount}`);
}

main().catch(error => {
  // Never print request URLs or the service key.
  console.error(`Collection failed: ${String(error?.message ?? error).replace(/serviceKey=[^&\s]+/gi, "serviceKey=[REDACTED]")}`);
  process.exitCode = 1;
});
