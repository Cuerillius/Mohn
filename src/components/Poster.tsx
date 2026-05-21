import { useNav } from '../context/NavContext';
import { imgUrl, itemTitle } from '../services/tmdb';
import type { TMDBItem } from '../types/tmdb';

interface Props {
  item: TMDBItem;
  width?: number;
  height?: number;
}

export default function Poster({ item, width, height }: Props) {
  const { navigate } = useNav();
  const poster = imgUrl(item.poster_path, 'w342');
  const title = itemTitle(item);
  const type = item.media_type === 'tv' ? 'series' : 'detail';

  return (
    <div
      className="poster"
      style={width ? { width, height } : undefined}
      onClick={() => navigate(type, item.id)}
    >
      {poster ? (
        <img src={poster} alt={title} loading="lazy" />
      ) : (
        <div className="poster-placeholder" style={{ background: '#1e2a3a' }}>
          <span className="poster-name">{title}</span>
        </div>
      )}
      <div className="poster-overlay" />
    </div>
  );
}
