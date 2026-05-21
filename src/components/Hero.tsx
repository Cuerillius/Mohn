import { useState, useRef, useEffect, useCallback } from 'react';
import { useNav } from '../context/NavContext';
import { imgUrl, itemTitle } from '../services/tmdb';
import type { TMDBItem } from '../types/tmdb';

const DURATION = 5500;

interface Props { items: TMDBItem[] }

export default function Hero({ items }: Props) {
  const { navigate } = useNav();
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

  if (!items.length) return <div className="hero" />;

  return (
    <div className="hero">
      <div className="hero-track" style={{ transform: `translateX(-${heroIdx * 100}%)` }}>
        {items.map((item) => {
          const bg = imgUrl(item.backdrop_path, 'original');
          const title = itemTitle(item);
          const type = item.media_type === 'tv' ? 'series' : 'detail';
          return (
            <div key={item.id} className="hero-slide">
              <div
                className="hero-bg"
                style={bg ? { backgroundImage: `url(${bg})` } : { background: '#1a2a3a' }}
              />
              <div className="hero-gradient" />
              <div className="hero-content">
                <div className="hero-title">{title}</div>
                <div className="hero-desc">{item.overview}</div>
                <div className="hero-btns">
                  <button className="btn-primary" onClick={() => navigate(type, item.id)}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                    Play
                  </button>
                  <button className="btn-secondary" onClick={() => navigate(type, item.id)}>More info</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <button className="hero-arrow left" onClick={() => goTo(heroIdx - 1)} aria-label="Previous">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m15 18-6-6 6-6"/>
        </svg>
      </button>
      <button className="hero-arrow right" onClick={() => goTo(heroIdx + 1)} aria-label="Next">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m9 18 6-6-6-6"/>
        </svg>
      </button>
    </div>
  );
}
