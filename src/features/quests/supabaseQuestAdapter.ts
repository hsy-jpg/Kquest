import type { Quest, QuestStep } from "@/data/quests";

export interface SupabaseQuestStep {
  order: number;
  kind: "VISIT" | "EXPLORE" | "PHOTO" | "ACTION" | string;
  prompt: string;
  verification?: string;
}

export interface PublishedQuestRecord {
  id: string;
  quest_id: string;
  source_content_id: string;
  title: string;
  description: string | null;
  quest_type: string;
  secondary_tags: string[];
  template_id: string;
  steps: unknown;
  classification_confidence: number;
  region: string;
  district: string | null;
  latitude: number | null;
  longitude: number | null;
  image: string | null;
  status: string;
  source_modified_time: string | null;
  created_at: string;
  published_at: string | null;
  proof_type?: "PHOTO" | "TEXT" | "CHOICE" | "CHECK" | "NONE" | null;
  proof_requirement?: string | null;
  completion_rule?: unknown;
  tour_places: {
    title: string;
    description: string | null;
    content_type: string;
    local_score: number;
    quality_score: number;
    selection_status: string;
    detail_data?: unknown;
  } | null;
}

export interface QuestExperienceDetails {
  about: string;
  tips: string[];
  budget: string;
  hours: string;
  restDate: string;
  parking: string;
  operatingGuide: string;
  address: string;
  homepage: string | null;
  telephone: string | null;
  googleMapUrl: string;
  naverMapUrl: string;
  kakaoMapUrl: string;
}

export interface SupabaseQuestCard extends Quest {
  databaseId: string;
  questId: string;
  sourceContentId: string;
  questType: string;
  secondaryTags: string[];
  templateId: string;
  classificationConfidence: number;
  latitude: number | null;
  longitude: number | null;
  sourceModifiedTime: string | null;
  region: string;
  district: string | null;
  createdAt: string;
  publishedAt: string | null;
  localScore: number;
  qualityScore: number;
  actionTypes: ActionType[];
  difficultyCode: "EASY" | "MEDIUM" | "CHALLENGE";
  durationMinutes: number;
  proofType: "PHOTO" | "TEXT" | "CHOICE" | "CHECK" | "NONE";
  proofRequirement: string | null;
  completionRule: {
    requiredStepOrders: number[];
    minimumCompletedSteps: number;
    proofRequired: boolean;
    proofType: "PHOTO" | "TEXT" | "CHOICE" | "CHECK" | "NONE";
  };
  season: ("ALL" | "SPRING" | "SUMMER" | "FALL" | "WINTER")[];
  recommendedTimes: ("ANYTIME" | "MORNING" | "AFTERNOON" | "SUNSET" | "EVENING" | "NIGHT")[];
  constraint: {
    summary: string;
    rules: string[];
  };
  userChoice: {
    required: boolean;
    prompt: string;
    responseType: "TEXT" | "CHOICE" | "CHECK";
    options: string[] | null;
  } | null;
  availability: {
    startAt: string | null;
    endAt: string | null;
  } | null;
  experienceDetails: QuestExperienceDetails;
}

export type ActionType =
  | "TRY"
  | "FIND"
  | "CHOOSE"
  | "COMPARE"
  | "CAPTURE"
  | "COLLECT"
  | "CREATE"
  | "INTERACT"
  | "NOTICE"
  | "WALK"
  | "TASTE"
  | "TIME";

export const CATEGORY_BY_TYPE: Record<string, Quest["category"]> = {
  LOCAL_FOOD: "Food",
  MARKET: "Shopping",
  SHOPPING: "Shopping",
  NATURE: "Nature",
  FESTIVAL: "Festival",
  NIGHTLIFE: "Nightlife",
  CULTURE: "Culture",
  CULTURAL_HERITAGE: "Culture",
  CRAFT_EXPERIENCE: "Culture",
  NEIGHBORHOOD: "Culture",
  GENERIC_LOCAL_DISCOVERY: "Culture",
};

const CATEGORY_EMOJI: Record<Quest["category"], string> = {
  Food: "🍜",
  Culture: "🏛️",
  Nature: "🌿",
  Nightlife: "🌙",
  Shopping: "🛍️",
  Festival: "🎉",
};

const STEP_META: Record<string, Pick<QuestStep, "title" | "emoji" | "type">> = {
  VISIT: { title: "Visit the place", emoji: "📍", type: "location" },
  EXPLORE: { title: "Explore closely", emoji: "🔎", type: "action" },
  PHOTO: { title: "Capture the moment", emoji: "📸", type: "photo" },
  ACTION: { title: "Complete the mission", emoji: "✅", type: "action" },
};

