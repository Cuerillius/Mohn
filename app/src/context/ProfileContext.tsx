import { createContext, useContext, useState } from 'react';

export interface Profile {
  id: string;
  name: string;
  sortOrder: number;
  userId: string;
  createdAt: string;
}

interface ProfileContextValue {
  profile: Profile | null;
  setProfile: (p: Profile | null) => void;
  clearProfile: () => void;
}

const STORAGE_KEY = 'mohn_profile';
const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfileState] = useState<Profile | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Profile) : null;
    } catch {
      return null;
    }
  });

  const setProfile = (p: Profile | null) => {
    if (p) localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    else localStorage.removeItem(STORAGE_KEY);
    setProfileState(p);
  };

  const clearProfile = () => setProfile(null);

  return (
    <ProfileContext.Provider value={{ profile, setProfile, clearProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used inside ProfileProvider');
  return ctx;
}
