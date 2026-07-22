import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAdminAuth, getAdminToken } from "@/context/adminAuth";

interface User {
  id: number;
  email: string;
  handle: string;
  displayName: string;
  tokenBalance: number;
  createdAt: string;
}

interface Stats {
  totalUsers: number;
  totalLinks: number;
  totalConversations: number;
}

function apiAdmin(path: string, opts?: RequestInit) {
  const token = getAdminToken();
  return fetch(`/api/admin${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(opts?.headers ?? {}) },
  });
}

export default function AdminDashboard() {
  const { admin, logout } = useAdminAuth();
  const [, setLocation] = useLocation();
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [addTokensUser, setAddTokensUser] = useState<User | null>(null);
  const [tokenAmount, setTokenAmount] = useState("");
  const [tokenNote, setTokenNote] = useState("");
  const [addingTokens, setAddingTokens] = useState(false);
  const [addError, setAddError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!admin) { setLocation("/admin/login"); return; }
    fetchAll();
  }, [admin]);

  const fetchAll = async () => {
    setLoadingUsers(true);
    const [statsRes, usersRes] = await Promise.all([
      apiAdmin("/stats"),
      apiAdmin("/users"),
    ]);
    if (statsRes.ok) setStats(await statsRes.json());
    if (usersRes.ok) setUsers(await usersRes.json());
    setLoadingUsers(false);
  };

  const handleAddTokens = async () => {
    if (!addTokensUser) return;
    const amount = parseInt(tokenAmount);
    if (!amount || amount <= 0) { setAddError("Enter a valid token amount"); return; }
    setAddingTokens(true);
    setAddError("");
    try {
      const res = await apiAdmin(`/users/${addTokensUser.id}/tokens`, {
        method: "POST",
        body: JSON.stringify({ amount, note: tokenNote }),
      });
      const data = await res.json();
      if (!res.ok) { setAddError(data.error || "Failed"); return; }
      setUsers(prev => prev.map(u => u.id === addTokensUser.id ? { ...u, tokenBalance: data.newBalance } : u));
      setAddTokensUser(null);
      setTokenAmount("");
      setTokenNote("");
    } catch { setAddError("Network error"); }
    finally { setAddingTokens(false); }
  };

  const handleDelete = async (userId: number) => {
    await apiAdmin(`/users/${userId}`, { method: "DELETE" });
    setUsers(prev => prev.filter(u => u.id !== userId));
    setDeleteConfirm(null);
  };

  const filtered = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.handle.toLowerCase().includes(search.toLowerCase()) ||
    u.displayName.toLowerCase().includes(search.toLowerCase())
  );

  if (!admin) return null;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-yellow-400 flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white">Admin Dashboard</h1>
            <p className="text-xs text-gray-400">{admin.email}</p>
          </div>
        </div>
        <button
          onClick={() => { logout(); setLocation("/admin/login"); }}
          className="text-xs text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 px-3 py-1.5 rounded-lg transition-colors"
        >
          Sign out
        </button>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Users", value: stats?.totalUsers ?? "—", icon: "👥" },
            { label: "Total Links", value: stats?.totalLinks ?? "—", icon: "🔗" },
            { label: "Conversations", value: stats?.totalConversations ?? "—", icon: "💬" },
          ].map(s => (
            <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <div className="text-2xl mb-2">{s.icon}</div>
              <div className="text-3xl font-bold text-white">{s.value}</div>
              <div className="text-xs text-gray-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Payment instructions notice */}
        <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-2xl p-4 flex gap-3">
          <span className="text-xl shrink-0">📢</span>
          <div>
            <p className="text-yellow-300 font-semibold text-sm">Payment Channel — WhatsApp</p>
            <p className="text-yellow-200/70 text-xs mt-0.5">
              When users send ₦300 per token, they contact <strong className="text-yellow-300">08135590989</strong> on WhatsApp. Once confirmed, add tokens to their account below.
            </p>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between gap-4">
            <h2 className="font-semibold text-white">Users</h2>
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Search users…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="bg-gray-800 border border-gray-700 text-white text-sm rounded-xl px-3 py-2 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 w-52"
              />
              <button onClick={fetchAll} className="text-xs text-gray-400 hover:text-white border border-gray-700 px-3 py-2 rounded-xl transition-colors">
                Refresh
              </button>
            </div>
          </div>

          {loadingUsers ? (
            <div className="py-16 text-center text-gray-500 text-sm">Loading users…</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-gray-500 text-sm">No users found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-left">
                    <th className="px-6 py-3 text-xs font-medium text-gray-400">User</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-400">Handle</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-400">Tokens</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-400">Joined</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u, i) => (
                    <tr key={u.id} className={`border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors ${i === filtered.length - 1 ? "border-none" : ""}`}>
                      <td className="px-6 py-4">
                        <div className="font-medium text-white">{u.displayName}</div>
                        <div className="text-xs text-gray-400">{u.email}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-300">@{u.handle}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${u.tokenBalance > 0 ? "bg-green-900/50 text-green-300" : "bg-red-900/40 text-red-300"}`}>
                          🪙 {u.tokenBalance} token{u.tokenBalance !== 1 ? "s" : ""}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-xs">
                        {new Date(u.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { setAddTokensUser(u); setTokenAmount(""); setTokenNote(""); setAddError(""); }}
                            className="text-xs bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-semibold px-3 py-1.5 rounded-lg transition-colors"
                          >
                            + Add Tokens
                          </button>
                          {deleteConfirm === u.id ? (
                            <div className="flex items-center gap-1.5">
                              <button onClick={() => handleDelete(u.id)} className="text-xs bg-red-600 hover:bg-red-500 text-white px-2.5 py-1.5 rounded-lg transition-colors">Confirm</button>
                              <button onClick={() => setDeleteConfirm(null)} className="text-xs text-gray-400 hover:text-white px-2 py-1.5">Cancel</button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(u.id)}
                              className="text-xs text-gray-500 hover:text-red-400 px-2 py-1.5 rounded-lg transition-colors"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Tokens Modal */}
      {addTokensUser && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setAddTokensUser(null)}>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-white mb-1">Add Tokens</h3>
            <p className="text-sm text-gray-400 mb-5">
              Adding tokens for <span className="text-white font-medium">{addTokensUser.displayName}</span>
              <br />Current balance: <span className="text-yellow-400 font-semibold">🪙 {addTokensUser.tokenBalance}</span>
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 font-medium block mb-1.5">Number of tokens</label>
                <input
                  type="number"
                  min="1"
                  value={tokenAmount}
                  onChange={e => setTokenAmount(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  placeholder="e.g. 5"
                  autoFocus
                />
                {tokenAmount && parseInt(tokenAmount) > 0 && (
                  <p className="text-xs text-gray-500 mt-1">= ₦{parseInt(tokenAmount) * 300} received</p>
                )}
              </div>
              <div>
                <label className="text-xs text-gray-400 font-medium block mb-1.5">Note (optional)</label>
                <input
                  type="text"
                  value={tokenNote}
                  onChange={e => setTokenNote(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  placeholder="e.g. Payment confirmed via WhatsApp"
                />
              </div>

              {addError && <p className="text-red-400 text-xs">{addError}</p>}

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setAddTokensUser(null)}
                  className="flex-1 border border-gray-700 text-gray-300 hover:text-white rounded-xl py-2.5 text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddTokens}
                  disabled={addingTokens}
                  className="flex-1 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-60 text-gray-900 font-semibold rounded-xl py-2.5 text-sm transition-colors"
                >
                  {addingTokens ? "Adding…" : "Add Tokens"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
