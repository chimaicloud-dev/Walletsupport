import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useClerk, useUser } from "@clerk/react";
import { Inbox, Settings, LogOut, MessageSquare } from "lucide-react";
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
    }
  });

  const handleLogout = () => {
    signOut({ redirectUrl: "/" });
  };

  return (
    <div className="flex min-h-[100dvh] bg-sidebar">
      {/* Sidebar */}
      <aside className="w-64 flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
          <MessageSquare className="w-6 h-6 mr-2 text-primary" />
          <span className="font-bold text-lg tracking-tight text-sidebar-foreground">SupportDesk</span>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <Link 
            href="/inbox" 
            className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              location.startsWith("/inbox") 
                ? "bg-primary/10 text-primary" 
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            }`}
          >
            <Inbox className="w-5 h-5 mr-3 opacity-80" />
            Inbox
            {stats?.unread ? (
              <span className="ml-auto bg-primary text-primary-foreground py-0.5 px-2 rounded-full text-xs font-semibold">
                {stats.unread}
              </span>
            ) : null}
          </Link>
          <Link 
            href="/settings" 
            className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              location.startsWith("/settings") 
                ? "bg-primary/10 text-primary" 
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            }`}
          >
            <Settings className="w-5 h-5 mr-3 opacity-80" />
            Settings
          </Link>
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center justify-between mb-4 px-2">
            <div className="truncate">
              <p className="text-sm font-medium truncate">{user?.fullName || user?.primaryEmailAddress?.emailAddress}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2 text-sm font-medium text-sidebar-foreground/80 rounded-md hover:bg-sidebar-accent hover:text-destructive transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3 opacity-80" />
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