function parseSteps(value: unknown): SupabaseQuestStep[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((step): step is SupabaseQuestStep =>
      Boolean(step) && typeof step === "object" && typeof step.prompt === "string",
    )
    .sort((a, b) => Number(a.order) - Number(b.order));
}

function numericCardId(sourceContentId: string, questId: string): number {
  const sourceId = Number(sourceContentId);
  if (Number.isSafeInteger(sourceId) && sourceId >= 0) return sourceId;

  let hash = 0;
  for (const character of questId) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return hash;
}

function summary(description: string): string {
  const firstSentence = description.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim() ?? description;
  return firstSentence.length <= 96 ? firstSentence : `${firstSentence.slice(0, 93).trim()}...`;
}

function deriveActionTypes(steps: SupabaseQuestStep[]): ActionType[] {
  const actions = new Set<ActionType>();
  for (const step of steps) {
    const prompt = step.prompt.toLowerCase();
    if (step.kind === "EXPLORE") actions.add("FIND");
    if (step.kind === "PHOTO") actions.add("CAPTURE");
    if (step.kind === "ACTION") actions.add("NOTICE");
    if (/choose|pick|select|favorite|favourite/.test(prompt)) actions.add("CHOOSE");
    if (/compare|difference|different/.test(prompt)) actions.add("COMPARE");
    if (/walk|route|trail|path/.test(prompt)) actions.add("WALK");
    if (/collect|three|3 |two|2 /.test(prompt)) actions.add("COLLECT");
    if (/create|make|build|combine/.test(prompt)) actions.add("CREATE");
    if (/taste|flavor|flavour|try a food|try the food/.test(prompt)) actions.add("TASTE");
    if (/sunset|morning|evening|night|time/.test(prompt)) actions.add("TIME");
  }
  return [...actions];
}

