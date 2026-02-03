import { useState, useEffect } from "react";
import { getTodaysCode, getCodeValidUntil, formatTimeRemaining } from "@shared/todaysCode";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Clock, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface TodaysCodeDisplayProps {
  compact?: boolean;
}

export function TodaysCodeDisplay({ compact = false }: TodaysCodeDisplayProps) {
  const { toast } = useToast();
  const [code, setCode] = useState(getTodaysCode());
  const [timeRemaining, setTimeRemaining] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const expiresAt = getCodeValidUntil();
      setTimeRemaining(formatTimeRemaining(expiresAt));
      setCode(getTodaysCode());
    };

    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    toast({
      title: "Code copied!",
      description: "Today's Code has been copied to clipboard.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-lg border border-primary/20">
        <Shield className="w-4 h-4 text-primary" />
        <span className="font-mono font-bold text-primary">{code}</span>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={handleCopy}
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
        </Button>
      </div>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">Today's Code</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-mono font-bold tracking-wider text-primary">
                {code}
              </span>
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8"
                onClick={handleCopy}
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          <Badge variant="outline" className="gap-1 text-xs">
            <Clock className="w-3 h-3" />
            {timeRemaining} left
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          Include this code in your proof videos/photos to verify authenticity.
        </p>
      </CardContent>
    </Card>
  );
}
