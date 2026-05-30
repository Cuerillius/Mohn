import { useState, useEffect, useRef } from "react";
import {
  Zap,
  Compass,
  Palette,
  Laugh,
  Shield,
  Film,
  Mic,
  Sparkles,
  Skull,
  Search,
  Heart,
  Rocket,
  Eye,
  Sword,
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
}

const GENRES: Genre[] = [
  { id: 28, name: "Action", Icon: Zap },
  { id: 12, name: "Adventure", Icon: Compass },
  { id: 16, name: "Animation", Icon: Palette },
  { id: 35, name: "Comedy", Icon: Laugh },
  { id: 80, name: "Crime", Icon: Shield },
  { id: 99, name: "Documentary", Icon: Video },
  { id: 18, name: "Drama", Icon: Mic },
  { id: 14, name: "Fantasy", Icon: Sparkles },
  { id: 27, name: "Horror", Icon: Skull },
  { id: 9648, name: "Mystery", Icon: View },
  { id: 10749, name: "Romance", Icon: Heart },
  { id: 878, name: "Sci-Fi", Icon: Rocket },
  { id: 53, name: "Thriller", Icon: Eye },
  { id: 10752, name: "War", Icon: Swords },
  { id: 37, name: "Western", Icon: Sun },
];

export { GENRES };

const GAP = 10;
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

  const chipClipRef = useRef<HTMLDivElement>(null);
  const chipTrackRef = useRef<HTMLDivElement>(null);
  const chipPageRef = useRef(0);
  const [chipBtnState, setChipBtnState] = useState({
    left: false,
    right: true,
  });
  const applyChipSizeRef = useRef<() => void>(() => undefined);

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

  applyChipSizeRef.current = () => {
    const clip = chipClipRef.current;
    const track = chipTrackRef.current;
    if (!clip || !track) return;
    const clipW = clip.clientWidth || window.innerWidth - 80;
    const chips = Array.from(
      track.querySelectorAll<HTMLElement>(".genre-chip"),
    );
    if (!chips.length) return;

    // measure how many chips fit
    let usedW = 0;
    let perPage = 0;
    for (const chip of chips) {
      const w = chip.offsetWidth || 80;
      if (usedW + w + (perPage > 0 ? GAP : 0) > clipW) break;
      usedW += w + (perPage > 0 ? GAP : 0);
      perPage++;
    }
    perPage = Math.max(1, perPage);

    const maxPage = Math.max(0, Math.ceil(GENRES.length / perPage) - 1);
    chipPageRef.current = Math.min(chipPageRef.current, maxPage);
    const idx = chipPageRef.current;

    // compute pixel offset: sum widths of first idx*perPage chips + gaps
    let offset = 0;
    const start = idx * perPage;
    for (let i = 0; i < start && i < chips.length; i++) {
      offset += (chips[i].offsetWidth || 80) + GAP;
    }

    track.style.gap = GAP + "px";
    track.style.transform = `translateX(-${offset}px)`;

    const lastPageStart = maxPage * perPage;
    let lastPageW = 0;
    for (let i = lastPageStart; i < chips.length; i++) {
      lastPageW += (chips[i].offsetWidth || 80) + (i > lastPageStart ? GAP : 0);
    }

    setChipBtnState({ left: idx > 0, right: idx < maxPage });
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
    const clip = chipClipRef.current;
    if (!clip) return;
    const ro = new ResizeObserver(() => applyChipSizeRef.current());
    ro.observe(clip);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    // re-measure after chips render
    requestAnimationFrame(() => applyChipSizeRef.current());
  }, []);

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

  const goChipLeft = () => {
    if (chipPageRef.current > 0) {
      chipPageRef.current--;
      applyChipSizeRef.current();
    }
  };

  const goChipRight = () => {
    chipPageRef.current++;
    applyChipSizeRef.current();
  };

  return (
    <div className="mb-7">
      <div className="flex items-center px-12 mb-3">
        <span className="text-sm font-medium text-white/50 flex-1">
          Browse by Genre
        </span>
      </div>
      <div className="flex items-center mb-3">
        <button
          className={`w-10 shrink-0 bg-transparent border-none cursor-pointer flex items-center justify-center p-0 transition-colors duration-150 h-9 ${chipBtnState.left ? "text-white/50 hover:text-white" : "text-white/50 opacity-20 cursor-default"}`}
          disabled={!chipBtnState.left}
          onClick={goChipLeft}
          aria-label="Previous genres"
        >
          <ChevronLeft />
        </button>
        <div className="overflow-hidden flex-1" ref={chipClipRef}>
          <div
            className="flex"
            style={{ transition: "transform 0.3s ease" }}
            ref={chipTrackRef}
          >
            {GENRES.map((genre) => {
              const { id, name, Icon } = genre;
              const active = id === activeGenre.id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveGenre(genre)}
                  className={`genre-chip flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-md border transition-all text-sm ${
                    active
                      ? "border-white/30 bg-white/10 text-white shadow-sm"
                      : "border-white/10 bg-transparent text-white/50 hover:border-white/20 hover:text-white/80"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {name}
                </button>
              );
            })}
          </div>
        </div>
        <button
          className={`w-10 shrink-0 bg-transparent border-none cursor-pointer flex items-center justify-center p-0 transition-colors duration-150 h-9 ${chipBtnState.right ? "text-white/50 hover:text-white" : "text-white/50 opacity-20 cursor-default"}`}
          disabled={!chipBtnState.right}
          onClick={goChipRight}
          aria-label="Next genres"
        >
          <ChevronRight />
        </button>
      </div>
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
            {!loading && items.length > 0
              ? items.map((item) => (
                  <Poster key={`${item.media_type}:${item.id}`} item={item} />
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
