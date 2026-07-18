import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/context/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignUpPage() {
  const [, setLocation] = useLocation();
  const { register, isLoading } = useAuth();
  const [form, setForm] = useState({ email: "", password: "", handle: "", displayName: "" });
  const [error, setError] = useState("");

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    try {
      await register(form.email, form.password, form.handle, form.displayName);
      setLocation("/inbox");
    } catch (err: any) {
      setError(err.message || "Registration failed");
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-blue-700 to-blue-600 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/bot-avatar.svg" alt="Wallet support ExPJdev" className="w-14 h-14 rounded-full mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white">Create your account</h1>
          <p className="text-blue-200 text-sm mt-1">Set up your support inbox in seconds</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="displayName">Full name</Label>
              <Input
                id="displayName"
                placeholder="John Smith"
                value={form.displayName}
                onChange={set("displayName")}
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="handle">
                Username <span className="text-muted-foreground font-normal">(your public chat link)</span>
              </Label>
              <div className="flex items-center border rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-primary/30">
                <span className="px-3 py-2 text-sm text-muted-foreground bg-muted border-r select-none">
                  /chat/
                </span>
                <Input
                  id="handle"
                  placeholder="johnsupport"
                  value={form.handle}
                  onChange={set("handle")}
                  required
                  pattern="[a-zA-Z0-9_-]+"
                  title="Only letters, numbers, underscores, and hyphens"
                  className="border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={set("email")}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 8 characters"
                value={form.password}
                onChange={set("password")}
                required
                minLength={8}
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating account…" : "Create account"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link href="/sign-in" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
