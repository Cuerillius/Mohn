import { useState, useEffect, useRef } from 'react';
import { useNav } from '../context/NavContext';

export default function Navbar() {
  const { navigate, setSearchQuery, searchQuery } = useNav();
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const openSearch = () => {
    setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const closeSearch = () => {
    setIsOpen(false);
    setSearchQuery('');
    navigate('home');
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (q.trim()) {
      navigate('search');
    } else {
      navigate('home');
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
    <nav className="nav">
      <span className="nav-logo" onClick={() => navigate('home')}>JLKR</span>
      <div className="nav-divider" />
      <div className={`nav-search-wrap${isOpen ? ' open' : ''}`}>
        <input
          ref={inputRef}
          className="nav-search"
          type="text"
          placeholder="Search..."
          autoComplete="off"
          value={searchQuery}
          onChange={handleInput}
        />
      </div>
      <button className="nav-icon-btn" onClick={isOpen ? closeSearch : openSearch} aria-label="Search">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
      </button>
      <button className="nav-icon-btn" onClick={() => navigate('profile')} aria-label="Account">
        <div className="nav-account-btn">JD</div>
      </button>
    </nav>
  );
}
