import { useState, useEffect } from 'react';
import { useNav } from '../context/NavContext';
import ContentRow from '../components/ContentRow';
import { getMovie, getMovieRecs, imgUrl, itemYear, formatRuntime } from '../services/tmdb';
import type { TMDBMovieDetail, TMDBItem } from '../types/tmdb';

type Tab = 'details' | 'similar';

export default function MovieDetailPage() {
  const { contentId, navigate } = useNav();
  const [movie, setMovie] = useState<TMDBMovieDetail | null>(null);
  const [recs, setRecs] = useState<TMDBItem[]>([]);
  const [tab, setTab] = useState<Tab>('details');

  useEffect(() => {
    if (!contentId) return;
    setMovie(null);
    setRecs([]);
    setTab('details');
    Promise.all([getMovie(contentId), getMovieRecs(contentId)])
      .then(([m, r]) => { setMovie(m); setRecs(r); })
      .catch(console.error);
  }, [contentId]);

  if (!movie) {
    return (
      <>
        <div className="detail-hero" style={{ background: '#1e2a3a' }}>
          <div className="detail-hero-gradient" />
          <button className="detail-back" onClick={() => navigate('home')} aria-label="Back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
          </button>
        </div>
        <div className="detail-body" />
      </>
    );
  }

  const bg = imgUrl(movie.backdrop_path, 'original');
  const year = itemYear(movie);
  const genre = movie.genres?.[0]?.name ?? '';
  const runtime = movie.runtime ? formatRuntime(movie.runtime) : '';
  const rating = movie.vote_average ? `★ ${movie.vote_average.toFixed(1)}` : '';
  const director = movie.credits?.crew?.find(c => c.job === 'Director')?.name ?? '';
  const cast = movie.credits?.cast?.slice(0, 4).map(c => c.name).join(', ') ?? '';

  return (
    <>
      <div className="detail-hero">
        <div id="detailBg" style={{
          position: 'absolute', inset: 0,
          ...(bg ? { backgroundImage: `url(${bg})`, backgroundSize: 'cover', backgroundPosition: 'center top' } : { background: '#1e2a3a' })
        }} />
        <div className="detail-hero-gradient" />
        <button className="detail-back" onClick={() => navigate('home')} aria-label="Back">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <div className="detail-hero-content">
          <div className="detail-title">{movie.title}</div>
          <div className="detail-btns">
            <button className="btn-primary">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Play
            </button>
            <button className="btn-secondary">+ My list</button>
          </div>
        </div>
      </div>

      <div className="detail-body">
        <div className="detail-tabs">
          {(['details', 'similar'] as Tab[]).map(t => (
            <button
              key={t}
              className={`detail-tab${tab === t ? ' active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t === 'details' ? 'Details' : 'More like this'}
            </button>
          ))}
        </div>

        <div className={`detail-tab-panel${tab === 'details' ? ' active' : ''}`}>
          <div className="detail-meta-line">
            {year && <span className="detail-meta-item">{year}</span>}
            {year && genre && <span className="detail-meta-sep">·</span>}
            {genre && <span className="detail-meta-item">{genre}</span>}
            {runtime && <><span className="detail-meta-sep">·</span><span className="detail-meta-item">{runtime}</span></>}
            {rating && <><span className="detail-meta-sep">·</span><span className="detail-age-tag">{rating}</span></>}
          </div>
          <div className="detail-layout">
            <p className="detail-desc">{movie.overview}</p>
            <div className="detail-sidebar">
              {director && (
                <div>
                  <div className="detail-fact-label">Director</div>
                  <div className="detail-fact-value">{director}</div>
                </div>
              )}
              {cast && (
                <div>
                  <div className="detail-fact-label">Cast</div>
                  <div className="detail-fact-value">{cast}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={`detail-tab-panel${tab === 'similar' ? ' active' : ''}`}>
          <div style={{ margin: '0 -48px' }}>
            <ContentRow title="" items={recs} />
          </div>
        </div>
      </div>
    </>
  );
}
