import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useProfile } from "../context/ProfileContext";
import Avatar from "./Avatar";
import { Separator } from "./ui/separator";
import { Delete, Search } from "lucide-react";
import { Button } from "./ui/button";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [isOpen, setIsOpen] = useState(() => !!searchParams.get("q"));
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const { profile, clearProfile } = useProfile();

  const searchAllowed =
    location.pathname === "/" ||
    location.pathname === "/search" ||
    location.pathname.startsWith("/movie/") ||
    location.pathname.startsWith("/tv/");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (query === (searchParams.get("q") ?? "")) return;

    const handler = setTimeout(() => {
      if (query.trim()) {
        if (location.pathname === "/" || location.pathname === "/search") {
          navigate(`/search?q=${encodeURIComponent(query.trim())}`, {
            replace: true,
          });
        }
      } else if (location.pathname === "/search") {
        navigate("/");
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [query, navigate, location.pathname, searchParams]);

  const openSearch = () => {
    setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const closeSearch = () => {
    setIsOpen(false);
    setQuery("");
    if (location.pathname === "/search") navigate("/");
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setQuery(q);
    if (q.trim()) {
      navigate(`/search?q=${encodeURIComponent(q.trim())}`);
    } else {
      navigate("/");
    }
  };

  const handleBlur = () => {
    if (query.trim() === "") {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSearch();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleProfileClick = () => {
    clearProfile();
    navigate("/profile");
  };

  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-100 bg-background border rounded-full flex items-center p-2">
      <button
        className="ml-2 flex items-center gap-2"
        onClick={() => navigate("/")}
        aria-label="Home"
      >
        <img src="/mohn.svg" alt="Mohn" className="size-8" />
        <span className="font-bold">Mohn</span>
      </button>

      {searchAllowed && (
        <>
          <Separator orientation="vertical" className="m-2" />

          <div className="flex items-center">
            <div
              className={`overflow-hidden transition-[width] duration-220 ease-in-out ${
                isOpen ? "w-50 " : "w-0"
              }`}
            >
              <input
                ref={inputRef}
                className="w-full py-1.5 px-2 text-sm text-white outline-none placeholder:text-white/50"
                type="text"
                placeholder="Search..."
                autoComplete="off"
                value={query}
                onChange={handleInput}
                onBlur={handleBlur}
              />
            </div>
            <Button
              variant="ghost"
              size="icon-lg"
              className="text-white/50"
              onClick={isOpen ? closeSearch : openSearch}
            >
              {isOpen ? <Delete /> : <Search />}
            </Button>
          </div>
        </>
      )}

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
