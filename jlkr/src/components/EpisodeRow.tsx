import { imgUrl } from '../services/tmdb';
import type { TMDBEpisode } from '../types/tmdb';

interface Props {
  episode: TMDBEpisode;
}

export default function EpisodeRow({ episode }: Props) {
  const thumb = imgUrl(episode.still_path, 'w300');
  return (
    <div className="flex items-center gap-[14px] py-[10px] px-2 border-b border-b-[0.5px] border-[#242424] last:border-b-0 cursor-pointer transition-colors duration-[120ms] rounded-lg -mx-2 hover:bg-[#242424]">
      <div className="w-24 h-[54px] rounded-[4px] shrink-0 overflow-hidden relative">
        {thumb ? (
          <img src={thumb} alt={episode.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full" style={{ background: '#1e2a3a' }} />
        )}
        <span className="absolute bottom-1 right-[5px] text-[9px] text-white/40">E{episode.episode_number}</span>
      </div>
      <div className="flex flex-col gap-[3px]">
        <span className="text-[13px] text-[#aaa]">{episode.name}</span>
        <span className="text-[11px] text-[#555]">Episode {episode.episode_number}</span>
      </div>
    </div>
  );
}
