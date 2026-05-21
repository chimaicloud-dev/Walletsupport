import { useListConversations, getListConversationsQueryKey, useGetConversationStats, getGetConversationStatsQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import Layout from "@/components/layout";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, CircleDashed, CheckCircle2, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function InboxPage() {
  const { data: conversations, isLoading } = useListConversations({
    query: {
      queryKey: getListConversationsQueryKey()
    }
  });

  const { data: stats } = useGetConversationStats({
    query: {
      queryKey: getGetConversationStatsQueryKey()
    }
  });

  return (
    <Layout>
      <div className="flex flex-col h-full">
        <header className="h-16 px-8 flex items-center border-b border-border bg-card shrink-0">
          <h1 className="text-xl font-semibold text-foreground">Inbox</h1>
          {stats && (
            <div className="ml-6 flex items-center space-x-4 text-sm">
              <span className="text-muted-foreground"><strong className="text-foreground font-medium">{stats.open}</strong> open</span>
              <span className="text-muted-foreground"><strong className="text-foreground font-medium">{stats.closed}</strong> closed</span>
            </div>
          )}
        </header>

        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-4xl mx-auto">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="w-full h-24 rounded-xl" />
                ))}
              </div>
            ) : conversations?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <MessageSquare className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground">You're all caught up!</h3>
                <p className="text-muted-foreground mt-1">No conversations yet. Share your link to get started.</p>
              </div>
            ) : (
              <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden divide-y divide-border">
                {conversations?.map((conv) => (
                  <Link 
                    key={conv.id} 
                    href={`/inbox/${conv.id}`}
                    className={`block p-4 sm:p-5 transition-colors hover:bg-muted/50 ${
                      !conv.isRead ? "bg-primary/5" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {!conv.isRead && (
                            <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                          )}
                          <h4 className={`text-base truncate ${!conv.isRead ? "font-semibold text-foreground" : "font-medium text-foreground/90"}`}>
                            {conv.subject}
                          </h4>
                          {conv.status === 'closed' && (
                            <Badge variant="secondary" className="text-xs font-normal h-5 shrink-0">Closed</Badge>
                          )}
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground gap-3">
                          <div className="flex items-center gap-1.5 truncate">
                            <User className="w-3.5 h-3.5" />
                            <span className="truncate">{conv.guestName}</span>
                          </div>
                          <span>&middot;</span>
                          <span>{conv.messageCount} message{conv.messageCount !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                      <div className="shrink-0 text-xs text-muted-foreground whitespace-nowrap pt-1">
                        {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: true })}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}