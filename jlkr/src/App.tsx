import { MemoryRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProfileProvider } from './context/ProfileContext';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import MovieDetailPage from './pages/MovieDetailPage';
import SeriesDetailPage from './pages/SeriesDetailPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';

function WithNavbar() {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
}

function RequireAuth() {
  const { user, loading } = useAuth();
  // While session check is in-flight, render blank to avoid flash
  if (loading) return <div className="min-h-screen bg-[#1f1f1f]" />;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function RequireProfile() {
  const hasProfile = Boolean(localStorage.getItem('jlkr_profile'));
  if (!hasProfile) return <Navigate to="/profile" replace />;
  return <Outlet />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />

      {/* Authenticated */}
      <Route element={<RequireAuth />}>
        {/* Profile picker — auth required, no profile selection required */}
        <Route path="/profile" element={<ProfilePage />} />

        {/* Main app — profile selection required */}
        <Route element={<RequireProfile />}>
          <Route element={<WithNavbar />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/movie/:id" element={<MovieDetailPage />} />
            <Route path="/tv/:id" element={<SeriesDetailPage />} />
          </Route>
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ProfileProvider>
        <MemoryRouter>
          <AppRoutes />
        </MemoryRouter>
      </ProfileProvider>
    </AuthProvider>
  );
}
