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
import { Copy, CheckCircle2, Trash2, Plus, Link as LinkIcon, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const createLinkSchema = z.object({
  slug: z
    .string()
    .min(3, "At least 3 characters")
    .max(50)
    .regex(/^[a-zA-Z0-9_-]+$/, "Only letters, numbers, hyphens, and underscores"),
  label: z.string().min(1, "Label is required").max(80),
  customName: z.string().max(80).optional(),
});

const editNameSchema = z.object({
  customName: z.string().max(80),
});

type CreateLinkValues = z.infer<typeof createLinkSchema>;
type EditNameValues = z.infer<typeof editNameSchema>;

export default function LinksPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editingLink, setEditingLink] = useState<{ id: number; customName: string | null; label: string } | null>(null);

  const { data: links, isLoading } = useListLinks({
    query: { queryKey: getListLinksQueryKey() },
  });

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
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListLinksQueryKey() });
        toast({ title: "Link created", description: "Your custom chat link is ready to share." });
        createForm.reset();
        setShowCreate(false);
      },
      onError: (err: any) => {
        toast({
          variant: "destructive",
          title: "Could not create link",
          description: err?.response?.data?.error || "That slug may already be taken.",
        });
      },
    },
  });

  const updateLink = useUpdateLink({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListLinksQueryKey() });
        toast({ title: "Name updated", description: "Visitors will now see the new name in the chat header." });
        setEditingLink(null);
        editForm.reset();
      },
      onError: () => {
        toast({ variant: "destructive", title: "Could not update link name." });
      },
    },
  });

  const deleteLink = useDeleteLink({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListLinksQueryKey() });
        toast({ title: "Link deleted" });
      },
    },
  });

  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
  const getLinkUrl = (slug: string) => `${window.location.origin}${basePath}/c/${slug}`;

  const handleCopy = (id: number, slug: string) => {
    navigator.clipboard.writeText(getLinkUrl(slug));
    setCopiedId(id);
    toast({ title: "Link copied to clipboard" });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const onSubmit = (data: CreateLinkValues) => {
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

  return (
    <Layout>
      <div className="flex flex-col h-full">
        <header className="h-16 px-8 flex items-center justify-between border-b border-border bg-card shrink-0">
          <h1 className="text-xl font-semibold text-foreground">My Links</h1>
          <Button
            onClick={() => setShowCreate(true)}
            className="gap-2"
            data-testid="button-create-link"
          >
            <Plus className="w-4 h-4" />
            Create Link
          </Button>
        </header>

        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-2xl mx-auto space-y-4">
            <p className="text-sm text-muted-foreground">
              Create custom links to share with different audiences. Set a custom chat name so visitors see a specific brand or agent name in the chat header.
            </p>

            {isLoading ? (
              <div className="space-y-3 mt-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-xl" />
                ))}
              </div>
            ) : links && links.length > 0 ? (
              <div className="space-y-3 mt-4">
                {links.map((link) => (
                  <div
                    key={link.id}
                    className="bg-card border border-border rounded-xl p-4 flex items-start gap-4 shadow-sm"
                    data-testid={`link-card-${link.id}`}
                  >
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                      <LinkIcon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{link.label}</p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {getLinkUrl(link.slug)}
                      </p>
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className="text-[11px] text-muted-foreground">Chat header name:</span>
                        <span className="text-[11px] font-medium text-foreground">
                          {link.customName?.trim() || <span className="text-muted-foreground italic">your display name</span>}
                        </span>
                        <button
                          className="ml-0.5 text-muted-foreground hover:text-foreground transition-colors"
                          onClick={() => openEditDialog({ id: link.id, customName: link.customName ?? null, label: link.label })}
                          data-testid={`button-edit-name-${link.id}`}
                          title="Edit chat name"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopy(link.id, link.slug)}
                        className="gap-1.5"
                        data-testid={`button-copy-link-${link.id}`}
                      >
                        {copiedId === link.id ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        {copiedId === link.id ? "Copied" : "Copy"}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-8 h-8 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteLink.mutate({ id: link.id })}
                        data-testid={`button-delete-link-${link.id}`}
                      >
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
                <p className="text-sm text-muted-foreground mb-6">
                  Create your first custom link to start receiving messages.
                </p>
                <Button onClick={() => setShowCreate(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Create your first link
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Link Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create a new link</DialogTitle>
          </DialogHeader>
          <form onSubmit={createForm.handleSubmit(onSubmit)} className="space-y-5 mt-2">
            <div className="space-y-2">
              <Label htmlFor="label">Link label</Label>
              <Input
                id="label"
                placeholder="e.g. Customer Support, VIP Clients"
                {...createForm.register("label")}
                data-testid="input-link-label"
              />
              {createForm.formState.errors.label && (
                <p className="text-xs text-destructive">{createForm.formState.errors.label.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Custom URL</Label>
              <div className="flex items-center">
                <span className="text-muted-foreground bg-muted px-3 py-2.5 border border-r-0 border-input rounded-l-md text-sm whitespace-nowrap">
                  /c/
                </span>
                <Input
                  id="slug"
                  className="rounded-l-none"
                  placeholder="my-support-link"
                  {...createForm.register("slug")}
                  data-testid="input-link-slug"
                />
              </div>
              {createForm.formState.errors.slug && (
                <p className="text-xs text-destructive">{createForm.formState.errors.slug.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Letters, numbers, hyphens and underscores only.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customName">
                Chat header name <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input
                id="customName"
                placeholder="e.g. Binance Support, VIP Desk"
                {...createForm.register("customName")}
                data-testid="input-link-custom-name"
              />
              {createForm.formState.errors.customName && (
                <p className="text-xs text-destructive">{createForm.formState.errors.customName.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                This name appears in the chat header when visitors open this link. Defaults to your display name.
              </p>
            </div>

            <div className="flex gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => { setShowCreate(false); createForm.reset(); }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={createLink.isPending}
                data-testid="button-submit-create-link"
              >
                {createLink.isPending ? "Creating..." : "Create Link"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Chat Name Dialog */}
      <Dialog open={!!editingLink} onOpenChange={(open) => { if (!open) { setEditingLink(null); editForm.reset(); } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit chat header name</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground -mt-2">
            This name appears in the chat header for <span className="font-medium text-foreground">{editingLink?.label}</span>. Leave blank to use your display name.
          </p>
          <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4 mt-1">
            <div className="space-y-2">
              <Label htmlFor="edit-customName">Chat header name</Label>
              <Input
                id="edit-customName"
                placeholder="e.g. Binance Support, VIP Desk"
                {...editForm.register("customName")}
                data-testid="input-edit-custom-name"
                autoFocus
              />
              {editForm.formState.errors.customName && (
                <p className="text-xs text-destructive">{editForm.formState.errors.customName.message}</p>
              )}
            </div>
            <div className="flex gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => { setEditingLink(null); editForm.reset(); }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={updateLink.isPending}
                data-testid="button-submit-edit-name"
              >
                {updateLink.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
