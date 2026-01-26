import { useState, useEffect } from "react";
import { useAuth } from "@/lib/authContext";
import { useProfile } from "@/lib/useProfile";
import { EmailVerificationBanner } from "@/components/email-verification-modal";
import { useStore, BADGES } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Settings, Shield, Trash2, Download, Share2, Coins, Flame, Star, Trophy, Cloud, GraduationCap, Eye, Wallet, Activity, Link2, RefreshCw, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface StravaStatus {
  connected: boolean;
  athlete?: {
    firstname: string;
    lastname: string;
    profile?: string;
  };
  lastSync?: string;
}

const badgeIcons: Record<string, any> = {
  star: Star,
  flame: Flame,
  'trash-2': Trash2,
  cloud: Cloud,
  trophy: Trophy,
  'graduation-cap': GraduationCap,
};

export default function ProfilePage() {
  const { user: authUser, initialized } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { user: storeUser, toggleInvestorMode, setFocus } = useStore();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const [stravaStatus, setStravaStatus] = useState<StravaStatus | null>(null);
  const [stravaLoading, setStravaLoading] = useState(true);
  const [walletAddress, setWalletAddress] = useState("");

  useEffect(() => {
    if (initialized && !authUser) {
      setLocation("/auth");
    }
  }, [initialized, authUser, setLocation]);

  useEffect(() => {
    async function fetchStravaStatus() {
      if (!authUser) return;
      try {
        const res = await fetch('/api/strava/status', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setStravaStatus(data);
        }
      } catch (err) {
        console.error('Failed to fetch Strava status:', err);
      } finally {
        setStravaLoading(false);
      }
    }
    fetchStravaStatus();
  }, [authUser]);

  const user = profile || storeUser || {
    name: authUser?.email?.split('@')[0] || 'Player',
    display_name: null,
    email: authUser?.email || '',
    credits: 0,
    points: 0,
    streak: 0,
    level: 1,
    role: 'user',
    focus: null,
    created_at: new Date().toISOString(),
  };

  const handleShareImpact = () => {
    const text = `I'm tracking my eco-actions with Play for Planet Earth! 🌍 Join me in making a difference.`;
    if (navigator.share) {
      navigator.share({ text });
    } else {
      navigator.clipboard.writeText(text);
      toast({ title: "Copied to clipboard!", description: "Share your impact with friends." });
    }
  };

  const handleExportData = () => {
    toast({ title: "Export Requested", description: "Your data export will be ready soon." });
  };

  const handleDeleteAccount = () => {
    toast({ title: "Delete Requested", description: "Account deletion request submitted.", variant: "destructive" });
  };

  const focusOptions = ["Reduce Waste", "Eat Greener", "Move Smarter", "Learn Climate"];

  if (!initialized || profileLoading) {
    return (
      <div className="space-y-8 max-w-4xl mx-auto pb-20 md:pb-0">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <Skeleton className="w-24 h-24 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <div className="mt-8 grid grid-cols-3 gap-4 pt-6">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayName = (user as any).display_name || user.name || authUser?.email?.split('@')[0] || 'Player';
  const createdAt = (user as any).created_at || (user as any).joinedAt;
  const joinedDate = createdAt ? new Date(createdAt).toLocaleDateString() : 'Recently';

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-20 md:pb-0">
      <EmailVerificationBanner />
      <Card className="bg-gradient-to-r from-card to-card/50 border-border overflow-hidden relative">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <Avatar className="w-24 h-24 border-4 border-background shadow-xl">
              {stravaStatus?.athlete?.profile ? (
                <AvatarImage src={stravaStatus.athlete.profile} alt={displayName} />
              ) : null}
              <AvatarFallback className="text-2xl bg-primary text-primary-foreground font-bold">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center md:text-left space-y-2">
              <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
                <h1 className="text-3xl font-bold font-display" data-testid="text-profile-name">{displayName}</h1>
                <Badge variant="outline" className="text-xs">{user.role || 'user'}</Badge>
              </div>
              <div className="text-muted-foreground flex items-center justify-center md:justify-start gap-4 text-sm flex-wrap">
                <span>Joined {joinedDate}</span>
                {user.focus && <><span>•</span><span>Focus: {user.focus}</span></>}
              </div>
              <div className="flex items-center justify-center md:justify-start gap-2 mt-2 flex-wrap">
                <Badge className="bg-primary/20 text-primary hover:bg-primary/30 border-none">Level {user.level || 1}</Badge>
              </div>
            </div>
            <Button variant="outline" onClick={handleShareImpact} data-testid="button-share-impact">
              <Share2 className="w-4 h-4 mr-2" /> Share Impact
            </Button>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-4 border-t border-border pt-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Coins className="w-4 h-4 text-primary" />
                <span className="text-2xl font-bold font-mono" data-testid="text-profile-credits">{user.credits || 0}</span>
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Credits</div>
            </div>
            <div className="text-center border-l border-r border-border">
              <div className="flex items-center justify-center gap-1">
                <Flame className="w-4 h-4 text-orange-500" />
                <span className="text-2xl font-bold font-mono" data-testid="text-profile-streak">{user.streak || 0}</span>
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Day Streak</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold font-mono" data-testid="text-profile-points">{user.points || 0}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Total XP</div>
            </div>
          </div>
          
          {/* Profile details from onboarding */}
          {((profile as any)?.age_range || (profile as any)?.interests?.length > 0) && (
            <div className="mt-6 pt-6 border-t border-border space-y-4">
              {(profile as any)?.age_range && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Age Range:</span>
                  <Badge variant="outline">{(profile as any).age_range}</Badge>
                </div>
              )}
              {(profile as any)?.interests?.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Interests:</span>
                  {(profile as any).interests.map((interest: string) => (
                    <Badge key={interest} variant="secondary" className="text-xs">{interest}</Badge>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Strava Connection
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stravaLoading ? (
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ) : stravaStatus?.connected ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <div className="font-medium" data-testid="text-strava-athlete">
                    Connected as {stravaStatus.athlete?.firstname} {stravaStatus.athlete?.lastname?.charAt(0)}.
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Last synced: {stravaStatus.lastSync ? new Date(stravaStatus.lastSync).toLocaleString() : 'Never'}
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setLocation('/settings')} data-testid="button-manage-strava">
                <Settings className="w-4 h-4 mr-2" /> Manage
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-dashed">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <Link2 className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <div className="font-medium">Strava Not Connected</div>
                  <div className="text-sm text-muted-foreground">Connect to earn verified activity points</div>
                </div>
              </div>
              <Button onClick={() => setLocation('/settings')} data-testid="button-connect-strava">
                <Link2 className="w-4 h-4 mr-2" /> Connect Strava
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Activity History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(user.points || 0) === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="font-medium">No verified activities yet</p>
              <p className="text-sm mt-1">Connect Strava and tap Sync to import your activities and earn points.</p>
              <Button variant="outline" className="mt-4" onClick={() => setLocation('/settings')} data-testid="button-go-to-settings">
                Go to Settings
              </Button>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-2xl font-bold">{user.points} XP</p>
              <p className="text-sm text-muted-foreground mt-1">Total earned from verified activities</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="badges" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto mb-8">
          <TabsTrigger value="badges">Badges</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
        </TabsList>

        <TabsContent value="badges">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {BADGES.length > 0 ? BADGES.map((badge) => {
              const Icon = badgeIcons[badge.icon] || Shield;
              return (
                <Card key={badge.id} className={`flex flex-col items-center p-6 text-center transition-colors ${badge.earned ? 'hover:bg-muted/30' : 'opacity-50 border-dashed'}`}>
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${badge.earned ? 'bg-gradient-to-br from-primary/20 to-primary/5' : 'bg-muted'}`}>
                    <Icon className={`w-8 h-8 ${badge.earned ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <h3 className="font-bold mb-1">{badge.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{badge.description}</p>
                  <Badge variant={badge.earned ? "default" : "secondary"} className="text-[10px]">
                    {badge.earned ? 'Earned' : badge.criteria}
                  </Badge>
                </Card>
              );
            }) : (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                <Trophy className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>Complete actions to earn badges!</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>Manage your preferences and data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium text-sm">Focus Area</h3>
                <div className="grid grid-cols-2 gap-2">
                  {focusOptions.map((focus) => (
                    <Button
                      key={focus}
                      variant={user.focus === focus ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFocus(focus)}
                    >
                      {focus}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium text-sm">Data Management</h3>
                <Button variant="outline" className="w-full justify-start" onClick={handleExportData}>
                  <Download className="mr-2 h-4 w-4" /> Export My Data
                </Button>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10">
                      <Trash2 className="mr-2 h-4 w-4" /> Delete Account
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete Account</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to delete your account? This action cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline">Cancel</Button>
                      <Button variant="destructive" onClick={handleDeleteAccount}>Delete Account</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedback">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Pilot Feedback
              </CardTitle>
              <CardDescription>Help us improve Play for Planet Earth</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-primary/50" />
                <p className="text-muted-foreground mb-4">We'd love to hear your thoughts on the pilot experience!</p>
                <Button onClick={() => {
                  toast({ title: "Thank you!", description: "Feedback form coming soon." });
                }} data-testid="button-share-feedback">
                  Share Feedback
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
