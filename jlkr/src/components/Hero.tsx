import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { imgUrl, itemTitle } from '../services/tmdb';
import type { TMDBItem } from '../types/tmdb';

const DURATION = 5500;

interface Props { items: TMDBItem[] }

export default function Hero({ items }: Props) {
  const navigate = useNavigate();
  const [heroIdx, setHeroIdx] = useState(0);
  const heroIdxRef = useRef(0);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef(0);

  const goTo = useCallback((idx: number) => {
    const len = items.length;
    if (!len) return;
    const n = ((idx % len) + len) % len;
    heroIdxRef.current = n;
    setHeroIdx(n);
    startRef.current = performance.now();
  }, [items.length]);

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

  if (!items.length) return <div className="relative w-full overflow-hidden h-[calc(100vh-56px)] max-h-[680px] min-h-[420px]" />;

  return (
    <div className="relative w-full overflow-hidden h-[calc(100vh-56px)] max-h-[680px] min-h-[420px]">
      <div className="flex h-full w-full" style={{ transform: `translateX(-${heroIdx * 100}%)` }}>
        {items.map((item) => {
          const bg = imgUrl(item.backdrop_path, 'original');
          const title = itemTitle(item);
          const path = item.media_type === 'tv' ? `/tv/${item.id}` : `/movie/${item.id}`;
          return (
            <div key={item.id} className="shrink-0 w-full h-full relative">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={bg ? { backgroundImage: `url(${bg})` } : { background: '#1a2a3a' }}
              />
              <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(to right, rgba(31,31,31,0.95) 30%, rgba(31,31,31,0.5) 60%, rgba(31,31,31,0.15) 100%), linear-gradient(to top, rgba(31,31,31,1) 0%, transparent 40%)' }}
              />
              <div className="absolute bottom-[60px] left-12 max-w-[420px] max-[900px]:left-6 max-[900px]:bottom-12 max-[900px]:max-w-[320px]">
                <div className="text-[36px] font-medium text-white leading-[1.1] mb-3 max-[900px]:text-[26px] max-[540px]:text-[22px]">{title}</div>
                <div className="text-[13px] text-[#aaa] leading-[1.6] mb-[22px] max-[540px]:hidden">{item.overview}</div>
                <div className="flex gap-[10px] items-center">
                  <button
                    className="inline-flex items-center gap-[7px] bg-white text-black text-[13px] font-medium py-[9px] px-[22px] rounded-lg border-none cursor-pointer transition-opacity duration-150 hover:opacity-[0.88]"
                    onClick={() => navigate(path)}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                    Play
                  </button>
                  <button
                    className="inline-flex items-center gap-[7px] bg-[#2a2a2a] text-[#aaa] text-[13px] font-normal py-[9px] px-5 rounded-lg border-none cursor-pointer transition-colors duration-150 hover:bg-[#333]"
                    onClick={() => navigate(path)}
                  >
                    More info
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <button
        className="absolute top-1/2 -translate-y-1/2 left-4 w-9 h-9 rounded-full bg-[rgba(42,42,42,0.7)] border-[0.5px] border-[#3a3a3a] text-[#aaa] cursor-pointer flex items-center justify-center z-10 transition-colors duration-150 hover:bg-[#2a2a2a]"
        onClick={() => goTo(heroIdx - 1)}
        aria-label="Previous"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m15 18-6-6 6-6"/>
        </svg>
      </button>
      <button
        className="absolute top-1/2 -translate-y-1/2 right-4 w-9 h-9 rounded-full bg-[rgba(42,42,42,0.7)] border-[0.5px] border-[#3a3a3a] text-[#aaa] cursor-pointer flex items-center justify-center z-10 transition-colors duration-150 hover:bg-[#2a2a2a]"
        onClick={() => goTo(heroIdx + 1)}
        aria-label="Next"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m9 18 6-6-6-6"/>
        </svg>
      </button>
    </div>
  );
}
