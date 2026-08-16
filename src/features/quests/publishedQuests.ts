import { supabase } from "@/integrations/supabase/client";
import {
  adaptPublishedQuest,
  type PublishedQuestRecord,
  type SupabaseQuestCard,
} from "./supabaseQuestAdapter";

const PUBLISHED_QUEST_SELECT = `
  id,
  quest_id,
  source_content_id,
  title,
  description,
  quest_type,
  secondary_tags,
  template_id,
  steps,
  classification_confidence,
  region,
  district,
  latitude,
  longitude,
  image,
  status,
  source_modified_time,
  created_at,
  published_at,
  proof_type,
  proof_requirement,
  completion_rule,
  tour_places!quests_source_content_id_fkey (
    title,
    description,
    content_type,
    local_score,
    quality_score,
    selection_status
  )
`;

export async function fetchPublishedQuests(): Promise<SupabaseQuestCard[]> {
  const { data, error } = await supabase
    .from("quests")
    .select(PUBLISHED_QUEST_SELECT)
    .eq("status", "PUBLISHED")
    .order("published_at", { ascending: false });

  if (error) throw new Error(`Failed to load published quests: ${error.message}`);

  return (data as unknown as PublishedQuestRecord[]).map(adaptPublishedQuest);
}

export async function fetchPublishedQuest(routeId: string): Promise<SupabaseQuestCard | null> {
  const isSourceContentId = /^\d+$/.test(routeId);
  let query = supabase
    .from("quests")
    .select(PUBLISHED_QUEST_SELECT)
    .eq("status", "PUBLISHED");

  query = isSourceContentId
    ? query.eq("source_content_id", routeId)
    : query.eq("quest_id", routeId);

  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(`Failed to load published quest: ${error.message}`);
  return data ? adaptPublishedQuest(data as unknown as PublishedQuestRecord) : null;
}
