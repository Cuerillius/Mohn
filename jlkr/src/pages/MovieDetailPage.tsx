import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import MediaHero from "../components/MediaHero";
import ContentRow from "../components/ContentRow";
import {
  getMovie,
  getMovieRecs,
  itemYear,
  formatRuntime,
  getLogoUrl,
  getTrailerKey,
} from "../services/tmdb";
import { keys } from "../lib/queryKeys";
import { useWatchlist } from "../hooks/useWatchlist";

export default function MovieDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showTrailer, setShowTrailer] = useState(false);
  const { inList, toggle } = useWatchlist(id ?? "", "movie");

  const numId = Number(id);

  const { data: movie } = useQuery({
    queryKey: keys.movie(numId),
    queryFn: () => getMovie(numId),
    enabled: !!id,
  });

  const { data: recs = [] } = useQuery({
    queryKey: keys.movieRecs(numId),
    queryFn: () => getMovieRecs(numId),
    enabled: !!id,
  });

  const director = movie?.credits?.crew?.find((c) => c.job === "Director");
  const credits = [
    ...(director ? [{ label: "Director", value: director.name }] : []),
    ...(movie?.credits?.cast?.length
      ? [
          {
            label: "Cast",
            value: movie.credits.cast
              .slice(0, 4)
              .map((c) => c.name)
              .join(", "),
          },
        ]
      : []),
  ];

  return (
    <div className="bg-background">
      <MediaHero
        backdropPath={movie?.backdrop_path ?? null}
        title={movie?.title ?? ""}
        logoUrl={movie ? getLogoUrl(movie.images) : null}
        tagline={movie?.tagline}
        year={movie ? itemYear(movie) : undefined}
        metaExtra={movie?.runtime ? formatRuntime(movie.runtime) : undefined}
        rating={movie?.vote_average}
        genre={movie?.genres?.[0]?.name}
        trailerKey={movie ? getTrailerKey(movie.videos) : null}
        showTrailer={showTrailer}
        onToggleTrailer={() => setShowTrailer((v) => !v)}
        overview={movie?.overview}
        credits={credits}
        onPlay={() => id && navigate(`/play/movie/${id}`)}
        inWatchlist={inList}
        onToggleWatchlist={toggle}
        onBack={() => navigate(-1)}
      />

      {recs.length > 0 && (
        <div className="pt-8 pb-12">
          <p className="text-[11px] text-white/30 uppercase tracking-widest px-10 mb-4 max-[900px]:px-6">
            More like this
          </p>
          <ContentRow title="" items={recs} />
        </div>
      )}
    </div>
  );
}
