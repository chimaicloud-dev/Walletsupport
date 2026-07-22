import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useListLinks,
  getListLinksQueryKey,
  useCreateLink,
  useUpdateLink,
  useDeleteLink,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth";
import { Copy, CheckCircle2, Trash2, Plus, Link as LinkIcon, Pencil, Mail, Coins } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ADMIN_WHATSAPP = "2348135590989";
const TOKEN_COST_NAIRA = 300;

const createLinkSchema = z.object({
  slug: z.string().min(3, "At least 3 characters").max(50).regex(/^[a-zA-Z0-9_-]+$/, "Only letters, numbers, hyphens, and underscores"),
  label: z.string().min(1, "Label is required").max(80),
  customName: z.string().max(80).optional(),
});

const editNameSchema = z.object({ customName: z.string().max(80) });

type CreateLinkValues = z.infer<typeof createLinkSchema>;
type EditNameValues = z.infer<typeof editNameSchema>;

function TokenBadge({ balance }: { balance: number }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
      balance > 0 ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-600 border-red-200"
    }`}>
      <Coins className="w-3 h-3" />
      {balance} token{balance !== 1 ? "s" : ""}
    </span>
  );
}

function BuyTokensModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const whatsappMsg = encodeURIComponent(
    `Hi, I'd like to buy tokens for my Wallet Support account.\n\nEmail: ${user?.email}\nHandle: @${user?.handle}\n\nPlease confirm payment of ₦${TOKEN_COST_NAIRA} per token.`
  );
  const whatsappUrl = `https://wa.me/${ADMIN_WHATSAPP}?text=${whatsappMsg}`;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-yellow-500" />
            Buy Tokens
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-1">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-amber-800 mb-1">How it works</p>
            <ul className="text-sm text-amber-700 space-y-1 list-none">
              <li>🔗 Each link you create costs <strong>1 token (₦{TOKEN_COST_NAIRA})</strong></li>
              <li>📱 Contact admin on WhatsApp to pay</li>
              <li>✅ Admin credits your account once confirmed</li>
            </ul>
          </div>

          <div className="bg-muted rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Admin WhatsApp</p>
            <p className="text-xl font-bold text-foreground tracking-wide">08135590989</p>
            <p className="text-xs text-muted-foreground mt-1">Available for payment approvals</p>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
            <p className="text-xs text-blue-700">
              <strong>Your account info to share:</strong><br />
              Email: {user?.email}<br />
              Handle: @{user?.handle}
            </p>
          </div>

          <Button
            className="w-full bg-[#25D366] hover:bg-[#20bf5a] text-white gap-2"
            onClick={() => window.open(whatsappUrl, "_blank")}
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.116 1.523 5.845L.057 23.492a.5.5 0 00.614.611l5.796-1.52A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.812 9.812 0 01-5.002-1.366l-.359-.214-3.721.976.993-3.622-.234-.373A9.818 9.818 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/></svg>
            Chat on WhatsApp
          </Button>

          <Button variant="outline" className="w-full" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function LinksPage() {
  const { toast } = useToast();
  const { user, setTokenBalance } = useAuth();
  const queryClient = useQueryClient();
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [emailCopiedId, setEmailCopiedId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showBuyTokens, setShowBuyTokens] = useState(false);
  const [editingLink, setEditingLink] = useState<{ id: number; customName: string | null; label: string } | null>(null);

  const { data: links, isLoading } = useListLinks({ query: { queryKey: getListLinksQueryKey() } });

  const createForm = useForm<CreateLinkValues>({
    resolver: zodResolver(createLinkSchema),
    defaultValues: { slug: "", label: "", customName: "" },
  });

  const editForm = useForm<EditNameValues>({
    resolver: zodResolver(editNameSchema),
    defaultValues: { customName: "" },
  });

  const createLink = useCreateLink({
    mutation: {
      onSuccess: (data: any) => {
        queryClient.invalidateQueries({ queryKey: getListLinksQueryKey() });
        toast({ title: "Link created", description: "Your custom chat link is ready to share." });
        if (typeof data?.tokenBalance === "number") setTokenBalance(data.tokenBalance);
        createForm.reset();
        setShowCreate(false);
      },
      onError: (err: any) => {
        const status = err?.response?.status;
        const msg = err?.response?.data?.error || "That slug may already be taken.";
        if (status === 402) {
          setShowCreate(false);
          setShowBuyTokens(true);
          return;
        }
        toast({ variant: "destructive", title: "Could not create link", description: msg });
      },
    },
  });

  const updateLink = useUpdateLink({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListLinksQueryKey() });
        toast({ title: "Name updated" });
        setEditingLink(null);
        editForm.reset();
      },
      onError: () => toast({ variant: "destructive", title: "Could not update link name." }),
    },
  });

  const deleteLink = useDeleteLink({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListLinksQueryKey() }) },
  });

  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
  const getLinkUrl = (slug: string) => `${window.location.origin}${basePath}/c/${slug}`;

  const handleCopy = (id: number, slug: string) => {
    navigator.clipboard.writeText(getLinkUrl(slug));
    setCopiedId(id);
    toast({ title: "Link copied to clipboard" });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyEmail = (id: number, slug: string, displayName: string) => {
    const url = getLinkUrl(slug);
    const avatarUrl = `${window.location.origin}${basePath}/bot-avatar.svg`;
    const snippet = `<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,sans-serif;max-width:380px;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
  <tr><td style="background:#1e3a5f;padding:24px;text-align:center;"><img src="${avatarUrl}" width="72" height="72" alt="Support" style="border-radius:50%;display:block;margin:0 auto;" /></td></tr>
  <tr><td style="background:#ffffff;padding:24px;text-align:center;">
    <p style="margin:0 0 4px 0;font-size:20px;font-weight:bold;color:#111111;">${displayName}</p>
    <p style="margin:0 0 20px 0;font-size:14px;color:#6b7280;">Live support chat — reply within minutes</p>
    <a href="${url}" style="display:inline-block;background:#F0B429;color:#111111;padding:13px 32px;border-radius:99px;font-size:15px;font-weight:bold;text-decoration:none;">Chat Now &rarr;</a>
    <p style="margin:16px 0 0 0;font-size:11px;color:#9ca3af;">Or copy this link: ${url}</p>
  </td></tr>
</table>`;
    navigator.clipboard.writeText(snippet);
    setEmailCopiedId(id);
    toast({ title: "Email snippet copied", description: "Paste it into Gmail, Apple Mail, or Outlook." });
    setTimeout(() => setEmailCopiedId(null), 3000);
  };

  const onSubmit = (data: CreateLinkValues) => {
    if ((user?.tokenBalance ?? 0) < 1) {
      setShowCreate(false);
      setShowBuyTokens(true);
      return;
    }
    createLink.mutate({ data: { slug: data.slug, label: data.label, customName: data.customName || undefined } });
  };

  const openEditDialog = (link: { id: number; customName: string | null; label: string }) => {
    setEditingLink(link);
    editForm.reset({ customName: link.customName ?? "" });
  };

  const onEditSubmit = (data: EditNameValues) => {
    if (!editingLink) return;
    updateLink.mutate({ id: editingLink.id, data: { customName: data.customName } });
  };

  const tokenBalance = user?.tokenBalance ?? 0;

  return (
    <Layout>
      <div className="flex flex-col h-full">
        <header className="h-16 px-8 flex items-center justify-between border-b border-border bg-card shrink-0">
          <h1 className="text-xl font-semibold text-foreground">My Links</h1>
          <div className="flex items-center gap-3">
            <TokenBadge balance={tokenBalance} />
            {tokenBalance === 0 && (
              <Button variant="outline" size="sm" className="gap-1.5 text-yellow-600 border-yellow-300 hover:bg-yellow-50" onClick={() => setShowBuyTokens(true)}>
                <Coins className="w-3.5 h-3.5" /> Buy Tokens
              </Button>
            )}
            <Button onClick={() => setShowCreate(true)} className="gap-2" data-testid="button-create-link">
              <Plus className="w-4 h-4" /> Create Link
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="flex items-start justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                Each link costs <strong>1 token (₦{TOKEN_COST_NAIRA})</strong>. Share links with different audiences and track their conversations.
              </p>
            </div>

            {tokenBalance === 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
                <Coins className="w-5 h-5 text-amber-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-amber-800">You have no tokens</p>
                  <p className="text-xs text-amber-700 mt-0.5">Contact admin on WhatsApp <strong>08135590989</strong> to buy tokens (₦{TOKEN_COST_NAIRA} each).</p>
                </div>
                <Button size="sm" className="bg-[#25D366] hover:bg-[#20bf5a] text-white shrink-0" onClick={() => setShowBuyTokens(true)}>
                  Buy Now
                </Button>
              </div>
            )}

            {isLoading ? (
              <div className="space-y-3 mt-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
              </div>
            ) : links && links.length > 0 ? (
              <div className="space-y-3 mt-4">
                {links.map(link => (
                  <div key={link.id} className="bg-card border border-border rounded-xl p-4 flex items-start gap-4 shadow-sm" data-testid={`link-card-${link.id}`}>
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                      <LinkIcon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{link.label}</p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{getLinkUrl(link.slug)}</p>
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className="text-[11px] text-muted-foreground">Chat name:</span>
                        <span className="text-[11px] font-medium text-foreground">
                          {link.customName?.trim() || <span className="text-muted-foreground italic">your display name</span>}
                        </span>
                        <button className="ml-0.5 text-muted-foreground hover:text-foreground" onClick={() => openEditDialog({ id: link.id, customName: link.customName ?? null, label: link.label })} title="Edit chat name">
                          <Pencil className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button size="sm" variant="outline" onClick={() => handleCopyEmail(link.id, link.slug, link.customName?.trim() || link.label)} className={`gap-1.5 ${emailCopiedId === link.id ? "border-green-300 text-green-700" : ""}`} title="Copy HTML email snippet">
                        {emailCopiedId === link.id ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> : <Mail className="w-3.5 h-3.5" />}
                        {emailCopiedId === link.id ? "Copied!" : "Email"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleCopy(link.id, link.slug)} className="gap-1.5">
                        {copiedId === link.id ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedId === link.id ? "Copied" : "Copy"}
                      </Button>
                      <Button size="icon" variant="ghost" className="w-8 h-8 text-muted-foreground hover:text-destructive" onClick={() => deleteLink.mutate({ id: link.id })}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-8 text-center py-16 border-2 border-dashed border-border rounded-xl">
                <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center mx-auto mb-4">
                  <LinkIcon className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="font-medium text-foreground mb-1">No links yet</p>
                <p className="text-sm text-muted-foreground mb-6">Create your first custom link to start receiving messages.</p>
                <Button onClick={() => tokenBalance > 0 ? setShowCreate(true) : setShowBuyTokens(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  {tokenBalance > 0 ? "Create your first link" : "Buy tokens to get started"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Buy Tokens Modal */}
      {showBuyTokens && <BuyTokensModal onClose={() => setShowBuyTokens(false)} />}

      {/* Create Link Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create a new link</DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-2 bg-muted px-3 py-2 rounded-lg mb-2">
            <Coins className="w-4 h-4 text-yellow-500" />
            <span className="text-sm text-muted-foreground">This will use <strong>1 token</strong>. You have <strong>{tokenBalance}</strong>.</span>
          </div>
          <form onSubmit={createForm.handleSubmit(onSubmit)} className="space-y-5 mt-1">
            <div className="space-y-2">
              <Label htmlFor="label">Link label</Label>
              <Input id="label" placeholder="e.g. Customer Support, VIP Clients" {...createForm.register("label")} />
              {createForm.formState.errors.label && <p className="text-xs text-destructive">{createForm.formState.errors.label.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Custom URL</Label>
              <div className="flex items-center">
                <span className="text-muted-foreground bg-muted px-3 py-2.5 border border-r-0 border-input rounded-l-md text-sm whitespace-nowrap">/c/</span>
                <Input id="slug" className="rounded-l-none" placeholder="my-support-link" {...createForm.register("slug")} />
              </div>
              {createForm.formState.errors.slug && <p className="text-xs text-destructive">{createForm.formState.errors.slug.message}</p>}
              <p className="text-xs text-muted-foreground">Letters, numbers, hyphens and underscores only.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="customName">Chat header name <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input id="customName" placeholder="e.g. Binance Support, VIP Desk" {...createForm.register("customName")} />
              {createForm.formState.errors.customName && <p className="text-xs text-destructive">{createForm.formState.errors.customName.message}</p>}
            </div>
            <div className="flex gap-3 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={() => { setShowCreate(false); createForm.reset(); }}>Cancel</Button>
              <Button type="submit" className="flex-1" disabled={createLink.isPending}>
                {createLink.isPending ? "Creating…" : "Create Link"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Chat Name Dialog */}
      <Dialog open={!!editingLink} onOpenChange={open => { if (!open) { setEditingLink(null); editForm.reset(); } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Edit chat header name</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground -mt-2">For <span className="font-medium text-foreground">{editingLink?.label}</span>. Leave blank to use your display name.</p>
          <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4 mt-1">
            <div className="space-y-2">
              <Label htmlFor="edit-customName">Chat header name</Label>
              <Input id="edit-customName" placeholder="e.g. Binance Support, VIP Desk" {...editForm.register("customName")} autoFocus />
            </div>
            <div className="flex gap-3 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={() => { setEditingLink(null); editForm.reset(); }}>Cancel</Button>
              <Button type="submit" className="flex-1" disabled={updateLink.isPending}>{updateLink.isPending ? "Saving…" : "Save"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
