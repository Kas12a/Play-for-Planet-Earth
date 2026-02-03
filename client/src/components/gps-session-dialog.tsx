import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Square, Clock, MapPin, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Quest } from "@/lib/store";

interface GpsSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quest: Quest | null;
  accessToken?: string;
  onSuccess?: () => void;
}

interface GpsPosition {
  lat: number;
  lng: number;
  timestamp: number;
}

export function GpsSessionDialog({ 
  open, 
  onOpenChange, 
  quest, 
  accessToken,
  onSuccess 
}: GpsSessionDialogProps) {
  const { toast } = useToast();
  const [isActive, setIsActive] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [distance, setDistance] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [positions, setPositions] = useState<GpsPosition[]>([]);
  const [gpsError, setGpsError] = useState<string | null>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Get minimum duration based on quest
  const getMinDuration = (): number => {
    if (!quest) return 600; // 10 min default
    if (quest.id === 'pilot_walk_instead') return 720; // 12 min
    if (quest.id === 'pilot_green_time') return 900; // 15 min
    if (quest.id === 'pilot_cycle_session') return 1200; // 20 min
    return 600;
  };

  const minDuration = getMinDuration();
  const progress = Math.min(100, (elapsed / minDuration) * 100);
  const isComplete = elapsed >= minDuration;

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (pos1: GpsPosition, pos2: GpsPosition): number => {
    const R = 6371000; // Earth's radius in meters
    const lat1 = pos1.lat * Math.PI / 180;
    const lat2 = pos2.lat * Math.PI / 180;
    const dLat = (pos2.lat - pos1.lat) * Math.PI / 180;
    const dLng = (pos2.lng - pos1.lng) * Math.PI / 180;

    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const startSession = () => {
    setGpsError(null);
    
    if (!navigator.geolocation) {
      setGpsError("GPS is not supported on this device");
      return;
    }

    startTimeRef.current = Date.now();
    setIsActive(true);
    setElapsed(0);
    setDistance(0);
    setPositions([]);

    // Start timer
    intervalRef.current = setInterval(() => {
      if (startTimeRef.current) {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }
    }, 1000);

    // Start GPS tracking
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const newPos: GpsPosition = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: position.timestamp,
        };
        
        setPositions(prev => {
          const updated = [...prev, newPos];
          // Calculate total distance
          if (updated.length > 1) {
            let totalDist = 0;
            for (let i = 1; i < updated.length; i++) {
              totalDist += calculateDistance(updated[i-1], updated[i]);
            }
            setDistance(totalDist);
          }
          return updated;
        });
      },
      (error) => {
        console.error("GPS error:", error);
        setGpsError("Unable to get location. Please enable GPS.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const stopSession = () => {
    setIsActive(false);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  const handleSubmit = async () => {
    if (!quest || !accessToken || elapsed < minDuration) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/quests/${quest.id}/gps-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          duration_sec: elapsed,
          distance_m: Math.round(distance),
          start_time: startTimeRef.current ? new Date(startTimeRef.current).toISOString() : null,
          end_time: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to submit session");
      }

      toast({
        title: "Session complete!",
        description: `Great job! You earned ${quest.points} points.`,
      });

      onSuccess?.();
      onOpenChange(false);
      
      // Reset state
      setElapsed(0);
      setDistance(0);
      setPositions([]);
    } catch (error: any) {
      toast({
        title: "Failed to submit",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  // Reset on close
  useEffect(() => {
    if (!open) {
      stopSession();
      setElapsed(0);
      setDistance(0);
      setPositions([]);
      setGpsError(null);
    }
  }, [open]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(2)} km`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>GPS Session</DialogTitle>
          <DialogDescription>
            {quest?.proof_instructions}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {gpsError && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{gpsError}</span>
            </div>
          )}

          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="text-5xl font-mono font-bold">
                  {formatTime(elapsed)}
                </div>
                
                <div className="flex justify-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {formatDistance(distance)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Min: {formatTime(minDuration)}
                  </div>
                </div>

                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${isComplete ? 'bg-green-500' : 'bg-primary'}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {isComplete && (
                  <Badge className="bg-green-500 text-white gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Minimum duration reached!
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            {!isActive ? (
              <Button 
                className="flex-1" 
                onClick={startSession}
                disabled={isComplete}
              >
                <Play className="w-4 h-4 mr-2" />
                Start Session
              </Button>
            ) : (
              <Button 
                className="flex-1" 
                variant="destructive"
                onClick={stopSession}
              >
                <Square className="w-4 h-4 mr-2" />
                Stop Session
              </Button>
            )}

            {isComplete && !isActive && (
              <Button 
                className="flex-1" 
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Complete Quest
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
