import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { authApi } from '../api/auth';
import {
  authUserFromResponse,
  clearAuth,
  getStoredUser,
  getToken,
  setStoredUser,
  setToken,
} from '../lib/authStorage';
import type { AuthUser, LoginRequest, RegisterRequest } from '../types/auth';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  canWrite: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function persistSession(res: {
  token: string;
  shopUserId: number;
  email: string;
  shopName: string;
  ownerName: string;
  phone?: string;
  active?: boolean;
}) {
  setToken(res.token);
  setStoredUser(authUserFromResponse(res));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    const stored = getStoredUser();
    if (!token || !stored) {
      clearAuth();
      setLoading(false);
      return;
    }

    authApi
      .me(token)
      .then((res) => {
        const refreshed = authUserFromResponse(res);
        setStoredUser(refreshed);
        setUser(refreshed);
      })
      .catch(() => {
        clearAuth();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (data: LoginRequest) => {
    const res = await authApi.login(data);
    persistSession(res);
    setUser(authUserFromResponse(res));
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    const res = await authApi.register(data);
    persistSession(res);
    setUser(authUserFromResponse(res));
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
  }, []);

  const canWrite = user?.active ?? false;

  const value = useMemo(
    () => ({ user, loading, canWrite, login, register, logout }),
    [user, loading, canWrite, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
