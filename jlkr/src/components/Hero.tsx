import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  itemTitle,
  itemYear,
  formatRuntime,
  getLogoUrl,
} from "../services/tmdb";
import type { TMDBMovieDetail, TMDBTVDetail } from "../types/tmdb";
import { ChevronLeft, ChevronRight, Info } from "lucide-react";
import MediaHero from "./MediaHero";
import { useWatchlist } from "../hooks/useWatchlist";

const DURATION = 5500;

function HeroSlide({ item }: { item: TMDBMovieDetail | TMDBTVDetail }) {
  const navigate = useNavigate();
  const isMovie = item.media_type === "movie";
  const movie = isMovie ? (item as TMDBMovieDetail) : null;
  const tv = !isMovie ? (item as TMDBTVDetail) : null;
  const path = `/${item.media_type}/${item.id}`;
  const { inList, toggle } = useWatchlist(String(item.id), item.media_type as "movie" | "tv");

  const metaExtra = movie?.runtime
    ? formatRuntime(movie.runtime)
    : tv?.number_of_seasons
      ? `${tv.number_of_seasons} season${tv.number_of_seasons !== 1 ? "s" : ""}`
      : undefined;

  return (
    <MediaHero
      backdropPath={item.backdrop_path}
      title={itemTitle(item)}
      logoUrl={getLogoUrl(item.images)}
      year={itemYear(item)}
      metaExtra={metaExtra}
      rating={item.vote_average}
      genre={item.genres?.[0]?.name}
      overview={item.overview}
      onPlay={() => navigate(isMovie ? `/play${path}` : `/play/tv/${item.id}/1/1`)}
      inWatchlist={inList}
      onToggleWatchlist={toggle}
      extraActions={
        <button
          onClick={() => navigate(path)}
          className="inline-flex items-center gap-2 bg-white/10 text-white text-sm font-normal py-2.5 px-5 rounded-lg hover:bg-white/15 transition-colors backdrop-blur-sm border border-white/10"
        >
          <Info size={14} />
          More info
        </button>
      }
      fullHeight={false}
      className="shrink-0 w-full"
    />
  );
}

interface Props {
  items: Array<TMDBMovieDetail | TMDBTVDetail>;
}

export default function Hero({ items }: Props) {
  const navigate = useNavigate();
  const [heroIdx, setHeroIdx] = useState(0);
  const heroIdxRef = useRef(0);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef(0);

  const goTo = useCallback(
    (idx: number) => {
      const len = items.length;
      if (!len) return;
      const n = ((idx % len) + len) % len;
      heroIdxRef.current = n;
      setHeroIdx(n);
      startRef.current = performance.now();
    },
    [items.length],
  );

  useEffect(() => {
    if (!items.length) return;
    startRef.current = null;
    const tick = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      if (ts - startRef.current >= DURATION) goTo(heroIdxRef.current + 1);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [items.length, goTo]);

  if (!items.length)
    return <div className="relative w-full overflow-hidden h-[80vh]" />;

  return (
    <div className="relative w-full overflow-hidden h-[80vh]">
      <div
        className="flex h-full w-full transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${heroIdx * 100}%)` }}
      >
        {items.map((item) => (
          <HeroSlide key={item.id} item={item} />
        ))}
      </div>
      <button
        className="absolute top-1/2 left-4 -translate-y-1/2 w-10 bg-transparent border-none cursor-pointer flex items-center justify-center p-0 text-white/50 hover:text-white transition-colors duration-150"
        onClick={() => goTo(heroIdx - 1)}
        aria-label="Previous"
      >
        <ChevronLeft />
      </button>
      <button
        className="absolute top-1/2 right-4 -translate-y-1/2 w-10 bg-transparent border-none cursor-pointer flex items-center justify-center p-0 text-white/50 hover:text-white transition-colors duration-150"
        onClick={() => goTo(heroIdx + 1)}
        aria-label="Next"
      >
        <ChevronRight />
      </button>
    </div>
  );
}
