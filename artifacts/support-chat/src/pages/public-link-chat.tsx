import { useState } from "react";
import { useParams, useLocation } from "wouter";
import {
  useGetLinkProfile,
  getGetLinkProfileQueryKey,
  useStartConversationByLink,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Send, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function PublicLinkChatPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [step, setStep] = useState<"name" | "message">("name");
  const [guestName, setGuestName] = useState("");
  const [message, setMessage] = useState("");

  const { data: profile, isLoading, error } = useGetLinkProfile(slug, {
    query: {
      enabled: !!slug,
      queryKey: getGetLinkProfileQueryKey(slug),
      retry: false,
    },
  });

  const startConversation = useStartConversationByLink({
    mutation: {
      onSuccess: (data) => {
        setLocation(`/c/${slug}/thread/${data.token}`);
      },
      onError: () => {
        toast({ variant: "destructive", title: "Failed to start chat. Please try again." });
      },
    },
  });

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;
    setStep("message");
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    startConversation.mutate({
      slug,
      data: { guestName: guestName.trim(), message: message.trim() },
    });
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
        <div className="flex-1 flex items-center justify-center">
          <Skeleton className="h-32 w-72 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col h-[100dvh] bg-[#f5f5f5] items-center justify-center p-6">
        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow">
          <MessageSquare className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold mb-2">Link not found</h2>
        <p className="text-muted-foreground text-sm text-center">
          This support link does not exist or has been removed.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-[#f5f5f5]">
      {/* Header */}
      <div className="bg-[#1e3a5f] px-4 py-3 flex items-center gap-3 shadow-md shrink-0">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          <MessageSquare className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-white font-semibold text-sm leading-tight truncate">
            {profile.displayName}
          </p>
          <p className="text-white/60 text-xs">Support</p>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-auto p-4 flex flex-col justify-end gap-3">
        <div className="flex justify-start">
          <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%] shadow-sm">
            <p className="text-sm text-gray-800 leading-relaxed">
              Welcome to {profile.displayName}'s support.
              {profile.bio ? ` ${profile.bio}` : " How can I help you today?"}
            </p>
          </div>
        </div>

        {step === "name" && (
          <div className="flex justify-start">
            <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%] shadow-sm">
              <p className="text-sm text-gray-800 mb-3">Before we start, what's your name?</p>
              <form onSubmit={handleNameSubmit} className="flex gap-2">
                <Input
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Enter your name"
                  className="h-9 text-sm"
                  autoFocus
                  data-testid="input-guest-name"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!guestName.trim()}
                  className="bg-[#1e3a5f] hover:bg-[#1e3a5f]/90 shrink-0"
                  data-testid="button-name-submit"
                >
                  Next
                </Button>
              </form>
            </div>
          </div>
        )}

        {step === "message" && (
          <>
            <div className="flex justify-end">
              <div className="bg-[#f0b429] rounded-2xl rounded-br-sm px-4 py-3 max-w-[85%] shadow-sm">
                <p className="text-sm text-gray-900 font-medium">{guestName}</p>
              </div>
            </div>
            <div className="flex justify-start">
              <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%] shadow-sm">
                <p className="text-sm text-gray-800">
                  Hi {guestName}! What can I help you with?
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Input bar */}
      {step === "message" && (
        <div className="shrink-0 bg-white border-t border-gray-200 px-3 py-3">
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask Question"
              className="flex-1 h-10 rounded-full border-gray-200 bg-gray-50 text-sm focus-visible:ring-1 focus-visible:ring-[#1e3a5f]/30"
              autoFocus
              data-testid="input-message"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!message.trim() || startConversation.isPending}
              className="rounded-full w-10 h-10 bg-[#1e3a5f] hover:bg-[#1e3a5f]/90 shrink-0"
              data-testid="button-send-message"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
