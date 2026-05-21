import { useRef, useState, useEffect } from 'react';
import Poster from './Poster';
import type { TMDBItem } from '../types/tmdb';

interface Props {
  title: string;
  items: TMDBItem[];
}

const STEP = 4;

function getPageSize() {
  if (window.innerWidth <= 540) return 2;
  if (window.innerWidth <= 900) return 4;
  return 8;
}

export default function ContentRow({ title, items }: Props) {
  const clipRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const pageIdxRef = useRef(0);
  const [btnState, setBtnState] = useState({ left: false, right: true });
  const applySizeRef = useRef<() => void>(() => undefined);

  applySizeRef.current = () => {
    const clip = clipRef.current;
    const track = trackRef.current;
    if (!clip || !track) return;

    const TOTAL = items.length;
    const PAGE = getPageSize();
    const clipW = clip.clientWidth || (window.innerWidth - 80);
    const GAP = 10;
    const pw = Math.floor((clipW - (PAGE - 1) * GAP) / PAGE);
    const ph = Math.round(pw * 1.5);

    const maxPage = Math.max(0, Math.ceil(TOTAL / STEP) - 1);
    pageIdxRef.current = Math.min(pageIdxRef.current, maxPage);
    const idx = pageIdxRef.current;

    track.querySelectorAll<HTMLElement>('.poster').forEach(p => {
      p.style.width = pw + 'px';
      p.style.height = ph + 'px';
    });
    track.querySelectorAll<HTMLElement>('.poster-skeleton').forEach(p => {
      p.style.width = pw + 'px';
      p.style.height = ph + 'px';
    });
    track.style.gap = GAP + 'px';

    const totalTrackW = TOTAL * pw + (TOTAL - 1) * GAP;
    const maxOffset = Math.max(0, totalTrackW - clipW);
    const rawOffset = idx * STEP * (pw + GAP);
    const offset = Math.min(rawOffset, maxOffset);
    track.style.transform = `translateX(-${offset}px)`;

    document.querySelectorAll<HTMLElement>('.row-arrow').forEach(btn => {
      btn.style.height = ph + 'px';
    });

    setBtnState({ left: idx > 0, right: rawOffset < maxOffset });
  };

  useEffect(() => {
    const handle = () => applySizeRef.current();
    const timer = setTimeout(() => applySizeRef.current(), 0);
    window.addEventListener('resize', handle);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handle);
    };
  }, []);

  useEffect(() => {
    setTimeout(() => applySizeRef.current(), 0);
  }, [items.length]);

  const goLeft = () => {
    if (pageIdxRef.current > 0) { pageIdxRef.current--; applySizeRef.current(); }
  };

  const goRight = () => {
    const clip = clipRef.current;
    if (!clip) return;
    const TOTAL = items.length;
    const maxPage = Math.max(0, Math.ceil(TOTAL / STEP) - 1);
    if (pageIdxRef.current < maxPage) { pageIdxRef.current++; applySizeRef.current(); }
  };

  if (!items.length) {
    return (
      <div className="row-section">
        {title && (
          <div className="row-header">
            <span className="row-header-title">{title}</span>
          </div>
        )}
        <div className="row-outer">
          <button className="row-arrow" disabled aria-label="Previous">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <div className="row-clip" ref={clipRef}>
            <div className="row-track" ref={trackRef}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="poster-skeleton poster" />
              ))}
            </div>
          </div>
          <button className="row-arrow" disabled aria-label="Next">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="row-section">
      {title && (
        <div className="row-header">
          <span className="row-header-title">{title}</span>
        </div>
      )}
      <div className="row-outer">
        <button className="row-arrow" disabled={!btnState.left} onClick={goLeft} aria-label="Previous">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <div className="row-clip" ref={clipRef}>
          <div className="row-track" ref={trackRef}>
            {items.map(item => <Poster key={item.id} item={item} />)}
          </div>
        </div>
        <button className="row-arrow" disabled={!btnState.right} onClick={goRight} aria-label="Next">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
        </button>
      </div>
    </div>
  );
}
