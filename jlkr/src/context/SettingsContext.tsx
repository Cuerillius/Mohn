import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { apiGet, apiPatch } from '../services/api';
import { useAuth } from './AuthContext';

interface SettingsContextValue {
  torboxKey: string;
  setTorboxKey: (key: string) => void;
  addonUrls: string[];
  addAddonUrl: (url: string) => void;
  removeAddonUrl: (url: string) => void;
  loading: boolean;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [torboxKey, setTorboxKeyState] = useState('');
  const [addonUrls, setAddonUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    apiGet<{ torboxKey: string; addonUrls: string[] }>('/api/settings')
      .then((s) => { setTorboxKeyState(s.torboxKey); setAddonUrls(s.addonUrls); })
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
  };

  return (
    <SettingsContext.Provider value={{ torboxKey, setTorboxKey, addonUrls, addAddonUrl, removeAddonUrl, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
