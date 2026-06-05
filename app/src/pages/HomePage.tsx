import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, TriangleAlert } from "lucide-react";
import Hero from "../components/Hero";
import ContentRow from "../components/ContentRow";
import GenreChips from "../components/GenreChips";
import useHomeData from "../hooks/useHomeData";
import { useSettings } from "../context/SettingsContext";

export default function HomePage() {
  const {
    heroItems,
    trending,
    movies,
    tv,
    myList,
    recommended,
    becauseOf,
    topRated,
    continueItems,
    continueExtras,
    watchAgainItems,
  } = useHomeData();
  const { torboxKey, activeAddonUrls, loading } = useSettings();
  const navigate = useNavigate();

  const [dismissed, setDismissed] = useState(false);

  const noKey = !loading && !torboxKey;
  const noAddons = !loading && activeAddonUrls.length === 0;
  const show = (noKey || noAddons) && !dismissed;

  // Build the message and actions based on what's missing
  const bothMissing = noKey && noAddons;

  return (
    <div className="scrollbar-none">
      <Hero items={heroItems} />
      <div className="pt-2 pb-10">
        {continueItems.length > 0 && (
          <ContentRow
            title="Continue Watching"
            items={continueItems}
            itemExtras={continueExtras}
          />
        )}
        {myList.length > 0 && <ContentRow title="My List" items={myList} />}
        {recommended.length > 0 && (
          <ContentRow title="Recommended for You" items={recommended} />
        )}
        {becauseOf && becauseOf.items.length > 0 && (
          <ContentRow title={becauseOf.title} items={becauseOf.items} />
        )}
        <ContentRow title="Trending This Week" items={trending} />
        <ContentRow title="Popular Movies" items={movies} />
        <ContentRow title="Popular Series" items={tv} />
        <GenreChips />
        {topRated.length > 0 && (
          <ContentRow title="Award Winning" items={topRated} />
        )}
        {watchAgainItems.length > 0 && (
          <ContentRow title="Watch It Again" items={watchAgainItems} />
        )}
      </div>

      {show && (
        <div className="fixed bottom-0 inset-x-0 z-50 flex items-center gap-3 border-t border-amber-500/30 bg-amber-950/90 px-5 py-3.5 text-sm text-amber-300 backdrop-blur-sm">
          <TriangleAlert size={15} className="shrink-0 text-amber-400" />

          {bothMissing ? (
            <span className="flex-1">
              No TorBox API key or addons configured — streaming won't work.{" "}
              <button
                onClick={() => navigate("/settings")}
                className="font-medium underline underline-offset-2 hover:text-amber-100 transition-colors"
              >
                Add key
              </button>
              {" · "}
              <button
                onClick={() => navigate("/settings?tab=addons")}
                className="font-medium underline underline-offset-2 hover:text-amber-100 transition-colors"
              >
                Add addon
              </button>
            </span>
          ) : noKey ? (
            <span className="flex-1">
              No TorBox API key set — streaming via torrents won't work.{" "}
              <button
                onClick={() => navigate("/settings")}
                className="font-medium underline underline-offset-2 hover:text-amber-100 transition-colors"
              >
                Add key
              </button>
            </span>
          ) : (
            <span className="flex-1">
              No addons configured — nothing will provide stream sources.{" "}
              <button
                onClick={() => navigate("/settings?tab=addons")}
                className="font-medium underline underline-offset-2 hover:text-amber-100 transition-colors"
              >
                Add addon
              </button>
            </span>
          )}

          <button
            onClick={() => setDismissed(true)}
            className="shrink-0 text-amber-400/60 hover:text-amber-300 transition-colors"
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
