import { useStore, QUESTS } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, Clock, Trophy, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function QuestsPage() {
  const { toast } = useToast();

  const handleJoin = (questTitle: string) => {
    toast({
      title: "Quest Joined!",
      description: `You have joined ${questTitle}. Good luck!`,
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-display tracking-tight">Quests</h1>
        <p className="text-muted-foreground">Join challenges to boost your impact and earn badges.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {QUESTS.map((quest) => (
          <Card key={quest.id} className="overflow-hidden flex flex-col h-full group hover:shadow-lg hover:shadow-primary/5 transition-all border-border/50">
            <div className="relative h-48 w-full overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
              <img 
                src={quest.image} 
                alt={quest.title} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <Badge className="absolute top-4 right-4 z-20 bg-primary text-primary-foreground font-bold border-none shadow-lg">
                +{quest.points} XP
              </Badge>
              <div className="absolute bottom-4 left-4 z-20">
                <Badge variant="secondary" className="mb-2 bg-black/50 backdrop-blur-md border-white/10 text-white">
                  {quest.category}
                </Badge>
                <h3 className="text-xl font-bold text-white shadow-black drop-shadow-md">{quest.title}</h3>
              </div>
            </div>
            
            <CardContent className="flex-1 pt-6 space-y-4">
              <p className="text-sm text-muted-foreground">{quest.description}</p>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4 text-primary" />
                  {quest.duration}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="w-4 h-4 text-primary" />
                  {quest.participants} joined
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Community Progress</span>
                  <span className="font-mono text-primary">65%</span>
                </div>
                <Progress value={65} className="h-1.5" />
              </div>
            </CardContent>

            <CardFooter className="pt-0 pb-6">
              <Button className="w-full" onClick={() => handleJoin(quest.title)}>
                Join Quest <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
