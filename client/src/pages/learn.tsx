import { useState } from "react";
import { useStore, LESSONS, Lesson } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { BookOpen, HelpCircle, CheckCircle, Award, Coins, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const QUIZZES: Record<string, { question: string; options: string[]; answer: string }> = {
  '1': {
    question: "How long does it take for a plastic bottle to decompose?",
    options: ["10 years", "50 years", "450 years", "It never decomposes"],
    answer: "450 years"
  },
  '2': {
    question: "What percentage of global CO2 emissions come from transportation?",
    options: ["5%", "16%", "25%", "40%"],
    answer: "16%"
  },
  '3': {
    question: "Which food has the highest carbon footprint per kg?",
    options: ["Chicken", "Beef", "Tofu", "Rice"],
    answer: "Beef"
  },
  '4': {
    question: "What is the most eco-friendly way to commute?",
    options: ["Electric car", "Bus", "Cycling/Walking", "Motorcycle"],
    answer: "Cycling/Walking"
  },
  '5': {
    question: "What does 'circular economy' mean?",
    options: ["Money goes in circles", "Products are reused/recycled", "Only round products", "Economic cycles"],
    answer: "Products are reused/recycled"
  },
};

export default function LearnPage() {
  const { toast } = useToast();
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState<Record<string, boolean>>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleQuizSubmit = () => {
    if (!selectedLesson) return;
    
    const quiz = QUIZZES[selectedLesson.id];
    if (selectedAnswer === quiz.answer) {
      toast({
        title: "Correct! 🎉",
        description: `You earned ${selectedLesson.creditsReward} credits!`,
      });
      setQuizCompleted(prev => ({ ...prev, [selectedLesson.id]: true }));
    } else {
      toast({
        title: "Not quite right",
        description: "Try again!",
        variant: "destructive"
      });
    }
    setSelectedAnswer("");
  };

  const completedCount = Object.keys(quizCompleted).length + LESSONS.filter(l => l.completed).length;
  const progressPercent = (completedCount / LESSONS.length) * 100;

  return (
    <div className="space-y-8 pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight">Learn</h1>
          <p className="text-muted-foreground">Short lessons to understand your impact and earn credits.</p>
        </div>
        <Card className="md:w-auto">
          <CardContent className="py-3 px-4 flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Progress</div>
              <div className="font-bold">{completedCount}/{LESSONS.length}</div>
            </div>
            <Progress value={progressPercent} className="w-24 h-2" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {LESSONS.map((lesson) => {
          const isCompleted = lesson.completed || quizCompleted[lesson.id];
          
          return (
            <Card key={lesson.id} className={`group hover:shadow-lg hover:shadow-primary/5 transition-all ${isCompleted ? 'border-green-500/30 bg-green-500/5' : ''}`}>
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="outline">{lesson.category}</Badge>
                  {isCompleted ? (
                    <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
                      <CheckCircle className="w-3 h-3 mr-1" /> Completed
                    </Badge>
                  ) : (
                    <Badge className="bg-primary/20 text-primary border-none">
                      <Coins className="w-3 h-3 mr-1" /> +{lesson.creditsReward}
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-xl">{lesson.title}</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Clock className="w-3 h-3" /> {lesson.duration} read
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                  {lesson.content}
                </p>
                
                <Dialog open={isDialogOpen && selectedLesson?.id === lesson.id} onOpenChange={(open) => {
                  setIsDialogOpen(open);
                  if (!open) {
                    setSelectedLesson(null);
                    setShowQuiz(false);
                    setSelectedAnswer("");
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button 
                      className={`w-full ${isCompleted ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20' : 'group-hover:bg-primary group-hover:text-primary-foreground'}`}
                      variant="outline"
                      onClick={() => {
                        setSelectedLesson(lesson);
                        setIsDialogOpen(true);
                      }}
                    >
                      {isCompleted ? 'Review Lesson' : 'Start Lesson'}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{lesson.title}</DialogTitle>
                      <DialogDescription className="flex items-center gap-2">
                        <Badge variant="outline">{lesson.category}</Badge>
                        <span>•</span>
                        <span>{lesson.duration}</span>
                      </DialogDescription>
                    </DialogHeader>
                    
                    {!showQuiz ? (
                      <div className="py-4 space-y-6">
                        <div className="p-5 bg-muted/50 rounded-lg text-sm leading-relaxed space-y-4">
                          <p>{lesson.content}</p>
                          <p>
                            Understanding this topic is crucial for making informed decisions about your daily habits. 
                            Small changes in behavior can lead to significant positive impacts on the environment.
                          </p>
                          <p>
                            Research shows that when individuals take action on climate issues, it creates a ripple effect 
                            that influences others in their community. Your actions matter more than you might think!
                          </p>
                          <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                            <h4 className="font-semibold mb-2">Key Takeaways</h4>
                            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                              <li>Every action counts towards a sustainable future</li>
                              <li>Small daily habits compound into big impact over time</li>
                              <li>Community action amplifies individual efforts</li>
                            </ul>
                          </div>
                        </div>
                        
                        <DialogFooter>
                          <Button onClick={() => setShowQuiz(true)} className="w-full">
                            <HelpCircle className="mr-2 w-4 h-4" /> Take Quiz to Earn Credits
                          </Button>
                        </DialogFooter>
                      </div>
                    ) : (
                      <div className="py-4 space-y-6">
                        <div className="p-4 bg-primary/10 rounded-lg border border-primary/20 flex items-center gap-3">
                          <Award className="w-6 h-6 text-primary" />
                          <div>
                            <div className="font-semibold">Quiz Time!</div>
                            <div className="text-sm text-muted-foreground">Answer correctly to earn {lesson.creditsReward} credits</div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <p className="font-medium">{QUIZZES[lesson.id]?.question}</p>
                          <RadioGroup onValueChange={setSelectedAnswer} value={selectedAnswer} className="space-y-2">
                            {QUIZZES[lesson.id]?.options.map((opt: string) => (
                              <div key={opt} className="flex items-center space-x-2 p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
                                <RadioGroupItem value={opt} id={opt} />
                                <Label htmlFor={opt} className="cursor-pointer w-full">{opt}</Label>
                              </div>
                            ))}
                          </RadioGroup>
                        </div>

                        <DialogFooter className="flex gap-2">
                          <Button variant="outline" onClick={() => setShowQuiz(false)}>Back to Lesson</Button>
                          <Button onClick={handleQuizSubmit} disabled={!selectedAnswer}>
                            Submit Answer
                          </Button>
                        </DialogFooter>
                      </div>
                    )}
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
