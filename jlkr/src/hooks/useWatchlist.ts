import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useProfile } from "../context/ProfileContext";
import { apiGet, apiPost, apiDelete } from "../services/api";
import { keys } from "../lib/queryKeys";

interface WatchlistEntry {
  id: string;
  mediaId: string;
  mediaType: string;
}

export function useWatchlist(
  mediaId: number | string,
  mediaType: "movie" | "tv",
) {
  const { profile } = useProfile();
  const queryClient = useQueryClient();

  const { data: list = [] } = useQuery({
    queryKey: keys.watchlist(profile?.id ?? ""),
    queryFn: () =>
      apiGet<WatchlistEntry[]>(
        `/api/profiles/${profile!.id}/watchlist`,
      ),
    enabled: !!profile,
    staleTime: 60 * 1000,
  });

  const inList = list.some((e) => e.mediaId === String(mediaId));

  const { mutate: toggle, isPending: loading } = useMutation({
    mutationFn: async () => {
      if (!profile) return;
      if (inList) {
        await apiDelete(`/api/profiles/${profile.id}/watchlist/${mediaId}`);
      } else {
        await apiPost(`/api/profiles/${profile.id}/watchlist`, {
          mediaId: String(mediaId),
          mediaType,
        });
      }
    },
    onSuccess: () => {
      if (profile) {
        queryClient.invalidateQueries({
          queryKey: keys.watchlist(profile.id),
        });
      }
    },
  });

  return { inList, toggle, loading };
}
