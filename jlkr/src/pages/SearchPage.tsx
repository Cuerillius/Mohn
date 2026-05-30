import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { searchMulti } from "../services/tmdb";
import { keys } from "../lib/queryKeys";
import Poster from "@/components/Poster";

function getPageSize() {
  if (window.innerWidth <= 540) return 2;
  if (window.innerWidth <= 900) return 4;
  return 8;
}

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("q") ?? "";
  const [debouncedQ, setDebouncedQ] = useState(searchQuery);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const q = debouncedQ.trim();

  const { data: results = [], isFetching } = useQuery({
    queryKey: keys.search(q),
    queryFn: () => searchMulti(q),
    enabled: q.length > 0,
    staleTime: 2 * 60 * 1000,
  });

  const PAGE = getPageSize();
  const GAP = 10;
  const availW = window.innerWidth - 96;
  const pw = Math.floor((availW - (PAGE - 1) * GAP) / PAGE);
  const ph = Math.round(pw * 1.5);

  const displayQ = searchQuery.trim();

  return (
    <div className="pt-20 px-12 pb-10 max-[900px]:px-5">
      <div className="text-[13px] text-[#555] mb-5">
        {!displayQ
          ? "Type to search"
          : isFetching
            ? "Searching…"
            : `${results.length} result${results.length !== 1 ? "s" : ""} for "${displayQ}"`}
      </div>
      <div className="flex flex-wrap gap-[10px]">
        {results.map((item) => (
          <Poster
            key={`${item.media_type}:${item.id}`}
            item={item}
            width={pw}
            height={ph}
          />
        ))}
      </div>
      {displayQ && !isFetching && results.length === 0 && (
        <div className="text-[14px] text-[#555] mt-10">No results found</div>
      )}
    </div>
  );
}
