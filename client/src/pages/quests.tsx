import { useState, useEffect } from "react";
import { QUESTS, Quest } from "@/lib/store";
import { useAuth } from "@/lib/authContext";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, ArrowRight, CheckCircle, Loader2, Video, Image, MapPin, Sparkles, Calendar, Users, Leaf, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TodaysCodeDisplay } from "@/components/todays-code-display";
import { ProofSubmissionDialog } from "@/components/proof-submission-dialog";
import { GpsSessionDialog } from "@/components/gps-session-dialog";
import { EcoQuizDialog } from "@/components/eco-quiz-dialog";

interface QuestParticipation {
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

export default function QuestsPage() {
  const { toast } = useToast();
  const { session } = useAuth();
  const [joinedQuests, setJoinedQuests] = useState<Map<string, QuestParticipation>>(new Map());
  const [loadingQuest, setLoadingQuest] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Dialog states
  const [proofQuest, setProofQuest] = useState<Quest | null>(null);
  const [gpsQuest, setGpsQuest] = useState<Quest | null>(null);
  const [quizQuest, setQuizQuest] = useState<Quest | null>(null);

  useEffect(() => {
    if (session?.access_token) {
      fetchMyQuests();
    } else {
      setLoading(false);
    }
  }, [session]);

  const fetchMyQuests = async () => {
    try {
      const response = await fetch('/api/quests/my', {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });
      if (response.ok) {
        const data: QuestParticipation[] = await response.json();
        const map = new Map<string, QuestParticipation>();
        data.forEach(p => map.set(p.quest_id, p));
        setJoinedQuests(map);
      }
    } catch (error) {
      console.error('Failed to fetch quest participations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (quest: Quest) => {
    if (joinedQuests.has(quest.id)) return;
    
    if (!session?.access_token) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to join quests.",
        variant: "destructive",
      });
      return;
    }
    
    setLoadingQuest(quest.id);
    
    try {
      const response = await fetch(`/api/quests/${quest.id}/join`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join quest');
      }

      const newParticipation: QuestParticipation = {
        quest_id: quest.id,
        progress: 0,
        completed: false,
        joined_at: new Date().toISOString(),
      };
      
      setJoinedQuests(prev => new Map(prev).set(quest.id, newParticipation));
      
      toast({
        title: "Quest Joined!",
        description: `You've joined "${quest.title}". Good luck!`,
      });
    } catch (error: any) {
      toast({
        title: "Failed to join quest",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingQuest(null);
    }
  };

  const handleAction = (quest: Quest) => {
    const participation = joinedQuests.get(quest.id);
    if (!participation) {
      handleJoin(quest);
      return;
    }

    // Route to appropriate dialog based on verification type
    switch (quest.verification_type) {
      case 'gps_session':
        setGpsQuest(quest);
        break;
      case 'proof_video':
      case 'proof_photo':
      case 'screenshot_health':
        setProofQuest(quest);
        break;
      case 'quiz':
        setQuizQuest(quest);
        break;
    }
  };

  const getActionButton = (quest: Quest) => {
    const participation = joinedQuests.get(quest.id);
    const isLoading = loadingQuest === quest.id;
    const isJoined = !!participation;
    const isCompleted = participation?.completed;

    if (isCompleted) {
      return (
        <Button variant="outline" disabled className="w-full min-h-[44px]">
          <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
          Completed
        </Button>
      );
    }

    if (!isJoined) {
      return (
        <Button 
          className="w-full min-h-[44px]" 
          onClick={() => handleJoin(quest)}
          disabled={isLoading}
          data-testid={`button-join-quest-${quest.id}`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Joining...
            </>
          ) : (
            <>
              Join Quest <ArrowRight className="ml-2 w-4 h-4" />
            </>
          )}
        </Button>
      );
    }

    // User has joined, show action button based on verification type
    switch (quest.verification_type) {
      case 'gps_session':
        return (
          <Button 
            className="w-full min-h-[44px]" 
            onClick={() => handleAction(quest)}
            data-testid={`button-start-session-${quest.id}`}
          >
            <MapPin className="w-4 h-4 mr-2" />
            Start Session
          </Button>
        );
      case 'proof_video':
        return (
          <Button 
            className="w-full min-h-[44px]" 
            onClick={() => handleAction(quest)}
            data-testid={`button-submit-video-${quest.id}`}
          >
            <Video className="w-4 h-4 mr-2" />
            Submit Video
          </Button>
        );
      case 'proof_photo':
      case 'screenshot_health':
        return (
          <Button 
            className="w-full min-h-[44px]" 
            onClick={() => handleAction(quest)}
            data-testid={`button-submit-photo-${quest.id}`}
          >
            <Image className="w-4 h-4 mr-2" />
            Submit Screenshot
          </Button>
        );
      case 'quiz':
        return (
          <Button 
            className="w-full min-h-[44px]" 
            onClick={() => handleAction(quest)}
            data-testid={`button-start-quiz-${quest.id}`}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Take Quiz
          </Button>
        );
    }
  };

  const getVerificationBadge = (quest: Quest) => {
    switch (quest.verification_type) {
      case 'gps_session':
        return (
          <Badge variant="outline" className="text-[10px] gap-1 bg-green-500/10 text-green-600 border-green-500/30">
            <MapPin className="w-3 h-3" />
            GPS Session
          </Badge>
        );
      case 'proof_video':
        return (
          <Badge variant="outline" className="text-[10px] gap-1 bg-blue-500/10 text-blue-500 border-blue-500/30">
            <Video className="w-3 h-3" />
            Video Proof
          </Badge>
        );
      case 'proof_photo':
      case 'screenshot_health':
        return (
          <Badge variant="outline" className="text-[10px] gap-1 bg-purple-500/10 text-purple-500 border-purple-500/30">
            <Image className="w-3 h-3" />
            Screenshot
          </Badge>
        );
      case 'quiz':
        return (
          <Badge variant="outline" className="text-[10px] gap-1 bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
            <Sparkles className="w-3 h-3" />
            Quiz
          </Badge>
        );
    }
  };

  // Group quests by frequency
  const dailyQuests = QUESTS.filter(q => q.frequency === 'daily' && q.is_active).sort((a, b) => a.sort_order - b.sort_order);
  const weeklyQuests = QUESTS.filter(q => q.frequency === 'weekly' && q.is_active).sort((a, b) => a.sort_order - b.sort_order);
  const seasonalQuests = QUESTS.filter(q => q.frequency === 'seasonal' && q.is_active).sort((a, b) => a.sort_order - b.sort_order);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const renderQuestCard = (quest: Quest) => {
    const participation = joinedQuests.get(quest.id);
    const isJoined = !!participation;
    const isCompleted = participation?.completed;

    return (
      <Card 
        key={quest.id} 
        className={`overflow-hidden flex flex-col h-full group transition-all border-border/50 ${
          isCompleted ? 'border-green-500/30 bg-green-500/5' :
          isJoined ? 'border-primary/30 bg-primary/5' : 'hover:shadow-lg hover:shadow-primary/5'
        }`}
        data-testid={`card-quest-${quest.id}`}
      >
        <div className="relative h-40 w-full overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
          {quest.image && (
            <img 
              src={quest.image} 
              alt={quest.title} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          )}
          <div className="absolute top-3 right-3 z-20 flex gap-2">
            <Badge className="bg-primary text-primary-foreground font-bold border-none shadow-lg">
              +{quest.points} pts
            </Badge>
          </div>
          <div className="absolute bottom-3 left-3 z-20">
            <div className="flex gap-1 mb-1">
              <Badge variant="secondary" className="bg-black/50 backdrop-blur-md border-white/10 text-white text-[10px] gap-1">
                {CATEGORY_ICONS[quest.category]}
                {quest.category}
              </Badge>
              <Badge variant="secondary" className="bg-black/50 backdrop-blur-md border-white/10 text-white text-[10px] gap-1">
                <Calendar className="w-3 h-3" />
                {FREQUENCY_LABELS[quest.frequency]}
              </Badge>
            </div>
            <h3 className="text-lg font-bold text-white shadow-black drop-shadow-md">{quest.title}</h3>
          </div>
          {isJoined && (
            <div className="absolute top-3 left-3 z-20">
              <Badge className={isCompleted ? "bg-green-500 text-white border-none" : "bg-blue-500 text-white border-none"}>
                {isCompleted ? (
                  <><CheckCircle className="w-3 h-3 mr-1" /> Done</>
                ) : (
                  <><CheckCircle className="w-3 h-3 mr-1" /> Joined</>
                )}
              </Badge>
            </div>
          )}
        </div>
        
        <CardContent className="flex-1 pt-4 space-y-3">
          <p className="text-sm text-muted-foreground line-clamp-2">{quest.description}</p>
          
          <div className="flex items-center gap-2 flex-wrap">
            {getVerificationBadge(quest)}
            {quest.anti_cheat_requires_daily_code && (
              <Badge variant="outline" className="text-[10px] gap-1 bg-orange-500/10 text-orange-600 border-orange-500/30">
                <AlertCircle className="w-3 h-3" />
                Code Required
              </Badge>
            )}
          </div>
        </CardContent>

        <CardFooter className="pt-0 pb-4">
          {getActionButton(quest)}
        </CardFooter>
      </Card>
    );
  };

  return (
    <div className="space-y-8 pb-20 md:pb-0">
      <div>
        <h1 className="text-3xl font-bold font-display tracking-tight">Pilot Quest Pack</h1>
        <p className="text-muted-foreground">Complete quests to earn points and make a real impact.</p>
      </div>

      <TodaysCodeDisplay />

      {dailyQuests.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Daily Quests
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dailyQuests.map(renderQuestCard)}
          </div>
        </div>
      )}

      {weeklyQuests.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Weekly Quests
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {weeklyQuests.map(renderQuestCard)}
          </div>
        </div>
      )}

      {seasonalQuests.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Seasonal Quests
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {seasonalQuests.map(renderQuestCard)}
          </div>
        </div>
      )}

      <ProofSubmissionDialog
        open={!!proofQuest}
        onOpenChange={(open) => !open && setProofQuest(null)}
        quest={proofQuest}
        accessToken={session?.access_token}
        onSuccess={() => {
          fetchMyQuests();
        }}
      />

      <GpsSessionDialog
        open={!!gpsQuest}
        onOpenChange={(open) => !open && setGpsQuest(null)}
        quest={gpsQuest}
        accessToken={session?.access_token}
        onSuccess={() => {
          fetchMyQuests();
        }}
      />

      <EcoQuizDialog
        open={!!quizQuest}
        onOpenChange={(open) => !open && setQuizQuest(null)}
        quest={quizQuest}
        accessToken={session?.access_token}
        onSuccess={() => {
          fetchMyQuests();
        }}
      />
    </div>
  );
}
