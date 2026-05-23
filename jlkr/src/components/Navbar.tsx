import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useProfile } from "../context/ProfileContext";

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

  // Logic to close when clicking outside if search is empty
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

  const initials = profile?.name
    ? profile.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  return (
    <nav className="fixed top-[14px] left-1/2 -translate-x-1/2 z-[100] h-11 bg-[#0f0f0f] backdrop-blur-md border-[0.5px] border-[#3a3a3a] rounded-full flex items-center px-[6px] shadow-[0_2px_16px_rgba(0,0,0,0.4)] w-fit max-w-[calc(100vw-48px)]">
      {/* Brand Logo */}
      <button
        className="flex items-center ml-2 mr-1 shrink-0 bg-transparent border-none cursor-pointer"
        onClick={() => navigate("/")}
        aria-label="Home"
      >
        <img src="/icon.svg" alt="jlkr" className="h-6 w-auto brightness-0 invert" />
      </button>

      {searchAllowed && (
        <>
          {/* Vertical Divider */}
          <div className="w-[1px] h-4 bg-[#3a3a3a] shrink-0" />

          {/* Search Container */}
          <div className="flex items-center ml-1">
            <div
              className={`overflow-hidden transition-[width] duration-[220ms] ease-in-out ${
                isOpen ? "w-[200px] max-[540px]:w-[130px]" : "w-0"
              }`}
            >
              <input
                ref={inputRef}
                className="w-full bg-transparent border-none py-[6px] px-2 text-[13px] text-white outline-none placeholder:text-[#555]"
                type="text"
                placeholder="Search..."
                autoComplete="off"
                value={query}
                onChange={handleInput}
                onBlur={handleBlur}
              />
            </div>

            <button
              className="w-9 h-9 rounded-full bg-transparent border-none text-[#555] cursor-pointer flex items-center justify-center transition-colors duration-150 shrink-0 hover:text-white hover:bg-white/[0.08]"
              onClick={isOpen ? closeSearch : openSearch}
              aria-label="Search"
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </button>
          </div>
        </>
      )}

      {/* Profile Button */}
      <button
        className="ml-0.5 w-9 h-9 rounded-full bg-transparent border-none cursor-pointer flex items-center justify-center transition-colors duration-150 shrink-0 hover:bg-white/[0.08]"
        onClick={handleProfileClick}
        aria-label="Switch profile"
      >
        <div className="w-[30px] h-[30px] rounded-full bg-[#333] border-[0.5px] border-[#444] flex items-center justify-center text-[12px] font-semibold text-[#ccc] uppercase">
          {initials}
        </div>
      </button>
    </nav>
  );
}
