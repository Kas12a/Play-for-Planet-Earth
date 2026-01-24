import { useState, useEffect } from "react";
import { ACTION_TYPES, ActionType } from "@/lib/store";
import { useAuth } from "@/lib/authContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Leaf, 
  Droplet, 
  Utensils, 
  Bus, 
  Zap, 
  Sprout, 
  Recycle,
  ShoppingBag,
  Search,
  CheckCircle2,
  Coins,
  Bike,
  Car,
  Home,
  Plug,
  Thermometer,
  Wind,
  Lightbulb,
  Apple,
  Package,
  Wrench,
  XCircle,
  AlertCircle,
  Info
} from "lucide-react";

const icons: Record<string, any> = {
  droplet: Droplet,
  utensils: Utensils,
  footprints: Bus,
  bus: Bus,
  bike: Bike,
  car: Car,
  home: Home,
  plug: Plug,
  thermometer: Thermometer,
  wind: Wind,
  lightbulb: Lightbulb,
  salad: Utensils,
  apple: Apple,
  leaf: Leaf,
  package: Package,
  recycle: Recycle,
  'x-circle': XCircle,
  wrench: Wrench,
  'shopping-bag': ShoppingBag,
  sprout: Sprout,
};

interface SelfDeclareStatus {
  dailyPointsRemaining: number;
  dailyActionsRemaining: number;
}

export default function ActionsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAction, setSelectedAction] = useState<ActionType | null>(null);
  const [logNote, setLogNote] = useState("");
  const [confidence, setConfidence] = useState([0.85]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  const [selfDeclareStatus, setSelfDeclareStatus] = useState<SelfDeclareStatus | null>(null);
  const { session } = useAuth();
  const { toast } = useToast();

  const categories = ["All", "Transport", "Energy", "Food", "Waste"];

  useEffect(() => {
    if (session?.access_token) {
      fetchSelfDeclareStatus();
    }
  }, [session]);

  const fetchSelfDeclareStatus = async () => {
    try {
      const response = await fetch('/api/points/summary', {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setSelfDeclareStatus({
          dailyPointsRemaining: data.selfDeclare?.dailyPointsRemaining ?? 10,
          dailyActionsRemaining: data.selfDeclare?.dailyActionsRemaining ?? 5,
        });
      }
    } catch (error) {
      console.error('Failed to fetch self-declare status:', error);
    }
  };

  const filteredActions = ACTION_TYPES.filter(action => {
    const matchesCategory = selectedCategory === "All" || action.category === selectedCategory;
    const matchesSearch = action.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getConfidenceTier = (conf: number): string => {
    if (conf >= 0.8) return 'High';
    if (conf >= 0.4) return 'Medium';
    return 'Low';
  };

  const handleLogAction = async () => {
    if (!selectedAction || isLogging) return;
    
    if (!session?.access_token) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to log actions.",
        variant: "destructive",
      });
      return;
    }

    if (selfDeclareStatus && selfDeclareStatus.dailyActionsRemaining <= 0) {
      toast({
        title: "Daily limit reached",
        description: "You've reached the limit of 5 self-declared actions per day.",
        variant: "destructive",
      });
      return;
    }

    setIsLogging(true);
    
    try {
      const clientRequestId = `${selectedAction.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const response = await fetch('/api/actions/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          actionTypeId: selectedAction.id,
          note: logNote || null,
          confidence: confidence[0],
          clientRequestId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to log action');
      }

      toast({
        title: "Action Logged!",
        description: `You earned ${data.pointsEarned} points for ${selectedAction.title}. (${data.dailyActionsRemaining} actions left today)`,
      });

      setSelfDeclareStatus({
        dailyPointsRemaining: data.dailyPointsRemaining,
        dailyActionsRemaining: data.dailyActionsRemaining,
      });
      
      setIsDialogOpen(false);
      setSelectedAction(null);
      setLogNote("");
      setConfidence([0.85]);
    } catch (error: any) {
      toast({
        title: "Failed to log action",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLogging(false);
    }
  };

  const canSelfDeclare = selfDeclareStatus 
    ? selfDeclareStatus.dailyActionsRemaining > 0 && selfDeclareStatus.dailyPointsRemaining > 0
    : true;

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div>
        <h1 className="text-3xl font-bold font-display tracking-tight">Log Actions</h1>
        <p className="text-muted-foreground">Track your eco-friendly activities and earn points.</p>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-amber-600">Self-Declared Actions</p>
            <p className="text-muted-foreground mt-1">
              These are manual entries with limited points. Connect Strava in Settings for <strong>verified activities</strong> that earn full points!
            </p>
            {selfDeclareStatus && (
              <p className="mt-2 text-xs">
                Today's remaining: <strong>{selfDeclareStatus.dailyActionsRemaining}</strong> actions, <strong>{selfDeclareStatus.dailyPointsRemaining}</strong> points
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search actions..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-actions"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <Button 
              key={cat} 
              variant={selectedCategory === cat ? "default" : "outline"} 
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              data-testid={`button-category-${cat.toLowerCase()}`}
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredActions.map((action) => {
          const IconComponent = icons[action.icon] || Leaf;
          
          return (
            <Card 
              key={action.id} 
              className="hover:shadow-lg hover:shadow-primary/5 transition-all border-border/50"
              data-testid={`card-action-${action.id}`}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <IconComponent className="w-5 h-5 text-primary" />
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {action.category}
                  </Badge>
                </div>
                <CardTitle className="text-lg mt-3">{action.title}</CardTitle>
                <CardDescription className="text-xs line-clamp-2">
                  {action.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Coins className="w-4 h-4 text-primary" />
                    <span>Up to <strong className="text-foreground">3</strong> pts</span>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    Self-declared
                  </Badge>
                </div>
                
                <Dialog open={isDialogOpen && selectedAction?.id === action.id} onOpenChange={(open) => {
                  setIsDialogOpen(open);
                  if (!open) {
                    setSelectedAction(null);
                    setLogNote("");
                    setConfidence([0.85]);
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => {
                        setSelectedAction(action);
                        setIsDialogOpen(true);
                      }}
                      disabled={!canSelfDeclare}
                      data-testid={`button-log-action-${action.id}`}
                    >
                      {canSelfDeclare ? (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" /> Log Action
                        </>
                      ) : (
                        <>
                          <AlertCircle className="mr-2 h-4 w-4" /> Limit Reached
                        </>
                      )}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <IconComponent className="w-4 h-4 text-primary" />
                        </div>
                        {action.title}
                      </DialogTitle>
                      <DialogDescription>
                        {action.description}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="confidence">Confidence Level: {getConfidenceTier(confidence[0])}</Label>
                        <Slider
                          id="confidence"
                          value={confidence}
                          onValueChange={setConfidence}
                          max={1}
                          min={0}
                          step={0.05}
                          className="w-full"
                        />
                        <p className="text-xs text-muted-foreground">
                          How certain are you that you completed this action?
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="note">Note (optional)</Label>
                        <Textarea 
                          id="note" 
                          placeholder="Any thoughts on this action?" 
                          value={logNote}
                          onChange={(e) => setLogNote(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button 
                        onClick={handleLogAction} 
                        className="w-full" 
                        disabled={isLogging}
                        data-testid="button-confirm-action"
                      >
                        {isLogging ? (
                          <>
                            <span className="w-4 h-4 mr-2 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                            Logging...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="mr-2 h-4 w-4" /> Confirm & Earn Points
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
