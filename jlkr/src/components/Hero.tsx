import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { imgUrl, itemTitle } from "../services/tmdb";
import type { TMDBItem } from "../types/tmdb";
import { ChevronLeft, ChevronRight, Info, Play } from "lucide-react";
import { Button } from "./ui/button";

const DURATION = 5500;

interface Props {
  items: TMDBItem[];
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
        className="flex h-full w-full"
        style={{ transform: `translateX(-${heroIdx * 100}%)` }}
      >
        {items.map((item) => {
          const bg = imgUrl(item.backdrop_path, "original");
          const title = itemTitle(item);
          const path = `/${item.media_type}/${item.id}`;
          return (
            <div key={item.id} className="shrink-0 w-full h-full relative">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={bg ? { backgroundImage: `url(${bg})` } : undefined}
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to right,oklch(from var(--background) l c h / 0.75) 30%,oklch(from var(--background) l c h / 0.3) 60%,oklch(from var(--background) l c h / 0.05) 100%),linear-gradient(to top,var(--background) 0%,transparent 40%)",
                }}
              />
              <div className="absolute bottom-15 left-12 max-w-105">
                <div className="text-4xl font-medium text-white mb-3">
                  {title}
                </div>
                <div className="text-sm text-white/50 mb-5.5">
                  {item.overview}
                </div>
                <div className="flex gap-3 items-center">
                  <Button
                    className="p-5"
                    onClick={() => navigate(`/play${path}`)}
                  >
                    <Play fill="currentColor" /> Play
                  </Button>
                  <Button
                    className="p-5"
                    variant="secondary"
                    onClick={() => navigate(path)}
                  >
                    <Info /> More info
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
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