function isCompletionRule(value: unknown): value is SupabaseQuestCard["completionRule"] {
  if (!value || typeof value !== "object") return false;
  const rule = value as Record<string, unknown>;
  return Array.isArray(rule.requiredStepOrders)
    && typeof rule.minimumCompletedSteps === "number"
    && typeof rule.proofRequired === "boolean"
    && typeof rule.proofType === "string";
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function textValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function deriveExperienceDetails(record: PublishedQuestRecord, description: string, category: Quest["category"]): QuestExperienceDetails {
  const detail = objectValue(record.tour_places?.detail_data);
  const operating = objectValue(detail.operating);
  const experience = objectValue(detail.experience);
  const event = objectValue(detail.event);
  const detailInfo = Array.isArray(detail.detailInfo) ? detail.detailInfo.map(objectValue) : [];
  const findInfo = (pattern: RegExp) => detailInfo
    .map((item) => ({ name: textValue(item.name) ?? "", text: textValue(item.text) ?? "" }))
    .find((item) => pattern.test(`${item.name} ${item.text}`))?.text ?? null;
  const address = textValue(detail.address) ?? [record.district, record.region].filter(Boolean).join(", ");
  const useTime = textValue(operating.useTime) ?? findInfo(/hours|opening|use time|operating/i);
  const eventPeriod = [textValue(event.startDate), textValue(event.endDate)].filter(Boolean).join(" – ");
  const restDate = textValue(operating.restDate) ?? findInfo(/closed|rest day|holiday/i);
  const parking = textValue(operating.parking) ?? findInfo(/parking/i);
  const budget = findInfo(/admission|entrance fee|fee|price|charge|cost/i);
  const program = textValue(experience.program) ?? textValue(experience.guide) ?? findInfo(/program|experience|tour guide/i);
  const tipsByCategory: Record<Quest["category"], string> = {
    Food: "Check prices before ordering and ask about ingredients if you have dietary restrictions.",
    Shopping: "Bring a reusable bag and confirm payment methods before purchasing.",
    Nature: "Stay on marked public paths and check weather conditions before setting out.",
    Festival: "Check the official event schedule and arrive early for popular programs.",
    Nightlife: "Check the last public-transport departure time and drink responsibly.",
    Culture: "Respect posted photography rules and keep voices low inside exhibition spaces.",
  };
  const tips = [
    tipsByCategory[category],
    restDate ? `Check the closing information before visiting: ${restDate}` : "Operating hours can change; check the official homepage before visiting.",
    parking ? `Parking information: ${parking}` : "Parking information is unavailable, so public transportation is recommended when possible.",
  ];
  const mapQuery = encodeURIComponent(address || record.title);
  const googleMapQuery = encodeURIComponent(
    record.latitude !== null && record.longitude !== null
      ? `${record.latitude},${record.longitude}`
      : address || record.title,
  );
  return {
    about: description,
    tips,
    budget: budget ?? "Admission or activity fees were not provided by TourAPI. Check the official homepage before visiting.",
    hours: (useTime ?? eventPeriod) || "Operating hours were not provided by TourAPI. Check before visiting.",
    restDate: restDate ?? "No regular closing-day information was provided.",
    parking: parking ?? "No parking information was provided; public transportation is recommended when possible.",
    operatingGuide: program ?? "Follow on-site notices and staff guidance for available programs and access.",
    address: address || record.region,
    homepage: textValue(detail.homepage),
    telephone: textValue(detail.tel) ?? textValue(operating.informationCenter),
    googleMapUrl: `https://www.google.com/maps/search/?api=1&query=${googleMapQuery}`,
    naverMapUrl: `https://map.naver.com/p/search/${mapQuery}`,
    kakaoMapUrl: `https://map.kakao.com/link/search/${mapQuery}`,
  };
}

export function adaptPublishedQuest(record: PublishedQuestRecord): SupabaseQuestCard {
  const description = record.description ?? record.tour_places?.description ?? "Explore this local place in Korea.";
  const category = CATEGORY_BY_TYPE[record.quest_type] ?? "Culture";
  const sourceSteps = parseSteps(record.steps);
  const actionTypes = deriveActionTypes(sourceSteps);
  const steps: QuestStep[] = sourceSteps.map((step, index) => {
    const meta = STEP_META[step.kind] ?? STEP_META.ACTION;
    return { id: index + 1, title: meta.title, description: step.prompt, emoji: meta.emoji, type: meta.type };
  });
  const mission = sourceSteps.at(-1)?.prompt ?? description;
  const place = [record.district, record.region].filter(Boolean).join(", ");
  const localScore = record.tour_places?.local_score ?? 70;
  const difficultyCode = actionTypes.length <= 1 ? "EASY" : actionTypes.length <= 3 ? "MEDIUM" : "CHALLENGE";
  const durationMinutes = Math.min(60, Math.max(5, sourceSteps.length * 5));
  const photoStep = sourceSteps.find((step) => step.kind === "PHOTO");
  const textStep = sourceSteps.find((step) => step.verification === "TEXT_OR_CHOICE");
  const proofType = record.proof_type ?? (photoStep ? "PHOTO" : textStep ? "TEXT" : "CHECK");
  const derivedCompletionRule: SupabaseQuestCard["completionRule"] = {
    requiredStepOrders: sourceSteps.map((step) => Number(step.order)),
    minimumCompletedSteps: sourceSteps.length,
    proofRequired: proofType !== "NONE",
    proofType,
  };
  const choiceStep = sourceSteps.find((step) =>
    step.kind === "ACTION" && /choose|pick|select|record/i.test(step.prompt),
  );
  const experienceDetails = deriveExperienceDetails(record, description, category);

  return {
    databaseId: record.id,
    id: numericCardId(record.source_content_id, record.quest_id),
    title: record.title,
    subtitle: summary(description),
    xp: Math.round((80 + localScore * 0.7) / 10) * 10,
    emoji: CATEGORY_EMOJI[category],
    image: record.image ?? "",
    category,
    difficulty: difficultyCode === "EASY" ? "Easy" : difficultyCode === "MEDIUM" ? "Medium" : "Hard",
    time: `${durationMinutes} min`,
    distance: "On-site",
    location: place || record.region,
    story: description,
    description,
    mission,
    steps,
    questId: record.quest_id,
    sourceContentId: record.source_content_id,
    questType: record.quest_type,
    secondaryTags: record.secondary_tags,
    templateId: record.template_id,
    classificationConfidence: record.classification_confidence,
    latitude: record.latitude,
    longitude: record.longitude,
    sourceModifiedTime: record.source_modified_time,
    region: record.region,
    district: record.district,
    createdAt: record.created_at,
    publishedAt: record.published_at,
    localScore,
    qualityScore: record.tour_places?.quality_score ?? 0,
    actionTypes,
    difficultyCode,
    durationMinutes,
    proofType,
    proofRequirement: record.proof_requirement ?? photoStep?.prompt ?? textStep?.prompt ?? null,
    completionRule: isCompletionRule(record.completion_rule) ? record.completion_rule : derivedCompletionRule,
    season: ["ALL"],
    recommendedTimes: ["ANYTIME"],
    constraint: {
      summary: "Complete the steps only in public, permitted areas.",
      rules: ["Respect posted access and photography rules.", "Do not photograph people without consent."],
    },
    userChoice: choiceStep
      ? { required: true, prompt: choiceStep.prompt, responseType: "TEXT", options: null }
      : null,
    availability: null,
    experienceDetails,
  };
}
