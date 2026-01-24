import { useState, useEffect } from "react";
import { useAuth } from "@/lib/authContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Crown, Users, Loader2 } from "lucide-react";

interface LeaderboardEntry {
  rank: number;
  displayName: string;
  points: number;
  level: number;
}

export default function LeaderboardPage() {
  const { session } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch('/api/leaderboard');
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data);
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-500 fill-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-300 fill-gray-300" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-700 fill-amber-700" />;
    return <span className="text-muted-foreground font-mono font-bold w-6 text-center">{rank}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const hasEntries = leaderboard.length > 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight">Leaderboard</h1>
          <p className="text-muted-foreground">See how you stack up against the community.</p>
        </div>
      </div>

      <Tabs defaultValue="global" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md mb-8">
          <TabsTrigger value="global">Global</TabsTrigger>
          <TabsTrigger value="friends">Friends</TabsTrigger>
        </TabsList>

        <TabsContent value="global">
          <Card>
            <CardHeader>
              <CardTitle>Global Rankings</CardTitle>
              <CardDescription>
                {hasEntries 
                  ? 'Rankings based on verified points earned' 
                  : 'Your ranking will appear here once more users join'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {!hasEntries && (
                  <div className="text-center py-6 text-muted-foreground">
                    <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Be the first to climb the ranks!</p>
                    <p className="text-xs mt-1">More participants will appear as they join the pilot.</p>
                  </div>
                )}
                {leaderboard.map((entry) => (
                  <div 
                    key={entry.rank} 
                    className="flex items-center justify-between p-4 rounded-xl transition-all bg-card hover:bg-muted/50"
                    data-testid={`leaderboard-entry-${entry.rank}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8">
                        {getRankIcon(entry.rank)}
                      </div>
                      <Avatar className="border-2 border-background">
                        <AvatarFallback className="bg-muted text-foreground font-bold">
                          {entry.displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold flex items-center gap-2">
                          {entry.displayName}
                        </div>
                        <div className="text-xs text-muted-foreground">Level {entry.level}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold font-mono text-lg">{entry.points.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground uppercase">Points</div>
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
              <h3 className="font-semibold text-lg mb-2">Add Friends</h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                Connect with friends to compete on a private leaderboard.
              </p>
              <Badge variant="outline" className="mt-4">Coming Soon</Badge>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
