import { useState } from "react";
import { useStore, DONATION_PROJECTS } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Coins, Heart, TreePine, Waves, Sun } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function DonatePage() {
  const { user, donateCredits } = useStore();
  const { toast } = useToast();
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [donationAmount, setDonationAmount] = useState<string>("");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  if (!user) return null;

  const handleDonate = () => {
    if (!selectedProject) return;
    
    const amount = parseInt(donationAmount);
    const result = donateCredits(selectedProject, amount);
    
    if (result.success) {
      toast({
        title: "Donation Successful!",
        description: result.message,
      });
    } else {
      toast({
        title: "Donation Failed",
        description: result.message,
        variant: "destructive",
      });
    }
    
    setIsConfirmOpen(false);
    setSelectedProject(null);
    setDonationAmount("");
  };

  const quickAmounts = [10, 25, 50, 100];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight">Donate Credits</h1>
          <p className="text-muted-foreground">Support environmental projects with your eco-credits.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
          <Coins className="w-5 h-5 text-primary" />
          <span className="font-bold font-mono">{user.credits}</span>
          <span className="text-sm text-muted-foreground">credits available</span>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {DONATION_PROJECTS.map((project) => {
          const progressPercent = Math.round((project.raised / project.goal) * 100);
          
          return (
            <Card key={project.id} className="overflow-hidden flex flex-col h-full group hover:shadow-lg hover:shadow-pink-500/10 transition-all">
              <div className="relative h-48 w-full overflow-hidden">
                {project.image && (
                  <img 
                    src={project.image} 
                    alt={project.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="font-bold text-lg text-white leading-tight">{project.title}</h3>
                </div>
              </div>
              
              <CardContent className="flex-1 pt-4 space-y-4">
                <p className="text-sm text-muted-foreground">{project.description}</p>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-mono text-primary">{progressPercent}%</span>
                  </div>
                  <Progress value={progressPercent} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{project.raised.toLocaleString()} credits raised</span>
                    <span>Goal: {project.goal.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="pt-0 pb-4">
                <Dialog open={isConfirmOpen && selectedProject === project.id} onOpenChange={(open) => {
                  setIsConfirmOpen(open);
                  if (!open) {
                    setSelectedProject(null);
                    setDonationAmount("");
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button 
                      className="w-full bg-pink-600 hover:bg-pink-700 text-white"
                      onClick={() => setSelectedProject(project.id)}
                    >
                      <Heart className="w-4 h-4 mr-2" /> Donate
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Donate to {project.title}</DialogTitle>
                      <DialogDescription>
                        Your donation helps fund this environmental project.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="py-4 space-y-6">
                      <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                        {project.image && (
                          <img src={project.image} alt={project.title} className="w-16 h-16 rounded-lg object-cover" />
                        )}
                        <div className="flex-1">
                          <h4 className="font-bold">{project.title}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label>Donation Amount</Label>
                        <div className="flex flex-wrap gap-2">
                          {quickAmounts.map((amt) => (
                            <Button
                              key={amt}
                              variant={donationAmount === amt.toString() ? "default" : "outline"}
                              size="sm"
                              onClick={() => setDonationAmount(amt.toString())}
                              disabled={user.credits < amt}
                            >
                              {amt}
                            </Button>
                          ))}
                        </div>
                        <div className="relative">
                          <Coins className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input 
                            type="number"
                            placeholder="Custom amount"
                            value={donationAmount}
                            onChange={(e) => setDonationAmount(e.target.value)}
                            className="pl-10"
                            min={1}
                            max={user.credits}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Your balance: {user.credits} credits
                        </p>
                      </div>
                      
                      {donationAmount && parseInt(donationAmount) > 0 && (
                        <div className="p-4 rounded-lg bg-pink-500/10 border border-pink-500/20">
                          <div className="flex justify-between text-sm">
                            <span>Donation:</span>
                            <span className="font-mono">{donationAmount} credits</span>
                          </div>
                          <div className="flex justify-between text-sm mt-1">
                            <span>Remaining balance:</span>
                            <span className="font-mono font-bold">{user.credits - parseInt(donationAmount)} credits</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsConfirmOpen(false)}>Cancel</Button>
                      <Button 
                        onClick={handleDonate}
                        disabled={!donationAmount || parseInt(donationAmount) <= 0 || parseInt(donationAmount) > user.credits}
                        className="bg-pink-600 hover:bg-pink-700"
                      >
                        <Heart className="w-4 h-4 mr-2" /> Confirm Donation
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Info Card */}
      <Card className="border-dashed border-pink-500/30">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-pink-500/10">
              <Heart className="w-6 h-6 text-pink-500" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">About Donations</h3>
              <p className="text-sm text-muted-foreground">
                Your credit donations directly fund verified environmental projects. 
                All donations are tracked transparently and 100% go to the projects.
                This is a closed-loop system — credits cannot be exchanged for cash.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
