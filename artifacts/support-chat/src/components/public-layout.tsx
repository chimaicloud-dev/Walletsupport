import { ReactNode } from "react";
import { Link } from "wouter";
import { MessageSquare } from "lucide-react";

interface PublicLayoutProps {
  children: ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background selection:bg-primary/20">
      <header className="h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 border-b border-border/40 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <Link href="/" className="flex items-center group">
          <MessageSquare className="w-6 h-6 mr-2 text-primary group-hover:scale-105 transition-transform" />
          <span className="font-bold text-lg tracking-tight text-foreground">SupportDesk</span>
        </Link>
        <div className="flex items-center space-x-4">
          <Link href="/sign-in" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Sign In
          </Link>
          <Link href="/sign-up" className="text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors shadow-sm">
            Get Started
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {children}
      </main>

      <footer className="py-8 border-t border-border/40 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} SupportDesk. All rights reserved.
        </div>
      </footer>
    </div>
  );
}