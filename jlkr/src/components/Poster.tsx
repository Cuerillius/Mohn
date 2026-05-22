import { useNavigate } from 'react-router-dom';
import { imgUrl, itemTitle } from '../services/tmdb';
import type { TMDBItem } from '../types/tmdb';

interface Props {
  item: TMDBItem;
  width?: number;
  height?: number;
}

export default function Poster({ item, width, height }: Props) {
  const navigate = useNavigate();
  const poster = imgUrl(item.poster_path, 'w342');
  const title = itemTitle(item);
  const path = item.media_type === 'tv' ? `/tv/${item.id}` : `/movie/${item.id}`;

  return (
    <div
      className="poster group shrink-0 rounded-lg cursor-pointer relative bg-[#2a2a2a] shadow-[inset_0_0_0_0px_rgba(255,255,255,0)] hover:shadow-[inset_0_0_0_2px_rgba(255,255,255,0.55)] transition-shadow duration-150"
      style={width ? { width, height } : undefined}
      onClick={() => navigate(path)}
    >
      {poster ? (
        <img src={poster} alt={title} loading="lazy" className="w-full h-full object-cover block rounded-lg" />
      ) : (
        <div className="w-full h-full flex items-end p-2 rounded-lg overflow-hidden" style={{ background: '#1e2a3a' }}>
          <span className="text-[9px] text-white/35 leading-[1.3]">{title}</span>
        </div>
      )}
      <div className="absolute inset-0 rounded-lg bg-transparent group-hover:bg-black/20 transition-colors duration-150" />
    </div>
  );
}
