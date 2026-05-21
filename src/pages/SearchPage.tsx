import { useState, useEffect } from 'react';
import { useNav } from '../context/NavContext';
import { searchMulti, imgUrl, itemTitle } from '../services/tmdb';
import type { TMDBItem } from '../types/tmdb';

function getPageSize() {
  if (window.innerWidth <= 540) return 2;
  if (window.innerWidth <= 900) return 4;
  return 8;
}

export default function SearchPage() {
  const { searchQuery, navigate } = useNav();
  const [results, setResults] = useState<TMDBItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) { setResults([]); return; }
    setLoading(true);
    const timer = setTimeout(() => {
      searchMulti(q)
        .then(setResults)
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const q = searchQuery.trim();
  const PAGE = getPageSize();
  const GAP = 10;
  const availW = window.innerWidth - 96;
  const pw = Math.floor((availW - (PAGE - 1) * GAP) / PAGE);
  const ph = Math.round(pw * 1.5);

  return (
    <div style={{ padding: '80px 48px 40px' }}>
      <div className="search-results-label">
        {!q
          ? 'Type to search'
          : loading
          ? 'Searching…'
          : `${results.length} result${results.length !== 1 ? 's' : ''} for "${q}"`}
      </div>
      <div className="search-grid">
        {results.map(item => {
          const poster = imgUrl(item.poster_path, 'w342');
          const title = itemTitle(item);
          const type = item.media_type === 'tv' ? 'series' : 'detail';
          return (
            <div
              key={item.id}
              className="poster"
              style={{ width: pw, height: ph }}
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
        })}
      </div>
      {q && !loading && results.length === 0 && (
        <div className="search-empty">No results found</div>
      )}
    </div>
  );
}
