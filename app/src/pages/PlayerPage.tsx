import { useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSettings } from "../context/SettingsContext";
import { useProfile } from "../context/ProfileContext";
import { usePlayerSession } from "../player/session/usePlayerSession";
import PlayerView from "../player/ui/PlayerView";

export default function PlayerPage() {
  const { type, id, season, episode } = useParams<{
    type: string;
    id: string;
    season?: string;
    episode?: string;
  }>();
  const navigate = useNavigate();
  const { activeAddonUrls, loading: settingsLoading } = useSettings();
  const { profile } = useProfile();

  const videoRef = useRef<HTMLVideoElement>(null);

  // Transparent full-screen styling while the player is mounted.
  useEffect(() => {
    document.documentElement.classList.add("player-page");
    document.body.classList.add("player-page");
    return () => {
      document.documentElement.classList.remove("player-page");
      document.body.classList.remove("player-page");
    };
  }, []);

  const snapshot = usePlayerSession({
    type: type === "tv" ? "tv" : "movie",
    tmdbId: id,
    season,
    episode,
    activeAddonUrls,
    settingsLoading,
    profileId: profile?.id,
    videoRef,
  });

  return <PlayerView s={snapshot} videoRef={videoRef} onBack={() => navigate(-1)} />;
}
