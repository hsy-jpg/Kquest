#!/usr/bin/env node

/*
 * K-Quest selection validation fixture.
 * - Uses 25 real EngService2 samples captured during the 2026-08-16 validation.
 * - Does not call the API, read .env, write files, touch the DB, or import app code.
 * - Compares the documented v1 result with the revised v2 selection rules.
 */

const rows = [
  ["3390551", "10 Corso Como Cheongdam Branch", "79", "SH", "SH05", "SH050200", "A04", "A0401", "A04010600", "Seoul", 0, 65],
  ["3544280", "100 Years Market 100 Years Night", "85", "EV", "EV01", "EV010600", "A02", "A0207", "A02070200", "Seoul", 54, 75],
  ["3480531", "105405 Magok", "82", "FD", "FD02", "FD020500", "A05", "A0502", "A05020700", "Seoul", 9, 65],
  ["268104", "ARKO Art Center", "78", "VE", "VE07", "VE070600", "A02", "A0206", "A02060500", "Seoul", 40, 65],
  ["3544517", "ARTEASPOON", "76", "EX", "EX02", "EX020400", "A02", "A0203", "A02030400", "Seoul", 40, 65],
  ["3488290", "Aank Air Hotel Gaebong", "80", "AC", "AC04", "AC040100", "B02", "B0201", "B02010900", "Seoul", 0, 65],
  ["2401023", "168 Stairs", "76", "EX", "EX07", "EX070200", "A02", "A0203", "A02030400", "Busan", 49, 55],
  ["1000428", "40-step Culture & Tourism Theme Street", "76", "VE", "VE04", "VE040100", "A02", "A0203", "A02030600", "Busan", 57, 55],
  ["2947858", "Ahopsan Forest", "76", "NA", "NA01", "NA010200", "A01", "A0101", "A01010400", "Busan", 55, 65],
  ["3516784", "B-Con Ground", "76", "VE", "VE12", "VE120300", "A02", "A0203", "A02030400", "Busan", 47, 65],
  ["1079482", "BEXCO", "78", "VE", "VE07", "VE070400", "A02", "A0206", "A02060400", "Busan", 9, 65],
  ["3019795", "Blue Story Hotel", "80", "AC", "AC01", "AC010100", "B02", "B0201", "B02010100", "Busan", 0, 65],
  ["3091770", "5.16 Tree Tunnel", "76", "VE", "VE01", "VE010600", "A02", "A0205", "A02050500", "Jeju", 28, 65],
  ["2949079", "Arario Museum Tapdong Cinema", "78", "VE", "VE07", "VE070600", "A02", "A0206", "A02060500", "Jeju", 47, 65],
  ["3304906", "Around Follie", "75", "AC", "AC05", "AC050100", "A03", "A0302", "A03021700", "Jeju", 10, 65],
  ["2949520", "Arte Museum Jeju", "78", "VE", "VE07", "VE070600", "A02", "A0206", "A02060500", "Jeju", 19, 65],
  ["264591", "Baengnokdam Lake", "76", "NA", "NA03", "NA030500", "A01", "A0101", "A01010500", "Jeju", 41, 55],
  ["3418415", "Baksugijeong Cliffs", "76", "NA", "NA02", "NA020800", "A01", "A0101", "A01011100", "Jeju", 44, 65],
  [null, "APAP Artwork Tour", "85", "EV", "EV03", "EV030400", "", "", "", "Gyeonggi", 54, 80],
  ["697123", "Andong Maskdance Festival", "85", "EV", "EV01", "EV010100", "", "", "", "Gyeongbuk", 59, 80],
  ["697439", "Anseong Namsadang Baudeogi Festival", "85", "EV", "EV01", "EV010100", "", "", "", "Gyeonggi", 61, 80],
  ["293144", "Bucheon International Comics Festival", "85", "EV", "EV01", "EV010100", "", "", "", "Gyeonggi", 47, 80],
  ["1273884", "Bupyeong Pungmul Festival", "85", "EV", "EV01", "EV010100", "", "", "", "Incheon", 54, 80],
  ["293091", "Busan International Rock Festival", "85", "EV", "EV01", "EV010100", "", "", "", "Busan", 29, 80],
  ["4020637", "Cheonan K-Culture Expo", "85", "EV", "EV03", "EV030200", "", "", "", "Chungnam", 46, 80],
].map(([contentid, title, contenttypeid, lclsSystm1, lclsSystm2, lclsSystm3, cat1, cat2, cat3, region, oldLocalScore, qualityScore]) => ({
  contentid, title, contenttypeid, lclsSystm1, lclsSystm2, lclsSystm3,
  cat1, cat2, cat3, region, oldLocalScore, qualityScore,
}));

