import { Link, useLocation } from "wouter";
import { useStore } from "@/lib/store";
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
  ChartBar
} from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!user) {
    return <div className="min-h-screen bg-background text-foreground">{children}</div>;
  }

  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/" },
    { label: "Actions", icon: ListTodo, href: "/actions" },
    { label: "Quests", icon: Trophy, href: "/quests" },
    { label: "Leaderboard", icon: ChartBar, href: "/leaderboard" },
    { label: "Learn", icon: GraduationCap, href: "/learn" },
    { label: "Credits", icon: Coins, href: "/credits" },
    { label: "Redeem", icon: Gift, href: "/redeem" },
    { label: "Donate", icon: Heart, href: "/donate" },
    { label: "Profile", icon: UserCircle, href: "/profile" },
  ];

  if (user.role === 'admin') {
    navItems.push({ label: "Admin", icon: ShieldCheck, href: "/admin" });
  }

  const isActive = (path: string) => location === path;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-sidebar p-6 fixed h-full z-50">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <span className="font-bold text-primary-foreground text-sm">P</span>
          </div>
          <span className="text-lg font-bold font-display tracking-tight">Play for Planet</span>
        </div>

        {/* Credits Display */}
        <div className="mb-6 p-3 rounded-lg bg-primary/10 border border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">Credits</span>
            </div>
            <span className="font-bold font-mono">{user.credits}</span>
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
              >
                <item.icon size={18} />
                <span className="text-sm">{item.label}</span>
              </div>
            </Link>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-border">
          {user.investorMode && (
            <Badge className="w-full mb-3 justify-center bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
              Demo Mode Active
            </Badge>
          )}
          <Button variant="ghost" className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={logout}>
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
          {user.investorMode && <Badge variant="outline" className="text-[10px] bg-yellow-500/10 text-yellow-500 border-yellow-500/20">DEMO</Badge>}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10">
            <Coins className="w-3 h-3 text-primary" />
            <span className="font-bold font-mono text-sm">{user.credits}</span>
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
                  <Button variant="ghost" className="w-full justify-start gap-2 text-destructive" onClick={logout}>
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
      </main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 backdrop-blur-lg p-2 flex justify-around items-center z-50 pb-safe">
        {[navItems[0], navItems[1], navItems[5], navItems[6], navItems[8]].map((item) => (
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
