import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAdminAuth, getAdminToken } from "@/context/adminAuth";

interface User {
  id: number;
  email: string;
  handle: string;
  displayName: string;
  walletBalance: number;
  linksAvailable: number;
  createdAt: string;
}

interface Stats {
  totalUsers: number;
  totalLinks: number;
  totalConversations: number;
  totalCredited: number;
}

const LINK_COST = 300;
const ADMIN_WA = "2348135590989";

function api(path: string, opts?: RequestInit) {
  const token = getAdminToken();
  return fetch(`/api/admin${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(opts?.headers ?? {}) },
  });
}

function WhatsAppIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`fill-current ${className}`}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.116 1.523 5.845L.057 23.492a.5.5 0 00.614.611l5.796-1.52A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.812 9.812 0 01-5.002-1.366l-.359-.214-3.721.976.993-3.622-.234-.373A9.818 9.818 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
    </svg>
  );
}

export default function AdminDashboard() {
  const { admin, logout } = useAdminAuth();
  const [, setLocation] = useLocation();
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [creditUser, setCreditUser] = useState<User | null>(null);
  const [creditAmount, setCreditAmount] = useState("");
  const [creditNote, setCreditNote] = useState("");
  const [crediting, setCrediting] = useState(false);
  const [creditError, setCreditError] = useState("");
  const [creditSuccess, setCreditSuccess] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  useEffect(() => {
    if (!admin) { setLocation("/admin/login"); return; }
    fetchAll();
  }, [admin]);

  async function fetchAll() {
    setLoading(true);
    const [sr, ur] = await Promise.all([api("/stats"), api("/users")]);
    if (sr.ok) setStats(await sr.json());
    if (ur.ok) setUsers(await ur.json());
    setLoading(false);
  }

  async function handleCredit() {
    if (!creditUser) return;
    const amount = parseInt(creditAmount);
    if (!amount || amount <= 0) { setCreditError("Enter a valid amount in Naira"); return; }
    setCrediting(true); setCreditError(""); setCreditSuccess("");
    try {
      const res = await api(`/users/${creditUser.id}/credit`, {
        method: "POST",
        body: JSON.stringify({ amount, note: creditNote }),
      });
      const data = await res.json();
      if (!res.ok) { setCreditError(data.error || "Failed"); return; }
      const linksNow = data.linksAvailable;
      setCreditSuccess(`✅ ₦${amount.toLocaleString()} credited — ${creditUser.displayName} now has ₦${data.newBalance.toLocaleString()} (${linksNow} link${linksNow !== 1 ? "s" : ""} available)`);
      setUsers(prev => prev.map(u => u.id === creditUser.id
        ? { ...u, walletBalance: data.newBalance, linksAvailable: linksNow }
        : u));
      setCreditAmount(""); setCreditNote("");
    } catch { setCreditError("Network error. Try again."); }
    finally { setCrediting(false); }
  }

  async function handleDelete(userId: number) {
    await api(`/users/${userId}`, { method: "DELETE" });
    setUsers(prev => prev.filter(u => u.id !== userId));
    setDeleteConfirm(null);
  }

  function openWhatsApp(user: User) {
    const msg = `Hi, following up on your Wallet Support payment request.\n\n📧 ${user.email}\n🔖 @${user.handle}\n\nCurrent balance: ₦${user.walletBalance.toLocaleString()}\n\nPlease confirm your payment so we can credit your account.`;
    window.open(`https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
  }

  const filtered = users.filter(u =>
    [u.email, u.handle, u.displayName].some(v => v.toLowerCase().includes(search.toLowerCase()))
  );

  const parsedAmount = parseInt(creditAmount) || 0;
  const linksFromCredit = parsedAmount >= LINK_COST ? Math.floor(parsedAmount / LINK_COST) : 0;

  if (!admin) return null;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-yellow-400 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-semibold">Wallet Support Admin</h1>
            <p className="text-xs text-gray-400">{admin.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={`https://wa.me/${ADMIN_WA}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-[#25D366] border border-[#25D366]/30 hover:bg-[#25D366]/10 px-3 py-1.5 rounded-lg transition-colors"
          >
            <WhatsAppIcon className="w-3.5 h-3.5" />
            WhatsApp
          </a>
          <button
            onClick={() => { logout(); setLocation("/admin/login"); }}
            className="text-xs text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 px-3 py-1.5 rounded-lg transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Users", value: stats?.totalUsers ?? "—", icon: "👥", color: "text-blue-400" },
            { label: "Links Created", value: stats?.totalLinks ?? "—", icon: "🔗", color: "text-purple-400" },
            { label: "Conversations", value: stats?.totalConversations ?? "—", icon: "💬", color: "text-cyan-400" },
            { label: "Total Credited", value: stats ? `₦${stats.totalCredited.toLocaleString()}` : "—", icon: "💰", color: "text-yellow-400" },
          ].map(s => (
            <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <div className="text-2xl mb-2">{s.icon}</div>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Notice */}
        <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-2xl p-4 flex gap-3 items-start">
          <WhatsAppIcon className="w-5 h-5 text-[#25D366] shrink-0 mt-0.5" />
          <div>
            <p className="text-yellow-300 font-semibold text-sm">Payment Channel</p>
            <p className="text-yellow-200/70 text-xs mt-0.5">
              Users send payment to <span className="text-white font-semibold">08135590989</span> via WhatsApp. Once confirmed, use <strong>"Credit Wallet"</strong> to add the naira amount to their account. Every ₦{LINK_COST} = 1 link they can create.
            </p>
          </div>
        </div>

        {/* Users */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800 flex flex-wrap items-center gap-3 justify-between">
            <h2 className="font-semibold text-white">Users ({filtered.length})</h2>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="bg-gray-800 border border-gray-700 text-white text-sm rounded-xl px-3 py-2 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 w-44"
              />
              <button onClick={fetchAll} className="text-xs text-gray-400 hover:text-white border border-gray-700 px-3 py-2 rounded-xl transition-colors">Refresh</button>
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center text-gray-500 text-sm">Loading users…</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-gray-500 text-sm">No users found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-left">
                    <th className="px-6 py-3 text-xs font-medium text-gray-400">User</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-400">Balance</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-400">Links Available</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-400">Joined</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u, i) => (
                    <tr key={u.id} className={`border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors ${i === filtered.length - 1 ? "border-none" : ""}`}>
                      <td className="px-6 py-4">
                        <div className="font-medium text-white">{u.displayName}</div>
                        <div className="text-xs text-gray-400">{u.email} · @{u.handle}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-semibold ${u.walletBalance > 0 ? "text-green-400" : "text-red-400"}`}>
                          ₦{u.walletBalance.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${u.linksAvailable > 0 ? "bg-green-900/50 text-green-300" : "bg-red-900/40 text-red-300"}`}>
                          {u.linksAvailable} link{u.linksAvailable !== 1 ? "s" : ""}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-xs">
                        {new Date(u.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => { setCreditUser(u); setCreditAmount(""); setCreditNote(""); setCreditError(""); setCreditSuccess(""); }}
                            className="text-xs bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-semibold px-3 py-1.5 rounded-lg transition-colors"
                          >
                            Credit Wallet
                          </button>
                          <button
                            onClick={() => openWhatsApp(u)}
                            className="text-xs bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                          >
                            <WhatsAppIcon className="w-3 h-3" /> Chat
                          </button>
                          {deleteConfirm === u.id ? (
                            <div className="flex items-center gap-1">
                              <button onClick={() => handleDelete(u.id)} className="text-xs bg-red-600 hover:bg-red-500 text-white px-2.5 py-1.5 rounded-lg">Confirm</button>
                              <button onClick={() => setDeleteConfirm(null)} className="text-xs text-gray-500 hover:text-white px-2 py-1.5">Cancel</button>
                            </div>
                          ) : (
                            <button onClick={() => setDeleteConfirm(u.id)} className="text-xs text-gray-600 hover:text-red-400 px-2 py-1.5 rounded-lg transition-colors">
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

      {/* Credit Wallet Modal */}
      {creditUser && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setCreditUser(null)}>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-white mb-1">Credit Wallet</h3>
            <p className="text-sm text-gray-400 mb-1">
              For <span className="text-white font-medium">{creditUser.displayName}</span>
            </p>
            <p className="text-xs text-gray-500 mb-5">
              Current balance: <span className="text-yellow-400 font-semibold">₦{creditUser.walletBalance.toLocaleString()}</span> · {creditUser.linksAvailable} links
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 font-medium block mb-1.5">Amount to credit (₦)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₦</span>
                  <input
                    type="number"
                    min="1"
                    value={creditAmount}
                    onChange={e => setCreditAmount(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl pl-8 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    placeholder="e.g. 1500"
                    autoFocus
                  />
                </div>
                {parsedAmount > 0 && (
                  <p className="text-xs text-gray-400 mt-1.5">
                    = <span className="text-yellow-400 font-semibold">{linksFromCredit} link{linksFromCredit !== 1 ? "s" : ""}</span> available after credit
                    {parsedAmount % LINK_COST > 0 && ` (₦${parsedAmount % LINK_COST} remainder)`}
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs text-gray-400 font-medium block mb-1.5">Payment note (optional)</label>
                <input
                  type="text"
                  value={creditNote}
                  onChange={e => setCreditNote(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  placeholder="e.g. Received via WhatsApp transfer"
                />
              </div>

              {creditError && <p className="text-red-400 text-xs">{creditError}</p>}
              {creditSuccess && <p className="text-green-400 text-xs">{creditSuccess}</p>}

              <div className="flex gap-3 pt-1">
                <button onClick={() => setCreditUser(null)} className="flex-1 border border-gray-700 text-gray-300 hover:text-white rounded-xl py-2.5 text-sm transition-colors">
                  {creditSuccess ? "Close" : "Cancel"}
                </button>
                {!creditSuccess && (
                  <button
                    onClick={handleCredit}
                    disabled={crediting}
                    className="flex-1 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-60 text-gray-900 font-semibold rounded-xl py-2.5 text-sm transition-colors"
                  >
                    {crediting ? "Crediting…" : `Credit ₦${parsedAmount > 0 ? parsedAmount.toLocaleString() : "—"}`}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
