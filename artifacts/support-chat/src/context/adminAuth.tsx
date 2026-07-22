import { createContext, useContext, useState, ReactNode } from "react";

export interface AdminUser {
  id: number;
  email: string;
}

interface AdminAuthContextType {
  admin: AdminUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);
const ADMIN_TOKEN_KEY = "admin_token";
const ADMIN_USER_KEY = "admin_user";

function getStoredAdmin(): AdminUser | null {
  try { return JSON.parse(localStorage.getItem(ADMIN_USER_KEY) || "null"); } catch { return null; }
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(getStoredAdmin);
  const [isLoading, setIsLoading] = useState(false);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const text = await res.text();
      let data: any;
      try { data = JSON.parse(text); } catch { throw new Error("Server error. Please try again."); }
      if (!res.ok) throw new Error(data.error || "Login failed");
      localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
      localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(data.admin));
      setAdmin(data.admin);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_USER_KEY);
    setAdmin(null);
  };

  return (
    <AdminAuthContext.Provider value={{ admin, isLoading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}

export function getAdminToken() {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}
