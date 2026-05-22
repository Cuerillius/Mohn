import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';


export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [isOpen, setIsOpen] = useState(() => !!searchParams.get('q'));
  const [query, setQuery] = useState(() => searchParams.get('q') ?? '');

  const searchAllowed = location.pathname === '/' || location.pathname === '/search' || location.pathname.startsWith('/movie/') || location.pathname.startsWith('/tv/');
  const inputRef = useRef<HTMLInputElement>(null);

  const openSearch = () => {
    setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const closeSearch = () => {
    setIsOpen(false);
    setQuery('');
    navigate('/');
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setQuery(q);
    if (q.trim()) {
      navigate(`/search?q=${encodeURIComponent(q.trim())}`);
    } else {
      navigate('/');
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSearch();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <nav className="fixed top-[14px] left-1/2 -translate-x-1/2 z-[100] h-11 bg-[rgba(30,30,30,0.85)] backdrop-blur-md border-[0.5px] border-[#3a3a3a] rounded-full flex items-center pl-4 pr-2 gap-2 w-fit max-w-[calc(100vw-48px)] shadow-[0_2px_16px_rgba(0,0,0,0.4)]">
      <span
        className="text-[13px] font-semibold text-white tracking-[0.1em] cursor-pointer whitespace-nowrap shrink-0"
        onClick={() => navigate('/')}
      >
        JLKR
      </span>
      {searchAllowed && (
        <>
          <div className="w-[0.5px] h-4 bg-[#3a3a3a] shrink-0" />
          <div className={`overflow-hidden transition-[width] duration-[220ms] ease-in-out ${isOpen ? 'w-[200px] max-[540px]:w-[130px]' : 'w-0'}`}>
            <input
              ref={inputRef}
              className="w-[200px] max-[540px]:w-[130px] bg-transparent border-none py-[6px] px-1 text-[13px] text-white outline-none placeholder:text-[#555]"
              type="text"
              placeholder="Search..."
              autoComplete="off"
              value={query}
              onChange={handleInput}
            />
          </div>
          <button
            className="w-8 h-8 rounded-full bg-transparent border-none text-[#555] cursor-pointer flex items-center justify-center transition-colors duration-150 shrink-0 hover:text-white hover:bg-white/[0.08]"
            onClick={isOpen ? closeSearch : openSearch}
            aria-label="Search"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </button>
        </>
      )}
      <button
        className="w-8 h-8 rounded-full bg-transparent border-none text-[#555] cursor-pointer flex items-center justify-center transition-colors duration-150 shrink-0 hover:text-white hover:bg-white/[0.08]"
        onClick={() => navigate('/profile')}
        aria-label="Account"
      >
        <div className="w-7 h-7 rounded-full bg-[#333] border-[0.5px] border-[#444] flex items-center justify-center text-[11px] font-medium text-[#aaa]">
          JD
        </div>
      </button>
    </nav>
  );
}
