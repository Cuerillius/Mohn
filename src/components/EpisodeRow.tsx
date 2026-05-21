import { imgUrl } from '../services/tmdb';
import type { TMDBEpisode } from '../types/tmdb';

interface Props {
  episode: TMDBEpisode;
}

export default function EpisodeRow({ episode }: Props) {
  const thumb = imgUrl(episode.still_path, 'w300');
  return (
    <div className="episode-row">
      <div className="episode-thumb">
        {thumb ? (
          <img src={thumb} alt={episode.name} className="episode-thumb-bg" style={{ objectFit: 'cover' }} />
        ) : (
          <div className="episode-thumb-bg" style={{ background: '#1e2a3a' }} />
        )}
        <span className="episode-num-overlay">E{episode.episode_number}</span>
      </div>
      <div className="episode-info">
        <span className="episode-title">{episode.name}</span>
        <span className="episode-num">Episode {episode.episode_number}</span>
      </div>
    </div>
  );
}
