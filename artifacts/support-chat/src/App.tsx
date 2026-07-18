import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { QueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/auth";

import LandingPage from "@/pages/landing";
import SignInPage from "@/pages/sign-in";
import SignUpPage from "@/pages/sign-up";
import InboxPage from "@/pages/inbox";
import ThreadPage from "@/pages/thread";
import SettingsPage from "@/pages/settings";
import LinksPage from "@/pages/links";
import PublicChatPage from "@/pages/public-chat";
import PublicThreadPage from "@/pages/public-thread";
import PublicLinkChatPage from "@/pages/public-link-chat";
import PublicLinkThreadPage from "@/pages/public-link-thread";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function HomeRedirect() {
  const { user } = useAuth();
  return user ? <Redirect to="/inbox" /> : <LandingPage />;
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user } = useAuth();
  return user ? <Component /> : <Redirect to="/sign-in" />;
}

function GuestOnlyRoute({ component: Component }: { component: React.ComponentType }) {
  const { user } = useAuth();
  return user ? <Redirect to="/inbox" /> : <Component />;
}

function AppRoutes() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Switch>
          <Route path="/" component={HomeRedirect} />
          <Route path="/sign-in" component={() => <GuestOnlyRoute component={SignInPage} />} />
          <Route path="/sign-up" component={() => <GuestOnlyRoute component={SignUpPage} />} />
          <Route path="/inbox" component={() => <ProtectedRoute component={InboxPage} />} />
          <Route path="/inbox/:id" component={() => <ProtectedRoute component={ThreadPage} />} />
          <Route path="/settings" component={() => <ProtectedRoute component={SettingsPage} />} />
          <Route path="/links" component={() => <ProtectedRoute component={LinksPage} />} />

          <Route path="/chat/:handle" component={PublicChatPage} />
          <Route path="/chat/:handle/thread/:token" component={PublicThreadPage} />
          <Route path="/c/:slug" component={PublicLinkChatPage} />
          <Route path="/c/:slug/thread/:token" component={PublicLinkThreadPage} />

          <Route component={NotFound} />
        </Switch>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </WouterRouter>
  );
}

export default App;
