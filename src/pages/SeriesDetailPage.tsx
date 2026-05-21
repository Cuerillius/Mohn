import { useState, useEffect } from 'react';
import { useNav } from '../context/NavContext';
import ContentRow from '../components/ContentRow';
import EpisodeRow from '../components/EpisodeRow';
import { getTV, getTVSeason, getTVRecs, imgUrl, itemYear } from '../services/tmdb';
import type { TMDBTVDetail, TMDBSeason, TMDBItem } from '../types/tmdb';

type Tab = 'details' | `season-${number}` | 'similar';

export default function SeriesDetailPage() {
  const { contentId, navigate } = useNav();
  const [show, setShow] = useState<TMDBTVDetail | null>(null);
  const [seasons, setSeasons] = useState<TMDBSeason[]>([]);
  const [recs, setRecs] = useState<TMDBItem[]>([]);
  const [tab, setTab] = useState<Tab>('details');

  useEffect(() => {
    if (!contentId) return;
    setShow(null);
    setSeasons([]);
    setRecs([]);
    setTab('details');

    Promise.all([getTV(contentId), getTVRecs(contentId)])
      .then(([tv, tvRecs]) => {
        setShow(tv);
        setRecs(tvRecs);
        const seasonNums = (tv.seasons ?? [])
          .filter(s => s.season_number > 0)
          .map(s => s.season_number);
        const nums = seasonNums.length
          ? seasonNums
          : Array.from({ length: tv.number_of_seasons }, (_, i) => i + 1);
        Promise.all(nums.map(n => getTVSeason(contentId, n)))
          .then(setSeasons)
          .catch(console.error);
      })
      .catch(console.error);
  }, [contentId]);

  if (!show) {
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

  const bg = imgUrl(show.backdrop_path, 'original');
  const year = itemYear(show);
  const genre = show.genres?.[0]?.name ?? '';
  const rating = show.vote_average ? `★ ${show.vote_average.toFixed(1)}` : '';
  const creator = show.created_by?.map(c => c.name).join(', ') ?? '';
  const cast = show.credits?.cast?.slice(0, 4).map(c => c.name).join(', ') ?? '';

  const tabs: { id: Tab; label: string }[] = [
    { id: 'details', label: 'Details' },
    ...seasons.map((s, i) => ({ id: `season-${i}` as Tab, label: `Season ${s.season_number}` })),
    { id: 'similar', label: 'More like this' },
  ];

  return (
    <>
      <div className="detail-hero">
        <div style={{
          position: 'absolute', inset: 0,
          ...(bg ? { backgroundImage: `url(${bg})`, backgroundSize: 'cover', backgroundPosition: 'center top' } : { background: '#1e2a3a' })
        }} />
        <div className="detail-hero-gradient" />
        <button className="detail-back" onClick={() => navigate('home')} aria-label="Back">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <div className="detail-hero-content">
          <div className="detail-title">{show.name ?? show.title}</div>
          <div className="detail-btns">
            <button className="btn-primary">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Play S1 E1
            </button>
            <button className="btn-secondary">+ My list</button>
          </div>
        </div>
      </div>

      <div className="detail-body">
        <div className="detail-tabs">
          {tabs.map(t => (
            <button
              key={t.id}
              className={`detail-tab${tab === t.id ? ' active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className={`detail-tab-panel${tab === 'details' ? ' active' : ''}`}>
          <div className="detail-meta-line">
            {year && <span className="detail-meta-item">{year}</span>}
            {year && genre && <span className="detail-meta-sep">·</span>}
            {genre && <span className="detail-meta-item">{genre}</span>}
            {show.number_of_seasons > 0 && (
              <><span className="detail-meta-sep">·</span>
              <span className="detail-meta-item">{show.number_of_seasons} season{show.number_of_seasons !== 1 ? 's' : ''}</span></>
            )}
            {show.number_of_episodes > 0 && (
              <><span className="detail-meta-sep">·</span>
              <span className="detail-meta-item">{show.number_of_episodes} episodes</span></>
            )}
            {rating && <><span className="detail-meta-sep">·</span><span className="detail-age-tag">{rating}</span></>}
          </div>
          <div className="detail-layout">
            <p className="detail-desc">{show.overview}</p>
            <div className="detail-sidebar">
              {creator && (
                <div>
                  <div className="detail-fact-label">Creator</div>
                  <div className="detail-fact-value">{creator}</div>
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

        {seasons.map((season, i) => (
          <div key={i} className={`detail-tab-panel${tab === `season-${i}` ? ' active' : ''}`}>
            <div className="episode-list">
              {season.episodes.map(ep => <EpisodeRow key={ep.episode_number} episode={ep} />)}
            </div>
          </div>
        ))}

        <div className={`detail-tab-panel${tab === 'similar' ? ' active' : ''}`}>
          <div style={{ margin: '0 -48px' }}>
            <ContentRow title="" items={recs} />
          </div>
        </div>
      </div>
    </>
  );
}
