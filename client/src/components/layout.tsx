import { Link, useLocation } from "wouter";
import { useStore } from "@/lib/store";
import { useAppConfig } from "@/lib/configContext";
import { useAuth } from "@/lib/authContext";
import { useProfile } from "@/lib/useProfile";
import { 
  LayoutDashboard, 
  ListTodo, 
  Trophy, 
  GraduationCap, 
  UserCircle, 
  Menu,
  ShieldCheck,
  LogOut,
  Coins,
  Gift,
  Heart,
  ChartBar,
  FlaskConical,
  Settings
} from "lucide-react";
import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import FeedbackButton from "@/components/feedback-button";

const PUBLIC_PATHS = ['/auth', '/terms', '/privacy', '/onboarding'];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { user: storeUser, logout: storeLogout } = useStore();
  const { user: authUser, signOut, initialized } = useAuth();
  const { profile } = useProfile();
  const { config } = useAppConfig();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const user = profile || storeUser;
  const isPublicPath = PUBLIC_PATHS.some(path => location.startsWith(path));
  const isOnboardingPath = location.startsWith('/onboarding');
  const isAuthenticated = !!(authUser || storeUser);
  const needsOnboarding = profile && !profile.onboarding_complete;
  
  // Redirect unauthenticated users to auth page
  useEffect(() => {
    if (initialized && !isAuthenticated && !isPublicPath) {
      setLocation('/auth');
    }
  }, [initialized, isAuthenticated, isPublicPath, setLocation]);
  
  // Redirect users who need onboarding
  useEffect(() => {
    if (initialized && isAuthenticated && needsOnboarding && !isOnboardingPath && !isPublicPath) {
      setLocation('/onboarding');
    }
  }, [initialized, isAuthenticated, needsOnboarding, isOnboardingPath, isPublicPath, setLocation]);
  
  const handleLogout = async () => {
    await signOut();
    storeLogout();
    setLocation('/auth');
  };

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Render public pages without navigation  
  if (!isAuthenticated) {
    if (isPublicPath) {
      return <div className="min-h-screen bg-background text-foreground">{children}</div>;
    }
    // Show loading while redirecting
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/", enabled: true },
    { label: "Actions", icon: ListTodo, href: "/actions", enabled: config?.ENABLE_ACTIONS },
    { label: "Quests", icon: Trophy, href: "/quests", enabled: config?.ENABLE_QUESTS },
    { label: "Leaderboard", icon: ChartBar, href: "/leaderboard", enabled: config?.ENABLE_LEADERBOARD },
    { label: "Learn", icon: GraduationCap, href: "/learn", enabled: config?.ENABLE_LEARN },
    { label: "Credits", icon: Coins, href: "/credits", enabled: config?.ENABLE_CREDITS },
    { label: "Redeem", icon: Gift, href: "/redeem", enabled: config?.ENABLE_MARKETPLACE },
    { label: "Donate", icon: Heart, href: "/donate", enabled: config?.ENABLE_DONATIONS },
    { label: "Profile", icon: UserCircle, href: "/profile", enabled: true },
    { label: "Settings", icon: Settings, href: "/settings", enabled: true },
  ].filter(item => item.enabled);

  // Only show admin nav if profile role is admin (from database, not store)
  if (profile?.role === 'admin') {
    navItems.push({ label: "Admin", icon: ShieldCheck, href: "/admin", enabled: true });
  }
  
  const isPilotMode = config?.PILOT_MODE;

  const isActive = (path: string) => location === path;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-sidebar p-6 fixed h-full z-50">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <span className="font-bold text-primary-foreground text-sm">P</span>
          </div>
          <span className="text-lg font-bold font-display tracking-tight">Play for Planet</span>
        </div>
        
        {isPilotMode && (
          <div className="mb-4 px-2 py-1.5 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center gap-2">
            <FlaskConical className="w-3 h-3 text-blue-500" />
            <span className="text-xs font-medium text-blue-500">Pilot Mode</span>
          </div>
        )}

        {/* Credits Display */}
        <div className="mb-6 p-3 rounded-lg bg-primary/10 border border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">Credits</span>
            </div>
            <span className="font-bold font-mono" data-testid="sidebar-credits">{user?.credits ?? 0}</span>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div 
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer ${
                  isActive(item.href) 
                    ? "bg-primary text-primary-foreground font-medium shadow-md shadow-primary/20" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                <item.icon size={18} />
                <span className="text-sm">{item.label}</span>
              </div>
            </Link>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-border">
          <Button variant="ghost" className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleLogout}>
            <LogOut size={18} />
            Logout
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-background sticky top-0 z-50">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <span className="font-bold text-primary-foreground text-sm">P</span>
          </div>
          <span className="font-bold font-display">PfPE</span>
          {isPilotMode && <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-500 border-blue-500/20">PILOT</Badge>}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10">
            <Coins className="w-3 h-3 text-primary" />
            <span className="font-bold font-mono text-sm">{user?.credits ?? 0}</span>
          </div>
          
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu size={24} />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 bg-sidebar border-r-border p-6">
              <div className="flex items-center gap-2 mb-8">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <span className="font-bold text-primary-foreground text-sm">P</span>
                </div>
                <span className="text-lg font-bold font-display">Play for Planet</span>
              </div>
              <nav className="flex flex-col gap-1">
                {navItems.map((item) => (
                  <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                    <div 
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                        isActive(item.href) 
                          ? "bg-primary text-primary-foreground font-medium" 
                          : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <item.icon size={18} />
                      <span className="text-sm">{item.label}</span>
                    </div>
                  </Link>
                ))}
                <div className="mt-4 pt-4 border-t border-border">
                  <Button variant="ghost" className="w-full justify-start gap-2 text-destructive" onClick={handleLogout}>
                    <LogOut size={18} />
                    Logout
                  </Button>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 md:pl-64">
        <div className="container mx-auto max-w-6xl p-4 md:p-8 animate-in fade-in duration-300">
          {children}
        </div>
        
        {/* Feedback Button */}
        {isPilotMode && <FeedbackButton />}
      </main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 backdrop-blur-lg p-2 flex justify-around items-center z-50 pb-safe">
        {navItems
          .filter(item => ['Dashboard', 'Actions', 'Credits', 'Profile'].includes(item.label))
          .slice(0, 5)
          .map((item) => (
           <Link key={item.href} href={item.href}>
            <div className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${isActive(item.href) ? 'text-primary' : 'text-muted-foreground'}`}>
              <item.icon size={20} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
