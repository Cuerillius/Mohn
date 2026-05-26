import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import ContentRow from "../components/ContentRow";
import {
  getMovie,
  getMovieRecs,
  imgUrl,
  itemYear,
  formatRuntime,
} from "../services/tmdb";
import type { TMDBMovieDetail, TMDBItem } from "../types/tmdb";
import { useWatchlist } from "../hooks/useWatchlist";

type Tab = "details" | "similar";

const DETAIL_HERO_GRADIENT =
  "linear-gradient(to right, rgba(15,15,15,0.95) 30%, rgba(15,15,15,0.5) 60%, rgba(15,15,15,0.15) 100%), linear-gradient(to top, rgba(15,15,15,1) 0%, transparent 40%)";

const backBtnCls =
  "absolute top-5 left-12 z-10 w-9 h-9 rounded-full bg-background/70 border border-border text-muted-foreground cursor-pointer flex items-center justify-center transition-colors duration-150 shrink-0 hover:bg-muted hover:text-foreground";

export default function MovieDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [movie, setMovie] = useState<TMDBMovieDetail | null>(null);
  const [recs, setRecs] = useState<TMDBItem[]>([]);
  const [tab, setTab] = useState<Tab>("details");
  const { inList, toggle } = useWatchlist(id ?? "", "movie");

  useEffect(() => {
    if (!id) return;
    setMovie(null);
    setRecs([]);
    setTab("details");
    window.scrollTo(0, 0);
    Promise.all([getMovie(Number(id)), getMovieRecs(Number(id))])
      .then(([m, r]) => {
        setMovie(m);
        setRecs(r);
      })
      .catch(console.error);
  }, [id]);

  const handlePlay = () => {
    if (id) navigate(`/play/movie/${id}`);
  };

  if (!movie) {
    return (
      <>
        <div className="relative w-full aspect-video max-h-[520px] overflow-hidden bg-[#1e2a3a]">
          <div
            className="absolute inset-0"
            style={{ background: DETAIL_HERO_GRADIENT }}
          />
          <button
            className={backBtnCls}
            onClick={() => navigate(-1)}
            aria-label="Back"
          >
            <ArrowLeft size={16} />
          </button>
        </div>
        <div className="px-12 pb-10 max-[900px]:px-5" />
      </>
    );
  }

  const bg = imgUrl(movie.backdrop_path, "original");
  const year = itemYear(movie);
  const genre = movie.genres?.[0]?.name ?? "";
  const runtime = movie.runtime ? formatRuntime(movie.runtime) : "";
  const rating = movie.vote_average ? `★ ${movie.vote_average.toFixed(1)}` : "";
  const director =
    movie.credits?.crew?.find((c) => c.job === "Director")?.name ?? "";
  const cast =
    movie.credits?.cast
      ?.slice(0, 4)
      .map((c) => c.name)
      .join(", ") ?? "";

  return (
    <>
      <div className="relative w-full aspect-video max-h-[520px] overflow-hidden bg-[#2a2a2a]">
        <div
          style={{
            position: "absolute",
            inset: 0,
            ...(bg
              ? {
                  backgroundImage: `url(${bg})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center top",
                }
              : { background: "#1e2a3a" }),
          }}
        />
        <div
          className="absolute inset-0"
          style={{ background: DETAIL_HERO_GRADIENT }}
        />
        <button
          className={backBtnCls}
          onClick={() => navigate(-1)}
          aria-label="Back"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="absolute bottom-9 left-12 right-12 max-[900px]:left-6 max-[900px]:right-6 max-[900px]:bottom-6">
          <div className="text-[36px] font-medium mb-[10px] leading-[1.1] max-[900px]:text-2xl">
            {movie.title}
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex gap-[10px]">
              <button
                onClick={handlePlay}
                className="inline-flex items-center gap-[7px] bg-white text-black text-[13px] font-medium py-[9px] px-[22px] rounded-lg border-none cursor-pointer transition-opacity duration-150 hover:opacity-[0.88]"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                Play
              </button>
              <button
                onClick={toggle}
                className="inline-flex items-center gap-[7px] bg-[#2a2a2a] text-[#aaa] text-[13px] font-normal py-[9px] px-5 rounded-lg border-none cursor-pointer transition-colors duration-150 hover:bg-[#333]"
              >
                {inList ? "✓ In list" : "+ My list"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-12 pb-10 max-[900px]:px-5">
        <div className="flex border-b-[0.5px] border-[#2e2e2e] mb-8">
          {(["details", "similar"] as Tab[]).map((t) => (
            <button
              key={t}
              className={`text-[13px] font-normal py-[14px] mr-7 bg-transparent border-none border-b-2 cursor-pointer transition-colors duration-150 -mb-px ${tab === t ? "text-white border-white" : "text-[#555] border-transparent hover:text-[#aaa]"}`}
              onClick={() => setTab(t)}
            >
              {t === "details" ? "Details" : "More like this"}
            </button>
          ))}
        </div>

        <div className={tab === "details" ? "block" : "hidden"}>
          <div className="flex gap-[10px] items-center mb-5 flex-wrap">
            {year && (
              <span className="text-sm font-medium text-white">{year}</span>
            )}
            {year && genre && <span className="text-[#555] text-xs">·</span>}
            {genre && (
              <span className="text-sm font-medium text-white">{genre}</span>
            )}
            {runtime && (
              <>
                <span className="text-[#555] text-xs">·</span>
                <span className="text-sm font-medium text-white">
                  {runtime}
                </span>
              </>
            )}
            {rating && (
              <>
                <span className="text-[#555] text-xs">·</span>
                <span className="text-xs text-[#aaa] border-[0.5px] border-[#3a3a3a] rounded-[3px] py-[2px] px-[7px]">
                  {rating}
                </span>
              </>
            )}
          </div>
          <div className="grid grid-cols-[1fr_200px] gap-10 items-start max-[900px]:grid-cols-1 max-[900px]:gap-6">
            <p className="text-sm text-[#aaa] leading-[1.75]">
              {movie.overview}
            </p>
            <div className="flex flex-col gap-[18px]">
              {director && (
                <div>
                  <div className="text-[11px] text-[#555] mb-[3px]">
                    Director
                  </div>
                  <div className="text-[13px] text-white leading-[1.5]">
                    {director}
                  </div>
                </div>
              )}
              {cast && (
                <div>
                  <div className="text-[11px] text-[#555] mb-[3px]">Cast</div>
                  <div className="text-[13px] text-white leading-[1.5]">
                    {cast}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={tab === "similar" ? "block" : "hidden"}>
          <div className="-mx-12 max-[900px]:-mx-5">
            <ContentRow title="" items={recs} />
          </div>
        </div>
      </div>
    </>
  );
}
