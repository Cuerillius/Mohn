import { createContext, useContext, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPatch } from "../services/api";
import { useAuth } from "./AuthContext";
import { keys } from "../lib/queryKeys";

interface Settings {
  torboxKey: string;
  addonUrls: string[];
  inactiveAddonUrls: string[];
}

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

const EMPTY: Settings = { torboxKey: "", addonUrls: [], inactiveAddonUrls: [] };

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data = EMPTY, isLoading } = useQuery({
    queryKey: keys.settings(),
    queryFn: () =>
      apiGet<Settings>("/api/settings").then((s) => ({
        torboxKey: s.torboxKey ?? "",
        addonUrls: s.addonUrls ?? [],
        inactiveAddonUrls: s.inactiveAddonUrls ?? [],
      })),
    enabled: !!user,
    staleTime: Infinity,
  });

  function applyPatch(update: Partial<Settings>) {
    const current =
      queryClient.getQueryData<Settings>(keys.settings()) ?? EMPTY;
    const next = { ...current, ...update };
    queryClient.setQueryData(keys.settings(), next);
    apiPatch("/api/settings", update).catch(() => {});
  }

  const setTorboxKey = (key: string) => applyPatch({ torboxKey: key });

  const addAddonUrl = (url: string) =>
    applyPatch({ addonUrls: [...data.addonUrls, url] });

  const removeAddonUrl = (url: string) =>
    applyPatch({
      addonUrls: data.addonUrls.filter((u) => u !== url),
      inactiveAddonUrls: data.inactiveAddonUrls.filter((u) => u !== url),
    });

  const toggleAddonUrl = (url: string) =>
    applyPatch({
      inactiveAddonUrls: data.inactiveAddonUrls.includes(url)
        ? data.inactiveAddonUrls.filter((u) => u !== url)
        : [...data.inactiveAddonUrls, url],
    });

  const activeAddonUrls = data.addonUrls.filter(
    (u) => !data.inactiveAddonUrls.includes(u),
  );

  return (
    <SettingsContext.Provider
      value={{
        torboxKey: data.torboxKey,
        setTorboxKey,
        addonUrls: data.addonUrls,
        addAddonUrl,
        removeAddonUrl,
        inactiveAddonUrls: data.inactiveAddonUrls,
        toggleAddonUrl,
        activeAddonUrls,
        loading: isLoading,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be within SettingsProvider");
  return ctx;
}