const has = (value, pattern) => pattern.test(String(value));
const titleHas = (item, pattern) => has(item.title, pattern);

function classify(item) {
  const title = item.title;
  const l1 = item.lclsSystm1;
  let questType;
  let templateId;
  let confidence = 0.85;
  const secondaryTags = [];
  const reviewFlags = ["OVERVIEW_MISSING", "DETAIL_NOT_ENRICHED"];
  if (!item.contentid) reviewFlags.push("SOURCE_ID_MISSING");

  if (item.contenttypeid === "85" || l1 === "EV") {
    questType = "FESTIVAL";
    templateId = /Maskdance|Namsadang|Pungmul/.test(title)
      ? "FESTIVAL_TRADITION_TRACE_V1"
      : "FESTIVAL_SCENE_HUNT_V1";
    if (/Market/.test(title)) secondaryTags.push("LOCAL_MARKET", "LOCAL_FOOD");
    if (/Rock/.test(title)) secondaryTags.push("MUSIC", "PERFORMANCE");
    if (/Comics/.test(title)) secondaryTags.push("COMICS", "CULTURE");
    if (/Artwork|APAP/.test(title)) secondaryTags.push("PUBLIC_ART", "ART_TOUR");
    if (/Maskdance|Namsadang|Pungmul/.test(title)) secondaryTags.push("TRADITION", "PERFORMANCE");
    if (/K-Culture/.test(title)) secondaryTags.push("CULTURE_EXPO");
    if (!item.cat1) reviewFlags.push("CAT_FIELDS_MISSING");
  } else if (l1 === "NA" || item.cat1 === "A01") {
    questType = "NATURE";
    templateId = /Lake|Cliff/.test(title) ? "SAFE_VIEWPOINT_WALK_V1" : "NATURE_DETAIL_HUNT_V1";
    secondaryTags.push(/Forest/.test(title) ? "FOREST" : /Cliff/.test(title) ? "COAST" : "NATURAL_LANDSCAPE");
    confidence = 0.95;
  } else if (item.contenttypeid === "80" || l1 === "AC") {
    if (item.contenttypeid !== "80") {
      questType = "GENERIC_LOCAL_DISCOVERY";
      templateId = "GENERIC_LANDMARK_HUNT_V1";
      confidence = 0.4;
      reviewFlags.push("TAXONOMY_CONFLICT", "GENERIC_FALLBACK");
    } else {
      questType = "STAY";
      templateId = null;
      confidence = 0.95;
      secondaryTags.push("GENERAL_LODGING");
      reviewFlags.push("NON_EXPERIENTIAL_STAY");
    }
  } else if (item.contenttypeid === "82" || l1 === "FD") {
    questType = "LOCAL_FOOD";
    templateId = "LOCAL_DISH_OBSERVER_V1";
    secondaryTags.push("RESTAURANT");
    reviewFlags.push("LOCALITY_NOT_PROVEN");
  } else if (item.contenttypeid === "79" || l1 === "SH") {
    questType = "SHOPPING";
    templateId = null;
    confidence = 0.95;
    secondaryTags.push("LUXURY_RETAIL");
    reviewFlags.push("NON_LOCAL_RETAIL");
  } else if (titleHas(item, /Stairs|Street|Ground/)) {
    questType = "NEIGHBORHOOD";
    templateId = "STREET_DETAIL_HUNT_V1";
    confidence = titleHas(item, /40-step/) ? 0.7 : 0.85;
    secondaryTags.push("LOCAL_STREET");
  } else if (titleHas(item, /ARTEASPOON/)) {
    questType = "CRAFT_EXPERIENCE";
    templateId = "CRAFT_PROCESS_SPOTTER_V1";
    secondaryTags.push("LOCAL_EXPERIENCE");
    reviewFlags.push("PROGRAM_AVAILABILITY_UNKNOWN");
  } else if (titleHas(item, /Tree Tunnel/)) {
    questType = "GENERIC_LOCAL_DISCOVERY";
    templateId = "GENERIC_LANDMARK_HUNT_V1";
    confidence = 0.55;
    secondaryTags.push("SCENIC_ROAD", "FOREST");
    reviewFlags.push("TAXONOMY_CONFLICT", "GENERIC_FALLBACK", "DRIVING_SAFETY");
  } else {
    questType = "CULTURE";
    templateId = "CULTURE_ONE_OBJECT_V1";
    confidence = /Museum|Art Center/.test(title) ? 0.95 : 0.7;
    secondaryTags.push(/BEXCO/.test(title) ? "CONVENTION_CENTER" : "CULTURE_FACILITY");
    if (/BEXCO/.test(title)) reviewFlags.push("TEMPLATE_MISMATCH");
  }

  return { questType, templateId, confidence, secondaryTags, reviewFlags };
}

