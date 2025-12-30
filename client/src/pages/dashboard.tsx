import { useStore, ACTION_TYPES } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
  ArrowRight
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
  const { user, actions } = useStore();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!user) {
      setLocation("/auth");
    }
  }, [user, setLocation]);

  if (!user) return null;

  // Mock data calculations
  const weeklyGoal = 500;
  const currentWeeklyPoints = user.points % 500; // Just for visualization
  const progress = Math.min((currentWeeklyPoints / weeklyGoal) * 100, 100);

  const icons: Record<string, any> = {
    droplet: Droplet,
    utensils: Utensils,
    footprints: Bus, // Closest match
    bus: Bus,
    'thermometer-snowflake': Zap,
    sprout: Sprout,
    recycle: Recycle,
    'shopping-bag': ShoppingBag
  };

  const chartData = [
    { day: "Mon", points: 40 },
    { day: "Tue", points: 80 },
    { day: "Wed", points: 20 },
    { day: "Thu", points: 90 },
    { day: "Fri", points: 50 },
    { day: "Sat", points: 100 },
    { day: "Sun", points: 40 },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome & Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="md:col-span-2 bg-gradient-to-br from-primary/10 to-card border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-2xl">Hi, {user.name}!</CardTitle>
            <CardDescription>Ready to save the planet today?</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mt-2">
              <Link href="/actions">
                <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-lg shadow-primary/20 transition-all hover:scale-105">
                  <PlusCircle className="mr-2 h-5 w-5" /> Log Action
                </Button>
              </Link>
            </div>
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

        <Card>
          <CardContent className="pt-6 flex flex-col items-center justify-center text-center">
             <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-2">
              <Trophy className="h-6 w-6 text-blue-500" />
            </div>
            <div className="text-3xl font-bold font-mono">{user.points}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total Points</div>
          </CardContent>
        </Card>
      </div>

      {/* Goal & Impact */}
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
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="p-4 rounded-xl bg-muted/50">
                <div className="text-sm text-muted-foreground mb-1">CO2e Saved</div>
                <div className="text-2xl font-bold font-mono">12.5 <span className="text-sm font-sans text-muted-foreground">kg</span></div>
              </div>
               <div className="p-4 rounded-xl bg-muted/50">
                <div className="text-sm text-muted-foreground mb-1">Waste Avoided</div>
                <div className="text-2xl font-bold font-mono">3 <span className="text-sm font-sans text-muted-foreground">items</span></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Impact Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-[200px]">
             <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="day" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                    itemStyle={{ color: 'hsl(var(--primary))' }}
                  />
                  <Line type="monotone" dataKey="points" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: "white" }} />
                </LineChart>
             </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions List (Suggestions) */}
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
                    <div className="text-xs text-muted-foreground">+{action.points} pts</div>
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
