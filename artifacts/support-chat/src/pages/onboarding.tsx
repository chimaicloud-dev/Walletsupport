import { useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useGetMe, getGetMeQueryKey, useUpsertMe } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const onboardingSchema = z.object({
  handle: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/, "Only letters, numbers, underscores, and hyphens"),
  displayName: z.string().min(1, "Name is required").max(50),
  bio: z.string().max(160).optional(),
});

type OnboardingValues = z.infer<typeof onboardingSchema>;

export default function OnboardingPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: userProfile, isLoading: isProfileLoading } = useGetMe({
    query: {
      queryKey: getGetMeQueryKey(),
      retry: false,
    },
  });

  const upsertMe = useUpsertMe({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        toast({ title: "Welcome to InfoMail PJ!", description: "Your support inbox is ready." });
        setLocation("/inbox");
      },
      onError: (err: any) => {
        toast({
          variant: "destructive",
          title: "Error saving profile",
          description: err?.message || "Please try another handle.",
        });
      },
    },
  });

  useEffect(() => {
    if (userProfile && userProfile.handle) {
      setLocation("/inbox");
    }
  }, [userProfile, setLocation]);

  const form = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: { handle: "", displayName: "", bio: "" },
  });

  const onSubmit = (data: OnboardingValues) => {
    upsertMe.mutate({ data });
  };

  if (isProfileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <div className="flex flex-col items-center gap-3">
          <img src="/bot-avatar.svg" alt="InfoMail PJ" className="w-14 h-14 rounded-full animate-pulse" />
          <p className="text-blue-500 text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-700 to-blue-600 px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <img src="/bot-avatar.svg" alt="InfoMail PJ" className="w-16 h-16 rounded-full mx-auto mb-4 shadow-lg" />
          <h2 className="text-3xl font-bold tracking-tight text-white">Set up InfoMail PJ</h2>
          <p className="mt-2 text-blue-200">Pick your unique link and display name.</p>
        </div>

        <div className="bg-white border border-blue-100 shadow-2xl rounded-2xl p-6 sm:p-8">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="handle">Support Handle</Label>
              <div className="flex items-center">
                <span className="text-muted-foreground bg-muted px-3 py-2 border border-r-0 border-input rounded-l-md text-sm">
                  /chat/
                </span>
                <Input
                  id="handle"
                  className="rounded-l-none"
                  placeholder="yourname"
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
                placeholder="How should clients call you?"
                {...form.register("displayName")}
              />
              {form.formState.errors.displayName && (
                <p className="text-sm text-destructive">{form.formState.errors.displayName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Short Bio (Optional)</Label>
              <Textarea
                id="bio"
                placeholder="I help with Binance, Bybit, Bitget…"
                className="resize-none h-20"
                {...form.register("bio")}
              />
              {form.formState.errors.bio && (
                <p className="text-sm text-destructive">{form.formState.errors.bio.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full h-11 bg-blue-600 hover:bg-blue-700" disabled={upsertMe.isPending}>
              {upsertMe.isPending ? "Setting up…" : "Start Supporting Clients"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
