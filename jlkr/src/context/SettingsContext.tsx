import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { apiGet, apiPatch } from '../services/api';
import { useAuth } from './AuthContext';

interface SettingsContextValue {
  torboxKey: string;
  setTorboxKey: (key: string) => void;
  addonUrls: string[];
  addAddonUrl: (url: string) => void;
  removeAddonUrl: (url: string) => void;
  inactiveAddonUrls: string[];
  toggleAddonUrl: (url: string) => void;
  activeAddonUrls: string[];
  loading: boolean;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [torboxKey, setTorboxKeyState] = useState('');
  const [addonUrls, setAddonUrls] = useState<string[]>([]);
  const [inactiveAddonUrls, setInactiveAddonUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    apiGet<{ torboxKey: string; addonUrls: string[]; inactiveAddonUrls: string[] }>('/api/settings')
      .then((s) => {
        setTorboxKeyState(s.torboxKey);
        setAddonUrls(s.addonUrls);
        setInactiveAddonUrls(s.inactiveAddonUrls ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id]);

  const setTorboxKey = (key: string) => {
    setTorboxKeyState(key);
    apiPatch('/api/settings', { torboxKey: key }).catch(() => {});
  };

  const addAddonUrl = (url: string) => {
    setAddonUrls((prev) => {
      const next = [...prev, url];
      apiPatch('/api/settings', { addonUrls: next }).catch(() => {});
      return next;
    });
  };

  const removeAddonUrl = (url: string) => {
    setAddonUrls((prev) => {
      const next = prev.filter((u) => u !== url);
      apiPatch('/api/settings', { addonUrls: next }).catch(() => {});
      return next;
    });
    // also remove from inactive if present
    setInactiveAddonUrls((prev) => {
      const next = prev.filter((u) => u !== url);
      apiPatch('/api/settings', { inactiveAddonUrls: next }).catch(() => {});
      return next;
    });
  };

  const toggleAddonUrl = (url: string) => {
    setInactiveAddonUrls((prev) => {
      const next = prev.includes(url)
        ? prev.filter((u) => u !== url)
        : [...prev, url];
      apiPatch('/api/settings', { inactiveAddonUrls: next }).catch(() => {});
      return next;
    });
  };

  const activeAddonUrls = addonUrls.filter((u) => !inactiveAddonUrls.includes(u));

  return (
    <SettingsContext.Provider value={{
      torboxKey, setTorboxKey,
      addonUrls, addAddonUrl, removeAddonUrl,
      inactiveAddonUrls, toggleAddonUrl, activeAddonUrls,
      loading,
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
