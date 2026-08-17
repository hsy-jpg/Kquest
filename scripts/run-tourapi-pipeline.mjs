#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fill, selectVariant } from "./test-tour-quest-generation.mjs";

const API_BASE = "https://apis.data.go.kr/B551011/EngService2";
const DEFAULT_REGIONS = ["1", "2", "3", "4", "5", "6", "7", "8", "31", "32", "33", "34", "35", "36", "37", "38", "39"];
const DEFAULT_CONTENT_TYPES = ["75", "76", "78", "79", "80", "82", "85"];
const REGION_NAMES = {
  "1": "Seoul", "2": "Incheon", "3": "Daejeon", "4": "Daegu", "5": "Gwangju",
  "6": "Busan", "7": "Ulsan", "8": "Sejong", "31": "Gyeonggi", "32": "Gangwon",
  "33": "Chungbuk", "34": "Chungnam", "35": "Gyeongbuk", "36": "Gyeongnam",
  "37": "Jeonbuk", "38": "Jeonnam", "39": "Jeju",
};

function parseArgs(argv) {
  const value = (name, fallback) => {
    const index = argv.indexOf(name);
    return index >= 0 && argv[index + 1] ? argv[index + 1] : fallback;
  };
  const all = argv.includes("--all");
  const maxItems = Number(value("--max-items", "100"));
  if (!Number.isInteger(maxItems) || maxItems < 1 || maxItems > 20000) {
    throw new Error("--max-items must be an integer between 1 and 20000");
  }
  return {
    regions: value("--regions", DEFAULT_REGIONS.join(",")).split(",").map(v => v.trim()).filter(Boolean),
    contentTypes: value("--content-types", DEFAULT_CONTENT_TYPES.join(",")).split(",").map(v => v.trim()).filter(Boolean),
    all,
    maxItems,
    outputDir: resolve(value("--output-dir", "artifacts/kquest-pipeline")),
    detailsFile: value("--details-file", null),
  };
}

function parseEnv(source) {
  const result = {};
  for (const raw of source.split(/\r?\n/)) {
    const match = raw.trim().match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match || raw.trim().startsWith("#")) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    result[match[1]] = value;
  }
  return result;
}

const sleep = ms => new Promise(done => setTimeout(done, ms));
const present = value => value !== undefined && value !== null && String(value).trim() !== "";
const arrayify = value => !value ? [] : Array.isArray(value) ? value : [value];
const clamp = value => Math.max(0, Math.min(100, Math.round(value)));

function cleanText(value) {
  if (!present(value)) return null;
  return String(value)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();
}

function redact(message, serviceKey) {
  return String(message ?? "Unknown error")
    .split(serviceKey).join("[REDACTED]")
    .replace(/serviceKey=[^&\s]+/gi, "serviceKey=[REDACTED]");
}

async function requestApi(operation, parameters, serviceKey) {
  const query = new URLSearchParams({ serviceKey, MobileOS: "ETC", MobileApp: "KQuestPipeline", _type: "json", ...parameters });
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(`${API_BASE}/${operation}?${query}`, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(45_000) });
      const text = await response.text();
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = JSON.parse(text);
      const header = payload?.response?.header;
      if (header?.resultCode && header.resultCode !== "0000") throw new Error(`API ${header.resultCode}: ${header.resultMsg}`);
      const item = payload?.response?.body?.items?.item;
      return { ok: true, items: arrayify(item), totalCount: Number(payload?.response?.body?.totalCount ?? arrayify(item).length), header };
    } catch (error) {
      if (attempt === 3) return { ok: false, items: [], totalCount: 0, error: redact(error?.message, serviceKey) };
      await sleep(500 * (2 ** (attempt - 1)));
    }
  }
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

