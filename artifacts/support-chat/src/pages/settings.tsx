import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useGetMe, getGetMeQueryKey, useUpsertMe } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, Link as LinkIcon, CheckCircle2 } from "lucide-react";
import { useState } from "react";

const settingsSchema = z.object({
  handle: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/, "Only letters, numbers, underscores, and hyphens"),
  displayName: z.string().min(1, "Name is required").max(50),
  bio: z.string().max(160).optional(),
});

type SettingsValues = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  
  const { data: userProfile, isLoading } = useGetMe({
    query: {
      queryKey: getGetMeQueryKey()
    }
  });

  const form = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      handle: "",
      displayName: "",
      bio: "",
    },
  });

  useEffect(() => {
    if (userProfile) {
      form.reset({
        handle: userProfile.handle || "",
        displayName: userProfile.displayName || "",
        bio: userProfile.bio || "",
      });
    }
  }, [userProfile, form]);

  const upsertMe = useUpsertMe({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        toast({ title: "Settings saved", description: "Your profile has been updated." });
      },
      onError: (err: any) => {
        toast({ 
          variant: "destructive", 
          title: "Error saving profile", 
          description: err?.message || "Please try another handle."
        });
      }
    }
  });

  const onSubmit = (data: SettingsValues) => {
    upsertMe.mutate({ data });
  };

  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
  const shareableLink = userProfile?.handle 
    ? `${window.location.origin}${basePath}/chat/${userProfile.handle}` 
    : "";

  const handleCopyLink = () => {
    if (!shareableLink) return;
    navigator.clipboard.writeText(shareableLink);
    setCopied(true);
    toast({ title: "Link copied", description: "Shareable link copied to clipboard." });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Layout>
      <div className="flex flex-col h-full">
        <header className="h-16 px-8 flex items-center border-b border-border bg-card shrink-0">
          <h1 className="text-xl font-semibold text-foreground">Settings</h1>
        </header>

        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-2xl mx-auto space-y-8">
            
            {/* Shareable Link Section */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <LinkIcon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Your Support Link</h3>
                  <p className="text-sm text-muted-foreground">Share this link with your audience to receive messages.</p>
                </div>
              </div>
              
              {isLoading ? (
                <Skeleton className="h-12 w-full rounded-md" />
              ) : (
                <div className="flex items-center mt-4">
                  <div className="flex-1 bg-muted px-4 py-3 rounded-l-lg border border-border border-r-0 truncate text-sm font-medium text-foreground">
                    {shareableLink || "Set a handle to generate your link"}
                  </div>
                  <Button 
                    onClick={handleCopyLink}
                    disabled={!shareableLink}
                    className="rounded-l-none h-[46px] px-6"
                  >
                    {copied ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                    {copied ? "Copied" : "Copy Link"}
                  </Button>
                </div>
              )}
            </div>

            {/* Profile Form */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-6">Profile Details</h3>
              
              {isLoading ? (
                <div className="space-y-6">
                  <div className="space-y-2"><Skeleton className="h-5 w-24" /><Skeleton className="h-10 w-full" /></div>
                  <div className="space-y-2"><Skeleton className="h-5 w-24" /><Skeleton className="h-10 w-full" /></div>
                  <div className="space-y-2"><Skeleton className="h-5 w-24" /><Skeleton className="h-24 w-full" /></div>
                </div>
              ) : (
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="handle">Handle</Label>
                    <div className="flex items-center">
                      <span className="text-muted-foreground bg-muted px-3 py-2.5 border border-r-0 border-input rounded-l-md text-sm">
                        /chat/
                      </span>
                      <Input
                        id="handle"
                        className="rounded-l-none h-[42px]"
                        {...form.register("handle")}
                      />
                    </div>
                    {form.formState.errors.handle && (
                      <p className="text-sm text-destructive">{form.formState.errors.handle.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      className="h-[42px]"
                      {...form.register("displayName")}
                    />
                    {form.formState.errors.displayName && (
                      <p className="text-sm text-destructive">{form.formState.errors.displayName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      className="resize-none h-24"
                      placeholder="Tell visitors what you can help with..."
                      {...form.register("bio")}
                    />
                    {form.formState.errors.bio && (
                      <p className="text-sm text-destructive">{form.formState.errors.bio.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground text-right">
                      {form.watch("bio")?.length || 0}/160
                    </p>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={upsertMe.isPending}
                    >
                      {upsertMe.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              )}
            </div>

          </div>
        </div>
      </div>
    </Layout>
  );
}