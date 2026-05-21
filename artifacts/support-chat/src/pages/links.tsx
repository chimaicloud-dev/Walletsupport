import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useListLinks,
  getListLinksQueryKey,
  useCreateLink,
  useDeleteLink,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Copy, CheckCircle2, Trash2, Plus, Link as LinkIcon, X } from "lucide-react";
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
});

type CreateLinkValues = z.infer<typeof createLinkSchema>;

export default function LinksPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const { data: links, isLoading } = useListLinks({
    query: { queryKey: getListLinksQueryKey() },
  });

  const form = useForm<CreateLinkValues>({
    resolver: zodResolver(createLinkSchema),
    defaultValues: { slug: "", label: "" },
  });

  const createLink = useCreateLink({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListLinksQueryKey() });
        toast({ title: "Link created", description: "Your custom chat link is ready to share." });
        form.reset();
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

  const deleteLink = useDeleteLink({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListLinksQueryKey() });
        toast({ title: "Link deleted" });
      },
    },
  });

  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  const getLinkUrl = (slug: string) =>
    `${window.location.origin}${basePath}/c/${slug}`;

  const handleCopy = (id: number, slug: string) => {
    navigator.clipboard.writeText(getLinkUrl(slug));
    setCopiedId(id);
    toast({ title: "Link copied to clipboard" });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const onSubmit = (data: CreateLinkValues) => {
    createLink.mutate({ data });
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
              Create custom links to share with different audiences. Anyone with your link can start a chat directly with you.
            </p>

            {isLoading ? (
              <div className="space-y-3 mt-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-xl" />
                ))}
              </div>
            ) : links && links.length > 0 ? (
              <div className="space-y-3 mt-4">
                {links.map((link) => (
                  <div
                    key={link.id}
                    className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm"
                    data-testid={`link-card-${link.id}`}
                  >
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                      <LinkIcon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{link.label}</p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {getLinkUrl(link.slug)}
                      </p>
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 mt-2">
            <div className="space-y-2">
              <Label htmlFor="label">Link label</Label>
              <Input
                id="label"
                placeholder="e.g. Customer Support, VIP Clients"
                {...form.register("label")}
                data-testid="input-link-label"
              />
              {form.formState.errors.label && (
                <p className="text-xs text-destructive">{form.formState.errors.label.message}</p>
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
                  {...form.register("slug")}
                  data-testid="input-link-slug"
                />
              </div>
              {form.formState.errors.slug && (
                <p className="text-xs text-destructive">{form.formState.errors.slug.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Letters, numbers, hyphens and underscores only.
              </p>
            </div>

            <div className="flex gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => { setShowCreate(false); form.reset(); }}
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
    </Layout>
  );
}