async function collectLists(args, serviceKey) {
  if (args.all) return collectAllLists(args, serviceKey);
  const combinations = args.regions.flatMap(region => args.contentTypes.map(contentTypeId => ({ region, contentTypeId })));
  const perCombination = Math.max(1, Math.ceil(args.maxItems / combinations.length));
  const collected = [];
  for (const combo of combinations) {
    const response = await requestApi("areaBasedList2", {
      numOfRows: String(Math.min(100, perCombination)), pageNo: "1", areaCode: combo.region,
      contentTypeId: combo.contentTypeId, arrange: "Q",
    }, serviceKey);
    if (!response.ok) {
      console.warn(`[LIST_FAILED] region=${combo.region} type=${combo.contentTypeId}: ${response.error}`);
      continue;
    }
    collected.push(...response.items.map(item => ({ ...item, _requestedRegion: combo.region })));
    await sleep(80);
  }
  const deduplicated = [...new Map(collected.filter(item => present(item.contentid)).map(item => [String(item.contentid), item])).values()];
  const byRegion = new Map(args.regions.map(region => [region, []]));
  for (const item of deduplicated) byRegion.get(String(item._requestedRegion))?.push(item);
  const balanced = [];
  for (let index = 0; balanced.length < args.maxItems; index += 1) {
    let added = false;
    for (const region of args.regions) {
      const item = byRegion.get(region)?.[index];
      if (!item) continue;
      balanced.push(item);
      added = true;
      if (balanced.length === args.maxItems) break;
    }
    if (!added) break;
  }
  return balanced;
}

async function collectAllLists(args, serviceKey) {
  const allowedTypes = new Set(args.contentTypes);
  const collected = [];
  for (const region of args.regions) {
    let pageNo = 1;
    let received = 0;
    let totalCount = 0;
    do {
      const response = await requestApi("areaBasedList2", {
        numOfRows: "100", pageNo: String(pageNo), areaCode: region, arrange: "Q",
      }, serviceKey);
      if (!response.ok) throw new Error(`[LIST_FAILED] region=${region} page=${pageNo}: ${response.error}`);
      totalCount = response.totalCount;
      received += response.items.length;
      collected.push(...response.items
        .filter(item => allowedTypes.has(String(item.contenttypeid)))
        .map(item => ({ ...item, _requestedRegion: region })));
      console.log(`[LIST] region=${REGION_NAMES[region] ?? region} page=${pageNo} ${Math.min(received, totalCount)}/${totalCount}`);
      pageNo += 1;
      await sleep(80);
    } while (received < totalCount);
  }
  return [...new Map(collected
    .filter(item => present(item.contentid))
    .map(item => [String(item.contentid), item])).values()];
}

async function enrichItem(listItem, serviceKey) {
  const contentId = String(listItem.contentid);
  const contentTypeId = String(listItem.contenttypeid);
  const [common, intro, info] = await Promise.all([
    requestApi("detailCommon2", { contentId }, serviceKey),
    requestApi("detailIntro2", { contentId, contentTypeId }, serviceKey),
    requestApi("detailInfo2", { contentId, contentTypeId, numOfRows: "100", pageNo: "1" }, serviceKey),
  ]);
  return normalizeItem(listItem, common.items[0] ?? {}, intro.items[0] ?? {}, info.items, {
    detailCommon2: common.ok, detailIntro2: intro.ok, detailInfo2: info.ok,
    errors: [common, intro, info].filter(value => !value.ok).map(value => value.error),
  });
}

