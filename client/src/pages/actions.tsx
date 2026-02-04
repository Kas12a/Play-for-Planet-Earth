import { useState, useEffect } from "react";
import { QUESTS, Quest } from "@/lib/store";
import { useAuth } from "@/lib/authContext";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, ArrowRight, CheckCircle, Loader2, Video, Image, MapPin, Sparkles, Calendar, Users, Leaf, Search, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { TodaysCodeDisplay } from "@/components/todays-code-display";
import { ProofSubmissionDialog } from "@/components/proof-submission-dialog";
import { GpsSessionDialog } from "@/components/gps-session-dialog";
import { EcoQuizDialog } from "@/components/eco-quiz-dialog";

interface ActionParticipation {
  quest_id: string;
  progress: number;
  completed: boolean;
  joined_at: string;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  movement: <MapPin className="w-3 h-3" />,
  waste: <Leaf className="w-3 h-3" />,
  learning: <Sparkles className="w-3 h-3" />,
  wellbeing: <Users className="w-3 h-3" />,
  food: <Leaf className="w-3 h-3" />,
  community: <Users className="w-3 h-3" />,
};

const FREQUENCY_LABELS: Record<string, string> = {
  daily: "Daily",
  weekly: "Weekly",
  seasonal: "This Season",
};

export default function ActionsPage() {
  const { toast } = useToast();
  const { session } = useAuth();
  const [joinedActions, setJoinedActions] = useState<Map<string, ActionParticipation>>(new Map());
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  
  const [proofQuest, setProofQuest] = useState<Quest | null>(null);
  const [gpsQuest, setGpsQuest] = useState<Quest | null>(null);
  const [quizQuest, setQuizQuest] = useState<Quest | null>(null);

  const categories = [
    { id: "all", label: "All" },
    { id: "movement", label: "Movement" },
    { id: "waste", label: "Waste" },
    { id: "food", label: "Food" },
    { id: "learning", label: "Learning" },
    { id: "wellbeing", label: "Wellbeing" },
    { id: "community", label: "Community" },
  ];

  useEffect(() => {
    if (session?.access_token) {
      fetchMyActions();
    } else {
      setLoading(false);
    }
  }, [session]);

  const fetchMyActions = async () => {
    try {
      const response = await fetch('/api/quests/my', {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });
      if (response.ok) {
        const data: ActionParticipation[] = await response.json();
        const map = new Map<string, ActionParticipation>();
        data.forEach(p => map.set(p.quest_id, p));
        setJoinedActions(map);
      }
    } catch (error) {
      console.error('Failed to fetch action participations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (action: Quest) => {
    if (joinedActions.has(action.id)) return;
    
    if (!session?.access_token) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to start actions.",
        variant: "destructive",
      });
      return;
    }
    
    setLoadingAction(action.id);
    
    try {
      const response = await fetch(`/api/quests/${action.id}/join`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start action');
      }

      const newParticipation: ActionParticipation = {
        quest_id: action.id,
        progress: 0,
        completed: false,
        joined_at: new Date().toISOString(),
      };
      
      setJoinedActions(prev => new Map(prev).set(action.id, newParticipation));
      
      toast({
        title: "Action Started!",
        description: `You've started "${action.title}". Good luck!`,
      });
    } catch (error: any) {
      toast({
        title: "Failed to start action",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleAction = (action: Quest) => {
    const participation = joinedActions.get(action.id);
    if (!participation) {
      handleJoin(action);
      return;
    }

    switch (action.verification_type) {
      case 'gps_session':
        setGpsQuest(action);
        break;
      case 'proof_video':
      case 'proof_photo':
      case 'screenshot_health':
        setProofQuest(action);
        break;
      case 'quiz':
        setQuizQuest(action);
        break;
    }
  };

  const handleQuestComplete = () => {
    fetchMyActions();
  };

  const getVerificationBadge = (action: Quest) => {
    switch (action.verification_type) {
      case 'gps_session':
        return (
          <Badge variant="outline" className="text-xs gap-1">
            <MapPin className="w-3 h-3" />
            GPS Session
          </Badge>
        );
      case 'proof_video':
        return (
          <Badge variant="outline" className="text-xs gap-1">
            <Video className="w-3 h-3" />
            Video Proof
          </Badge>
        );
      case 'proof_photo':
      case 'screenshot_health':
        return (
          <Badge variant="outline" className="text-xs gap-1">
            <Image className="w-3 h-3" />
            Photo/Screenshot
          </Badge>
        );
      case 'quiz':
        return (
          <Badge variant="outline" className="text-xs gap-1">
            <Sparkles className="w-3 h-3" />
            Quiz
          </Badge>
        );
      default:
        return null;
    }
  };

  const filteredActions = QUESTS.filter(action => {
    const matchesCategory = selectedCategory === "all" || action.category === selectedCategory;
    const matchesSearch = action.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         action.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch && action.is_active;
  });

  const dailyActions = filteredActions.filter(a => a.frequency === 'daily');
  const weeklyActions = filteredActions.filter(a => a.frequency === 'weekly');
  const seasonalActions = filteredActions.filter(a => a.frequency === 'seasonal');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const renderActionCard = (action: Quest) => {
    const participation = joinedActions.get(action.id);
    const isJoined = !!participation;
    const isCompleted = participation?.completed;
    const isLoading = loadingAction === action.id;

    return (
      <Card 
        key={action.id} 
        className={`overflow-hidden transition-all hover:shadow-lg ${isCompleted ? 'opacity-75' : ''}`}
        data-testid={`card-action-${action.id}`}
      >
        {action.image && (
          <div className="relative h-32 overflow-hidden">
            <img 
              src={action.image} 
              alt={action.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-2 left-2 flex gap-1">
              <Badge variant="secondary" className="text-xs">
                {CATEGORY_ICONS[action.category]}
                <span className="ml-1 capitalize">{action.category}</span>
              </Badge>
              <Badge variant="secondary" className="text-xs">
                <Calendar className="w-3 h-3 mr-1" />
                {FREQUENCY_LABELS[action.frequency]}
              </Badge>
            </div>
            {isCompleted && (
              <div className="absolute top-2 right-2">
                <Badge className="bg-green-500 text-white">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Completed
                </Badge>
              </div>
            )}
          </div>
        )}
        
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-lg leading-tight">{action.title}</h3>
            <Badge variant="default" className="shrink-0">
              {action.points} pts
            </Badge>
          </div>
          
          <p className="text-sm text-muted-foreground mb-3">
            {action.description}
          </p>
          
          <div className="flex flex-wrap gap-1.5">
            {getVerificationBadge(action)}
            {action.anti_cheat_requires_daily_code && (
              <Badge variant="outline" className="text-xs gap-1 text-amber-600 border-amber-300">
                <AlertCircle className="w-3 h-3" />
                Code Required
              </Badge>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="p-4 pt-0">
          <Button 
            className="w-full" 
            variant={isJoined ? "default" : "outline"}
            disabled={isLoading || isCompleted}
            onClick={() => handleAction(action)}
            data-testid={`button-action-${action.id}`}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : isCompleted ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Completed
              </>
            ) : isJoined ? (
              <>
                <ArrowRight className="w-4 h-4 mr-2" />
                Continue
              </>
            ) : (
              <>
                Start Action
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    );
  };

  const renderActionGroup = (title: string, actions: Quest[]) => {
    if (actions.length === 0) return null;
    
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          {title}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {actions.map(renderActionCard)}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display">Eco Actions</h1>
          <p className="text-muted-foreground mt-1">
            Complete verified actions to earn points and make a real impact.
          </p>
        </div>
        
        <TodaysCodeDisplay />
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search actions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-actions"
          />
        </div>
        
        <div className="flex gap-2 flex-wrap">
          {categories.map(cat => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat.id)}
              data-testid={`button-category-${cat.id}`}
            >
              {cat.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-8">
        {renderActionGroup("Daily Actions", dailyActions)}
        {renderActionGroup("Weekly Actions", weeklyActions)}
        {renderActionGroup("Seasonal Actions", seasonalActions)}
      </div>

      {filteredActions.length === 0 && (
        <div className="text-center py-12">
          <Leaf className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
          <h3 className="font-semibold text-lg mb-2">No actions found</h3>
          <p className="text-muted-foreground text-sm">
            Try adjusting your search or category filter.
          </p>
        </div>
      )}

      <ProofSubmissionDialog
        quest={proofQuest}
        open={!!proofQuest}
        onOpenChange={(open) => { if (!open) { setProofQuest(null); fetchMyActions(); } }}
      />

      <GpsSessionDialog
        quest={gpsQuest}
        open={!!gpsQuest}
        onOpenChange={(open) => { if (!open) { setGpsQuest(null); fetchMyActions(); } }}
      />

      <EcoQuizDialog
        quest={quizQuest}
        open={!!quizQuest}
        onOpenChange={(open) => { if (!open) { setQuizQuest(null); fetchMyActions(); } }}
      />
    </div>
  );
}
