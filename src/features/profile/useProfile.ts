import { useQuery } from "@tanstack/react-query";
import { fetchMyProofPhotos, fetchProfileData } from "./profileStats";

export const profileQueryKey = ["profile"] as const;

export function useProfile() {
  return useQuery({
    queryKey: profileQueryKey,
    queryFn: fetchProfileData,
    staleTime: 30 * 1000,
  });
}

export function useMyPhotos() {
  return useQuery({
    queryKey: ["profile", "photos"],
    queryFn: fetchMyProofPhotos,
    staleTime: 30 * 1000,
  });
}
