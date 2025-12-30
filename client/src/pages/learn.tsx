import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { BookOpen, HelpCircle, CheckCircle } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const LESSONS = [
  {
    id: 1,
    title: "The Plastic Problem",
    category: "Waste",
    duration: "2 min",
    points: 50,
    content: "Plastic pollution is a global issue. Every piece of plastic ever made still exists...",
    quiz: {
      question: "How long does it take for a plastic bottle to decompose?",
      options: ["10 years", "50 years", "450 years", "It never decomposes"],
      answer: "450 years"
    }
  },
  {
    id: 2,
    title: "Energy Vampires",
    category: "Energy",
    duration: "3 min",
    points: 50,
    content: "Did you know appliances use energy even when turned off? This is called 'phantom load'...",
    quiz: {
      question: "What is 'phantom load'?",
      options: ["A ghost in the machine", "Energy used when off", "A type of battery", "Solar power"],
      answer: "Energy used when off"
    }
  },
  {
    id: 3,
    title: "Sustainable Diet",
    category: "Food",
    duration: "5 min",
    points: 100,
    content: "Eating less meat is one of the most impactful ways to reduce your carbon footprint...",
    quiz: {
      question: "Which food has the highest carbon footprint?",
      options: ["Chicken", "Beef", "Tofu", "Lentils"],
      answer: "Beef"
    }
  },
];

export default function LearnPage() {
  const { toast } = useToast();
  const [selectedAnswer, setSelectedAnswer] = useState("");

  const handleQuizSubmit = (lesson: any) => {
    if (selectedAnswer === lesson.quiz.answer) {
      toast({
        title: "Correct!",
        description: `You earned ${lesson.points} XP!`,
      });
    } else {
      toast({
        title: "Not quite",
        description: "Try again!",
        variant: "destructive"
      });
    }
    setSelectedAnswer("");
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-display tracking-tight">Learn</h1>
        <p className="text-muted-foreground">Short lessons to help you understand your impact.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {LESSONS.map((lesson) => (
          <Card key={lesson.id} className="group hover:shadow-lg hover:shadow-primary/5 transition-all">
            <CardHeader>
              <div className="flex justify-between items-start mb-2">
                <Badge variant="outline">{lesson.category}</Badge>
                <Badge className="bg-primary/20 text-primary border-none hover:bg-primary/30">
                  +{lesson.points} XP
                </Badge>
              </div>
              <CardTitle className="text-xl">{lesson.title}</CardTitle>
              <CardDescription className="flex items-center gap-1">
                <BookOpen className="w-3 h-3" /> {lesson.duration} read
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                {lesson.content}
              </p>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full group-hover:bg-primary group-hover:text-primary-foreground" variant="outline">
                    Start Lesson
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>{lesson.title}</DialogTitle>
                    <DialogDescription>Read the lesson and take the quiz.</DialogDescription>
                  </DialogHeader>
                  
                  <div className="py-4 space-y-6">
                    <div className="p-4 bg-muted/50 rounded-lg text-sm leading-relaxed">
                      {lesson.content}
                      <br /><br />
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                    </div>

                    <div className="space-y-4 border-t border-border pt-4">
                      <div className="flex items-center gap-2 font-semibold">
                        <HelpCircle className="w-5 h-5 text-primary" />
                        Quiz Time
                      </div>
                      <p className="text-sm">{lesson.quiz.question}</p>
                      <RadioGroup onValueChange={setSelectedAnswer} className="space-y-2">
                        {lesson.quiz.options.map((opt: string) => (
                          <div key={opt} className="flex items-center space-x-2 p-2 rounded hover:bg-muted/50 transition-colors">
                            <RadioGroupItem value={opt} id={opt} />
                            <Label htmlFor={opt} className="cursor-pointer w-full">{opt}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button onClick={() => handleQuizSubmit(lesson)} disabled={!selectedAnswer}>
                      Submit Answer
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
