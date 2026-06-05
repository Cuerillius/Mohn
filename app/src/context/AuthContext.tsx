import { createContext, useContext } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getSession } from "../lib/authClient";
import { keys } from "../lib/queryKeys";

export interface AppUser {
  id: string;
  email: string;
  name: string;
}

interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  setUser: (user: AppUser | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  const { data: user = null, isLoading } = useQuery({
    queryKey: keys.session(),
    queryFn: async () => {
      const { data } = await getSession();
      return data?.user
        ? { id: data.user.id, email: data.user.email, name: data.user.name }
        : null;
    },
    staleTime: Infinity,
  });

  const setUser = (u: AppUser | null) => {
    queryClient.setQueryData(keys.session(), u);
  };

  const logout = () => {
    queryClient.setQueryData(keys.session(), null);
    queryClient.clear();
  };

  return (
    <AuthContext.Provider value={{ user, loading: isLoading, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
