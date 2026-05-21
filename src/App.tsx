import { NavProvider, useNav } from './context/NavContext';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import MovieDetailPage from './pages/MovieDetailPage';
import SeriesDetailPage from './pages/SeriesDetailPage';
import ProfilePage from './pages/ProfilePage';

const apiKey = import.meta.env.VITE_TMDB_API_KEY as string | undefined;

function Pages() {
  const { page } = useNav();
  return (
    <>
      <div className={`page${page === 'home' ? ' active' : ''}`}>
        <HomePage />
      </div>
      <div className={`page${page === 'search' ? ' active' : ''}`}>
        <SearchPage />
      </div>
      <div className={`page${page === 'detail' ? ' active' : ''}`}>
        <MovieDetailPage />
      </div>
      <div className={`page${page === 'series' ? ' active' : ''}`}>
        <SeriesDetailPage />
      </div>
      <div className={`page${page === 'profile' ? ' active' : ''}`}>
        <ProfilePage />
      </div>
    </>
  );
}

function MissingKey() {
  return (
    <div style={{ padding: '80px 48px', fontFamily: 'Inter, sans-serif', background: '#1f1f1f', minHeight: '100vh', color: '#aaa' }}>
      <h2 style={{ color: '#fff', marginBottom: 12 }}>Missing TMDB API key</h2>
      <p style={{ marginBottom: 12 }}>Add your TMDB Read Access Token to a <code style={{ background: '#2a2a2a', padding: '2px 6px', borderRadius: 4 }}>.env</code> file in the project root:</p>
      <pre style={{ background: '#2a2a2a', padding: 16, borderRadius: 8, fontSize: 13 }}>VITE_TMDB_API_KEY=eyJhbGci...</pre>
      <p style={{ marginTop: 16, fontSize: 13 }}>Get your token at <span style={{ color: '#fff' }}>themoviedb.org → Settings → API</span></p>
    </div>
  );
}

export default function App() {
  if (!apiKey || apiKey === 'your_tmdb_read_access_token_here') {
    return <MissingKey />;
  }
  return (
    <NavProvider>
      <Navbar />
      <Pages />
    </NavProvider>
  );
}
