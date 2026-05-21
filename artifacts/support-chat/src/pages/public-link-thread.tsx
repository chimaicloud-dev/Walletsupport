import { useEffect, useRef, useState } from "react";
import { useParams, useLocation } from "wouter";
import {
  useGetGuestConversation,
  getGetGuestConversationQueryKey,
  useSendGuestMessage,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Send, MessageSquare, X, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function PublicLinkThreadPage() {
  const params = useParams();
  const token = params.token as string;
  const slug = params.slug as string;
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [replyContent, setReplyContent] = useState("");

  const { data: conversation, isLoading, error } = useGetGuestConversation(token, {
    query: {
      enabled: !!token,
      queryKey: getGetGuestConversationQueryKey(token),
      refetchInterval: 4000,
    },
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
      onError: () => {
        toast({ variant: "destructive", title: "Failed to send message. Please try again." });
      },
    },
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    sendGuestMessage.mutate({ token, data: { content: replyContent.trim() } });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-[100dvh] bg-[#f5f5f5]">
        <div className="bg-[#1e3a5f] h-16 flex items-center px-4 gap-3">
          <Skeleton className="w-9 h-9 rounded-full bg-white/20" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-28 bg-white/20" />
            <Skeleton className="h-3 w-20 bg-white/20" />
          </div>
        </div>
        <div className="flex-1 p-4 space-y-4">
          <div className="flex justify-start"><Skeleton className="h-16 w-64 rounded-2xl" /></div>
          <div className="flex justify-end"><Skeleton className="h-12 w-52 rounded-2xl" /></div>
          <div className="flex justify-start"><Skeleton className="h-20 w-72 rounded-2xl" /></div>
        </div>
      </div>
    );
  }

  if (error || !conversation) {
    return (
      <div className="flex flex-col h-[100dvh] bg-[#f5f5f5] items-center justify-center p-6">
        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow">
          <MessageSquare className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold mb-2">Conversation not found</h2>
        <p className="text-muted-foreground text-sm text-center mb-4">
          This thread may have been removed or the link is invalid.
        </p>
        <Button
          className="bg-[#1e3a5f] hover:bg-[#1e3a5f]/90"
          onClick={() => setLocation(`/c/${slug}`)}
        >
          Start a new chat
        </Button>
      </div>
    );
  }

  const caseId = `#${String(conversation.id).padStart(9, "0").slice(-9)}`;

  return (
    <div className="flex flex-col h-[100dvh] bg-[#f5f5f5]">
      {/* Header */}
      <div className="bg-[#1e3a5f] px-4 py-3 flex items-center gap-3 shadow-md shrink-0">
        <button
          onClick={() => setLocation(`/c/${slug}`)}
          className="text-white/70 hover:text-white mr-1 shrink-0"
          data-testid="button-back"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          <MessageSquare className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm leading-tight truncate">
            {conversation.ownerDisplayName}
          </p>
          <p className="text-white/60 text-xs">Case ID {caseId}</p>
        </div>
        <button className="text-white/70 hover:text-white shrink-0" data-testid="button-more">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-3">
        <div className="flex justify-start">
          <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%] shadow-sm">
            <p className="text-sm text-gray-800 leading-relaxed">
              Welcome to customer support. I'm here to help you with your query.
            </p>
          </div>
        </div>

        {conversation.messages?.map((msg) => {
          const isGuest = msg.senderType === "guest";
          return (
            <div key={msg.id} className={`flex ${isGuest ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                  isGuest
                    ? "bg-[#f0b429] rounded-br-sm"
                    : "bg-white rounded-tl-sm"
                }`}
                data-testid={`message-${msg.id}`}
              >
                <p className={`text-sm leading-relaxed ${isGuest ? "text-gray-900" : "text-gray-800"}`}>
                  {msg.content}
                </p>
                <p className={`text-xs mt-1.5 text-right ${isGuest ? "text-gray-700/70" : "text-gray-400"}`}>
                  {format(new Date(msg.createdAt), "HH:mm")}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="shrink-0 bg-white border-t border-gray-200 px-3 py-3">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <Input
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Ask Question"
            className="flex-1 h-10 rounded-full border-gray-200 bg-gray-50 text-sm focus-visible:ring-1 focus-visible:ring-[#1e3a5f]/30"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend(e as any);
              }
            }}
            data-testid="input-reply"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!replyContent.trim() || sendGuestMessage.isPending}
            className="rounded-full w-10 h-10 bg-[#1e3a5f] hover:bg-[#1e3a5f]/90 shrink-0"
            data-testid="button-send-reply"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
