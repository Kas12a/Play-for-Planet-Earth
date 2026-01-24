import { useState } from "react";
import { useStore, ACTION_TYPES, ActionType } from "@/lib/store";
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
  Camera,
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
  XCircle
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

export default function ActionsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAction, setSelectedAction] = useState<ActionType | null>(null);
  const [logNote, setLogNote] = useState("");
  const [confidence, setConfidence] = useState([0.85]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  const { logAction, user } = useStore();
  const { toast } = useToast();

  const categories = ["All", "Transport", "Energy", "Food", "Waste"];

  const filteredActions = ACTION_TYPES.filter(action => {
    const matchesCategory = selectedCategory === "All" || action.category === selectedCategory;
    const matchesSearch = action.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCreditsMultiplier = (conf: number): number => {
    if (conf >= 0.8) return 1.0;
    if (conf >= 0.4) return 0.6;
    return 0.3;
  };

  const getConfidenceTier = (conf: number): string => {
    if (conf >= 0.8) return 'High';
    if (conf >= 0.4) return 'Medium';
    return 'Low';
  };

  const handleLogAction = async () => {
    if (selectedAction && !isLogging) {
      setIsLogging(true);
      
      // Small delay to simulate API call and prevent double-click
      await new Promise(resolve => setTimeout(resolve, 300));
      
      logAction(selectedAction.id, logNote, confidence[0]);
      const multiplier = getCreditsMultiplier(confidence[0]);
      const creditsEarned = Math.round(selectedAction.baseRewardCredits * multiplier);
      
      toast({
        title: "Action Logged!",
        description: `You earned ${creditsEarned} credits for ${selectedAction.title}.`,
      });
      
      setIsDialogOpen(false);
      setSelectedAction(null);
      setLogNote("");
      setConfidence([0.85]);
      setIsLogging(false);
    }
  };

  const calculateCredits = (action: ActionType, conf: number) => {
    const multiplier = getCreditsMultiplier(conf);
    return Math.round(action.baseRewardCredits * multiplier);
  };

  return (
    <div className="space-y-8 pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight">Action Library</h1>
          <p className="text-muted-foreground">Log your eco-habits and earn credits.</p>
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
              <Coins className="w-4 h-4 text-primary" />
              <span className="font-bold font-mono text-sm">{user.credits}</span>
            </div>
          )}
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search actions..." 
              className="pl-9 bg-card border-border"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={selectedCategory === cat ? "default" : "outline"}
            onClick={() => setSelectedCategory(cat)}
            className="rounded-full"
            size="sm"
          >
            {cat}
          </Button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredActions.map((action) => {
          const Icon = icons[action.icon] || Leaf;
          return (
            <Card key={action.id} className="group hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5 bg-card/50 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="text-right">
                  <Badge variant="secondary" className="font-mono text-xs flex items-center gap-1">
                    <Coins className="w-3 h-3" /> {action.baseRewardCredits}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <h3 className="font-bold text-lg mb-1">{action.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{action.description}</p>
                </div>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                  <span className="flex items-center gap-1">
                    <Leaf className="h-3 w-3" /> {action.impactCO2}kg CO2
                  </span>
                  <span className="px-2 py-0.5 rounded bg-muted uppercase tracking-wider text-[10px]">
                    {action.category}
                  </span>
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
                      className="w-full group-hover:bg-primary group-hover:text-primary-foreground" 
                      variant="outline" 
                      onClick={() => {
                        setSelectedAction(action);
                        setIsDialogOpen(true);
                      }}
                    >
                      Log Action
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Log {action.title}</DialogTitle>
                      <DialogDescription>
                        Add details to your log. Higher confidence = more credits.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                      <div className="flex items-center justify-center p-6 bg-muted/30 rounded-lg border-2 border-dashed border-muted hover:border-primary/50 cursor-pointer transition-colors">
                        <div className="text-center space-y-2">
                          <div className="mx-auto w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            <Camera className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="text-sm text-muted-foreground">Add Photo Evidence (Optional)</div>
                          <div className="text-xs text-primary">Increases verification confidence</div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Verification Confidence</Label>
                          <Slider
                            value={confidence}
                            onValueChange={setConfidence}
                            max={1}
                            min={0.1}
                            step={0.05}
                            className="py-2"
                          />
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">
                              Tier: <span className={`font-medium ${confidence[0] >= 0.8 ? 'text-green-500' : confidence[0] >= 0.4 ? 'text-yellow-500' : 'text-red-500'}`}>
                                {getConfidenceTier(confidence[0])} ({Math.round(confidence[0] * 100)}%)
                              </span>
                            </span>
                            <span className="text-muted-foreground">
                              Multiplier: {getCreditsMultiplier(confidence[0])}x
                            </span>
                          </div>
                        </div>

                        <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">You'll earn:</span>
                            <span className="font-bold font-mono text-lg text-primary flex items-center gap-1">
                              <Coins className="w-4 h-4" />
                              {calculateCredits(action, confidence[0])} credits
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="note">Note (Optional)</Label>
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
                            <CheckCircle2 className="mr-2 h-4 w-4" /> Confirm & Earn Credits
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
