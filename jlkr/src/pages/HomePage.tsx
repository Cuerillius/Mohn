import { useState, useEffect } from 'react';
import Hero from '../components/Hero';
import ContentRow from '../components/ContentRow';
import { getTrending, getPopularMovies, getPopularTV, getNowPlaying, getMovie, getTV } from '../services/tmdb';
import { apiGet } from '../services/api';
import { useProfile } from '../context/ProfileContext';
import type { TMDBItem } from '../types/tmdb';

interface WatchlistEntry {
  id: string;
  mediaId: string;
  mediaType: string;
}

export default function HomePage() {
  const { profile } = useProfile();
  const [heroItems, setHeroItems] = useState<TMDBItem[]>([]);
  const [trending, setTrending] = useState<TMDBItem[]>([]);
  const [movies, setMovies] = useState<TMDBItem[]>([]);
  const [tv, setTv] = useState<TMDBItem[]>([]);
  const [nowPlaying, setNowPlaying] = useState<TMDBItem[]>([]);
  const [myList, setMyList] = useState<TMDBItem[]>([]);

  useEffect(() => {
    getTrending().then(items => {
      setHeroItems(items.slice(0, 5));
      setTrending(items);
    }).catch(console.error);
    getPopularMovies().then(setMovies).catch(console.error);
    getPopularTV().then(setTv).catch(console.error);
    getNowPlaying().then(setNowPlaying).catch(console.error);
  }, []);

  useEffect(() => {
    if (!profile) { setMyList([]); return; }
    let cancelled = false;
    apiGet<WatchlistEntry[]>(`/api/profiles/${profile.id}/watchlist`)
      .then(entries =>
        Promise.all(
          entries.map(e =>
            e.mediaType === 'movie'
              ? getMovie(Number(e.mediaId)).then(m => ({ ...m, media_type: 'movie' as const }))
              : getTV(Number(e.mediaId)).then(t => ({ ...t, media_type: 'tv' as const }))
          )
        )
      )
      .then(items => { if (!cancelled) setMyList(items); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [profile]);

  return (
    <>
      <Hero items={heroItems} />
      <div className="pt-2 pb-10">
        {myList.length > 0 && <ContentRow title="My List" items={myList} />}
        <ContentRow title="Trending this week" items={trending} />
        <ContentRow title="Popular Movies" items={movies} />
        <ContentRow title="Popular Series" items={tv} />
        <ContentRow title="New Arrivals" items={nowPlaying} />
      </div>
    </>
  );
}
