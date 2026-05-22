import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useGetLinkProfile, getGetLinkProfileQueryKey, useStartConversationByLink } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { getVisitorName } from "@/utils/notifications";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

function BotAvatar({ size = 48 }: { size?: number }) {
  return (
    <img src="/bot-avatar.svg" alt="Wallet support ExPJdev" width={size} height={size} style={{ borderRadius: "50%" }} />
  );
}

export default function PublicLinkChatPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [email, setEmail] = useState(() => localStorage.getItem("visitor_email") || "");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(false);

  const tokenKey = `chat_token_link_${slug}`;

  const { data: profile } = useGetLinkProfile(slug, {
    query: { queryKey: getGetLinkProfileQueryKey(slug), retry: false },
  });

  const startConversation = useStartConversationByLink({
    mutation: {
      onSuccess: (data) => {
        localStorage.setItem(tokenKey, data.token);
        setLocation(`/c/${slug}/thread/${data.token}`);
      },
      onError: () => {
        setSubmitted(false);
        setError(true);
        toast({ variant: "destructive", title: "Could not connect. Please try again." });
      },
    },
  });

  useEffect(() => {
    if (!slug) return;
    const existing = localStorage.getItem(tokenKey);
    if (existing) {
      setLocation(`/c/${slug}/thread/${existing}`);
    }
  }, [slug]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submitted) return;
    setSubmitted(true);
    if (email.trim()) localStorage.setItem("visitor_email", email.trim());
    const visitorName = email.trim()
      ? email.trim().split("@")[0]
      : getVisitorName();
    startConversation.mutate({
      slug,
      data: { guestName: visitorName, message: "", email: email.trim() || undefined } as any,
    });
  };

  const agentName = profile?.displayName || "Customer Support";

  if (error) {
    return (
      <div className="flex flex-col h-[100dvh] bg-[#f0f0f0] items-center justify-center p-6">
        <BotAvatar size={72} />
        <h2 className="text-xl font-bold mt-4 mb-2">Connection failed</h2>
        <p className="text-gray-500 text-sm text-center mb-6">We could not reach support. Please try again.</p>
        <button onClick={() => { setError(false); setSubmitted(false); }}
          className="bg-[#F0B429] text-gray-900 font-semibold px-6 py-2.5 rounded-full text-sm">
          Try again
        </button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex flex-col h-[100dvh] bg-[#f0f0f0]">
        <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 shadow-sm">
          <BotAvatar size={44} />
          <div>
            <p className="font-bold text-gray-900 text-base leading-tight">{agentName}</p>
            <p className="text-gray-500 text-xs">Connecting…</p>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <BotAvatar size={56} />
            <p className="text-gray-500 text-sm">Starting your chat…</p>
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-[#f0f0f0]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 shadow-sm shrink-0">
        <BotAvatar size={44} />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 text-base leading-tight truncate">{agentName}</p>
          <p className="text-gray-500 text-xs">Wallet support ExPJdev</p>
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 overflow-auto p-4 flex flex-col justify-end gap-3">
        <div className="flex justify-start items-end gap-2">
          <BotAvatar size={28} />
          <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 max-w-[82%] shadow-sm">
            <p className="text-sm text-gray-800 leading-relaxed">
              Welcome to customer support. I'm your {agentName} assistant. How can I help you today?
            </p>
          </div>
        </div>

        <div className="flex justify-start items-end gap-2">
          <BotAvatar size={28} />
          <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 max-w-[82%] shadow-sm">
            <p className="text-sm text-gray-800 mb-3">
              Please enter your email so we can follow up if needed.
            </p>
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="h-9 text-sm rounded-full border-gray-200 bg-gray-50 flex-1"
                autoFocus
                data-testid="input-email"
              />
              <Button
                type="submit"
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white shrink-0 rounded-full px-4"
                data-testid="button-start-chat"
              >
                <Send className="w-3.5 h-3.5" />
              </Button>
            </form>
            <button
              type="button"
              onClick={handleSubmit}
              className="mt-2 text-xs text-gray-400 hover:text-gray-600 w-full text-center"
            >
              Skip — start without email
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
