import {
  MemoryRouter,
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";

const isTauri = Boolean((window as any).__TAURI_INTERNALS__);
const AppRouter = isTauri ? MemoryRouter : BrowserRouter;
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ProfileProvider } from "./context/ProfileContext";
import { SettingsProvider } from "./context/SettingsContext";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import SearchPage from "./pages/SearchPage";
import MovieDetailPage from "./pages/MovieDetailPage";
import SeriesDetailPage from "./pages/SeriesDetailPage";
import LoginPage from "./pages/LoginPage";
import PlayerPage from "./pages/PlayerPage";
import ProfileSwitchPage from "./pages/ProfileSwitchPage";
import SettingsPage from "./pages/SettingsPage";

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
  if (loading) return <div className="min-h-screen bg-[#0f0f0f]" />;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function RequireProfile() {
  const hasProfile = Boolean(localStorage.getItem("jlkr_profile"));
  if (!hasProfile) return <Navigate to="/profile" replace />;
  return <Outlet />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<RequireAuth />}>
        <Route path="/profile" element={<ProfileSwitchPage />} />
        <Route path="settings" element={<SettingsPage />} />

        <Route element={<RequireProfile />}>
          <Route element={<WithNavbar />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/movie/:id" element={<MovieDetailPage />} />
            <Route path="/tv/:id" element={<SeriesDetailPage />} />
          </Route>
          <Route path="/play/:type/:id" element={<PlayerPage />} />
          <Route
            path="/play/:type/:id/:season/:episode"
            element={<PlayerPage />}
          />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ProfileProvider>
        <SettingsProvider>
          <AppRouter>
            <AppRoutes />
          </AppRouter>
        </SettingsProvider>
      </ProfileProvider>
    </AuthProvider>
  );
}
