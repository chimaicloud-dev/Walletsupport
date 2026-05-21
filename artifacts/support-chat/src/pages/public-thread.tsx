import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "wouter";
import { 
  useGetGuestConversation, 
  getGetGuestConversationQueryKey,
  useSendGuestMessage
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import PublicLayout from "@/components/public-layout";
import { format } from "date-fns";
import { Send, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function PublicThreadPage() {
  const params = useParams();
  const token = params.token as string;
  const handle = params.handle as string;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [replyContent, setReplyContent] = useState("");

  const { data: conversation, isLoading, error } = useGetGuestConversation(token, {
    query: {
      enabled: !!token,
      queryKey: getGetGuestConversationQueryKey(token),
      refetchInterval: 5000 // Poll for new messages every 5s
    }
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages]);

  const sendGuestMessage = useSendGuestMessage({
    mutation: {
      onSuccess: () => {
        setReplyContent("");
        queryClient.invalidateQueries({ queryKey: getGetGuestConversationQueryKey(token) });
      },
      onError: (err: any) => {
        toast({ variant: "destructive", title: "Failed to send message", description: err?.message });
      }
    }
  });

  const handleSend = () => {
    if (!replyContent.trim()) return;
    sendGuestMessage.mutate({
      token,
      data: { content: replyContent.trim() }
    });
  };

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="flex-1 max-w-3xl mx-auto w-full p-4 sm:p-8">
          <Skeleton className="h-10 w-2/3 mb-8" />
          <div className="space-y-6">
            <Skeleton className="h-24 w-3/4 ml-auto rounded-2xl" />
            <Skeleton className="h-24 w-3/4 rounded-2xl" />
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (error || !conversation) {
    return (
      <PublicLayout>
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <MessageSquare className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Conversation not found</h2>
          <p className="text-muted-foreground">This thread might have been removed or the link is invalid.</p>
          <Link href={`/chat/${handle}`}>
            <Button className="mt-6">Start a new conversation</Button>
          </Link>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full bg-background border-x border-border shadow-sm">
        <header className="h-auto min-h-20 px-6 sm:px-8 py-5 flex flex-col justify-center border-b border-border bg-card/50 backdrop-blur-sm sticky top-[64px] z-10">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground leading-tight mb-1">
            {conversation.subject}
          </h1>
          <p className="text-sm font-medium text-muted-foreground">
            Conversation with <span className="text-foreground">{conversation.ownerDisplayName}</span>
          </p>
        </header>

        <div className="flex-1 overflow-auto bg-muted/10 p-4 sm:p-8">
          <div className="space-y-6 pb-4">
            {conversation.messages?.map((msg) => {
              const isGuest = msg.senderType === 'guest';
              return (
                <div key={msg.id} className={`flex ${isGuest ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-5 py-4 shadow-sm ${
                    isGuest 
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
            })}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="p-4 sm:p-6 bg-card border-t border-border shrink-0">
          <div className="flex gap-4 items-end bg-background border border-input rounded-xl p-2 focus-within:ring-2 focus-within:ring-primary/20 transition-all shadow-sm">
            <Textarea 
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Type a message..."
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
                disabled={!replyContent.trim() || sendGuestMessage.isPending}
                onClick={handleSend}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}