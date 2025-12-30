import { Link, useLocation } from "wouter";
import { useStore } from "@/lib/store";
import { 
  LayoutDashboard, 
  ListTodo, 
  Trophy, 
  GraduationCap, 
  UserCircle, 
  Menu,
  X,
  ShieldCheck,
  LogOut
} from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // If no user, mock "auth layout" (just content)
  if (!user) {
    return <div className="min-h-screen bg-background text-foreground">{children}</div>;
  }

  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/" },
    { label: "Actions", icon: ListTodo, href: "/actions" },
    { label: "Quests", icon: Trophy, href: "/quests" },
    { label: "Leaderboard", icon: Trophy, href: "/leaderboard" }, // Reuse icon for now
    { label: "Learn", icon: GraduationCap, href: "/learn" },
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
            <span className="font-bold text-primary-foreground">P</span>
          </div>
          <span className="text-xl font-bold font-display tracking-tight">Play for Planet</span>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div 
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer ${
                  isActive(item.href) 
                    ? "bg-primary text-primary-foreground font-medium shadow-md shadow-primary/20" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </div>
            </Link>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-border">
          <Button variant="ghost" className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={logout}>
            <LogOut size={20} />
            Logout
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-background sticky top-0 z-50">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <span className="font-bold text-primary-foreground">P</span>
          </div>
          <span className="font-bold font-display">Play for Planet</span>
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
                <span className="font-bold text-primary-foreground">P</span>
              </div>
              <span className="text-xl font-bold font-display">Play for Planet</span>
            </div>
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                  <div 
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                      isActive(item.href) 
                        ? "bg-primary text-primary-foreground font-medium" 
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <item.icon size={20} />
                    <span>{item.label}</span>
                  </div>
                </Link>
              ))}
              <div className="mt-4 pt-4 border-t border-border">
                <Button variant="ghost" className="w-full justify-start gap-2 text-destructive" onClick={logout}>
                  <LogOut size={20} />
                  Logout
                </Button>
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </header>

      {/* Main Content */}
      <main className="flex-1 md:pl-64">
        <div className="container mx-auto max-w-5xl p-4 md:p-8 animate-in fade-in duration-500">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-background/80 backdrop-blur-lg p-2 flex justify-around items-center z-50 pb-safe">
        {navItems.slice(0, 4).map((item) => (
           <Link key={item.href} href={item.href}>
            <div className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${isActive(item.href) ? 'text-primary' : 'text-muted-foreground'}`}>
              <item.icon size={20} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </div>
          </Link>
        ))}
        <Link href="/profile">
           <div className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${isActive('/profile') ? 'text-primary' : 'text-muted-foreground'}`}>
              <UserCircle size={20} />
              <span className="text-[10px] font-medium">Profile</span>
            </div>
        </Link>
      </div>
    </div>
  );
}
