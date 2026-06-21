import { useEffect, useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { imgUrl, itemTitle } from "../services/tmdb";
import type { TMDBItem } from "../types/tmdb";
import { GalleryHorizontalEnd, Star } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

interface Props {
  item: TMDBItem;
  width?: number;
  height?: number;
  progress?: number;
}

interface TipColor {
  bg: string;
  fg: string;
}

/** Pull the dominant (most common, non-extreme) color out of the poster art. */
function useDominantColor(src: string | null): TipColor | null {
  const [color, setColor] = useState<TipColor | null>(null);
  useEffect(() => {
    if (!src) {
      setColor(null);
      return;
    }
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = src;
    img.onload = () => {
      try {
        const w = 16;
        const h = 24;
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, w, h);
        const { data } = ctx.getImageData(0, 0, w, h);
        const buckets = new Map<
          string,
          { n: number; r: number; g: number; b: number }
        >();
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          if (data[i + 3] < 125) continue;
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          if (max < 28 || min > 232) continue; // skip near-black / near-white
          const key = `${r >> 4}-${g >> 4}-${b >> 4}`;
          const e = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
          e.n++;
          e.r += r;
          e.g += g;
          e.b += b;
          buckets.set(key, e);
        }
        let best: { n: number; r: number; g: number; b: number } | null = null;
        for (const e of buckets.values()) {
          if (!best || e.n > best.n) best = e;
        }
        if (!best || cancelled) return;
        const r = Math.round(best.r / best.n);
        const g = Math.round(best.g / best.n);
        const b = Math.round(best.b / best.n);
        const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        setColor({
          bg: `rgb(${r} ${g} ${b})`,
          fg: lum > 0.6 ? "#0a0a0a" : "#ffffff",
        });
      } catch {
        // tainted canvas / CORS — fall back to default popover styling
      }
    };
    return () => {
      cancelled = true;
    };
  }, [src]);
  return color;
}

export default function Poster({ item, width, height, progress }: Props) {
  const navigate = useNavigate();
  const poster = imgUrl(item.poster_path, "w342");
  const title = itemTitle(item);
  const path = `/${item.media_type}/${item.id}`;
  const rating = item.vote_average ? item.vote_average.toFixed(1) : null;
  const tip = useDominantColor(imgUrl(item.poster_path, "w92"));

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className="poster group shrink-0 rounded-lg relative cursor-pointer transition-transform duration-200 ease-out hover:scale-[1.08] hover:z-10"
          style={width ? { width, height } : undefined}
          onClick={() => navigate(path)}
        >
          <div className="absolute bottom-2 right-2">
            {item.media_type === "tv" && (
              <GalleryHorizontalEnd
                fill="currentColor"
                className="w-4 h-4 text-white/60 drop-shadow"
              />
            )}
          </div>
          {poster ? (
            <img
              src={poster}
              alt={title}
              loading="lazy"
              className="w-full h-full object-cover block rounded-lg"
            />
          ) : (
            <div className="w-full h-full flex items-end p-2 rounded-lg bg-accent">
              <span className="text-xs text-white/35">{title}</span>
            </div>
          )}
          {progress !== undefined && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 rounded-b-lg overflow-hidden">
              <div
                className="h-full bg-primary"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        style={
          tip
            ? ({ "--tt-bg": tip.bg, "--tt-fg": tip.fg } as CSSProperties)
            : undefined
        }
      >
        <span className="flex items-center gap-2">
          <span className="truncate">{title}</span>
          {rating && (
            <span className="flex shrink-0 items-center gap-1 text-xs font-normal opacity-60">
              <Star className="size-3 fill-current" />
              {rating}
            </span>
          )}
        </span>
      </TooltipContent>
    </Tooltip>
  );
}
