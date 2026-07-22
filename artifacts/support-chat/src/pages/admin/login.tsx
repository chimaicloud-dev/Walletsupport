import { useState } from "react";
import { useLocation } from "wouter";
import { useAdminAuth } from "@/context/adminAuth";

export default function AdminLoginPage() {
  const { login, isLoading, admin } = useAdminAuth();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (admin) {
    setLocation("/admin");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      setLocation("/admin");
    } catch (err: any) {
      setError(err.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-yellow-400 mb-4">
            <svg className="w-7 h-7 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Admin Portal</h1>
          <p className="text-gray-400 text-sm mt-1">Wallet Support — Internal Dashboard</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                placeholder="admin@example.com"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="bg-red-900/40 border border-red-700 text-red-300 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-60 text-gray-900 font-semibold py-3 rounded-xl text-sm transition-colors"
            >
              {isLoading ? "Signing in…" : "Sign in to Admin"}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          Wallet Support Admin — Restricted Access
        </p>
      </div>
    </div>
  );
}
