import { useState } from "react";
import { useStore, ACTION_TYPES, ActionType } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
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
  CheckCircle2
} from "lucide-react";

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

export default function ActionsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAction, setSelectedAction] = useState<ActionType | null>(null);
  const [logNote, setLogNote] = useState("");
  const { logAction } = useStore();
  const { toast } = useToast();

  const categories = ["All", "Waste", "Energy", "Transport", "Food", "Nature"];

  const filteredActions = ACTION_TYPES.filter(action => {
    const matchesCategory = selectedCategory === "All" || action.category === selectedCategory;
    const matchesSearch = action.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleLogAction = () => {
    if (selectedAction) {
      logAction(selectedAction.id, logNote);
      toast({
        title: "Action Logged!",
        description: `You earned ${selectedAction.points} points for ${selectedAction.title}.`,
      });
      setSelectedAction(null);
      setLogNote("");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight">Action Library</h1>
          <p className="text-muted-foreground">Log your eco-habits and track your impact.</p>
        </div>
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
                <Badge variant="secondary" className="font-mono text-xs">
                  +{action.points} XP
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <h3 className="font-bold text-lg mb-1">{action.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{action.description}</p>
                </div>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                  <span className="flex items-center gap-1">
                    <Leaf className="h-3 w-3" /> {action.impactCO2}kg CO2e
                  </span>
                  <span className="px-2 py-0.5 rounded bg-muted uppercase tracking-wider text-[10px]">
                    {action.category}
                  </span>
                </div>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full group-hover:bg-primary group-hover:text-primary-foreground" variant="outline" onClick={() => setSelectedAction(action)}>
                      Log Action
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Log {action.title}</DialogTitle>
                      <DialogDescription>
                        Great job! Add some details to your log.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="flex items-center justify-center p-6 bg-muted/30 rounded-lg border-2 border-dashed border-muted hover:border-primary/50 cursor-pointer transition-colors">
                        <div className="text-center space-y-2">
                          <div className="mx-auto w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            <Camera className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="text-sm text-muted-foreground">Add Photo Evidence (Optional)</div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="note" className="text-sm font-medium">Note (Optional)</label>
                        <Textarea 
                          id="note" 
                          placeholder="Any thoughts on this action?" 
                          value={logNote}
                          onChange={(e) => setLogNote(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleLogAction} className="w-full">
                        <CheckCircle2 className="mr-2 h-4 w-4" /> Confirm & Earn {action.points} XP
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
