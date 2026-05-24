import { useRef, useState, useEffect } from "react";
import Poster from "./Poster";
import type { TMDBItem } from "../types/tmdb";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "./ui/skeleton";

interface Props {
  title: string;
  items: TMDBItem[];
}

const GAP = 10;
const POSTER_MIN_W = 130;
const MAX_PAGE = 10;

function computePage(clipW: number): number {
  const page = Math.floor((clipW + GAP) / (POSTER_MIN_W + GAP));
  return Math.max(2, Math.min(page, MAX_PAGE));
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
    const clipW = clip.clientWidth || window.innerWidth - 80;
    const PAGE = computePage(clipW);

    const pw = Math.floor((clipW - (PAGE - 1) * GAP) / PAGE);
    const ph = Math.round(pw * 1.5);

    const maxPage = Math.max(0, Math.ceil(TOTAL / PAGE) - 1);
    pageIdxRef.current = Math.min(pageIdxRef.current, maxPage);
    const idx = pageIdxRef.current;

    track.querySelectorAll<HTMLElement>(".poster").forEach((p) => {
      p.style.width = pw + "px";
      p.style.height = ph + "px";
    });
    track.querySelectorAll<HTMLElement>(".poster-skeleton").forEach((p) => {
      p.style.width = pw + "px";
      p.style.height = ph + "px";
    });
    track.style.gap = GAP + "px";

    const totalTrackW = TOTAL * pw + (TOTAL - 1) * GAP;
    const maxOffset = Math.max(0, totalTrackW - clipW);
    const rawOffset = idx * PAGE * (pw + GAP);
    const offset = Math.min(rawOffset, maxOffset);
    track.style.transform = `translateX(-${offset}px)`;

    document.querySelectorAll<HTMLElement>(".row-arrow").forEach((btn) => {
      btn.style.height = ph + "px";
    });

    setBtnState({ left: idx > 0, right: rawOffset < maxOffset });
  };

  useEffect(() => {
    const clip = clipRef.current;
    if (!clip) return;
    const ro = new ResizeObserver(() => applySizeRef.current());
    ro.observe(clip);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    applySizeRef.current();
  }, [items.length]);

  const goLeft = () => {
    if (pageIdxRef.current > 0) {
      pageIdxRef.current--;
      applySizeRef.current();
    }
  };

  const goRight = () => {
    const clip = clipRef.current;
    if (!clip) return;
    const TOTAL = items.length;
    const clipW = clip.clientWidth || window.innerWidth - 80;
    const PAGE = computePage(clipW);
    const maxPage = Math.max(0, Math.ceil(TOTAL / PAGE) - 1);
    if (pageIdxRef.current < maxPage) {
      pageIdxRef.current++;
      applySizeRef.current();
    }
  };
  return (
    <div className="mb-7">
      {title && (
        <div className="flex items-center px-12 mb-3">
          <span className="text-sm font-medium text-white/50 flex-1">
            {title}
          </span>
        </div>
      )}
      <div className="flex items-center">
        <button
          className={`row-arrow w-10 shrink-0 bg-transparent border-none cursor-pointer flex items-center justify-center p-0 transition-colors duration-150 ${btnState.left ? "text-white/50 hover:text-white" : "text-white/50 opacity-20 cursor-default"}`}
          disabled={!btnState.left}
          onClick={goLeft}
          aria-label="Previous"
        >
          <ChevronLeft />
        </button>
        <div className="overflow-hidden flex-1" ref={clipRef}>
          <div
            className="flex"
            style={{ transition: "transform 0.3s ease" }}
            ref={trackRef}
          >
            {items.length > 0 ? (
              <>
                {items.map((item) => (
                  <Poster key={item.id} item={item} />
                ))}
              </>
            ) : (
              <>
                {Array.from({ length: MAX_PAGE }).map((_, i) => (
                  <Skeleton
                    key={i}
                    className="poster-skeleton shrink-0 rounded-lg"
                  />
                ))}
              </>
            )}
          </div>
        </div>
        <button
          className={`row-arrow w-10 shrink-0 bg-transparent border-none cursor-pointer flex items-center justify-center p-0 transition-colors duration-150 ${btnState.right ? "text-white/50 hover:text-white" : "text-white/50 opacity-20 cursor-default"}`}
          disabled={!btnState.right}
          onClick={goRight}
          aria-label="Next"
        >
          <ChevronRight />
        </button>
      </div>
    </div>
  );
}
