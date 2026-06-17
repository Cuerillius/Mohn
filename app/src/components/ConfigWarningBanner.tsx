import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, TriangleAlert } from "lucide-react";
import { useSettings } from "../context/SettingsContext";

export default function ConfigWarningBanner() {
  const { torboxKeySet, activeAddonUrls, loading } = useSettings();
  const navigate = useNavigate();

  const [dismissed, setDismissed] = useState(() => {
    return sessionStorage.getItem("config-warning-dismissed") === "true";
  });

  const noKey = !loading && !torboxKeySet;
  const noAddons = !loading && activeAddonUrls.length === 0;

  if (loading || (!noKey && !noAddons) || dismissed) return null;

  const bothMissing = noKey && noAddons;

  function dismiss() {
    sessionStorage.setItem("config-warning-dismissed", "true");
    setDismissed(true);
  }

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 flex items-center gap-3 border-t border-red-500/30 bg-red-950/90 px-5 py-3.5 text-sm text-red-300 backdrop-blur-sm">
      <TriangleAlert size={15} className="shrink-0 text-red-400" />

      {bothMissing ? (
        <span className="flex-1">
          No TorBox API key or addons configured — streaming won't work.{" "}
          <button
            onClick={() => navigate("/settings")}
            className="font-medium underline underline-offset-2 hover:text-red-100 transition-colors"
          >
            Add key
          </button>
          {" · "}
          <button
            onClick={() => navigate("/settings?tab=addons")}
            className="font-medium underline underline-offset-2 hover:text-red-100 transition-colors"
          >
            Add addon
          </button>
        </span>
      ) : noKey ? (
        <span className="flex-1">
          No TorBox API key set — streaming via torrents won't work.{" "}
          <button
            onClick={() => navigate("/settings")}
            className="font-medium underline underline-offset-2 hover:text-red-100 transition-colors"
          >
            Add key
          </button>
        </span>
      ) : (
        <span className="flex-1">
          No addons configured — nothing will provide stream sources.{" "}
          <button
            onClick={() => navigate("/settings?tab=addons")}
            className="font-medium underline underline-offset-2 hover:text-red-100 transition-colors"
          >
            Add addon
          </button>
        </span>
      )}

      <button
        onClick={dismiss}
        className="shrink-0 text-red-400/60 hover:text-red-300 transition-colors"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}
