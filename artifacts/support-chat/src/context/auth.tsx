import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { setAuthTokenGetter } from "@workspace/api-client-react";

export interface AuthUser {
  id: number;
  email: string;
  handle: string;
  displayName: string;
  bio?: string | null;
  avatarUrl?: string | null;
  tokenBalance: number;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, handle: string, displayName: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  setTokenBalance: (balance: number) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);
const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

function getStoredUser(): AuthUser | null {
  try { return JSON.parse(localStorage.getItem(USER_KEY) || "null"); } catch { return null; }
}

function storeUser(user: AuthUser) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(getStoredUser);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setAuthTokenGetter(() => localStorage.getItem(TOKEN_KEY));
  }, []);

  const safeJson = async (res: Response) => {
    const text = await res.text();
    try { return JSON.parse(text); } catch { throw new Error(`Server error (${res.status}). Please try again.`); }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.error || "Login failed");
      localStorage.setItem(TOKEN_KEY, data.token);
      storeUser(data.user);
      setUser(data.user);
    } finally { setIsLoading(false); }
  };

  const register = async (email: string, password: string, handle: string, displayName: string) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password, handle, displayName }) });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.error || "Registration failed");
      localStorage.setItem(TOKEN_KEY, data.token);
      storeUser(data.user);
      setUser(data.user);
    } finally { setIsLoading(false); }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  };

  const refreshUser = async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;
    try {
      const res = await fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        storeUser(data);
        setUser(data);
      }
    } catch {}
  };

  const setTokenBalance = (balance: number) => {
    if (!user) return;
    const updated = { ...user, tokenBalance: balance };
    storeUser(updated);
    setUser(updated);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, refreshUser, setTokenBalance }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
