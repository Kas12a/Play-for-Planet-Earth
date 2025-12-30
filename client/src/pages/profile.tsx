import { useStore, BADGES } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Shield, Mail, Trash2, Download } from "lucide-react";

export default function ProfilePage() {
  const { user } = useStore();

  if (!user) return null;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <Card className="bg-gradient-to-r from-card to-card/50 border-border">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <Avatar className="w-24 h-24 border-4 border-background shadow-xl">
              <AvatarFallback className="text-2xl bg-primary text-primary-foreground font-bold">
                {user.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center md:text-left space-y-2">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <h1 className="text-3xl font-bold font-display">{user.name}</h1>
                <Badge variant="outline" className="text-xs">{user.role}</Badge>
              </div>
              <div className="text-muted-foreground flex items-center justify-center md:justify-start gap-4 text-sm">
                <span>Joined {new Date(user.joinedAt).toLocaleDateString()}</span>
                <span>•</span>
                <span>{user.ageBand}</span>
              </div>
              <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
                <Badge className="bg-primary/20 text-primary hover:bg-primary/30 border-none">Level {user.level}</Badge>
                <Badge variant="outline">Cohort: {user.cohortId || 'None'}</Badge>
              </div>
            </div>
            <Button variant="outline" size="icon">
              <Settings className="w-5 h-5" />
            </Button>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-4 border-t border-border pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold font-mono">{user.streak}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Day Streak</div>
            </div>
            <div className="text-center border-l border-r border-border">
              <div className="text-2xl font-bold font-mono">{user.points}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Total XP</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold font-mono">12</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Actions</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="badges" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8">
          <TabsTrigger value="badges">Badges</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="badges">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {BADGES.map((badge) => (
              <Card key={badge.id} className="flex flex-col items-center p-6 text-center hover:bg-muted/30 transition-colors">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4">
                  <Shield className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-bold mb-1">{badge.name}</h3>
                <p className="text-sm text-muted-foreground mb-3">{badge.description}</p>
                <Badge variant="secondary" className="text-[10px]">{badge.criteria}</Badge>
              </Card>
            ))}
            {/* Locked Badge Placeholder */}
            <Card className="flex flex-col items-center p-6 text-center opacity-50 border-dashed">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-bold mb-1">Locked</h3>
              <p className="text-sm text-muted-foreground">Keep playing to unlock</p>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>Manage your privacy and data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium text-sm">Privacy</h3>
                <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium">Public Profile</div>
                    <div className="text-xs text-muted-foreground">Allow others to see your stats</div>
                  </div>
                  <Switch checked readOnly />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium text-sm">Data Management</h3>
                <Button variant="outline" className="w-full justify-start">
                  <Download className="mr-2 h-4 w-4" /> Export My Data
                </Button>
                <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10">
                  <Trash2 className="mr-2 h-4 w-4" /> Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Switch({ checked, readOnly }: { checked: boolean; readOnly?: boolean }) {
  return (
    <div className={`w-11 h-6 rounded-full relative transition-colors ${checked ? 'bg-primary' : 'bg-input'}`}>
      <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${checked ? 'translate-x-5' : ''}`} />
    </div>
  );
}
