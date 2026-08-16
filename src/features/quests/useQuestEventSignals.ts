import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { QuestEventSignal } from "./forYouRecommendations";

async function fetchMyQuestEventSignals(): Promise<QuestEventSignal[]> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (!sessionData.session) return [];
  const { data, error } = await supabase.from("quest_events").select("quest_id,event_type,created_at").order("created_at", { ascending: false });
  if (error) throw error;
  return data as QuestEventSignal[];
}

export function useQuestEventSignals() {
  return useQuery({
    queryKey: ["quest-events", "mine"],
    queryFn: fetchMyQuestEventSignals,
    staleTime: 0,
  });
}
