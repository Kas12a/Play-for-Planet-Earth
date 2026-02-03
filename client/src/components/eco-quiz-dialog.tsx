import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, Loader2, Sparkles, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Quest } from "@/lib/store";

interface EcoQuizDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quest: Quest | null;
  accessToken?: string;
  onSuccess?: () => void;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

// Pool of eco questions - 5 random ones selected daily
const QUESTION_POOL: QuizQuestion[] = [
  {
    question: "What percentage of plastic ever produced has been recycled?",
    options: ["About 9%", "About 30%", "About 50%", "About 70%"],
    correct: 0,
    explanation: "Only about 9% of all plastic ever produced has been recycled. Most ends up in landfills or the environment."
  },
  {
    question: "Which activity produces the most carbon emissions per person?",
    options: ["Driving 100 miles", "One transatlantic flight", "Heating a home for a month", "Eating beef for a year"],
    correct: 1,
    explanation: "A single transatlantic flight can produce more CO2 per person than driving 100 miles."
  },
  {
    question: "How long does a plastic bottle take to decompose?",
    options: ["10 years", "50 years", "450 years", "1000 years"],
    correct: 2,
    explanation: "Plastic bottles take approximately 450 years to decompose in the environment."
  },
  {
    question: "What's the most effective individual action against climate change?",
    options: ["Recycling more", "Eating less meat", "Using LED bulbs", "Avoiding one transatlantic flight"],
    correct: 3,
    explanation: "Avoiding one transatlantic flight saves about 1.6 tonnes of CO2 - more than other actions combined."
  },
  {
    question: "How much water is needed to produce one cotton t-shirt?",
    options: ["100 liters", "700 liters", "2,700 liters", "10,000 liters"],
    correct: 2,
    explanation: "It takes about 2,700 liters of water to produce one cotton t-shirt - enough drinking water for one person for 2.5 years."
  },
  {
    question: "What percentage of the world's energy comes from renewable sources?",
    options: ["About 13%", "About 30%", "About 45%", "About 60%"],
    correct: 1,
    explanation: "Approximately 30% of global electricity now comes from renewable sources, and this is growing."
  },
  {
    question: "Which country has the highest recycling rate?",
    options: ["Germany", "Sweden", "Japan", "South Korea"],
    correct: 0,
    explanation: "Germany has one of the highest recycling rates in the world at about 67%."
  },
  {
    question: "How many trees does it take to absorb one ton of CO2 per year?",
    options: ["1-2 trees", "10-15 trees", "40-50 trees", "100+ trees"],
    correct: 2,
    explanation: "It takes about 40-50 mature trees to absorb one ton of CO2 per year."
  },
  {
    question: "What is the largest source of ocean plastic pollution?",
    options: ["Plastic straws", "Fishing gear", "Plastic bottles", "Plastic bags"],
    correct: 1,
    explanation: "Fishing gear accounts for about 46% of ocean plastic pollution."
  },
  {
    question: "Walking instead of driving 1 mile saves approximately how much CO2?",
    options: ["0.1 kg", "0.4 kg", "1 kg", "2 kg"],
    correct: 1,
    explanation: "Walking instead of driving saves about 0.4 kg (nearly 1 pound) of CO2 per mile."
  },
];

export function EcoQuizDialog({
  open,
  onOpenChange,
  quest,
  accessToken,
  onSuccess,
}: EcoQuizDialogProps) {
  const { toast } = useToast();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Generate daily questions based on date
  useEffect(() => {
    if (open) {
      const today = new Date();
      const seed = today.getUTCFullYear() * 1000 + today.getUTCMonth() * 32 + today.getUTCDate();
      
      // Shuffle based on seed
      const shuffled = [...QUESTION_POOL].sort((a, b) => {
        const hashA = (seed + QUESTION_POOL.indexOf(a)) % 100;
        const hashB = (seed + QUESTION_POOL.indexOf(b)) % 100;
        return hashA - hashB;
      });
      
      setQuestions(shuffled.slice(0, 5));
      setCurrentIndex(0);
      setSelectedAnswer(null);
      setShowResult(false);
      setScore(0);
      setCompleted(false);
    }
  }, [open]);

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + (showResult ? 1 : 0)) / questions.length) * 100;

  const handleAnswer = (answerIndex: number) => {
    if (showResult) return;
    
    setSelectedAnswer(answerIndex);
    setShowResult(true);
    
    if (answerIndex === currentQuestion.correct) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setCompleted(true);
    }
  };

  const handleSubmit = async () => {
    if (!quest || !accessToken) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/quests/${quest.id}/complete-quiz`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          score,
          total: questions.length,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to submit quiz");
      }

      toast({
        title: "Quiz complete!",
        description: `You scored ${score}/${questions.length} and earned ${quest.points} points!`,
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Submission failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!currentQuestion && !completed) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Eco Knowledge Spark
          </DialogTitle>
          <DialogDescription>
            Answer 5 questions to complete today's quiz
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Question {currentIndex + 1} of {questions.length}</span>
              <span className="text-muted-foreground">Score: {score}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {!completed ? (
            <>
              <Card>
                <CardContent className="pt-6">
                  <p className="font-medium text-lg mb-4">
                    {currentQuestion.question}
                  </p>

                  <div className="space-y-2">
                    {currentQuestion.options.map((option, index) => {
                      const isSelected = selectedAnswer === index;
                      const isCorrect = index === currentQuestion.correct;
                      
                      let className = "w-full justify-start text-left h-auto py-3 px-4";
                      
                      if (showResult) {
                        if (isCorrect) {
                          className += " bg-green-500/10 border-green-500 text-green-700";
                        } else if (isSelected && !isCorrect) {
                          className += " bg-red-500/10 border-red-500 text-red-700";
                        }
                      } else if (isSelected) {
                        className += " border-primary";
                      }

                      return (
                        <Button
                          key={index}
                          variant="outline"
                          className={className}
                          onClick={() => handleAnswer(index)}
                          disabled={showResult}
                        >
                          <span className="flex items-center gap-2">
                            {showResult && isCorrect && (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            )}
                            {showResult && isSelected && !isCorrect && (
                              <XCircle className="w-4 h-4 text-red-500" />
                            )}
                            {option}
                          </span>
                        </Button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {showResult && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    {currentQuestion.explanation}
                  </p>
                </div>
              )}

              {showResult && (
                <Button className="w-full" onClick={handleNext}>
                  {currentIndex < questions.length - 1 ? (
                    <>
                      Next Question
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  ) : (
                    "See Results"
                  )}
                </Button>
              )}
            </>
          ) : (
            <div className="text-center space-y-4">
              <div className="text-6xl font-bold text-primary">
                {score}/{questions.length}
              </div>
              <p className="text-lg">
                {score === 5 ? "Perfect score! Amazing!" : 
                 score >= 3 ? "Great job! Keep learning!" : 
                 "Good try! Every question teaches something."}
              </p>
              <Badge className="text-lg px-4 py-2">
                +{quest?.points} points
              </Badge>

              <Button 
                className="w-full mt-4" 
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Claiming...
                  </>
                ) : (
                  "Claim Points"
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
