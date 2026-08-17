import { useQuery } from "@tanstack/react-query";
import { fetchPublicProfile } from "./publicProfile";

export function usePublicProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ["social", "publicProfile", userId],
    queryFn: () => fetchPublicProfile(userId!),
    enabled: Boolean(userId),
  });
}
