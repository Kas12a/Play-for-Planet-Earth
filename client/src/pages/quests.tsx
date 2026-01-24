import { useState } from "react";
import { QUESTS, Quest } from "@/lib/store";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, ArrowRight, CheckCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function QuestsPage() {
  const { toast } = useToast();
  const [joinedQuests, setJoinedQuests] = useState<Set<string>>(new Set());
  const [loadingQuest, setLoadingQuest] = useState<string | null>(null);

  const handleJoin = async (quest: Quest) => {
    if (joinedQuests.has(quest.id)) return;
    
    setLoadingQuest(quest.id);
    
    // Simulate API call with slight delay for UX
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setJoinedQuests(prev => new Set(prev).add(quest.id));
    setLoadingQuest(null);
    
    toast({
      title: "Quest Joined!",
      description: `You've joined "${quest.title}". Good luck!`,
    });
  };

  const isJoined = (questId: string) => joinedQuests.has(questId);

  return (
    <div className="space-y-8 pb-20 md:pb-0">
      <div>
        <h1 className="text-3xl font-bold font-display tracking-tight">Quests</h1>
        <p className="text-muted-foreground">Join challenges to boost your impact and earn rewards.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {QUESTS.map((quest) => {
          const joined = isJoined(quest.id);
          const loading = loadingQuest === quest.id;
          
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
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>{quest.duration}</span>
                  {quest.evidenceRequired && (
                    <Badge variant="outline" className="ml-auto text-[10px]">Evidence required</Badge>
                  )}
                </div>
              </CardContent>

              <CardFooter className="pt-0 pb-6">
                <Button 
                  className="w-full min-h-[44px]" 
                  onClick={() => handleJoin(quest)}
                  disabled={joined || loading}
                  variant={joined ? "outline" : "default"}
                  data-testid={`button-join-quest-${quest.id}`}
                >
                  {loading ? (
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
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
