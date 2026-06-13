import { type ReactNode } from "react";
import "lite-youtube-embed/src/lite-yt-embed.css";
import "lite-youtube-embed/src/lite-yt-embed.js";
import { ArrowLeft, Star, Play, Tv, Bookmark } from "lucide-react";
import { imgUrl } from "../services/tmdb";

export interface MediaHeroCredit {
  label: string;
  value: string;
}

export interface MediaHeroProps {
  backdropPath: string | null;

  title: string;
  logoUrl?: string | null;
  tagline?: string;

  year?: string;
  rating?: number;
  metaExtra?: string;
  genre?: string;

  trailerKey?: string | null;
  showTrailer?: boolean;
  onToggleTrailer?: () => void;

  overview?: string;
  credits?: MediaHeroCredit[];

  primaryLabel?: string;
  onPlay?: () => void;
  inWatchlist?: boolean;
  onToggleWatchlist?: () => void;
  extraActions?: ReactNode;

  onBack?: () => void;
  fullHeight?: boolean;
  className?: string;
}

export default function MediaHero({
  backdropPath,
  title,
  logoUrl,
  tagline,
  year,
  rating,
  metaExtra,
  genre,
  trailerKey,
  showTrailer = false,
  onToggleTrailer,
  overview,
  credits,
  primaryLabel = "Play",
  onPlay,
  inWatchlist,
  onToggleWatchlist,
  extraActions,
  onBack,
  fullHeight = true,
  className = "",
}: MediaHeroProps) {
  const bg = imgUrl(backdropPath, "original");
  const heightClass = fullHeight ? "h-screen" : "h-[80vh]";
  const hasMeta = year || (rating && rating > 0) || metaExtra || genre;

  return (
    <div
      className={`relative ${heightClass} overflow-hidden bg-card ${className}`}
    >
      {showTrailer && trailerKey ? (
        // @ts-ignore — lite-youtube is a custom element
        <lite-youtube
          videoid={trailerKey}
          params="autoplay=1&controls=0&rel=0&modestbranding=1&iv_load_policy=3"
          style={{ width: "100%", height: "100%", maxWidth: "none" }}
        />
      ) : (
        bg && (
          <img
            src={bg}
            alt={title}
            className="w-full h-full object-cover object-top"
          />
        )
      )}

      {showTrailer && (
        <div className="absolute top-0 left-0 right-0 h-[52px] bg-background pointer-events-none z-10" />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/10 pointer-events-none" />

      {onBack && (
        <button
          onClick={onBack}
          className="fixed top-6 left-8 z-50 p-2 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
      )}

      <div className="absolute bottom-0 left-0 right-0 px-10 pb-10 max-w-3xl max-[900px]:px-6 max-[900px]:pb-8">
        {!showTrailer && (
          <>
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={title}
                className="max-h-24 max-w-xs object-contain mb-2 drop-shadow-lg max-[900px]:max-h-16"
              />
            ) : (
              <h1 className="text-4xl font-bold tracking-tight text-white mb-2 leading-tight max-[900px]:text-2xl">
                {title}
              </h1>
            )}

            {tagline && (
              <p className="text-sm text-white/50 italic mb-4">{tagline}</p>
            )}

            {hasMeta && (
              <div className="flex items-center gap-3 mb-5 text-sm text-white/70 flex-wrap">
                {year && <span>{year}</span>}
                {metaExtra && (
                  <>
                    {year && <span className="text-white/30">·</span>}
                    <span>{metaExtra}</span>
                  </>
                )}
                {rating && rating > 0 && (
                  <>
                    {(year || metaExtra) && (
                      <span className="text-white/30">·</span>
                    )}
                    <span className="flex items-center gap-1">
                      <Star
                        size={12}
                        className="text-yellow-400 fill-yellow-400"
                      />
                      {rating.toFixed(1)}
                    </span>
                  </>
                )}
                {genre && (
                  <>
                    {(year || metaExtra || rating) && (
                      <span className="text-white/30">·</span>
                    )}
                    <span>{genre}</span>
                  </>
                )}
              </div>
            )}
          </>
        )}

        <div className="flex gap-3 mb-5 flex-wrap">
          {onPlay && (
            <button
              onClick={onPlay}
              className="inline-flex items-center gap-2 bg-white text-black text-sm font-semibold py-2.5 px-6 rounded-lg hover:opacity-90 transition-opacity"
            >
              <Play size={14} fill="currentColor" />
              {primaryLabel}
            </button>
          )}

          {onToggleWatchlist && (
            <button
              onClick={onToggleWatchlist}
              className="inline-flex items-center gap-2 bg-white/10 text-white text-sm font-normal py-2.5 px-5 rounded-lg hover:bg-white/15 transition-colors backdrop-blur-sm border border-white/10"
            >
              <Bookmark fill={inWatchlist ? "currentColor" : "none"} />
            </button>
          )}

          {trailerKey && onToggleTrailer && (
            <button
              onClick={onToggleTrailer}
              className={`inline-flex items-center gap-2 text-sm font-normal py-2.5 px-5 rounded-lg transition-colors backdrop-blur-sm border ${
                showTrailer
                  ? "bg-white/20 text-white border-white/30"
                  : "bg-white/10 text-white border-white/10 hover:bg-white/15"
              }`}
            >
              <Tv size={13} />
              {showTrailer ? "Hide trailer" : "Trailer"}
            </button>
          )}

          {extraActions}
        </div>

        {overview && (
          <p className="text-sm text-white/65 leading-relaxed line-clamp-3 mb-4 max-w-xl">
            {overview}
          </p>
        )}

        {credits && credits.length > 0 && (
          <div className="flex gap-8 text-sm flex-wrap">
            {credits.map((c) => (
              <div key={c.label}>
                <span className="text-white/35">{c.label} </span>
                <span className="text-white/80">{c.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
