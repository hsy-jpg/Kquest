import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CreateJournalEntryInput,
  createJournalEntry,
  fetchComments,
  fetchJournalEntriesByUser,
  fetchJournalEntry,
  fetchJournalFeed,
  fetchMyJournalEntries,
  postComment,
  toggleJournalLike,
} from "./journalEntries";

export const journalQueryKeys = {
  mine: ["journal", "mine"] as const,
  feed: ["journal", "feed"] as const,
  entry: (id: string) => ["journal", "entry", id] as const,
  byUser: (userId: string) => ["journal", "byUser", userId] as const,
  comments: (entryId: string) => ["journal", "comments", entryId] as const,
};

export function useMyJournalEntries() {
  return useQuery({ queryKey: journalQueryKeys.mine, queryFn: fetchMyJournalEntries, staleTime: 30 * 1000 });
}

export function useJournalFeed() {
  return useQuery({ queryKey: journalQueryKeys.feed, queryFn: () => fetchJournalFeed(), staleTime: 30 * 1000 });
}

export function useJournalEntry(id: string | undefined) {
  return useQuery({
    queryKey: journalQueryKeys.entry(id ?? ""),
    queryFn: () => fetchJournalEntry(id!),
    enabled: Boolean(id),
  });
}

export function useCreateJournalEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateJournalEntryInput) => createJournalEntry(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

export function useToggleJournalLike() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entryId: string) => toggleJournalLike(entryId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["journal"] }),
  });
}

export function useJournalEntriesByUser(userId: string | undefined) {
  return useQuery({
    queryKey: journalQueryKeys.byUser(userId ?? ""),
    queryFn: () => fetchJournalEntriesByUser(userId!),
    enabled: Boolean(userId),
  });
}

export function useComments(entryId: string | undefined) {
  return useQuery({
    queryKey: journalQueryKeys.comments(entryId ?? ""),
    queryFn: () => fetchComments(entryId!),
    enabled: Boolean(entryId),
  });
}

export function useAddComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ entryId, content }: { entryId: string; content: string }) => postComment(entryId, content),
    onSuccess: (_data, { entryId }) => {
      queryClient.invalidateQueries({ queryKey: journalQueryKeys.comments(entryId) });
      queryClient.invalidateQueries({ queryKey: ["journal"] });
    },
  });
}
