import { isTauri } from "./lib/platform";
const AppRouter = isTauri ? MemoryRouter : BrowserRouter;
import {
  MemoryRouter,
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ProfileProvider, useProfile } from "./context/ProfileContext";
import { SettingsProvider } from "./context/SettingsContext";
import Navbar from "./components/Navbar";
import ConfigWarningBanner from "./components/ConfigWarningBanner";
import HomePage from "./pages/HomePage";
import SearchPage from "./pages/SearchPage";
import MovieDetailPage from "./pages/MovieDetailPage";
import SeriesDetailPage from "./pages/SeriesDetailPage";
import LoginPage from "./pages/LoginPage";
import Player from "./pages/player/Player";
import ProfileSwitchPage from "./pages/ProfileSwitchPage";
import SettingsPage from "./pages/SettingsPage";
import { useSettings } from "./context/SettingsContext";
import OnboardingPage from "./pages/OnboardingPage";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";

function WithNavbar() {
  return (
    <>
      <Navbar />
      <ConfigWarningBanner />
      <Outlet />
    </>
  );
}

function RequireAuth() {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-background" />;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function RedirectIfAuth() {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-background" />;
  if (user) return <Navigate to="/" replace />;
  return <Outlet />;
}

function RequireOnboarding() {
  const { onboardingStep, loading } = useSettings();
  if (loading) return <div className="min-h-screen bg-background" />;
  if (onboardingStep !== -1) return <Navigate to="/onboarding" replace />;
  return <Outlet />;
}

function RequireProfile() {
  const { hasProfile } = useProfile();
  if (!hasProfile) return <Navigate to="/profile" replace />;
  return <Outlet />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<RedirectIfAuth />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>
      <Route element={<RequireAuth />}>
        <Route path="/onboarding" element={<OnboardingPage />} />

        <Route element={<RequireOnboarding />}>
          <Route path="/profile" element={<ProfileSwitchPage />} />
          <Route path="/settings" element={<SettingsPage />} />

          <Route element={<RequireProfile />}>
            <Route element={<WithNavbar />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/movie/:id" element={<MovieDetailPage />} />
              <Route path="/tv/:id" element={<SeriesDetailPage />} />
            </Route>
            <Route path="/play/:type/:id" element={<Player />} />
            <Route
              path="/play/:type/:id/:season/:episode"
              element={<Player />}
            />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ProfileProvider>
          <SettingsProvider>
            <AppRouter>
              <AppRoutes />
            </AppRouter>
          </SettingsProvider>
        </ProfileProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
