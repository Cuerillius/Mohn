import { createContext, useContext, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPatch } from "../services/api";
import { useAuth } from "./AuthContext";
import { keys } from "../lib/queryKeys";

interface Settings {
  torboxKeySet: boolean;
  addonUrls: string[];
  inactiveAddonUrls: string[];
  onboardingStep: number;
}

interface SettingsContextValue {
  torboxKeySet: boolean;
  setTorboxKey: (key: string) => void;
  addonUrls: string[];
  addAddonUrl: (url: string) => void;
  removeAddonUrl: (url: string) => void;
  reorderAddonUrls: (urls: string[]) => void;
  inactiveAddonUrls: string[];
  toggleAddonUrl: (url: string) => void;
  activeAddonUrls: string[];
  onboardingStep: number;
  setOnboardingStep: (step: number) => void;
  loading: boolean;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

const EMPTY: Settings = { torboxKeySet: false, addonUrls: [], inactiveAddonUrls: [], onboardingStep: 1 };

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data = EMPTY, isLoading } = useQuery({
    queryKey: keys.settings(),
    queryFn: () =>
      apiGet<{ torboxKeySet: boolean; addonUrls: string[]; inactiveAddonUrls: string[]; onboardingStep: number }>("/api/settings").then((s) => ({
        torboxKeySet: !!s.torboxKeySet,
        addonUrls: s.addonUrls ?? [],
        inactiveAddonUrls: s.inactiveAddonUrls ?? [],
        onboardingStep: s.onboardingStep ?? 1,
      })),
    enabled: !!user,
    staleTime: Infinity,
  });

  function applyPatch(update: Partial<Omit<Settings, 'torboxKeySet'>>) {
    const current = queryClient.getQueryData<Settings>(keys.settings()) ?? EMPTY;
    const next = { ...current, ...update };
    queryClient.setQueryData(keys.settings(), next);
    apiPatch("/api/settings", update).catch(() => {});
  }

  const setTorboxKey = (key: string) => {
    const current = queryClient.getQueryData<Settings>(keys.settings()) ?? EMPTY;
    queryClient.setQueryData(keys.settings(), { ...current, torboxKeySet: !!key });
    apiPatch("/api/settings", { torboxKey: key }).catch(() => {});
  };

  const setOnboardingStep = (step: number) => applyPatch({ onboardingStep: step });

  const addAddonUrl = (url: string) =>
    applyPatch({ addonUrls: [...data.addonUrls, url] });

  const removeAddonUrl = (url: string) =>
    applyPatch({
      addonUrls: data.addonUrls.filter((u) => u !== url),
      inactiveAddonUrls: data.inactiveAddonUrls.filter((u) => u !== url),
    });

  const reorderAddonUrls = (urls: string[]) => applyPatch({ addonUrls: urls });

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
        torboxKeySet: data.torboxKeySet,
        setTorboxKey,
        addonUrls: data.addonUrls,
        addAddonUrl,
        removeAddonUrl,
        reorderAddonUrls,
        inactiveAddonUrls: data.inactiveAddonUrls,
        toggleAddonUrl,
        activeAddonUrls,
        onboardingStep: data.onboardingStep,
        setOnboardingStep,
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
