import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { searchMulti, imgUrl, itemTitle } from "../services/tmdb";
import type { TMDBItem } from "../types/tmdb";
import Poster from "@/components/Poster";

function getPageSize() {
  if (window.innerWidth <= 540) return 2;
  if (window.innerWidth <= 900) return 4;
  return 8;
}

export default function SearchPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("q") ?? "";
  const [results, setResults] = useState<TMDBItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setResults([]);
      return;
    }
    setLoading(true);
    const timer = setTimeout(() => {
      searchMulti(q)
        .then(setResults)
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const q = searchQuery.trim();
  const PAGE = getPageSize();
  const GAP = 10;
  const availW = window.innerWidth - 96;
  const pw = Math.floor((availW - (PAGE - 1) * GAP) / PAGE);
  const ph = Math.round(pw * 1.5);

  return (
    <div className="pt-20 px-12 pb-10 max-[900px]:px-5">
      <div className="text-[13px] text-[#555] mb-5">
        {!q
          ? "Type to search"
          : loading
            ? "Searching…"
            : `${results.length} result${results.length !== 1 ? "s" : ""} for "${q}"`}
      </div>
      <div className="flex flex-wrap gap-[10px]">
        {results.map((item) => {
          return (
            <Poster
              key={`${item.media_type}:${item.id}`}
              item={item}
              width={pw}
              height={ph}
            />
          );
        })}
      </div>
      {q && !loading && results.length === 0 && (
        <div className="text-[14px] text-[#555] mt-10">No results found</div>
      )}
    </div>
  );
}
