import { useEffect, useRef, useState } from "react";
import { useParams, useLocation } from "wouter";
import {
  useGetGuestConversation,
  getGetGuestConversationQueryKey,
  useSendGuestMessage,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Send, ArrowLeft, Power, MoreHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

function BotAvatar({ size = 48 }: { size?: number }) {
  return (
    <img
      src="/bot-avatar.svg"
      alt="Support Bot"
      width={size}
      height={size}
      style={{ borderRadius: "50%" }}
    />
  );
}

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

  const handleBack = () => {
    localStorage.removeItem(`chat_token_link_${slug}`);
    setLocation(`/c/${slug}`);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-[100dvh] bg-[#f0f0f0]">
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="space-y-1 flex-1">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-36" />
          </div>
        </div>
        <div className="flex-1 p-4 space-y-4">
          <div className="flex justify-start"><Skeleton className="h-16 w-64 rounded-2xl" /></div>
          <div className="flex justify-end"><Skeleton className="h-12 w-52 rounded-2xl bg-yellow-100" /></div>
        </div>
      </div>
    );
  }

  if (error || !conversation) {
    return (
      <div className="flex flex-col h-[100dvh] bg-[#f0f0f0] items-center justify-center p-6">
        <BotAvatar size={72} />
        <h2 className="text-xl font-bold mt-4 mb-2">Conversation not found</h2>
        <p className="text-gray-500 text-sm text-center mb-6">This thread may have expired.</p>
        <button
          onClick={handleBack}
          className="bg-[#F0B429] text-gray-900 font-semibold px-6 py-2.5 rounded-full text-sm"
        >
          Start a new chat
        </button>
      </div>
    );
  }

  const caseId = `#${String(conversation.id).padStart(9, "0")}`;
  const agentName = conversation.ownerDisplayName;

  return (
    <div className="flex flex-col h-[100dvh] bg-[#f0f0f0]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 shadow-sm shrink-0">
        <button onClick={handleBack} className="text-gray-500 hover:text-gray-800 shrink-0 p-1">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="shrink-0"><BotAvatar size={44} /></div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 text-base leading-tight truncate">{agentName}</p>
          <p className="text-gray-500 text-xs mt-0.5">Case ID {caseId}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600">
            <Power className="w-4 h-4" />
          </button>
          <div className="flex items-center border border-gray-200 rounded-full overflow-hidden">
            <button className="px-3 py-1.5 text-gray-500 hover:bg-gray-50 flex items-center border-r border-gray-200">
              <MoreHorizontal className="w-4 h-4" />
            </button>
            <button onClick={handleBack} className="px-3 py-1.5 text-gray-500 hover:bg-gray-50 flex items-center">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {/* Welcome bubble */}
        <div className="flex justify-start items-end gap-2">
          <BotAvatar size={28} />
          <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 max-w-[80%] shadow-sm">
            <p className="text-sm text-gray-800 leading-relaxed">
              Welcome to customer support. I'm your {agentName} assistant. How can I help you today?
            </p>
          </div>
        </div>

        {conversation.messages?.map((msg) => {
          const isGuest = msg.senderType === "guest";
          return (
            <div key={msg.id} className={`flex items-end gap-2 ${isGuest ? "justify-end" : "justify-start"}`}>
              {!isGuest && <BotAvatar size={28} />}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
                  isGuest ? "bg-[#F0B429] rounded-br-sm" : "bg-white rounded-bl-sm"
                }`}
              >
                <p className={`text-sm leading-relaxed ${isGuest ? "text-gray-900" : "text-gray-800"}`}>
                  {msg.content}
                </p>
                <p className={`text-[11px] mt-1.5 text-right ${isGuest ? "text-gray-700/60" : "text-gray-400"}`}>
                  {format(new Date(msg.createdAt), "HH:mm")}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 bg-white border-t border-gray-100 px-4 py-3">
        <form onSubmit={handleSend} className="flex items-center gap-3">
          <Input
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Ask Question"
            className="flex-1 h-10 rounded-full border-gray-200 bg-gray-50 text-sm focus-visible:ring-1 focus-visible:ring-yellow-400/50"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e as any); }
            }}
            autoFocus
          />
          <Button
            type="submit"
            size="icon"
            disabled={!replyContent.trim() || sendGuestMessage.isPending}
            className="rounded-full w-10 h-10 bg-[#F0B429] hover:bg-[#e0a820] text-gray-900 shrink-0 shadow-sm"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
