import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchDiscoverableProfiles, fetchXpLeaderboard, toggleFriend } from "./friends";

export function useDiscoverableProfiles() {
  return useQuery({
    queryKey: ["social", "discoverable"],
    queryFn: () => fetchDiscoverableProfiles(),
    staleTime: 30 * 1000,
  });
}

export function useXpLeaderboard() {
  return useQuery({ queryKey: ["social", "leaderboard"], queryFn: () => fetchXpLeaderboard(), staleTime: 60 * 1000 });
}

export function useToggleFriend() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (otherUserId: string) => toggleFriend(otherUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}
