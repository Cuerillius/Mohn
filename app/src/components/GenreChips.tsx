import { useState, useEffect, useRef } from "react";
import {
  Zap,
  Compass,
  Palette,
  Laugh,
  Shield,
  Mic,
  Sparkles,
  Skull,
  Heart,
  Rocket,
  Eye,
  Sun,
  Swords,
  View,
  Video,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { TMDBItem } from "../types/tmdb";
import { getByGenre } from "../services/tmdb";
import Poster from "./Poster";
import { Skeleton } from "./ui/skeleton";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Genre {
  id: number;
  name: string;
  Icon: LucideIcon;
  color: string;
}

const GENRES: Genre[] = [
  { id: 28, name: "Action", Icon: Zap, color: "#ef4444" },
  { id: 12, name: "Adventure", Icon: Compass, color: "#f59e0b" },
  { id: 16, name: "Animation", Icon: Palette, color: "#ec4899" },
  { id: 35, name: "Comedy", Icon: Laugh, color: "#eab308" },
  { id: 80, name: "Crime", Icon: Shield, color: "#64748b" },
  { id: 99, name: "Documentary", Icon: Video, color: "#14b8a6" },
  { id: 18, name: "Drama", Icon: Mic, color: "#8b5cf6" },
  { id: 14, name: "Fantasy", Icon: Sparkles, color: "#a855f7" },
  { id: 27, name: "Horror", Icon: Skull, color: "#b91c1c" },
  { id: 9648, name: "Mystery", Icon: View, color: "#6366f1" },
  { id: 10749, name: "Romance", Icon: Heart, color: "#f43f5e" },
  { id: 878, name: "Sci-Fi", Icon: Rocket, color: "#06b6d4" },
  { id: 53, name: "Thriller", Icon: Eye, color: "#f97316" },
  { id: 10752, name: "War", Icon: Swords, color: "#78716c" },
  { id: 37, name: "Western", Icon: Sun, color: "#d97706" },
];

export { GENRES };

const GAP = 18;
const POSTER_MIN_W = 130;
const MAX_PAGE = 10;


function computePage(clipW: number): number {
  const page = Math.floor((clipW + GAP) / (POSTER_MIN_W + GAP));
  return Math.max(2, Math.min(page, MAX_PAGE));
}

export default function GenreChips() {
  const [activeGenre, setActiveGenre] = useState<Genre>(GENRES[0]);
  const [items, setItems] = useState<TMDBItem[]>([]);
  const [loading, setLoading] = useState(true);

  const clipRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const pageIdxRef = useRef(0);
  const [btnState, setBtnState] = useState({ left: false, right: true });
  const applySizeRef = useRef<() => void>(() => undefined);

  applySizeRef.current = () => {
    const clip = clipRef.current;
    const track = trackRef.current;
    if (!clip || !track) return;

    const TOTAL = items.length || MAX_PAGE;
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

  useEffect(() => {
    setLoading(true);
    setItems([]);
    pageIdxRef.current = 0;
    getByGenre(activeGenre.id).then((data) => {
      setItems(data);
      setLoading(false);
    });
  }, [activeGenre.id]);

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

  // --- genre pill scroller ---
  const chipScrollRef = useRef<HTMLDivElement>(null);
  const [chipBtn, setChipBtn] = useState({ left: false, right: true });

  const updateChipBtn = () => {
    const el = chipScrollRef.current;
    if (!el) return;
    setChipBtn({
      left: el.scrollLeft > 2,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 2,
    });
  };

  useEffect(() => {
    updateChipBtn();
    const el = chipScrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(updateChipBtn);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scrollChips = (dir: 1 | -1) => {
    const el = chipScrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };


  return (
    <div className="relative mb-7">
      {/* heading aligned with ContentRow titles */}
      <div className="flex items-center pl-10 mb-2">
        <h2 className="text-xl font-bold text-white flex-1">Browse by Genre</h2>
      </div>

      {/* One unified genre card: selector + poster row */}
      <div className="rounded-2xl border border-white/20 bg-white/[0.03] mx-10 px-4 pt-4 pb-2">
        <div>
          {/* sleeker selector with its own scroll arrows */}
          <div className="flex items-center">
            <button
              className={`w-9 h-9 shrink-0 bg-transparent border-none cursor-pointer flex items-center justify-center p-0 transition-colors duration-150 ${chipBtn.left ? "text-white/50 hover:text-white" : "text-white/50 opacity-20 cursor-default"}`}
              disabled={!chipBtn.left}
              onClick={() => scrollChips(-1)}
              aria-label="Previous genres"
            >
              <ChevronLeft />
            </button>
            <div
              ref={chipScrollRef}
              onScroll={updateChipBtn}
              className="flex flex-1 gap-2 overflow-x-auto scrollbar-none py-1"
            >
              {GENRES.map((genre) => {
                const active = genre.id === activeGenre.id;
                const GenreIcon = genre.Icon;
                return (
                  <button
                    key={genre.id}
                    onClick={() => setActiveGenre(genre)}
                    className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                      active
                        ? "bg-white/20 border-white/40 text-white"
                        : "bg-white/5 border-white/20 text-white/55 hover:bg-white/10 hover:text-white/90"
                    }`}
                  >
                    <GenreIcon className="h-3.5 w-3.5" />
                    {genre.name}
                  </button>
                );
              })}
            </div>
            <button
              className={`w-9 h-9 shrink-0 bg-transparent border-none cursor-pointer flex items-center justify-center p-0 transition-colors duration-150 ${chipBtn.right ? "text-white/50 hover:text-white" : "text-white/50 opacity-20 cursor-default"}`}
              disabled={!chipBtn.right}
              onClick={() => scrollChips(1)}
              aria-label="Next genres"
            >
              <ChevronRight />
            </button>
          </div>

          {/* Poster row — part of the same card */}
          <div className="mt-2 flex items-center">
            <button
              className={`row-arrow w-9 shrink-0 bg-transparent border-none cursor-pointer flex items-center justify-center p-0 transition-colors duration-150 ${btnState.left ? "text-white/50 hover:text-white" : "text-white/50 opacity-20 cursor-default"}`}
              disabled={!btnState.left}
              onClick={goLeft}
              aria-label="Previous"
            >
              <ChevronLeft />
            </button>
            <div className="overflow-hidden flex-1 py-4" ref={clipRef}>
              <div
                className="flex"
                style={{ transition: "transform 0.3s ease" }}
                ref={trackRef}
              >
                {!loading && items.length > 0
                  ? items.map((item) => (
                      <Poster
                        key={`${item.media_type}:${item.id}`}
                        item={item}
                      />
                    ))
                  : Array.from({ length: MAX_PAGE }).map((_, i) => (
                      <Skeleton
                        key={i}
                        className="poster-skeleton shrink-0 rounded-lg"
                      />
                    ))}
              </div>
            </div>
            <button
              className={`row-arrow w-9 shrink-0 bg-transparent border-none cursor-pointer flex items-center justify-center p-0 transition-colors duration-150 ${btnState.right ? "text-white/50 hover:text-white" : "text-white/50 opacity-20 cursor-default"}`}
              disabled={!btnState.right}
              onClick={goRight}
              aria-label="Next"
            >
              <ChevronRight />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
