import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { api, getToken, setToken } from '@/services/api';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string | null;
  role: 'user' | 'admin';
}

interface AuthCtx {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>(null!);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!getToken()) { setUser(null); setLoading(false); return; }
    try {
      const me = await api<AuthUser>('/api/auth/me');
      setUser(me);
    } catch {
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const login = async (email: string, password: string) => {
    const res = await api<{ token: string; user: AuthUser }>('/api/auth/login', {
      method: 'POST', body: JSON.stringify({ email, password }),
    });
    setToken(res.token);
    setUser(res.user);
  };

  const register = async (email: string, password: string, displayName?: string) => {
    const res = await api<{ token: string; user: AuthUser }>('/api/auth/register', {
      method: 'POST', body: JSON.stringify({ email, password, displayName }),
    });
    setToken(res.token);
    setUser(res.user);
  };

  const logout = () => { setToken(null); setUser(null); };

  return <Ctx.Provider value={{ user, loading, login, register, logout, refresh }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
