import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ConfigProvider, useAppConfig } from "@/lib/configContext";
import { AuthProvider } from "@/lib/authContext";
import Layout from "@/components/layout";

// Pages
import AuthPage from "@/pages/auth";
import OnboardingPage from "@/pages/onboarding";
import DashboardPage from "@/pages/dashboard";
import ActionsPage from "@/pages/actions";
import QuestsPage from "@/pages/quests";
import LeaderboardPage from "@/pages/leaderboard";
import LearnPage from "@/pages/learn";
import ProfilePage from "@/pages/profile";
import CreditsPage from "@/pages/credits";
import RedeemPage from "@/pages/redeem";
import DonatePage from "@/pages/donate";
import AdminPage from "@/pages/admin";
import SettingsPage from "@/pages/settings";
import TermsPage from "@/pages/terms";
import PrivacyPage from "@/pages/privacy";
import WorkoutsPage from "@/pages/workouts";
import ComingSoonPage from "@/pages/coming-soon";
import NotFound from "@/pages/not-found";

function Router() {
  const { config, loading } = useAppConfig();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-muted-foreground text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <Switch>
        <Route path="/auth" component={AuthPage} />
        <Route path="/onboarding" component={OnboardingPage} />
        
        <Route path="/" component={DashboardPage} />
        <Route path="/actions" component={config?.ENABLE_ACTIONS ? ActionsPage : ComingSoonPage} />
        <Route path="/quests" component={config?.ENABLE_QUESTS ? QuestsPage : ComingSoonPage} />
        <Route path="/leaderboard" component={config?.ENABLE_LEADERBOARD ? LeaderboardPage : ComingSoonPage} />
        <Route path="/learn" component={config?.ENABLE_LEARN ? LearnPage : ComingSoonPage} />
        <Route path="/profile" component={ProfilePage} />
        <Route path="/settings" component={SettingsPage} />
        <Route path="/workouts" component={WorkoutsPage} />
        <Route path="/terms" component={TermsPage} />
        <Route path="/privacy" component={PrivacyPage} />
        <Route path="/credits" component={config?.ENABLE_CREDITS ? CreditsPage : ComingSoonPage} />
        <Route path="/redeem" component={config?.ENABLE_MARKETPLACE ? RedeemPage : ComingSoonPage} />
        <Route path="/donate" component={config?.ENABLE_DONATIONS ? DonatePage : ComingSoonPage} />
        <Route path="/admin" component={AdminPage} />
        
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ConfigProvider>
    </QueryClientProvider>
  );
}

export default App;
