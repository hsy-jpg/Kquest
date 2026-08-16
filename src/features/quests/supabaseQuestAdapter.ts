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
  } | null;
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

const CATEGORY_BY_TYPE: Record<string, Quest["category"]> = {
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
  };
}
