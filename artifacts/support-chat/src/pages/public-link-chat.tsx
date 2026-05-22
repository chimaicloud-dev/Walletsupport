import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useStartConversationByLink } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { getVisitorName } from "@/utils/notifications";

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

export default function PublicLinkChatPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [error, setError] = useState(false);

  const tokenKey = `chat_token_link_${slug}`;

  const startConversation = useStartConversationByLink({
    mutation: {
      onSuccess: (data) => {
        localStorage.setItem(tokenKey, data.token);
        setLocation(`/c/${slug}/thread/${data.token}`);
      },
      onError: () => {
        setError(true);
        toast({ variant: "destructive", title: "Could not connect to support. Please try again." });
      },
    },
  });

  useEffect(() => {
    if (!slug) return;
    const existing = localStorage.getItem(tokenKey);
    if (existing) {
      setLocation(`/c/${slug}/thread/${existing}`);
      return;
    }
    const visitorName = getVisitorName();
    startConversation.mutate({ slug, data: { guestName: visitorName, message: "" } });
  }, [slug]);

  if (error) {
    return (
      <div className="flex flex-col h-[100dvh] bg-[#f0f0f0] items-center justify-center p-6">
        <BotAvatar size={72} />
        <h2 className="text-xl font-bold mt-4 mb-2">Connection failed</h2>
        <p className="text-gray-500 text-sm text-center mb-6">
          We could not reach support right now. Please try again.
        </p>
        <button
          onClick={() => {
            setError(false);
            const visitorName = getVisitorName();
            startConversation.mutate({ slug, data: { guestName: visitorName, message: "" } });
          }}
          className="bg-[#F0B429] text-gray-900 font-semibold px-6 py-2.5 rounded-full text-sm"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-[#f0f0f0]">
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 shadow-sm">
        <BotAvatar size={44} />
        <div>
          <p className="font-bold text-gray-900 text-base leading-tight">Customer Support</p>
          <p className="text-gray-500 text-xs">Connecting…</p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <BotAvatar size={56} />
          <p className="text-gray-500 text-sm">Starting your chat…</p>
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-[#F0B429] rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
