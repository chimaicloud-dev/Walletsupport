import { useParams, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useGetUserByHandle, getGetUserByHandleQueryKey, useStartConversation } from "@workspace/api-client-react";
import PublicLayout from "@/components/public-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare } from "lucide-react";

const contactSchema = z.object({
  guestName: z.string().min(1, "Name is required").max(50),
  guestEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  subject: z.string().min(1, "Subject is required").max(100),
  message: z.string().min(1, "Message is required"),
});

type ContactValues = z.infer<typeof contactSchema>;

export default function PublicChatPage() {
  const params = useParams();
  const handle = params.handle as string;
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: profile, isLoading, error } = useGetUserByHandle(handle, {
    query: {
      enabled: !!handle,
      queryKey: getGetUserByHandleQueryKey(handle),
      retry: false
    }
  });

  const startConversation = useStartConversation({
    mutation: {
      onSuccess: (data) => {
        toast({ title: "Message sent", description: "Your message has been sent successfully." });
        setLocation(`/chat/${handle}/thread/${data.token}`);
      },
      onError: (err: any) => {
        toast({ 
          variant: "destructive", 
          title: "Error sending message", 
          description: err?.message || "Please try again later."
        });
      }
    }
  });

  const form = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      guestName: "",
      guestEmail: "",
      subject: "",
      message: "",
    },
  });

  const onSubmit = (data: ContactValues) => {
    startConversation.mutate({
      handle,
      data: {
        ...data,
        guestEmail: data.guestEmail || undefined
      }
    });
  };

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-12 sm:py-24">
          <div className="text-center mb-12">
            <Skeleton className="h-10 w-48 mx-auto mb-4" />
            <Skeleton className="h-5 w-64 mx-auto" />
          </div>
          <div className="bg-card border border-border shadow-sm rounded-2xl p-6 sm:p-8 space-y-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (error || !profile) {
    return (
      <PublicLayout>
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <MessageSquare className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Profile not found</h2>
          <p className="text-muted-foreground">The support handle <strong>{handle}</strong> does not exist.</p>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-12 sm:py-20">
        <div className="text-center mb-10 space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
            <MessageSquare className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Contact {profile.displayName}
            </h1>
            {profile.bio && (
              <p className="mt-3 text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
                {profile.bio}
              </p>
            )}
          </div>
        </div>

        <div className="bg-card border border-border shadow-xl shadow-black/5 rounded-2xl p-6 sm:p-8">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="guestName">Your Name *</Label>
                <Input
                  id="guestName"
                  placeholder="Jane Doe"
                  className="h-11"
                  {...form.register("guestName")}
                />
                {form.formState.errors.guestName && (
                  <p className="text-sm text-destructive">{form.formState.errors.guestName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="guestEmail">Email (Optional)</Label>
                <Input
                  id="guestEmail"
                  type="email"
                  placeholder="jane@example.com"
                  className="h-11"
                  {...form.register("guestEmail")}
                />
                {form.formState.errors.guestEmail && (
                  <p className="text-sm text-destructive">{form.formState.errors.guestEmail.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                placeholder="What is this regarding?"
                className="h-11"
                {...form.register("subject")}
              />
              {form.formState.errors.subject && (
                <p className="text-sm text-destructive">{form.formState.errors.subject.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                placeholder="How can I help you today?"
                className="min-h-[120px] resize-y"
                {...form.register("message")}
              />
              {form.formState.errors.message && (
                <p className="text-sm text-destructive">{form.formState.errors.message.message}</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-base font-medium shadow-sm"
              disabled={startConversation.isPending}
            >
              {startConversation.isPending ? "Sending..." : "Send Message"}
            </Button>
          </form>
        </div>
      </div>
    </PublicLayout>
  );
}