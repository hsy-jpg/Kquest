import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchGroupInfo, fetchGroupMessages, fetchGroups, fetchMyGroups, joinGroup, leaveGroup, sendGroupMessage } from "./groups";

const groupMessagesKey = (groupId: string | undefined) => ["groups", "messages", groupId] as const;

export function useGroups() {
  return useQuery({ queryKey: ["groups", "all"], queryFn: fetchGroups, staleTime: 30 * 1000 });
}

export function useMyGroups() {
  return useQuery({ queryKey: ["groups", "mine"], queryFn: fetchMyGroups, staleTime: 30 * 1000 });
}

export function useGroupInfo(groupId: string | undefined) {
  return useQuery({
    queryKey: ["groups", "info", groupId],
    queryFn: () => fetchGroupInfo(groupId!),
    enabled: Boolean(groupId),
    staleTime: 30 * 1000,
  });
}

export function useJoinGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (groupId: string) => joinGroup(groupId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["groups"] }),
  });
}

export function useLeaveGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (groupId: string) => leaveGroup(groupId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["groups"] }),
  });
}

export function useGroupMessages(groupId: string | undefined) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: groupMessagesKey(groupId),
    queryFn: () => fetchGroupMessages(groupId!),
    enabled: Boolean(groupId),
  });

  useEffect(() => {
    if (!groupId) return;
    const channel = supabase
      .channel(`group-messages-${groupId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "group_messages", filter: `group_id=eq.${groupId}` },
        () => queryClient.invalidateQueries({ queryKey: groupMessagesKey(groupId) }),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, queryClient]);

  return query;
}

export function useSendGroupMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, content }: { groupId: string; content: string }) => sendGroupMessage(groupId, content),
    onSuccess: (_data, { groupId }) => queryClient.invalidateQueries({ queryKey: groupMessagesKey(groupId) }),
  });
}