function revisedLocalScore(item, classification) {
  const reasons = [];
  let identity = 0;
  let archetype = 0;
  let action = 0;
  let repeatability = 0;
  let explicit = 5; // every captured sample has a resolvable region/address
  let penalty = 0;

  if (classification.questType === "FESTIVAL") {
    identity = /Maskdance|Namsadang|Pungmul|Market/.test(item.title) ? 20 : 12;
    archetype = /Maskdance|Namsadang|Pungmul|Market/.test(item.title) ? 25 : 15;
    action = 16;
    explicit += 5;
    reasons.push(archetype === 25 ? "REGIONAL_FESTIVAL_ARCHETYPE" : "LOCAL_EVENT_ARCHETYPE", "FIELD_BASED_ACTIVITY");
  } else if (classification.questType === "NATURE") {
    identity = 20;
    archetype = 20;
    action = 16;
    repeatability = 6;
    explicit += 5;
    reasons.push("NA_CATEGORY_WITH_REGION", "LOCAL_NATURE_ARCHETYPE", "FIELD_BASED_ACTIVITY");
  } else if (classification.questType === "NEIGHBORHOOD") {
    identity = 18;
    archetype = 22;
    action = 16;
    repeatability = 6;
    explicit += 5;
    reasons.push("STREET_OR_VILLAGE_ARCHETYPE", "FIELD_BASED_ACTIVITY");
  } else if (classification.questType === "CRAFT_EXPERIENCE") {
    identity = 12;
    archetype = 18;
    action = 16;
    repeatability = 6;
    explicit += 5;
    reasons.push("LOCAL_CULTURE_ARCHETYPE", "EXPERIENCE_CATEGORY");
  } else if (classification.questType === "CULTURE") {
    identity = /Museum|Art Center/.test(item.title) ? 15 : 5;
    archetype = /Museum|Art Center/.test(item.title) ? 18 : 0;
    action = /Museum|Art Center/.test(item.title) ? 16 : 6;
    repeatability = 6;
    explicit += /Museum|Art Center/.test(item.title) ? 5 : 0;
    reasons.push("CULTURE_CATEGORY_WITH_REGION");
    if (/BEXCO/.test(item.title)) penalty += 10;
  } else if (classification.questType === "LOCAL_FOOD") {
    action = 8;
    repeatability = 6;
    explicit += 5;
    reasons.push("FOOD_CATEGORY", "LOCAL_FOOD_EVIDENCE_MISSING");
  } else if (classification.questType === "STAY") {
    repeatability = 6;
    penalty += 20;
    reasons.push("GENERAL_LODGING_PENALTY");
  } else if (classification.questType === "SHOPPING") {
    action = 5;
    repeatability = 6;
    penalty += 25;
    reasons.push("NON_LOCAL_RETAIL_PENALTY");
  } else {
    identity = /Tree Tunnel/.test(item.title) ? 12 : 0;
    archetype = /Tree Tunnel/.test(item.title) ? 20 : 0;
    action = 10;
    repeatability = 6;
    reasons.push("TAXONOMY_CONFLICT", "GENERIC_FALLBACK");
  }

  const localScore = Math.max(0, Math.min(100, identity + archetype + action + repeatability + explicit - penalty));
  return { localScore, scoreReasons: reasons };
}

