import { useStore, ACTION_TYPES } from "@/lib/store";
import { useAuth } from "@/lib/authContext";
import { useProfile } from "@/lib/useProfile";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Leaf, 
  Flame, 
  Trophy, 
  Target, 
  PlusCircle, 
  Droplet, 
  Utensils, 
  Bus, 
  Zap, 
  Sprout, 
  Recycle,
  ShoppingBag,
  ArrowRight,
  Coins,
  TrendingUp,
  Cloud,
  Trash2
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

export default function DashboardPage() {
  const { user: authUser, initialized } = useAuth();
  const { profile } = useProfile();
  const { user: storeUser, actions, transactions } = useStore();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (initialized && !authUser) {
      setLocation("/auth");
    }
  }, [authUser, initialized, setLocation]);

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!authUser) return null;

  const user = profile || storeUser || {
    name: authUser.email?.split('@')[0] || 'Eco Warrior',
    credits: 0,
    streak: 0,
    points: 0,
  };
  
  // Use display_name first (from profile), fall back to name, then email prefix
  const displayName = (profile?.display_name) || user.name || authUser.email?.split('@')[0] || 'Eco Warrior';

  // Mock data calculations
  const weeklyGoal = 500;
  const currentWeeklyPoints = user.points % 500;
  const progress = Math.min((currentWeeklyPoints / weeklyGoal) * 100, 100);

  // Calculate impact from actions
  const weeklyActions = actions.filter(a => 
    new Date(a.timestamp) > new Date(Date.now() - 7 * 86400000)
  );
  const totalCO2Saved = weeklyActions.reduce((sum, a) => {
    const action = ACTION_TYPES.find(at => at.id === a.actionId);
    return sum + (action?.impactCO2 || 0);
  }, 0);

  const totalWasteAvoided = weeklyActions.reduce((sum, a) => {
    const action = ACTION_TYPES.find(at => at.id === a.actionId);
    return sum + (action?.impactWaste || 0);
  }, 0);

  const icons: Record<string, any> = {
    droplet: Droplet,
    utensils: Utensils,
    footprints: Bus,
    bus: Bus,
    'thermometer-snowflake': Zap,
    sprout: Sprout,
    recycle: Recycle,
    'shopping-bag': ShoppingBag
  };

  // Generate chart data from actual transactions
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const today = new Date();
  const chartData = days.map((day, i) => {
    const dayStart = new Date(today);
    dayStart.setDate(today.getDate() - (6 - i));
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);
    
    const dayCredits = transactions
      .filter(t => t.type === 'EARN' && new Date(t.createdAt) >= dayStart && new Date(t.createdAt) <= dayEnd)
      .reduce((sum, t) => sum + t.amount, 0);
    
    return { day, credits: dayCredits };
  });

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8 pb-24 md:pb-0">
      {/* Hero Welcome Section */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl hero-gradient p-4 sm:p-6 md:p-8 lg:p-10 border border-white/[0.08]">
        <div className="absolute top-0 right-0 w-32 sm:w-48 md:w-64 h-32 sm:h-48 md:h-64 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-24 sm:w-36 md:w-48 h-24 sm:h-36 md:h-48 bg-cyan-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 sm:gap-6">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold font-display mb-1 sm:mb-2">
                Welcome back, <span className="gradient-text">{displayName}</span>!
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base md:text-lg">Ready to make a difference today?</p>
            </div>
            <div className="flex gap-2 sm:gap-3">
              <Link href="/actions">
                <Button 
                  className="btn-premium text-primary-foreground font-semibold px-3 py-4 sm:px-4 sm:py-5 md:px-6 md:py-6 text-xs sm:text-sm md:text-base rounded-lg sm:rounded-xl"
                  data-testid="button-log-action"
                >
                  <PlusCircle className="mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" /> <span className="hidden sm:inline">Log Action</span><span className="sm:hidden">Log</span>
                </Button>
              </Link>
              <Link href="/credits">
                <Button variant="outline" className="px-3 py-4 sm:px-4 sm:py-5 md:px-5 md:py-6 rounded-lg sm:rounded-xl border-white/10 hover:bg-white/5 text-xs sm:text-sm" data-testid="button-view-credits">
                  <Coins className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Credits
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
        <div className="stat-card card-hover">
          <div className="stat-card-inner flex flex-col items-center justify-center text-center p-3 sm:p-4 md:p-5">
            <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-2 sm:mb-3 neon-glow-sm">
              <Coins className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-primary" />
            </div>
            <div className="text-2xl sm:text-3xl md:text-4xl font-bold font-mono gradient-text" data-testid="text-credits-balance">{user.credits}</div>
            <div className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider font-semibold mt-1">Credits</div>
          </div>
        </div>

        <div className="stat-card card-hover">
          <div className="stat-card-inner flex flex-col items-center justify-center text-center p-3 sm:p-4 md:p-5">
            <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-orange-500/20 to-orange-500/5 flex items-center justify-center mb-2 sm:mb-3">
              <Flame className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-orange-500 animate-pulse streak-fire" />
            </div>
            <div className="text-2xl sm:text-3xl md:text-4xl font-bold font-mono text-orange-400">{user.streak}</div>
            <div className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider font-semibold mt-1">Day Streak</div>
          </div>
        </div>

        <div className="stat-card card-hover">
          <div className="stat-card-inner flex flex-col items-center justify-center text-center p-3 sm:p-4 md:p-5">
            <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 flex items-center justify-center mb-2 sm:mb-3">
              <Trophy className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-yellow-500" />
            </div>
            <div className="text-2xl sm:text-3xl md:text-4xl font-bold font-mono text-yellow-400">{user.points}</div>
            <div className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider font-semibold mt-1">Total Points</div>
          </div>
        </div>

        <div className="stat-card card-hover">
          <div className="stat-card-inner flex flex-col items-center justify-center text-center p-3 sm:p-4 md:p-5">
            <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 flex items-center justify-center mb-2 sm:mb-3">
              <Target className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-purple-500" />
            </div>
            <div className="text-2xl sm:text-3xl md:text-4xl font-bold font-mono text-purple-400">{weeklyActions.length}</div>
            <div className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider font-semibold mt-1">This Week</div>
          </div>
        </div>
      </div>

      {/* Impact Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
        <Card className="glass-card card-hover overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardContent className="pt-4 sm:pt-6 relative">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2.5 sm:p-3 md:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/20">
                <Cloud className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-emerald-400" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl md:text-3xl font-bold font-mono text-emerald-400">{totalCO2Saved.toFixed(1)} <span className="text-xs sm:text-sm font-sans text-muted-foreground">kg</span></div>
                <div className="text-xs sm:text-sm text-muted-foreground">CO2e saved this week</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card card-hover overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardContent className="pt-4 sm:pt-6 relative">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2.5 sm:p-3 md:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 border border-cyan-500/20">
                <Trash2 className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-cyan-400" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl md:text-3xl font-bold font-mono text-cyan-400">{totalWasteAvoided.toFixed(1)} <span className="text-xs sm:text-sm font-sans text-muted-foreground">kg</span></div>
                <div className="text-xs sm:text-sm text-muted-foreground">Waste avoided this week</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card card-hover overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardContent className="pt-6 relative">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 border border-amber-500/20">
                <TrendingUp className="w-7 h-7 text-amber-400" />
              </div>
              <div>
                <div className="text-3xl font-bold font-mono text-amber-400">{weeklyActions.length}</div>
                <div className="text-sm text-muted-foreground">Actions this week</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Why PfPE Works - Investor Friendly */}
      <Card className="border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Leaf className="w-5 h-5 text-primary" />
            Why Play for Planet Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <div className="p-2 rounded-full bg-primary/10">
                <Target className="w-4 h-4 text-primary" />
              </div>
              <div>
                <div className="font-semibold text-sm">Daily Quests</div>
                <div className="text-xs text-muted-foreground">Build sustainable habits through gamified challenges</div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <div className="p-2 rounded-full bg-primary/10">
                <Trophy className="w-4 h-4 text-primary" />
              </div>
              <div>
                <div className="font-semibold text-sm">Community Ranking</div>
                <div className="text-xs text-muted-foreground">Compete and collaborate with your cohort</div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <div className="p-2 rounded-full bg-primary/10">
                <Coins className="w-4 h-4 text-primary" />
              </div>
              <div>
                <div className="font-semibold text-sm">Real Rewards</div>
                <div className="text-xs text-muted-foreground">Earn credits for tangible eco-friendly rewards</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Goal & Chart */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Weekly Goal
              </CardTitle>
              <span className="text-sm text-muted-foreground">{currentWeeklyPoints} / {weeklyGoal} XP</span>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={progress} className="h-3 mb-4" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Credits Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-[120px]">
             <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="day" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                    itemStyle={{ color: 'hsl(var(--primary))' }}
                  />
                  <Line type="monotone" dataKey="credits" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} activeDot={{ r: 3, fill: "white" }} />
                </LineChart>
             </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold font-display">Recommended Actions</h2>
          <Link href="/actions" className="text-sm text-primary hover:underline flex items-center">
            View All <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ACTION_TYPES.slice(0, 4).map((action) => {
            const Icon = icons[action.icon] || Leaf;
            return (
              <Card key={action.id} className="hover:bg-muted/50 transition-colors cursor-pointer group">
                <CardContent className="p-4 flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm leading-tight mb-1">{action.title}</h3>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Coins className="w-3 h-3" /> +{action.baseRewardCredits}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