function normalizeItem(listItem, common, intro, infoItems, fetch) {
  const source = { ...listItem, ...common };
  const info = infoItems.map(item => ({
    name: cleanText(item.infoname ?? item.subname),
    text: cleanText(item.infotext ?? item.subdetailoverview),
  })).filter(item => item.name || item.text);
  const regionCode = String(source.areacode ?? listItem._requestedRegion ?? "");
  const address = [source.addr1, source.addr2].filter(present).join(" ").trim();
  const overview = cleanText(source.overview);
  const program = cleanText(intro.program ?? intro.programinfo ?? intro.expguide);
  const eventPlace = cleanText(intro.eventplace ?? intro.placeinfo);
  return {
    sourceContentId: String(source.contentid ?? ""), contentTypeId: String(source.contenttypeid ?? ""),
    title: cleanText(source.title), overview, description: overview,
    address: cleanText(address), regionCode, region: REGION_NAMES[regionCode] ?? cleanText(address?.split(",").at(-1)) ?? "Unknown",
    district: extractDistrict(address), latitude: numberOrNull(source.mapy), longitude: numberOrNull(source.mapx),
    image: present(source.firstimage) ? String(source.firstimage).replace(/^http:/, "https:") : null,
    imageCopyright: source.cpyrhtDivCd ?? null, sourceModifiedTime: source.modifiedtime ?? null,
    tel: cleanText(source.tel ?? intro.infocenter), homepage: cleanText(source.homepage),
    lclsSystm1: source.lclsSystm1 ?? "", lclsSystm2: source.lclsSystm2 ?? "", lclsSystm3: source.lclsSystm3 ?? "",
    cat1: source.cat1 ?? "", cat2: source.cat2 ?? "", cat3: source.cat3 ?? "",
    operating: {
      useTime: cleanText(intro.usetime ?? intro.playtime), restDate: cleanText(intro.restdate),
      parking: cleanText(intro.parking), informationCenter: cleanText(intro.infocenter),
    },
    experience: { guide: cleanText(intro.expguide), program, ageRange: cleanText(intro.expagerange ?? intro.agelimit) },
    event: {
      startDate: intro.eventstartdate ?? listItem.eventstartdate ?? null,
      endDate: intro.eventenddate ?? listItem.eventenddate ?? null,
      venue: eventPlace ?? cleanText(source.addr1),
    },
    detailInfo: info, fetch,
  };
}

function extractDistrict(address) {
  if (!present(address)) return null;
  const parts = String(address).split(/[ ,]+/).filter(Boolean);
  return parts.find(part => /-(?:gu|gun|si)$/i.test(part)) ?? null;
}

