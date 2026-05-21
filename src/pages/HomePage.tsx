import { useState, useEffect } from 'react';
import Hero from '../components/Hero';
import ContentRow from '../components/ContentRow';
import { getTrending, getPopularMovies, getPopularTV, getNowPlaying } from '../services/tmdb';
import type { TMDBItem } from '../types/tmdb';

export default function HomePage() {
  const [heroItems, setHeroItems] = useState<TMDBItem[]>([]);
  const [trending, setTrending] = useState<TMDBItem[]>([]);
  const [movies, setMovies] = useState<TMDBItem[]>([]);
  const [tv, setTv] = useState<TMDBItem[]>([]);
  const [nowPlaying, setNowPlaying] = useState<TMDBItem[]>([]);

  useEffect(() => {
    getTrending().then(items => {
      setHeroItems(items.slice(0, 5));
      setTrending(items);
    }).catch(console.error);
    getPopularMovies().then(setMovies).catch(console.error);
    getPopularTV().then(setTv).catch(console.error);
    getNowPlaying().then(setNowPlaying).catch(console.error);
  }, []);

  return (
    <>
      <Hero items={heroItems} />
      <div className="rows">
        <ContentRow title="Trending this week" items={trending} />
        <ContentRow title="Popular Movies" items={movies} />
        <ContentRow title="Popular Series" items={tv} />
        <ContentRow title="New Arrivals" items={nowPlaying} />
      </div>
    </>
  );
}