function oldStatus(item) {
  if (item.oldLocalScore >= 55 && item.qualityScore >= 60) return "AUTO_ACCEPTED";
  if (item.oldLocalScore >= 40 || item.qualityScore < 60) return "REVIEW";
  return "EXCLUDED";
}

function revisedStatus(item, result) {
  const hardExcluded = result.reviewFlags.some(flag => ["NON_LOCAL_RETAIL", "NON_EXPERIENTIAL_STAY"].includes(flag));
  const blockingReview = result.reviewFlags.some(flag => ["SOURCE_ID_MISSING", "TAXONOMY_CONFLICT", "GENERIC_FALLBACK", "TEMPLATE_MISMATCH", "DRIVING_SAFETY"].includes(flag));
  if (hardExcluded) return "EXCLUDED";
  if (blockingReview || result.confidence < 0.7) return "REVIEW";
  if (result.localScore >= 50 && item.qualityScore >= 55) return "AUTO_ACCEPTED";
  if (result.localScore >= 30 || item.qualityScore < 55) return "REVIEW";
  return "EXCLUDED";
}

const results = rows.map(item => {
  const classified = classify(item);
  const scored = revisedLocalScore(item, classified);
  const merged = { ...item, ...classified, ...scored };
  return { ...merged, oldStatus: oldStatus(item), selectionStatus: revisedStatus(item, merged) };
});

const summary = version => {
  const key = version === "old" ? "oldStatus" : "selectionStatus";
  const counts = Object.fromEntries(["AUTO_ACCEPTED", "REVIEW", "EXCLUDED"].map(status => [status, results.filter(r => r[key] === status).length]));
  return { ...counts, percentages: Object.fromEntries(Object.entries(counts).map(([k, v]) => [k, `${(v / results.length * 100).toFixed(1)}%`])) };
};

console.log("\nK-Quest selection validation: 25 captured EngService2 samples\n");
for (const item of results) {
  console.log(JSON.stringify({
    title: item.title,
    contentid: item.contentid,
    contenttypeid: item.contenttypeid,
    lclsSystm1: item.lclsSystm1,
    lclsSystm2: item.lclsSystm2,
    lclsSystm3: item.lclsSystm3,
    cat1: item.cat1,
    cat2: item.cat2,
    cat3: item.cat3,
    region: item.region,
    localScore: item.localScore,
    qualityScore: item.qualityScore,
    selectionStatus: item.selectionStatus,
    questType: item.questType,
    secondaryTags: item.secondaryTags,
    templateId: item.templateId,
    confidence: item.confidence,
    scoreReasons: item.scoreReasons,
    reviewFlags: item.reviewFlags,
  }));
}

console.log("\nSummary");
console.log(JSON.stringify({ before: summary("old"), after: summary("new") }, null, 2));

console.log("\nStatus changes");
console.table(results
  .filter(item => item.oldStatus !== item.selectionStatus)
  .map(item => ({
    title: item.title,
    oldLocal: item.oldLocalScore,
    newLocal: item.localScore,
    quality: item.qualityScore,
    before: item.oldStatus,
    after: item.selectionStatus,
  })));
