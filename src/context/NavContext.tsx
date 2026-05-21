import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

export type Page = 'home' | 'search' | 'detail' | 'series' | 'profile';

interface NavContextValue {
  page: Page;
  contentId: number | null;
  searchQuery: string;
  navigate: (page: Page, id?: number) => void;
  setSearchQuery: (q: string) => void;
}

const NavContext = createContext<NavContextValue | null>(null);

export function NavProvider({ children }: { children: ReactNode }) {
  const [page, setPage] = useState<Page>('home');
  const [contentId, setContentId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const navigate = useCallback((p: Page, id?: number) => {
    setPage(p);
    setContentId(id ?? null);
    if (p !== 'search') setSearchQuery('');
    window.scrollTo(0, 0);
  }, []);

  return (
    <NavContext.Provider value={{ page, contentId, searchQuery, navigate, setSearchQuery }}>
      {children}
    </NavContext.Provider>
  );
}

export function useNav() {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error('useNav must be used inside NavProvider');
  return ctx;
}
