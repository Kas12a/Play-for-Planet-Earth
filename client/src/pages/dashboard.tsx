import { useStore, ACTION_TYPES } from "@/lib/store";
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
  const { user, actions, transactions } = useStore();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!user) {
      setLocation("/auth");
    }
  }, [user, setLocation]);

  if (!user) return null;

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
    <div className="space-y-8 pb-20 md:pb-0">
      {/* Welcome & Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="md:col-span-2 bg-gradient-to-br from-primary/10 to-card border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-2xl">Hi, {user.name || 'Eco Warrior'}!</CardTitle>
            <CardDescription>Ready to save the planet today?</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mt-2">
              <Link href="/actions">
                <Button 
                  className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-lg shadow-primary/20 transition-all hover:scale-105"
                  data-testid="button-log-action"
                >
                  <PlusCircle className="mr-2 h-5 w-5" /> Log Action
                </Button>
              </Link>
              <Link href="/credits">
                <Button variant="outline" data-testid="button-view-credits">
                  <Coins className="mr-2 h-4 w-4" /> View Credits
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <Coins className="h-6 w-6 text-primary" />
            </div>
            <div className="text-3xl font-bold font-mono" data-testid="text-credits-balance">{user.credits}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Credits</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center mb-2">
              <Flame className="h-6 w-6 text-orange-500 animate-pulse" />
            </div>
            <div className="text-3xl font-bold font-mono">{user.streak}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Day Streak</div>
          </CardContent>
        </Card>
      </div>

      {/* Impact Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-emerald-500/5 to-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-500/10">
                <Cloud className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <div className="text-2xl font-bold font-mono">{totalCO2Saved.toFixed(1)} <span className="text-sm font-sans text-muted-foreground">kg</span></div>
                <div className="text-sm text-muted-foreground">CO2e saved this week</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/5 to-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-500/10">
                <Trash2 className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <div className="text-2xl font-bold font-mono">{totalWasteAvoided.toFixed(1)} <span className="text-sm font-sans text-muted-foreground">kg</span></div>
                <div className="text-sm text-muted-foreground">Waste avoided this week</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/5 to-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-500/10">
                <TrendingUp className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <div className="text-2xl font-bold font-mono">{weeklyActions.length}</div>
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
