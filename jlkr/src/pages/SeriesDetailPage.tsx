import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueries } from "@tanstack/react-query";
import MediaHero from "../components/MediaHero";
import ContentRow from "../components/ContentRow";
import EpisodeRow from "../components/EpisodeRow";
import {
  getTV,
  getTVSeason,
  getTVRecs,
  itemYear,
  getLogoUrl,
  getTrailerKey,
} from "../services/tmdb";
import { keys } from "../lib/queryKeys";
import type { TMDBSeason } from "../types/tmdb";
import { useWatchlist } from "../hooks/useWatchlist";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

export default function SeriesDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedSeason, setSelectedSeason] = useState(0);
  const [showTrailer, setShowTrailer] = useState(false);
  const { inList, toggle } = useWatchlist(id ?? "", "tv");

  const numId = Number(id);

  const { data: show } = useQuery({
    queryKey: keys.tv(numId),
    queryFn: () => getTV(numId),
    enabled: !!id,
  });

  const { data: recs = [] } = useQuery({
    queryKey: keys.tvRecs(numId),
    queryFn: () => getTVRecs(numId),
    enabled: !!id,
  });

  const seasonNumbers = useMemo(() => {
    if (!show) return [];
    const nums = (show.seasons ?? [])
      .filter((s) => s.season_number > 0)
      .map((s) => s.season_number);
    return nums.length
      ? nums
      : Array.from({ length: show.number_of_seasons }, (_, i) => i + 1);
  }, [show]);

  const seasonQueries = useQueries({
    queries: seasonNumbers.map((n) => ({
      queryKey: keys.tvSeason(numId, n),
      queryFn: () => getTVSeason(numId, n),
      enabled: !!id && seasonNumbers.length > 0,
    })),
  });

  const seasons = seasonQueries
    .map((q) => q.data)
    .filter(Boolean) as TMDBSeason[];

  const credits = [
    ...(show?.created_by?.length
      ? [
          {
            label: "Creator",
            value: show.created_by.map((c) => c.name).join(", "),
          },
        ]
      : []),
    ...(show?.credits?.cast?.length
      ? [
          {
            label: "Cast",
            value: show.credits.cast
              .slice(0, 4)
              .map((c) => c.name)
              .join(", "),
          },
        ]
      : []),
  ];

  const seasonsMeta = show?.number_of_seasons
    ? `${show.number_of_seasons} season${show.number_of_seasons !== 1 ? "s" : ""}`
    : undefined;

  const currentSeason = seasons[selectedSeason] ?? null;

  return (
    <div className="bg-background">
      <MediaHero
        backdropPath={show?.backdrop_path ?? null}
        title={show?.name ?? show?.title ?? ""}
        logoUrl={show ? getLogoUrl(show.images) : null}
        tagline={show?.tagline}
        year={show ? itemYear(show) : undefined}
        metaExtra={seasonsMeta}
        rating={show?.vote_average}
        genre={show?.genres?.[0]?.name}
        trailerKey={show ? getTrailerKey(show.videos) : null}
        showTrailer={showTrailer}
        onToggleTrailer={() => setShowTrailer((v) => !v)}
        overview={show?.overview}
        credits={credits}
        primaryLabel="Play S1 E1"
        onPlay={() => id && navigate(`/play/tv/${id}/1/1`)}
        inWatchlist={inList}
        onToggleWatchlist={toggle}
        onBack={() => navigate(-1)}
      />

      {seasons.length > 0 && (
        <div className="pt-8 pb-12">
          <div className="px-10 max-[900px]:px-6 mb-6 flex items-center gap-4">
            <Select
              value={String(selectedSeason)}
              onValueChange={(v) => setSelectedSeason(Number(v))}
            >
              <SelectTrigger className="w-auto min-w-[140px] bg-white/5 border-white/10 text-white font-semibold text-[14px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {seasons.map((s, i) => (
                  <SelectItem key={i} value={String(i)}>
                    Season {s.season_number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {currentSeason && (
              <span className="text-[12px] text-white/30">
                {currentSeason.episodes.length} episode
                {currentSeason.episodes.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {currentSeason && (
            <div className="px-10 max-[900px]:px-6">
              {currentSeason.episodes.map((ep) => (
                <EpisodeRow
                  key={ep.episode_number}
                  episode={ep}
                  onClick={() =>
                    navigate(
                      `/play/tv/${id}/${currentSeason.season_number}/${ep.episode_number}`,
                    )
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}

      {recs.length > 0 && (
        <div className="pt-2 pb-12">
          <p className="text-[11px] text-white/30 uppercase tracking-widest px-10 mb-4 max-[900px]:px-6">
            More like this
          </p>
          <ContentRow title="" items={recs} />
        </div>
      )}
    </div>
  );
}
