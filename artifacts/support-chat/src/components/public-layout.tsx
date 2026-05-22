import { ReactNode } from "react";
import { Link } from "wouter";

interface PublicLayoutProps {
  children: ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-white selection:bg-blue-100">
      <header className="h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 border-b border-blue-100 bg-white sticky top-0 z-50 shadow-sm">
        <Link href="/" className="flex items-center gap-2 group">
          <img src="/bot-avatar.svg" alt="Wallet support ExPJdev" className="w-8 h-8 rounded-full" />
          <span className="font-bold text-lg tracking-tight text-blue-900">Wallet support ExPJdev</span>
        </Link>
        <div className="flex items-center space-x-3">
          <Link
            href="/sign-in"
            className="text-sm font-medium text-blue-700 hover:text-blue-900 transition-colors px-3 py-1.5"
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="text-sm font-semibold bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            Get Started
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {children}
      </main>

      <footer className="py-8 border-t border-blue-100 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-blue-500">
          &copy; {new Date().getFullYear()} Wallet support ExPJdev. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
