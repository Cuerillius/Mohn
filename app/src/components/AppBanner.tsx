import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { X, TriangleAlert, ArrowUpCircle } from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import { downloadUpdate, restartToUpdate } from "../lib/updater";

type Tone = "warning" | "info";

const toneStyles: Record<Tone, string> = {
  warning: "border-red-500/30 bg-red-950/90 text-red-300",
  info: "border-emerald-500/30 bg-emerald-950/90 text-emerald-300",
};
const iconStyles: Record<Tone, string> = {
  warning: "text-red-400",
  info: "text-emerald-400",
};
const dismissStyles: Record<Tone, string> = {
  warning: "text-red-400/60 hover:text-red-300",
  info: "text-emerald-400/60 hover:text-emerald-300",
};

type Banner = {
  id: string;
  tone: Tone;
  icon: ReactNode;
  message: ReactNode;
};

/**
 * Single bottom banner shared by all app-wide notices. Banners are shown one at
 * a time by priority order (first match wins). Rendered inside WithNavbar, so
 * it's automatically hidden in the player.
 */
export default function AppBanner() {
  const { torboxKeySet, activeAddonUrls, loading } = useSettings();
  const navigate = useNavigate();

  const [updateVersion, setUpdateVersion] = useState<string | null>(null);
  const [restarting, setRestarting] = useState(false);

  const [dismissed, setDismissed] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(sessionStorage.getItem("dismissed-banners") ?? "{}");
    } catch {
      return {};
    }
  });

  useEffect(() => {
    let cancelled = false;
    void downloadUpdate().then((update) => {
      if (!cancelled && update) setUpdateVersion(update.version);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function dismiss(id: string) {
    const next = { ...dismissed, [id]: true };
    sessionStorage.setItem("dismissed-banners", JSON.stringify(next));
    setDismissed(next);
  }

  const link = (label: string, to: string) => (
    <button
      onClick={() => navigate(to)}
      className="font-medium underline underline-offset-2 hover:opacity-80 transition-opacity"
    >
      {label}
    </button>
  );

  // Highest priority first.
  const banners: Banner[] = [];

  const noKey = !loading && !torboxKeySet;
  const noAddons = !loading && activeAddonUrls.length === 0;
  if (noKey || noAddons) {
    banners.push({
      id: "config-warning",
      tone: "warning",
      icon: <TriangleAlert size={15} className="shrink-0" />,
      message:
        noKey && noAddons ? (
          <>
            No TorBox API key or addons configured — streaming won't work.{" "}
            {link("Add key", "/settings")}
            {" · "}
            {link("Add addon", "/settings?tab=addons")}
          </>
        ) : noKey ? (
          <>
            No TorBox API key set — streaming via torrents won't work.{" "}
            {link("Add key", "/settings")}
          </>
        ) : (
          <>
            No addons configured — nothing will provide stream sources.{" "}
            {link("Add addon", "/settings?tab=addons")}
          </>
        ),
    });
  }

  if (updateVersion) {
    banners.push({
      id: "update-ready",
      tone: "info",
      icon: <ArrowUpCircle size={15} className="shrink-0" />,
      message: (
        <>
          Mohn {updateVersion} is ready to install.{" "}
          <button
            onClick={() => {
              setRestarting(true);
              void restartToUpdate();
            }}
            disabled={restarting}
            className="font-medium underline underline-offset-2 hover:opacity-80 transition-opacity disabled:opacity-60"
          >
            {restarting ? "Restarting…" : "Restart now"}
          </button>
        </>
      ),
    });
  }

  const active = banners.find((b) => !dismissed[b.id]);
  if (!active) return null;

  return (
    <div
      className={`fixed bottom-0 inset-x-0 z-50 flex items-center gap-3 border-t px-5 py-3.5 text-sm backdrop-blur-sm ${toneStyles[active.tone]}`}
    >
      <span className={iconStyles[active.tone]}>{active.icon}</span>
      <span className="flex-1">{active.message}</span>
      <button
        onClick={() => dismiss(active.id)}
        className={`shrink-0 transition-colors ${dismissStyles[active.tone]}`}
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}