function numberOrNull(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function inferRegionFromAddress(address) {
  const text = String(address ?? "").toLowerCase();
  return Object.values(REGION_NAMES).find(name => text.includes(name.toLowerCase())) ?? "Unknown";
}

function fromCollectedDetails(document) {
  return document.results.map(result => {
    const common = result.raw?.detailCommon2?.items?.[0] ?? {};
    const intro = result.raw?.detailIntro2?.items?.[0] ?? {};
    const info = result.raw?.detailInfo2?.items ?? [];
    const listItem = {
      ...common,
      contentid: result.target.contentId,
      contenttypeid: result.target.contentTypeId,
      title: common.title ?? result.target.title,
      _requestedRegion: common.areacode,
    };
    const normalized = normalizeItem(listItem, common, intro, info, {
      detailCommon2: result.raw?.detailCommon2?.ok === true,
      detailIntro2: result.raw?.detailIntro2?.ok === true,
      detailInfo2: result.raw?.detailInfo2?.ok === true,
      errors: [],
    });
    if (normalized.region === "Unknown") normalized.region = inferRegionFromAddress(normalized.address);
    return normalized;
  });
}

function classify(item) {
  const signal = [item.title, item.overview, item.lclsSystm3, item.cat3, item.experience.program, item.experience.guide]
    .filter(Boolean).join(" ");
  const l1 = item.lclsSystm1;
  const result = { questType: "GENERIC_LOCAL_DISCOVERY", secondaryTags: [], templateId: "GENERIC_LANDMARK_HUNT_V1", classificationConfidence: 0.55, classificationReasons: [], reviewFlags: [] };

  if (item.contentTypeId === "85" || l1 === "EV") {
    result.questType = "FESTIVAL";
    result.templateId = /mask|namsadang|pungmul|traditional|folk/i.test(signal) ? "FESTIVAL_TRADITION_TRACE_V1" : "FESTIVAL_SCENE_HUNT_V1";
    result.classificationConfidence = item.overview ? 0.95 : 0.85;
    if (/market|food|ingredient/i.test(signal)) result.secondaryTags.push("LOCAL_MARKET", "LOCAL_FOOD");
    if (/mask|namsadang|pungmul|traditional|folk/i.test(signal)) result.secondaryTags.push("TRADITION", "PERFORMANCE");
    if (/rock|music/i.test(signal)) result.secondaryTags.push("MUSIC", "PERFORMANCE");
    if (/comic|manhwa/i.test(signal)) result.secondaryTags.push("COMICS", "CULTURE");
    result.classificationReasons.push("EVENT_TAXONOMY");
  } else if (l1 === "NA" || item.cat1 === "A01") {
    result.questType = "NATURE";
    result.templateId = /lake|cliff|coast|mountain|peak|oreum/i.test(signal) ? "SAFE_VIEWPOINT_WALK_V1" : "NATURE_DETAIL_HUNT_V1";
    result.classificationConfidence = 0.95;
    if (/forest/i.test(signal)) result.secondaryTags.push("FOREST");
    if (/lake|crater/i.test(signal)) result.secondaryTags.push("LAKE", "VOLCANIC_LANDSCAPE");
    if (/cliff|coast|sea/i.test(signal)) result.secondaryTags.push("COAST", "CLIFF");
    result.classificationReasons.push("NATURE_TAXONOMY");
  } else if (item.contentTypeId === "79" || l1 === "SH") {
    if (/traditional market|market|five-day|5-day/i.test(signal)) {
      result.questType = "LOCAL_FOOD"; result.templateId = "MARKET_LOCAL_FOOD_HUNT_V1"; result.classificationConfidence = 0.9;
      result.secondaryTags.push("LOCAL_MARKET"); result.classificationReasons.push("MARKET_SIGNAL");
    } else {
      result.questType = "SHOPPING"; result.templateId = null; result.classificationConfidence = 0.9;
      result.reviewFlags.push("LOCALITY_NOT_PROVEN");
    }
  } else if (item.contentTypeId === "82" || l1 === "FD") {
    result.questType = "LOCAL_FOOD"; result.templateId = "LOCAL_DISH_OBSERVER_V1"; result.classificationConfidence = item.overview ? 0.85 : 0.7;
    if (/regional|local specialty|traditional|market|famous for/i.test(signal)) result.secondaryTags.push("REGIONAL_FOOD");
    else result.reviewFlags.push("LOCALITY_NOT_PROVEN");
  } else if (item.contentTypeId === "80" || l1 === "AC") {
    result.questType = "STAY"; result.templateId = null; result.classificationConfidence = 0.95;
    if (/hanok|temple stay|farm stay|traditional/i.test(signal)) result.secondaryTags.push("STAY_CULTURE");
    else result.reviewFlags.push("NON_EXPERIENTIAL_STAY");
  } else if (l1 === "EX" || /workshop|craft|art class|experience program/i.test(signal)) {
    result.questType = "CRAFT_EXPERIENCE"; result.templateId = "CRAFT_PROCESS_SPOTTER_V1"; result.classificationConfidence = item.experience.guide || item.experience.program ? 0.95 : 0.75;
    result.secondaryTags.push("LOCAL_EXPERIENCE");
    if (!item.experience.guide && !item.experience.program) result.reviewFlags.push("PROGRAM_AVAILABILITY_UNKNOWN");
  } else if (/street|stairs|steps|village|alley|under an overpass|cultural complex/i.test(signal) || /^VE(?:04|12)/.test(item.lclsSystm2)) {
    result.questType = "NEIGHBORHOOD"; result.templateId = "STREET_DETAIL_HUNT_V1"; result.classificationConfidence = item.overview ? 0.9 : 0.75;
    result.secondaryTags.push("LOCAL_STREET"); result.classificationReasons.push("NEIGHBORHOOD_SIGNAL");
  } else if (item.contentTypeId === "78" || l1 === "VE" || item.cat1 === "A02") {
    result.questType = "CULTURE"; result.templateId = "CULTURE_ONE_OBJECT_V1"; result.classificationConfidence = item.overview ? 0.9 : 0.7;
    result.secondaryTags.push("CULTURE_FACILITY"); result.classificationReasons.push("CULTURE_TAXONOMY");
  } else if (item.contentTypeId === "75") {
    result.questType = "ACTIVE"; result.templateId = null; result.classificationConfidence = 0.65;
    result.reviewFlags.push("ACTIVE_TEMPLATE_SAFETY_REVIEW");
  } else {
    result.reviewFlags.push("GENERIC_FALLBACK");
  }
  return result;
}

function localScore(item, classification) {
  const signal = [item.title, item.overview, item.lclsSystm3, item.cat3, ...classification.secondaryTags].filter(Boolean).join(" ");
  let identity = 0, archetype = 0, action = 0, repeatability = 0, explicit = item.address && item.region !== "Unknown" ? 10 : 5, penalty = 0;
  const reasons = [];
  switch (classification.questType) {
    case "FESTIVAL": {
      const stronglyLocal = /mask|namsadang|pungmul|traditional|folk|market|regional|local specialty/i.test(signal);
      identity = stronglyLocal ? 20 : 12; archetype = stronglyLocal ? 25 : 15; action = 16; explicit = 10;
      reasons.push(stronglyLocal ? "REGIONAL_FESTIVAL_ARCHETYPE" : "LOCAL_EVENT_ARCHETYPE", "FIELD_BASED_ACTIVITY"); break;
    }
    case "NATURE": identity = 20; archetype = 20; action = 16; repeatability = 6; reasons.push("LOCAL_NATURE_ARCHETYPE", "FIELD_BASED_ACTIVITY"); break;
    case "NEIGHBORHOOD": identity = item.overview ? 20 : 18; archetype = 22; action = 16; repeatability = 6; reasons.push("STREET_OR_VILLAGE_ARCHETYPE", "FIELD_BASED_ACTIVITY"); break;
    case "CRAFT_EXPERIENCE": identity = item.overview ? 20 : 12; archetype = 18; action = 16; repeatability = 6; reasons.push("LOCAL_CULTURE_ARCHETYPE", "EXPERIENCE_CATEGORY"); break;
    case "CULTURE": identity = 15; archetype = 18; action = 16; repeatability = 6; reasons.push("CULTURE_CATEGORY_WITH_REGION"); break;
    case "LOCAL_FOOD": {
      const localEvidence = classification.secondaryTags.includes("LOCAL_MARKET") || classification.secondaryTags.includes("REGIONAL_FOOD");
      identity = localEvidence ? 20 : 0; archetype = localEvidence ? 25 : 0; action = 8; repeatability = 6;
      reasons.push(localEvidence ? "LOCAL_FOOD_EVIDENCE" : "LOCAL_FOOD_EVIDENCE_MISSING"); break;
    }
    case "SHOPPING": action = 5; repeatability = 6; penalty = 25; reasons.push("NON_LOCAL_RETAIL_PENALTY"); break;
    case "STAY": repeatability = 6; if (!classification.secondaryTags.includes("STAY_CULTURE")) penalty = 20; reasons.push("GENERAL_LODGING_PENALTY"); break;
    case "ACTIVE": identity = 10; archetype = 10; action = 16; repeatability = 6; reasons.push("ACTIVE_CONTENT"); break;
    default: action = 10; repeatability = 6; reasons.push("GENERIC_FALLBACK");
  }
  return { localScore: clamp(identity + archetype + action + repeatability + explicit - penalty), scoreReasons: reasons };
}

function qualityScore(item) {
  let score = 0;
  const reasons = [];
  if (item.latitude !== null && item.longitude !== null && item.address) { score += 25; reasons.push("VALID_LOCATION"); }
  if (item.overview) { score += 20; reasons.push("OVERVIEW_PRESENT"); }
  if (item.lclsSystm3 || item.cat3) { score += 15; reasons.push("SPECIFIC_TAXONOMY"); }
  if (item.image && item.imageCopyright) { score += 15; reasons.push("IMAGE_WITH_COPYRIGHT"); }
  if (Object.values(item.operating).some(present) || Object.values(item.event).some(present)) { score += 10; reasons.push("OPERATION_INFO"); }
  if (String(item.sourceModifiedTime ?? "") >= "20240101000000") { score += 10; reasons.push("RECENTLY_MODIFIED"); }
  if (item.tel || item.homepage) { score += 5; reasons.push("CONTACT_PRESENT"); }
  return { qualityScore: clamp(score), qualityReasons: reasons };
}

function dateState(item) {
  if (item.event.endDate && /^\d{8}$/.test(String(item.event.endDate))) {
    const today = new Date().toISOString().slice(0, 10).replaceAll("-", "");
    if (String(item.event.endDate) < today) return "ENDED";
  }
  return "ACTIVE_OR_FUTURE";
}

function decide(item, classification, scores) {
  const flags = [...classification.reviewFlags];
  const exclusionSignal = [item.title, item.overview, item.lclsSystm3, item.cat3]
    .filter(Boolean)
    .join(" ");
  if (/casino|country club|golf course|golf club/i.test(exclusionSignal)) {
    flags.push("NON_LOCAL_COMMERCIAL_LEISURE");
  }
  if (!item.sourceContentId || !item.title) flags.push("SOURCE_ID_OR_TITLE_MISSING");
  if (item.latitude === null || item.longitude === null || !item.address) flags.push("LOCATION_INCOMPLETE");
  if (!item.fetch.detailCommon2 || !item.fetch.detailIntro2 || !item.fetch.detailInfo2) flags.push("DETAIL_ENRICHMENT_INCOMPLETE");
  if (classification.questType === "FESTIVAL") {
    if (!item.event.startDate) flags.push("EVENT_START_MISSING");
    if (!item.event.endDate) flags.push("EVENT_END_MISSING");
    if (!item.event.venue) flags.push("VENUE_MISSING");
    if (dateState(item) === "ENDED") return { selectionStatus: "EXCLUDED", reviewFlags: [...flags, "EVENT_ENDED"] };
  }
  if (/Baengnokdam/i.test(item.title) && !item.detailInfo.some(detail => /difficulty|weather/i.test(`${detail.name} ${detail.text}`))) {
    flags.push("ROUTE_DIFFICULTY_OR_WEATHER_NOT_VERIFIED");
  }
  const hardExcluded = flags.some(flag => ["NON_EXPERIENTIAL_STAY", "NON_LOCAL_COMMERCIAL_LEISURE"].includes(flag)) || (classification.questType === "SHOPPING" && !classification.secondaryTags.includes("LOCAL_MARKET"));
  const blocking = flags.some(flag => [
    "SOURCE_ID_OR_TITLE_MISSING", "LOCATION_INCOMPLETE", "GENERIC_FALLBACK",
    "PROGRAM_AVAILABILITY_UNKNOWN", "ACTIVE_TEMPLATE_SAFETY_REVIEW", "EVENT_START_MISSING", "EVENT_END_MISSING",
    "VENUE_MISSING", "ROUTE_DIFFICULTY_OR_WEATHER_NOT_VERIFIED", "LOCALITY_NOT_PROVEN",
  ].includes(flag));
  if (hardExcluded) return { selectionStatus: "EXCLUDED", reviewFlags: flags };
  if (!blocking && scores.localScore >= 50 && scores.qualityScore >= 55 && classification.classificationConfidence >= 0.7 && classification.templateId) {
    return { selectionStatus: "AUTO_ACCEPTED", reviewFlags: flags };
  }
  if (scores.localScore >= 30 || scores.qualityScore >= 40 || blocking) return { selectionStatus: "REVIEW", reviewFlags: flags };
  return { selectionStatus: "EXCLUDED", reviewFlags: flags };
}

function evaluate(item) {
  const classification = classify(item);
  const local = localScore(item, classification);
  const quality = qualityScore(item);
  const decision = decide(item, classification, { ...local, ...quality });
  return { ...item, ...classification, ...local, ...quality, ...decision };
}

function makeQuest(item, recentVariantIds) {
  const detail = item.detailInfo.map(value => `${value.name ?? ""} ${value.text ?? ""}`).join(" ");
  const variantInput = {
    contentid: item.sourceContentId, title: item.title, region: item.region,
    lclsSystm3: item.lclsSystm3, cat3: item.cat3, questType: item.questType,
    templateId: item.templateId, secondaryTags: item.secondaryTags, overview: item.overview, detail,
  };
  const selected = selectVariant(variantInput, recentVariantIds);
  const selectedVariantId = `${item.templateId}:${selected.v.id}`;
  recentVariantIds.unshift(selectedVariantId);
  if (recentVariantIds.length > 20) recentVariantIds.pop();
  const slots = selected.g.slots;
  const questTitle = slots.feature === item.title ? `Discover ${item.title}` : `Explore ${slots.feature} at ${item.title}`;
  const description = item.overview ?? `Explore ${item.title} through a respectful, place-based mission.`;
  return {
    questId: `kq-kto-${item.sourceContentId}-${item.templateId.toLowerCase().replace(/_v\d+$/, "").replaceAll("_", "-")}`,
    sourceContentId: item.sourceContentId,
    title: questTitle,
    description,
    region: item.region,
    district: item.district,
    latitude: item.latitude,
    longitude: item.longitude,
    image: item.image,
    questType: item.questType,
    secondaryTags: item.secondaryTags,
    templateId: item.templateId,
    selectedVariantId,
    steps: [
      { order: 1, kind: "VISIT", prompt: `Visit ${item.title} and check in at the public entrance or mapped point.`, verification: "GEOFENCE" },
      { order: 2, kind: "EXPLORE", prompt: fill(selected.v.explore, slots), verification: "SELF_CONFIRM" },
      { order: 3, kind: "PHOTO", prompt: fill(selected.v.photo, slots), verification: "USER_PHOTO" },
      { order: 4, kind: "ACTION", prompt: fill(selected.v.action, slots), verification: "TEXT_OR_CHOICE" },
    ],
    localScore: item.localScore,
    qualityScore: item.qualityScore,
    classificationConfidence: item.classificationConfidence,
    sourceModifiedTime: item.sourceModifiedTime,
  };
}

function reviewRecord(item) {
  return {
    sourceContentId: item.sourceContentId, title: item.title, description: item.description,
    region: item.region, district: item.district, latitude: item.latitude, longitude: item.longitude, image: item.image,
    contentTypeId: item.contentTypeId, taxonomy: { lcls: [item.lclsSystm1, item.lclsSystm2, item.lclsSystm3], cat: [item.cat1, item.cat2, item.cat3] },
    proposedQuestType: item.questType, secondaryTags: item.secondaryTags, proposedTemplateId: item.templateId,
    localScore: item.localScore, qualityScore: item.qualityScore, classificationConfidence: item.classificationConfidence,
    scoreReasons: item.scoreReasons, reviewFlags: item.reviewFlags, event: item.event, operating: item.operating,
    experience: item.experience, detailInfo: item.detailInfo, sourceModifiedTime: item.sourceModifiedTime,
  };
}

function tourPlaceRecord(item) {
  return {
    sourceContentId: item.sourceContentId,
    title: item.title,
    description: item.description,
    overview: item.overview,
    region: item.region,
    district: item.district,
    latitude: item.latitude,
    longitude: item.longitude,
    image: item.image,
    contentTypeId: item.contentTypeId,
    cat1: item.cat1,
    cat2: item.cat2,
    cat3: item.cat3,
    lclsSystm1: item.lclsSystm1,
    lclsSystm2: item.lclsSystm2,
    lclsSystm3: item.lclsSystm3,
    sourceModifiedTime: item.sourceModifiedTime,
    localScore: item.localScore,
    qualityScore: item.qualityScore,
    selectionStatus: item.selectionStatus,
    detailData: {
      address: item.address,
      tel: item.tel,
      homepage: item.homepage,
      operating: item.operating,
      event: item.event,
      experience: item.experience,
      detailInfo: item.detailInfo,
    },
  };
}

async function writeJson(path, value) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  let normalizedItems;
  let sourceMode;
  if (args.detailsFile) {
    const document = JSON.parse(await readFile(resolve(args.detailsFile), "utf8"));
    const collectedDetails = fromCollectedDetails(document);
    normalizedItems = args.all ? collectedDetails : collectedDetails.slice(0, args.maxItems);
    sourceMode = "DETAILS_FILE";
  } else {
    const env = parseEnv(await readFile(resolve(".env"), "utf8"));
    const serviceKey = env.TOURAPI_SERVICE_KEY;
    if (!serviceKey) throw new Error("TOURAPI_SERVICE_KEY is missing from .env");
    console.log(`${args.all ? "Collecting all matching" : `Collecting up to ${args.maxItems}`} items from regions ${args.regions.join(", ")}...`);
    const listItems = await collectLists(args, serviceKey);
    console.log(`Enriching ${listItems.length} unique items with detailCommon2/detailIntro2/detailInfo2...`);
    normalizedItems = await mapLimit(listItems, 3, async (item, index) => {
      const enriched = await enrichItem(item, serviceKey);
      if ((index + 1) % 25 === 0 || index + 1 === listItems.length) {
        console.log(`[DETAIL] ${index + 1}/${listItems.length} latest=${enriched.sourceContentId} ${enriched.title}`);
      }
      return enriched;
    });
    sourceMode = "LIVE_API";
  }

  const evaluated = normalizedItems.map(evaluate);
  const accepted = evaluated.filter(item => item.selectionStatus === "AUTO_ACCEPTED");
  const review = evaluated.filter(item => item.selectionStatus === "REVIEW");
  const excluded = evaluated.filter(item => item.selectionStatus === "EXCLUDED");
  const recentVariantIds = [];
  const quests = accepted.map(item => makeQuest(item, recentVariantIds));
  const createdAt = new Date().toISOString();
  const metadata = { createdAt, source: "KTO EngService2", sourceMode, collectionMode: args.all ? "ALL_PAGES" : "LIMITED", inputCount: evaluated.length, autoAcceptedCount: accepted.length, reviewCount: review.length, excludedCount: excluded.length, apiKeyStored: false };
  const tourPlacesPath = resolve(args.outputDir, "tour-places.json");
  const acceptedPath = resolve(args.outputDir, "accepted-quests.json");
  const reviewPath = resolve(args.outputDir, "review-items.json");
  await writeJson(tourPlacesPath, { metadata, places: evaluated.map(tourPlaceRecord) });
  await writeJson(acceptedPath, { metadata, quests });
  await writeJson(reviewPath, { metadata, items: review.map(reviewRecord) });
  console.log(`AUTO_ACCEPTED ${accepted.length}, REVIEW ${review.length}, EXCLUDED ${excluded.length}`);
  console.log(`Saved tour places: ${tourPlacesPath}`);
  console.log(`Saved accepted quests: ${acceptedPath}`);
  console.log(`Saved review items: ${reviewPath}`);
}

main().catch(error => {
  console.error(`Pipeline failed: ${String(error?.message ?? error).replace(/serviceKey=[^&\s]+/gi, "serviceKey=[REDACTED]")}`);
  process.exitCode = 1;
});
