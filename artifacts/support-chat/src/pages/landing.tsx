import { Link } from "wouter";
import { ArrowRight, ShieldCheck, Zap, MessageSquare } from "lucide-react";
import PublicLayout from "@/components/public-layout";

const EXCHANGES = [
  { name: "Binance",  bg: "#F0B429", text: "#111" },
  { name: "Bybit",    bg: "#F7A600", text: "#111" },
  { name: "Bitget",   bg: "#00C4B4", text: "#fff" },
  { name: "OKX",      bg: "#111827", text: "#fff" },
  { name: "Coinbase", bg: "#0052FF", text: "#fff" },
  { name: "KuCoin",   bg: "#23AF91", text: "#fff" },
  { name: "Kraken",   bg: "#5741D9", text: "#fff" },
  { name: "HTX",      bg: "#1A6AFF", text: "#fff" },
  { name: "Gate.io",  bg: "#0B3C6E", text: "#fff" },
  { name: "MEXC",     bg: "#00C087", text: "#fff" },
];

export default function LandingPage() {
  return (
    <PublicLayout>
      <div className="flex-1 bg-white overflow-hidden">

        {/* Hero */}
        <div className="relative bg-gradient-to-br from-blue-700 via-blue-600 to-blue-800 text-white overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.08),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.15),transparent_60%)]" />
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-8">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Live support — respond in minutes
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6">
              Professional crypto<br />
              <span className="text-yellow-300">customer support</span>
            </h1>
            <p className="text-lg sm:text-xl text-blue-100 leading-relaxed max-w-2xl mx-auto mb-10">
              InfoMail PJ provides instant live support for users of Binance, Bybit, Bitget, and all major exchanges. Share your link — we handle the rest.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/sign-up"
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold rounded-xl text-blue-900 bg-yellow-300 hover:bg-yellow-200 transition-all shadow-lg hover:-translate-y-0.5"
              >
                Get Started Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link
                href="/sign-in"
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold rounded-xl text-white border border-white/30 hover:bg-white/10 transition-all"
              >
                Sign In
              </Link>
            </div>
            <p className="mt-6 flex items-center justify-center gap-2 text-sm text-blue-200">
              <ShieldCheck className="w-4 h-4 text-green-400" />
              Free to start. No credit card required.
            </p>
          </div>
        </div>

        {/* Exchange logos */}
        <div className="bg-blue-50 border-y border-blue-100 py-12">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-sm font-semibold text-blue-400 uppercase tracking-widest mb-8">
              Supporting users of all major exchanges
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {EXCHANGES.map((ex) => (
                <span
                  key={ex.name}
                  className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold shadow-sm"
                  style={{ background: ex.bg, color: ex.text }}
                >
                  {ex.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="py-24 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-blue-900 mb-4">
              Everything you need to support your clients
            </h2>
            <p className="text-center text-blue-500 mb-16 max-w-xl mx-auto">
              One platform. All exchanges. Full conversation history in a clean inbox.
            </p>
            <div className="grid md:grid-cols-3 gap-10">
              <div className="text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-blue-200">
                  <MessageSquare className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-blue-900">One Clean Inbox</h3>
                <p className="text-blue-500 leading-relaxed text-sm">
                  All your client conversations from every exchange in one organized dashboard. No more scattered DMs or emails.
                </p>
              </div>
              <div className="text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-blue-200">
                  <Zap className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-blue-900">Instant Setup</h3>
                <p className="text-blue-500 leading-relaxed text-sm">
                  Create a custom support link in seconds. Share it anywhere — email, Telegram, Twitter — and start receiving chats immediately.
                </p>
              </div>
              <div className="text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-blue-200">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-blue-900">Trusted & Secure</h3>
                <p className="text-blue-500 leading-relaxed text-sm">
                  Every conversation is private and secure. Each client gets a unique session link with full chat history preserved.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-600 py-16 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to support your clients?</h2>
          <p className="text-blue-200 mb-8 text-lg">Set up your InfoMail PJ support link in under a minute.</p>
          <Link
            href="/sign-up"
            className="inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold rounded-xl text-blue-900 bg-yellow-300 hover:bg-yellow-200 transition-all shadow-lg hover:-translate-y-0.5"
          >
            Create Your Support Link
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>

      </div>
    </PublicLayout>
  );
}
