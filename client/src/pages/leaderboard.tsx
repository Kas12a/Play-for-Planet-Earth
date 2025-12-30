import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Crown, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LeaderboardPage() {
  const { user, users } = useStore();

  if (!user) return null;

  // Combine current user with mock users and sort
  const allUsers = [user, ...users].sort((a, b) => b.points - a.points);
  
  // Assign ranks
  const rankedUsers = allUsers.map((u, index) => ({ ...u, rank: index + 1 }));

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-500 fill-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-300 fill-gray-300" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-700 fill-amber-700" />;
    return <span className="text-muted-foreground font-mono font-bold w-6 text-center">{rank}</span>;
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight">Leaderboard</h1>
          <p className="text-muted-foreground">See how you stack up against the community.</p>
        </div>
      </div>

      <Tabs defaultValue="cohort" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md mb-8">
          <TabsTrigger value="cohort">Cohort</TabsTrigger>
          <TabsTrigger value="friends">Friends</TabsTrigger>
        </TabsList>

        <TabsContent value="cohort">
          <Card>
            <CardHeader>
              <CardTitle>Cohort Rankings</CardTitle>
              <CardDescription>Weekly reset in 3 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rankedUsers.map((u) => (
                  <div 
                    key={u.id} 
                    className={`flex items-center justify-between p-4 rounded-xl transition-all ${
                      u.id === user.id 
                        ? 'bg-primary/10 border border-primary/20 shadow-sm' 
                        : 'bg-card hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8">
                        {getRankIcon(u.rank)}
                      </div>
                      <Avatar className="border-2 border-background">
                        <AvatarFallback className="bg-muted text-foreground font-bold">
                          {u.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold flex items-center gap-2">
                          {u.name}
                          {u.id === user.id && <Badge variant="outline" className="text-[10px] h-5 px-1.5">You</Badge>}
                        </div>
                        <div className="text-xs text-muted-foreground">Level {u.level} • {u.streak} Day Streak</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold font-mono text-lg">{u.points.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground uppercase">XP</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="friends">
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <div className="bg-muted/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Connect with Friends</h3>
              <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                Invite friends to compete on the leaderboard and achieve goals together.
              </p>
              <Button>Invite Friends</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
