import { useState, useEffect } from "react";
import { QUESTS, Quest } from "@/lib/store";
import { useAuth } from "@/lib/authContext";
import { useProfile, HealthDataSource } from "@/lib/useProfile";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, ArrowRight, CheckCircle, Loader2, Shield, Video, Heart, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useLocation } from "wouter";
import { VideoSubmissionDialog } from "@/components/video-submission-dialog";

interface QuestParticipation {
  quest_id: string;
  progress: number;
  completed: boolean;
  joined_at: string;
}

export default function QuestsPage() {
  const { toast } = useToast();
  const { session } = useAuth();
  const { profile } = useProfile();
  const [, setLocation] = useLocation();
  const [joinedQuests, setJoinedQuests] = useState<Set<string>>(new Set());
  const [loadingQuest, setLoadingQuest] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showHealthPrompt, setShowHealthPrompt] = useState(false);
  const [videoQuestId, setVideoQuestId] = useState<string | null>(null);
  const [videoQuestTitle, setVideoQuestTitle] = useState("");

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
        setJoinedQuests(new Set(data.map(p => p.quest_id)));
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

    if (quest.verificationType === 'healthKit' && (!profile?.health_data_source || profile.health_data_source === 'none')) {
      setShowHealthPrompt(true);
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

      setJoinedQuests(prev => new Set(prev).add(quest.id));
      
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

  const isJoined = (questId: string) => joinedQuests.has(questId);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 md:pb-0">
      <div>
        <h1 className="text-3xl font-bold font-display tracking-tight">Quests</h1>
        <p className="text-muted-foreground">Join challenges to boost your impact and earn rewards.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {QUESTS.map((quest) => {
          const joined = isJoined(quest.id);
          const isLoading = loadingQuest === quest.id;
          const requiresVerified = quest.requiresVerifiedActivity;
          
          return (
            <Card 
              key={quest.id} 
              className={`overflow-hidden flex flex-col h-full group transition-all border-border/50 ${
                joined ? 'border-primary/30 bg-primary/5' : 'hover:shadow-lg hover:shadow-primary/5'
              }`}
              data-testid={`card-quest-${quest.id}`}
            >
              <div className="relative h-48 w-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
                {quest.image && (
                  <img 
                    src={quest.image} 
                    alt={quest.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                )}
                <div className="absolute top-4 right-4 z-20 flex gap-2">
                  <Badge className="bg-primary text-primary-foreground font-bold border-none shadow-lg">
                    +{quest.creditsReward} credits
                  </Badge>
                </div>
                <div className="absolute bottom-4 left-4 z-20">
                  <Badge variant="secondary" className="mb-2 bg-black/50 backdrop-blur-md border-white/10 text-white">
                    {quest.category}
                  </Badge>
                  <h3 className="text-xl font-bold text-white shadow-black drop-shadow-md">{quest.title}</h3>
                </div>
                {joined && (
                  <div className="absolute top-4 left-4 z-20">
                    <Badge className="bg-green-500 text-white border-none">
                      <CheckCircle className="w-3 h-3 mr-1" /> Joined
                    </Badge>
                  </div>
                )}
              </div>
              
              <CardContent className="flex-1 pt-6 space-y-4">
                <p className="text-sm text-muted-foreground">{quest.description}</p>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>{quest.duration}</span>
                  {quest.verificationType === 'healthKit' && (
                    <Badge variant="outline" className="ml-auto text-[10px] gap-1 bg-pink-500/10 text-pink-500 border-pink-500/30">
                      <Heart className="w-3 h-3" />
                      Health Data
                    </Badge>
                  )}
                  {quest.verificationType === 'video' && (
                    <Badge variant="outline" className="ml-auto text-[10px] gap-1 bg-blue-500/10 text-blue-500 border-blue-500/30">
                      <Video className="w-3 h-3" />
                      Video Proof
                    </Badge>
                  )}
                  {requiresVerified && quest.verificationType !== 'healthKit' && quest.verificationType !== 'video' && (
                    <Badge variant="outline" className="ml-auto text-[10px] gap-1">
                      <Shield className="w-3 h-3" />
                      Verified only
                    </Badge>
                  )}
                </div>
              </CardContent>

              <CardFooter className="pt-0 pb-6 flex gap-2">
                {joined && quest.verificationType === 'video' ? (
                  <Button 
                    className="w-full min-h-[44px]" 
                    onClick={() => {
                      setVideoQuestId(quest.id);
                      setVideoQuestTitle(quest.title);
                    }}
                    data-testid={`button-submit-video-${quest.id}`}
                  >
                    <Video className="w-4 h-4 mr-2" />
                    Submit Video
                  </Button>
                ) : (
                  <Button 
                    className="w-full min-h-[44px]" 
                    onClick={() => handleJoin(quest)}
                    disabled={joined || isLoading}
                    variant={joined ? "outline" : "default"}
                    data-testid={`button-join-quest-${quest.id}`}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Joining...
                      </>
                    ) : joined ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Joined
                      </>
                    ) : (
                      <>
                        Join Quest <ArrowRight className="ml-2 w-4 h-4" />
                      </>
                    )}
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <Dialog open={showHealthPrompt} onOpenChange={setShowHealthPrompt}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              Health Data Source Required
            </DialogTitle>
            <DialogDescription>
              This quest requires health data verification. Please connect a health data source in your profile settings before joining.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <p className="text-sm text-muted-foreground">
              Supported health apps:
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="gap-1">
                <Heart className="w-3 h-3" /> Apple Health
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Heart className="w-3 h-3" /> Google Fit
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Heart className="w-3 h-3" /> Samsung Health
              </Badge>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHealthPrompt(false)}>
              Cancel
            </Button>
            <Button onClick={() => { setShowHealthPrompt(false); setLocation('/profile'); }}>
              Go to Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <VideoSubmissionDialog
        open={!!videoQuestId}
        onOpenChange={(open) => {
          if (!open) {
            setVideoQuestId(null);
            setVideoQuestTitle("");
          }
        }}
        questId={videoQuestId || ""}
        questTitle={videoQuestTitle}
        accessToken={session?.access_token}
        onSuccess={() => {
          toast({
            title: "Video submitted!",
            description: "Your submission is pending review.",
          });
        }}
      />
    </div>
  );
}
