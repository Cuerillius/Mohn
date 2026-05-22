import { createContext, useContext, useEffect, useState } from 'react';
import { getSession } from '../lib/authClient';

export interface AppUser {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  user: AppUser | null;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  setUser: (user: AppUser | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, loading: true });

  useEffect(() => {
    getSession()
      .then(({ data }) => {
        setState({
          user: data?.user
            ? { id: data.user.id, email: data.user.email, name: data.user.name }
            : null,
          loading: false,
        });
      })
      .catch(() => setState({ user: null, loading: false }));
  }, []);

  const setUser = (user: AppUser | null) =>
    setState(prev => ({ ...prev, user }));

  const logout = () => setState({ user: null, loading: false });

  return (
    <AuthContext.Provider value={{ ...state, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
