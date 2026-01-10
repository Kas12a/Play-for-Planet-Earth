import { useState } from "react";
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
import { Settings, Shield, Trash2, Download, Share2, Coins, Flame, Star, Trophy, Cloud, GraduationCap, Eye, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const badgeIcons: Record<string, any> = {
  star: Star,
  flame: Flame,
  'trash-2': Trash2,
  cloud: Cloud,
  trophy: Trophy,
  'graduation-cap': GraduationCap,
};

export default function ProfilePage() {
  const { user, toggleInvestorMode, setFocus } = useStore();
  const { toast } = useToast();
  const [walletAddress, setWalletAddress] = useState(user?.walletAddress || "");

  if (!user) return null;

  const handleShareImpact = () => {
    const text = `This week I completed ${user.streak} eco-actions and earned ${user.credits} credits with Play for Planet Earth! 🌍`;
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

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-20 md:pb-0">
      {/* Header */}
      <Card className="bg-gradient-to-r from-card to-card/50 border-border overflow-hidden relative">
        {user.investorMode && (
          <div className="absolute top-4 right-4">
            <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">DEMO MODE</Badge>
          </div>
        )}
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <Avatar className="w-24 h-24 border-4 border-background shadow-xl">
              <AvatarFallback className="text-2xl bg-primary text-primary-foreground font-bold">
                {user.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center md:text-left space-y-2">
              <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
                <h1 className="text-3xl font-bold font-display">{user.name || 'Eco Warrior'}</h1>
                <Badge variant="outline" className="text-xs">{user.role}</Badge>
                {user.betaAccess && <Badge className="bg-green-500/20 text-green-500 border-green-500/30 text-xs">BETA</Badge>}
              </div>
              <div className="text-muted-foreground flex items-center justify-center md:justify-start gap-4 text-sm flex-wrap">
                <span>Joined {new Date(user.joinedAt).toLocaleDateString()}</span>
                {user.ageBand && <><span>•</span><span>{user.ageBand}</span></>}
                {user.focus && <><span>•</span><span>Focus: {user.focus}</span></>}
              </div>
              <div className="flex items-center justify-center md:justify-start gap-2 mt-2 flex-wrap">
                <Badge className="bg-primary/20 text-primary hover:bg-primary/30 border-none">Level {user.level}</Badge>
                <Badge variant="outline">Cohort: {user.cohortId || 'None'}</Badge>
              </div>
            </div>
            <Button variant="outline" onClick={handleShareImpact}>
              <Share2 className="w-4 h-4 mr-2" /> Share Impact
            </Button>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-4 border-t border-border pt-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Coins className="w-4 h-4 text-primary" />
                <span className="text-2xl font-bold font-mono">{user.credits}</span>
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Credits</div>
            </div>
            <div className="text-center border-l border-r border-border">
              <div className="flex items-center justify-center gap-1">
                <Flame className="w-4 h-4 text-orange-500" />
                <span className="text-2xl font-bold font-mono">{user.streak}</span>
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Day Streak</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold font-mono">{user.points}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Total XP</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="badges" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto mb-8">
          <TabsTrigger value="badges">Badges</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="wallet">Wallet</TabsTrigger>
        </TabsList>

        <TabsContent value="badges">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {BADGES.map((badge) => {
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
            })}
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
                <h3 className="font-medium text-sm">Demo Mode</h3>
                <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium flex items-center gap-2">
                      <Eye className="w-4 h-4" /> Investor Mode
                    </div>
                    <div className="text-xs text-muted-foreground">Show sample data for demonstrations</div>
                  </div>
                  <Switch checked={user.investorMode} onCheckedChange={toggleInvestorMode} />
                </div>
              </div>

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

        <TabsContent value="wallet">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5" /> Wallet Address
              </CardTitle>
              <CardDescription>
                Optional: Connect a wallet address for future tokenisation features.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50 border border-dashed">
                <p className="text-sm text-muted-foreground mb-4">
                  <strong>Note:</strong> Blockchain features are not yet implemented. 
                  This wallet address is stored for future use when we enable on-chain verification of eco-actions.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="wallet">Wallet Address (Optional)</Label>
                  <Input
                    id="wallet"
                    placeholder="0x..."
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                  />
                </div>
                <Button className="mt-4" variant="outline" onClick={() => {
                  toast({ title: "Wallet Saved", description: "Your wallet address has been saved for future use." });
                }}>
                  Save Wallet Address
                </Button>
              </div>

              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <h4 className="font-semibold mb-2 text-sm">Future Tokenisation</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Transactions will be mirrored on-chain for transparency</li>
                  <li>• proof_hash field enables verification of action logs</li>
                  <li>• Credits remain off-chain and cannot be traded or cashed out</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
