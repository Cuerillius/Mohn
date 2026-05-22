import { MemoryRouter, Routes, Route, Outlet } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import MovieDetailPage from './pages/MovieDetailPage';
import SeriesDetailPage from './pages/SeriesDetailPage';
import ProfilePage from './pages/ProfilePage';

const apiKey = import.meta.env.VITE_TMDB_API_KEY as string | undefined;

function MissingKey() {
  return (
    <div className="px-12 pt-20 bg-[#1f1f1f] min-h-screen text-[#aaa]">
      <h2 className="text-white mb-3">Missing TMDB API key</h2>
      <p className="mb-3">
        Add your TMDB Read Access Token to a{' '}
        <code className="bg-[#2a2a2a] px-[6px] py-[2px] rounded">.env</code>{' '}
        file in the project root:
      </p>
      <pre className="bg-[#2a2a2a] p-4 rounded-lg text-[13px]">VITE_TMDB_API_KEY=eyJhbGci...</pre>
      <p className="mt-4 text-[13px]">
        Get your token at <span className="text-white">themoviedb.org → Settings → API</span>
      </p>
    </div>
  );
}

function WithNavbar() {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<WithNavbar />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/movie/:id" element={<MovieDetailPage />} />
        <Route path="/tv/:id" element={<SeriesDetailPage />} />
      </Route>
      <Route path="/profile" element={<ProfilePage />} />
    </Routes>
  );
}

export default function App() {
  if (!apiKey || apiKey === 'your_tmdb_read_access_token_here') {
    return <MissingKey />;
  }
  return (
    <MemoryRouter>
      <AppRoutes />
    </MemoryRouter>
  );
}
