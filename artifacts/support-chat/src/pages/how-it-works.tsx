import Layout from "@/components/layout";
import { Wallet, Link as LinkIcon, MessageCircle, CheckCircle2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/auth";

const DEFAULT_LINK_COST = 500;

export default function HowItWorksPage() {
  const { data: pricing } = useQuery({
    queryKey: ["/api/auth/pricing"],
    queryFn: async () => {
      const response = await fetch("/api/auth/pricing");
      if (!response.ok) throw new Error("Could not load current link price.");
      return response.json() as Promise<{ linkPrice: number }>;
    },
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
  const { user } = useAuth();
  const linkCost = pricing?.linkPrice ?? user?.linkCost ?? DEFAULT_LINK_COST;
  return (
    <Layout>
      <div className="flex flex-col h-full">
        <header className="h-16 px-8 flex items-center border-b border-border bg-card shrink-0">
          <h1 className="text-xl font-semibold text-foreground">How It Works</h1>
        </header>

        <div className="flex-1 overflow-auto p-6 sm:p-8">
          <div className="max-w-3xl mx-auto space-y-6">
            <div>
              <p className="text-sm text-muted-foreground">
                Learn how to fund your wallet, create a support link, and receive messages from your users.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <section className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center mb-4">
                  <Wallet className="w-5 h-5 text-green-700" />
                </div>
                <h2 className="font-semibold text-foreground mb-2">1. Fund your wallet</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Open <strong>My Links</strong>, choose <strong>Buy Tokens</strong>, enter the amount you want to purchase, and pay to the displayed PalmPay account. Select “Mark as paid &amp; send receipt” to send your receipt on WhatsApp. An admin will verify the payment and credit your wallet.
                </p>
              </section>

              <section className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center mb-4">
                  <LinkIcon className="w-5 h-5 text-blue-700" />
                </div>
                <h2 className="font-semibold text-foreground mb-2">2. Generate a link</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  In <strong>My Links</strong>, click <strong>Create Link</strong>. Add a label, choose a unique URL name, and optionally set the chat header name. {user?.isFreeSubscription ? "Your free subscription means links have no wallet charges and never need renewal." : <>Each link costs ₦{linkCost.toLocaleString()}. Its first visitor starts a 24-hour active period; after that, renew it for the same price.</>}
                </p>
              </section>

              <section className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center mb-4">
                  <MessageCircle className="w-5 h-5 text-yellow-700" />
                </div>
                <h2 className="font-semibold text-foreground mb-2">3. Share with your user</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Copy the live link or email button and send it to the intended user. Messages sent through that link arrive in your <strong>Inbox</strong> under your account.
                </p>
              </section>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
              <div className="flex gap-3 items-start">
                <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <h2 className="font-semibold text-blue-900 mb-1">Your account and your links</h2>
                  <p className="text-sm text-blue-800 leading-relaxed">
                    Every link you create belongs to your account and sends its conversations to your Inbox. Keep each link for the user you shared it with. You can edit its chat name or delete it from My Links at any time.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}