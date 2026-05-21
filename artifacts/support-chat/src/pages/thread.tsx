import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "wouter";
import { 
  useGetConversation, 
  getGetConversationQueryKey,
  useListMessages,
  getListMessagesQueryKey,
  useSendMessage,
  useMarkConversationRead
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout";
import { formatDistanceToNow, format } from "date-fns";
import { ArrowLeft, Send, CheckCircle2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function ThreadPage() {
  const params = useParams();
  const id = Number(params.id);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [replyContent, setReplyContent] = useState("");
  
  const markRead = useMarkConversationRead();

  const { data: conversation, isLoading: isLoadingConv } = useGetConversation(id, {
    query: {
      enabled: !!id,
      queryKey: getGetConversationQueryKey(id)
    }
  });

  const { data: messages, isLoading: isLoadingMessages } = useListMessages(id, {
    query: {
      enabled: !!id,
      queryKey: getListMessagesQueryKey(id)
    }
  });

  useEffect(() => {
    if (conversation && !conversation.isRead) {
      markRead.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetConversationQueryKey(id) });
          queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
          queryClient.invalidateQueries({ queryKey: ["/api/conversations/stats"] });
        }
      });
    }
  }, [conversation, id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useSendMessage({
    mutation: {
      onSuccess: () => {
        setReplyContent("");
        queryClient.invalidateQueries({ queryKey: getListMessagesQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getGetConversationQueryKey(id) });
      },
      onError: (err: any) => {
        toast({ variant: "destructive", title: "Failed to send message", description: err?.message });
      }
    }
  });

  const handleSend = () => {
    if (!replyContent.trim()) return;
    sendMessage.mutate({
      id,
      data: { content: replyContent.trim() }
    });
  };

  if (isLoadingConv || !conversation) {
    return (
      <Layout>
        <div className="p-8">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-4 w-32" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col h-full relative">
        <header className="h-auto min-h-16 px-4 sm:px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10 gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <Link href="/inbox" className="p-2 -ml-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors mt-0.5 sm:mt-0">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-lg font-bold text-foreground leading-tight">{conversation.subject}</h2>
                {conversation.status === 'closed' && (
                  <Badge variant="secondary" className="font-normal">Closed</Badge>
                )}
              </div>
              <div className="flex items-center text-sm text-muted-foreground gap-2">
                <span className="font-medium text-foreground/80">{conversation.guestName}</span>
                {conversation.guestEmail && (
                  <>
                    <span>&middot;</span>
                    <span>{conversation.guestEmail}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto bg-muted/10 p-4 sm:p-8">
          <div className="max-w-3xl mx-auto space-y-6 pb-4">
            {isLoadingMessages ? (
              <div className="space-y-4">
                <Skeleton className="h-24 w-3/4 rounded-2xl" />
                <Skeleton className="h-24 w-3/4 ml-auto rounded-2xl" />
              </div>
            ) : (
              messages?.map((msg) => {
                const isOwner = msg.senderType === 'owner';
                return (
                  <div key={msg.id} className={`flex ${isOwner ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-5 py-4 shadow-sm ${
                      isOwner 
                        ? 'bg-primary text-primary-foreground rounded-br-sm' 
                        : 'bg-card border border-border text-card-foreground rounded-bl-sm'
                    }`}>
                      <div className="whitespace-pre-wrap break-words text-sm sm:text-base leading-relaxed">
                        {msg.content}
                      </div>
                      <div className={`text-xs mt-3 font-medium opacity-70 flex items-center justify-end gap-1.5`}>
                        {format(new Date(msg.createdAt), 'MMM d, h:mm a')}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="p-4 sm:p-6 bg-card border-t border-border shrink-0">
          <div className="max-w-3xl mx-auto">
            {conversation.status === 'closed' ? (
              <div className="text-center py-4 bg-muted/50 rounded-xl border border-border">
                <p className="text-muted-foreground text-sm font-medium">This conversation is closed.</p>
              </div>
            ) : (
              <div className="flex gap-4 items-end bg-background border border-input rounded-xl p-2 focus-within:ring-2 focus-within:ring-primary/20 transition-all shadow-sm">
                <Textarea 
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Type your reply..."
                  className="min-h-[80px] max-h-48 resize-none border-0 shadow-none focus-visible:ring-0 px-3 py-3"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <div className="shrink-0 pb-2 pr-2">
                  <Button 
                    size="icon" 
                    className="h-10 w-10 rounded-lg shadow-sm"
                    disabled={!replyContent.trim() || sendMessage.isPending}
                    onClick={handleSend}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}