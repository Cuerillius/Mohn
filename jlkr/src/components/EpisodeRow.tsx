import { Play } from "lucide-react";
import { imgUrl } from "../services/tmdb";
import type { TMDBEpisode } from "../types/tmdb";

interface Props {
  episode: TMDBEpisode;
  onClick?: () => void;
}

export default function EpisodeRow({ episode, onClick }: Props) {
  const thumb = imgUrl(episode.still_path, "w300");

  return (
    <div onClick={onClick} className="group flex gap-4 py-4 border-b border-white/5 last:border-b-0 cursor-pointer rounded-lg -mx-3 px-3 hover:bg-white/[0.04] transition-colors duration-150">
      {/* Thumbnail */}
      <div className="relative shrink-0 w-[180px] h-[101px] rounded-lg overflow-hidden bg-white/5">
        {thumb ? (
          <img
            src={thumb}
            alt={episode.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-[#1a2535]" />
        )}
        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors duration-150">
          <Play className="w-9 h-9 fill-white opacity-0 group-hover:opacity-100 transition-opacity duration-150 drop-shadow-lg" />
        </div>
        {/* Episode number badge */}
        <span className="absolute bottom-1.5 left-2 text-[10px] font-semibold text-white/50 bg-black/50 px-1.5 py-0.5 rounded">
          E{episode.episode_number}
        </span>
      </div>

      {/* Info */}
      <div className="flex flex-col justify-center min-w-0 flex-1 gap-1.5">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[14px] font-semibold text-white/90 truncate">
            {episode.name}
          </span>
          {episode.runtime != null && (
            <span className="text-[12px] text-white/30 shrink-0">
              {episode.runtime}m
            </span>
          )}
        </div>
        {episode.overview ? (
          <p className="text-[12px] text-white/40 leading-relaxed line-clamp-2">
            {episode.overview}
          </p>
        ) : null}
      </div>
    </div>
  );
}
