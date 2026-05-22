import { useState, useEffect } from 'react';
import { useProfile } from '../context/ProfileContext';
import { apiGet, apiPost, apiDelete } from '../services/api';

interface WatchlistEntry {
  id: string;
  mediaId: string;
  mediaType: string;
}

export function useWatchlist(mediaId: number | string, mediaType: 'movie' | 'tv') {
  const { profile } = useProfile();
  const [inList, setInList] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    apiGet<WatchlistEntry[]>(`/api/profiles/${profile.id}/watchlist`)
      .then(list => {
        if (!cancelled) setInList(list.some(e => e.mediaId === String(mediaId)));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [profile, mediaId]);

  const toggle = async () => {
    if (!profile || loading) return;
    setLoading(true);
    try {
      if (inList) {
        await apiDelete(`/api/profiles/${profile.id}/watchlist/${mediaId}`);
        setInList(false);
      } else {
        await apiPost(`/api/profiles/${profile.id}/watchlist`, {
          mediaId: String(mediaId),
          mediaType,
        });
        setInList(true);
      }
    } catch {
      // silently fail — don't reset state
    } finally {
      setLoading(false);
    }
  };

  return { inList, toggle, loading };
}
