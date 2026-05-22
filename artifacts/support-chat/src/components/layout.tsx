import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useClerk, useUser } from "@clerk/react";
import { Inbox, Settings, LogOut, Link as LinkIcon, Mail } from "lucide-react";
import { useGetConversationStats } from "@workspace/api-client-react";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { signOut } = useClerk();
  const { user } = useUser();
  const { data: stats } = useGetConversationStats({
    query: {
      queryKey: ["/api/conversations/stats"],
    },
  });

  const handleLogout = () => {
    signOut({ redirectUrl: "/" });
  };

  return (
    <div className="flex min-h-[100dvh] bg-sidebar">
      {/* Sidebar — dark navy */}
      <aside className="w-64 flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
        <div className="h-16 flex items-center px-5 border-b border-sidebar-border gap-2.5">
          <img src="/bot-avatar.svg" alt="InfoMail PJ" className="w-8 h-8 rounded-full shrink-0" />
          <span className="font-bold text-base tracking-tight text-white">InfoMail PJ</span>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <Link
            href="/inbox"
            className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              location.startsWith("/inbox")
                ? "bg-sidebar-primary/20 text-sidebar-primary"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            }`}
            data-testid="nav-inbox"
          >
            <Inbox className="w-4.5 h-4.5 mr-3 opacity-80" />
            Inbox
            {stats?.unread ? (
              <span className="ml-auto bg-sidebar-primary text-white py-0.5 px-2 rounded-full text-xs font-semibold">
                {stats.unread}
              </span>
            ) : null}
          </Link>

          <Link
            href="/links"
            className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              location.startsWith("/links")
                ? "bg-sidebar-primary/20 text-sidebar-primary"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            }`}
            data-testid="nav-links"
          >
            <LinkIcon className="w-4.5 h-4.5 mr-3 opacity-80" />
            My Links
          </Link>

          <Link
            href="/settings"
            className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              location.startsWith("/settings")
                ? "bg-sidebar-primary/20 text-sidebar-primary"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            }`}
            data-testid="nav-settings"
          >
            <Settings className="w-4.5 h-4.5 mr-3 opacity-80" />
            Settings
          </Link>
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-7 h-7 rounded-full bg-sidebar-primary/20 flex items-center justify-center shrink-0">
              <Mail className="w-3.5 h-3.5 text-sidebar-primary" />
            </div>
            <p className="text-sm font-medium text-sidebar-foreground/80 truncate">
              {user?.fullName || user?.primaryEmailAddress?.emailAddress}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2 text-sm font-medium text-sidebar-foreground/60 rounded-md hover:bg-sidebar-accent hover:text-red-400 transition-colors"
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4 mr-3 opacity-80" />
            Log out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-background overflow-hidden">
        {children}
      </main>
    </div>
  );
}
