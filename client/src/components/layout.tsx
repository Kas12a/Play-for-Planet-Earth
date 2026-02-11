import { Link, useLocation } from "wouter";
import { useStore } from "@/lib/store";
import { useAppConfig } from "@/lib/configContext";
import { useAuth } from "@/lib/authContext";
import { useProfile } from "@/lib/useProfile";
import { EmailVerificationBanner, EmailVerificationModal } from "@/components/email-verification-modal";
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
  Settings,
  Leaf,
  TreePine,
  Zap,
  Bike,
  Recycle,
  Sparkles,
  User,
  Dumbbell
} from "lucide-react";

const AVATARS: Record<string, { icon: typeof Leaf; color: string }> = {
  leaf: { icon: Leaf, color: 'bg-green-500' },
  tree: { icon: TreePine, color: 'bg-emerald-600' },
  zap: { icon: Zap, color: 'bg-yellow-500' },
  bike: { icon: Bike, color: 'bg-blue-500' },
  recycle: { icon: Recycle, color: 'bg-teal-500' },
  heart: { icon: Heart, color: 'bg-pink-500' },
  sparkles: { icon: Sparkles, color: 'bg-purple-500' },
  user: { icon: User, color: 'bg-gray-500' },
};
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
  const { profile, loading: profileLoading } = useProfile();
  const { config } = useAppConfig();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const user = profile || storeUser;
  const isPublicPath = PUBLIC_PATHS.some(path => location.startsWith(path));
  const isOnboardingPath = location.startsWith('/onboarding');
  const isAuthenticated = !!(authUser || storeUser);
  
  // Only determine onboarding status after profile has loaded
  const profileReady = isAuthenticated && !profileLoading && profile !== null;
  const needsOnboarding = profileReady && !profile.onboarding_complete;
  
  // Redirect unauthenticated users to auth page
  useEffect(() => {
    if (initialized && !isAuthenticated && !isPublicPath) {
      setLocation('/auth');
    }
  }, [initialized, isAuthenticated, isPublicPath, setLocation]);
  
  // Redirect users who need onboarding (only after profile is loaded)
  useEffect(() => {
    if (initialized && profileReady && needsOnboarding && !isOnboardingPath && !isPublicPath) {
      setLocation('/onboarding');
    }
  }, [initialized, profileReady, needsOnboarding, isOnboardingPath, isPublicPath, setLocation]);
  
  const handleLogout = async () => {
    await signOut();
    storeLogout();
    setLocation('/auth');
  };

  // Show loading while auth or profile is initializing
  if (!initialized || (isAuthenticated && profileLoading && !isPublicPath)) {
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
    { label: "Workouts", icon: Dumbbell, href: "/workouts", enabled: true },
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
      <aside className="hidden md:flex flex-col w-64 border-r border-white/[0.06] bg-gradient-to-b from-sidebar to-black/20 p-6 fixed h-full z-50">
        <div className="flex items-center gap-3 mb-5">
          {profile?.profile_picture_url ? (
            <img 
              src={profile.profile_picture_url} 
              alt="Profile" 
              className="w-10 h-10 rounded-xl object-cover shadow-lg"
            />
          ) : (() => {
            const avatarKey = profile?.avatar_key || 'leaf';
            const avatar = AVATARS[avatarKey] || AVATARS.leaf;
            const AvatarIcon = avatar.icon;
            return (
              <div className={`w-10 h-10 rounded-xl ${avatar.color} flex items-center justify-center shadow-lg`}>
                <AvatarIcon className="w-5 h-5 text-white" />
              </div>
            );
          })()}
          <div className="min-w-0">
            <span className="text-sm sm:text-base font-bold font-display tracking-tight leading-tight whitespace-nowrap">Play for Planet Earth</span>
          </div>
        </div>
        
        {isPilotMode && (
          <div className="mb-4 px-3 py-2 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 flex items-center justify-center gap-2">
            <FlaskConical className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-xs font-semibold text-blue-400">Pilot Mode</span>
          </div>
        )}

        {/* Credits Display */}
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 neon-glow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Coins className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">Credits</span>
            </div>
            <span className="text-xl font-bold font-mono gradient-text" data-testid="sidebar-credits">{user?.credits ?? 0}</span>
          </div>
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div 
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer group ${
                  isActive(item.href) 
                    ? "sidebar-active bg-gradient-to-r from-primary/20 to-transparent text-foreground font-medium" 
                    : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
                }`}
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                <item.icon size={18} className={isActive(item.href) ? "text-primary" : "group-hover:text-primary transition-colors"} />
                <span className="text-sm">{item.label}</span>
              </div>
            </Link>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-white/[0.06]">
          <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-xl py-3 transition-all" onClick={handleLogout}>
            <LogOut size={18} />
            Logout
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 border-b border-white/[0.06] bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-2">
          {profile?.profile_picture_url ? (
            <img 
              src={profile.profile_picture_url} 
              alt="Profile" 
              className="w-9 h-9 rounded-xl object-cover shadow-lg"
            />
          ) : (() => {
            const avatarKey = profile?.avatar_key || 'leaf';
            const avatar = AVATARS[avatarKey] || AVATARS.leaf;
            const AvatarIcon = avatar.icon;
            return (
              <div className={`w-9 h-9 rounded-xl ${avatar.color} flex items-center justify-center shadow-lg`}>
                <AvatarIcon className="w-4 h-4 text-white" />
              </div>
            );
          })()}
          <div className="min-w-0">
            <span className="font-bold font-display text-xs sm:text-sm leading-tight whitespace-nowrap">Play for Planet Earth</span>
          </div>
          {isPilotMode && <Badge variant="outline" className="text-[9px] bg-blue-500/10 text-blue-400 border-blue-500/20 ml-1">PILOT</Badge>}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-primary/15 to-primary/5 border border-primary/20">
            <Coins className="w-3.5 h-3.5 text-primary" />
            <span className="font-bold font-mono text-sm gradient-text">{user?.credits ?? 0}</span>
          </div>
          
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-xl hover:bg-white/[0.04]">
                <Menu size={22} />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-gradient-to-b from-sidebar to-black/40 border-r-white/[0.06] p-6">
              <div className="flex items-center gap-3 mb-8">
                {profile?.profile_picture_url ? (
                  <img 
                    src={profile.profile_picture_url} 
                    alt="Profile" 
                    className="w-12 h-12 rounded-xl object-cover shadow-lg"
                  />
                ) : (() => {
                  const avatarKey = profile?.avatar_key || 'leaf';
                  const avatar = AVATARS[avatarKey] || AVATARS.leaf;
                  const AvatarIcon = avatar.icon;
                  return (
                    <div className={`w-12 h-12 rounded-xl ${avatar.color} flex items-center justify-center shadow-lg`}>
                      <AvatarIcon className="w-6 h-6 text-white" />
                    </div>
                  );
                })()}
                <div className="min-w-0">
                  <span className="text-base sm:text-lg font-bold font-display leading-tight whitespace-nowrap">Play for Planet Earth</span>
                </div>
              </div>
              <nav className="flex flex-col gap-2">
                {navItems.map((item) => (
                  <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                    <div 
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                        isActive(item.href) 
                          ? "sidebar-active bg-gradient-to-r from-primary/20 to-transparent text-foreground font-medium" 
                          : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
                      }`}
                    >
                      <item.icon size={18} className={isActive(item.href) ? "text-primary" : ""} />
                      <span className="text-sm">{item.label}</span>
                    </div>
                  </Link>
                ))}
                <div className="mt-6 pt-6 border-t border-white/[0.06]">
                  <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-xl py-3" onClick={handleLogout}>
                    <LogOut size={18} />
                    Logout
                  </Button>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Email Verification Modal (shows on all pages) */}
      <EmailVerificationModal />
      
      {/* Main Content */}
      <main className="flex-1 md:pl-64">
        <div className="container mx-auto max-w-6xl px-3 py-4 sm:p-4 md:p-6 lg:p-8 animate-in fade-in duration-300">
          {/* Email verification banner at top of every page */}
          <EmailVerificationBanner />
          {children}
        </div>
        
        {/* Feedback Button */}
        {isPilotMode && <FeedbackButton />}
      </main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 backdrop-blur-lg p-2 flex justify-around items-center z-50 pb-safe">
        {navItems
          .filter(item => ['Dashboard', 'Quests', 'Credits', 'Profile'].includes(item.label))
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
