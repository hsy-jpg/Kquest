import { supabase } from "@/integrations/supabase/client";
import { ensureMvpUser } from "./questCompletion";

export async function recordQuestView(questId: string): Promise<boolean> {
  await ensureMvpUser();
  const { data, error } = await supabase.rpc("record_quest_view", { p_quest_id: questId });
  if (error || !data?.[0]) throw new Error(`Quest view save failed: ${error?.message ?? "No result returned"}`);
  return data[0].recorded;
}
