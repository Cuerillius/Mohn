import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useProfile } from "../context/ProfileContext";
import Avatar from "./Avatar";
import { Separator } from "./ui/separator";
import { Search, X } from "lucide-react";
import { Button } from "./ui/button";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const initialQuery = searchParams.get("q") ?? "";
  const [isOpen, setIsOpen] = useState(() => !!initialQuery);
  const [query, setQuery] = useState(() => initialQuery);

  const { profile, clearProfile } = useProfile();
  const inputRef = useRef<HTMLInputElement>(null);
  const prevPathRef = useRef<string>(location.pathname === "/search" ? "/" : location.pathname);

  useEffect(() => {
    if (query === (searchParams.get("q") ?? "")) return;

    const timer = setTimeout(() => {
      if (query.trim()) {
        navigate(`/search?q=${encodeURIComponent(query.trim())}`, {
          replace: location.pathname === "/search",
        });
      } else if (!query.trim() && location.pathname === "/search") {
        navigate(prevPathRef.current);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, navigate, location.pathname, searchParams]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSearch();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [location.pathname]);

  const openSearch = () => {
    if (location.pathname !== "/search") {
      prevPathRef.current = location.pathname;
    }
    setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const closeSearch = useCallback(() => {
    setIsOpen(false);
    setQuery("");
    if (location.pathname === "/search") navigate(prevPathRef.current);
  }, [location.pathname, navigate]);

  const routeHome = () => {
    closeSearch();
    navigate("/");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleBlur = () => {
    if (!query.trim()) closeSearch();
  };

  const handleProfileClick = () => {
    clearProfile();
  };

  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-100 bg-background border rounded-full flex items-center p-2">
      <button
        className="ml-1 flex items-center gap-1"
        onClick={routeHome}
        aria-label="Home"
      >
        <img src="/mohn.svg" alt="Mohn" className="size-10" />
        <span className="font-bold">Mohn</span>
      </button>

      <Separator orientation="vertical" className="m-2" />

      <div className="flex items-center">
        <div
          className={[
            "overflow-hidden transition-[width] duration-220 ease-in-out",
            isOpen ? "w-50" : "w-0",
          ].join(" ")}
        >
          <input
            ref={inputRef}
            type="text"
            placeholder="Search..."
            autoComplete="off"
            value={query}
            onChange={handleChange}
            onBlur={handleBlur}
            className="w-full py-1.5 px-2 text-sm text-white outline-none placeholder:text-white/50"
          />
        </div>

        <Button
          variant="ghost"
          size="icon-lg"
          className="text-white/50"
          onClick={isOpen ? closeSearch : openSearch}
          aria-label={isOpen ? "Close search" : "Open search"}
        >
          {isOpen ? <X /> : <Search />}
        </Button>
      </div>

      <button
        className="shrink-0 ml-2 rounded-full ring-2 ring-transparent transition-all duration-150 hover:ring-white"
        onClick={handleProfileClick}
        aria-label="Switch profile"
      >
        <Avatar name={profile?.name ?? "?"} className="size-9 rounded-full" />
      </button>
    </nav>
  );
}
