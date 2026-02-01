import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/authContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Dumbbell, 
  Plus, 
  Clock, 
  Flame, 
  Target, 
  Play, 
  Trash2, 
  Edit, 
  Calendar,
  TrendingUp,
  Timer,
  Zap,
  Activity,
  ChevronRight,
  Loader2,
  CheckCircle2,
  X
} from "lucide-react";

interface WorkoutExercise {
  id?: string;
  name: string;
  exerciseType: 'cardio' | 'strength' | 'flexibility' | 'balance' | 'hiit';
  sets: number;
  reps?: number;
  durationMinutes?: number;
  restSeconds: number;
  notes?: string;
}

interface WorkoutPlan {
  id: string;
  name: string;
  description?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  target_days_per_week: number;
  is_active: boolean;
  workout_exercises: WorkoutExercise[];
  created_at: string;
}

interface WorkoutSession {
  id: string;
  plan_id?: string;
  name: string;
  duration_minutes: number;
  calories_burned?: number;
  notes?: string;
  completed_at: string;
  exercise_logs: any[];
}

interface WorkoutStats {
  totalSessions: number;
  totalMinutes: number;
  totalCalories: number;
  sessionsThisWeek: number;
  activePlans: number;
}

const EXERCISE_TYPES = [
  { value: 'strength', label: 'Strength', icon: Dumbbell },
  { value: 'cardio', label: 'Cardio', icon: Activity },
  { value: 'hiit', label: 'HIIT', icon: Zap },
  { value: 'flexibility', label: 'Flexibility', icon: Target },
  { value: 'balance', label: 'Balance', icon: TrendingUp },
];

const DIFFICULTY_COLORS = {
  beginner: 'bg-green-500/20 text-green-400 border-green-500/30',
  intermediate: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  advanced: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export default function WorkoutsPage() {
  const { user: authUser, initialized, session } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [stats, setStats] = useState<WorkoutStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("plans");
  
  // Create plan dialog
  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [planName, setPlanName] = useState("");
  const [planDescription, setPlanDescription] = useState("");
  const [planDifficulty, setPlanDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>("beginner");
  const [planDaysPerWeek, setPlanDaysPerWeek] = useState(3);
  const [planExercises, setPlanExercises] = useState<WorkoutExercise[]>([]);
  const [creatingPlan, setCreatingPlan] = useState(false);
  
  // Log workout dialog
  const [showLogWorkout, setShowLogWorkout] = useState(false);
  const [workoutName, setWorkoutName] = useState("");
  const [workoutDuration, setWorkoutDuration] = useState(30);
  const [workoutCalories, setWorkoutCalories] = useState<number | undefined>();
  const [workoutNotes, setWorkoutNotes] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState<string | undefined>();
  const [loggingWorkout, setLoggingWorkout] = useState(false);

  useEffect(() => {
    if (initialized && !authUser) {
      setLocation("/auth");
    }
  }, [authUser, initialized, setLocation]);

  useEffect(() => {
    async function fetchData() {
      if (!session?.access_token) {
        setLoading(false);
        return;
      }
      
      try {
        const headers = { 'Authorization': `Bearer ${session.access_token}` };
        
        const [plansRes, sessionsRes, statsRes] = await Promise.all([
          fetch('/api/workouts/plans', { headers }),
          fetch('/api/workouts/sessions', { headers }),
          fetch('/api/workouts/stats', { headers }),
        ]);
        
        if (plansRes.ok) {
          const plansData = await plansRes.json();
          setPlans(plansData);
        }
        
        if (sessionsRes.ok) {
          const sessionsData = await sessionsRes.json();
          setSessions(sessionsData);
        }
        
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }
      } catch (err) {
        console.error('Failed to fetch workout data:', err);
      } finally {
        setLoading(false);
      }
    }
    
    if (initialized && authUser) {
      fetchData();
    }
  }, [initialized, authUser, session?.access_token]);

  const handleAddExercise = () => {
    setPlanExercises([...planExercises, {
      name: "",
      exerciseType: "strength",
      sets: 3,
      reps: 10,
      restSeconds: 60,
    }]);
  };

  const handleRemoveExercise = (index: number) => {
    setPlanExercises(planExercises.filter((_, i) => i !== index));
  };

  const handleExerciseChange = (index: number, field: keyof WorkoutExercise, value: any) => {
    const updated = [...planExercises];
    updated[index] = { ...updated[index], [field]: value };
    setPlanExercises(updated);
  };

  const handleCreatePlan = async () => {
    if (!planName.trim()) {
      toast({ title: "Error", description: "Please enter a plan name", variant: "destructive" });
      return;
    }

    if (planExercises.length === 0) {
      toast({ title: "Error", description: "Please add at least one exercise", variant: "destructive" });
      return;
    }

    const validExercises = planExercises.filter(e => e.name.trim());
    if (validExercises.length === 0) {
      toast({ title: "Error", description: "Please enter exercise names", variant: "destructive" });
      return;
    }

    setCreatingPlan(true);
    try {
      const res = await fetch('/api/workouts/plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          name: planName,
          description: planDescription,
          difficulty: planDifficulty,
          targetDaysPerWeek: planDaysPerWeek,
          exercises: validExercises,
        }),
      });

      if (res.ok) {
        const newPlan = await res.json();
        setPlans([newPlan, ...plans]);
        setShowCreatePlan(false);
        resetPlanForm();
        toast({ title: "Success", description: "Workout plan created!" });
      } else {
        const error = await res.json();
        toast({ title: "Error", description: error.error || "Failed to create plan", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to create plan", variant: "destructive" });
    } finally {
      setCreatingPlan(false);
    }
  };

  const handleLogWorkout = async () => {
    if (!workoutName.trim()) {
      toast({ title: "Error", description: "Please enter a workout name", variant: "destructive" });
      return;
    }

    setLoggingWorkout(true);
    try {
      const res = await fetch('/api/workouts/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          planId: selectedPlanId || null,
          name: workoutName,
          durationMinutes: workoutDuration,
          caloriesBurned: workoutCalories,
          notes: workoutNotes,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        setSessions([result.session, ...sessions]);
        if (stats) {
          setStats({
            ...stats,
            totalSessions: stats.totalSessions + 1,
            totalMinutes: stats.totalMinutes + workoutDuration,
            totalCalories: stats.totalCalories + (workoutCalories || 0),
            sessionsThisWeek: stats.sessionsThisWeek + 1,
          });
        }
        setShowLogWorkout(false);
        resetWorkoutForm();
        toast({ 
          title: "Workout Logged!", 
          description: `You earned ${result.pointsEarned} points for completing your workout!` 
        });
      } else {
        const error = await res.json();
        toast({ title: "Error", description: error.error || "Failed to log workout", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to log workout", variant: "destructive" });
    } finally {
      setLoggingWorkout(false);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    try {
      const res = await fetch(`/api/workouts/plans/${planId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session?.access_token}` },
      });

      if (res.ok) {
        setPlans(plans.filter(p => p.id !== planId));
        toast({ title: "Deleted", description: "Workout plan removed" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to delete plan", variant: "destructive" });
    }
  };

  const resetPlanForm = () => {
    setPlanName("");
    setPlanDescription("");
    setPlanDifficulty("beginner");
    setPlanDaysPerWeek(3);
    setPlanExercises([]);
  };

  const resetWorkoutForm = () => {
    setWorkoutName("");
    setWorkoutDuration(30);
    setWorkoutCalories(undefined);
    setWorkoutNotes("");
    setSelectedPlanId(undefined);
  };

  if (!initialized || !authUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 md:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Dumbbell className="w-7 h-7 text-primary" />
            Workout Planner
          </h1>
          <p className="text-muted-foreground mt-1">Create routines and track your fitness journey</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showLogWorkout} onOpenChange={setShowLogWorkout}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-log-workout">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Log Workout
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Log Completed Workout</DialogTitle>
                <DialogDescription>Record a workout session you've completed</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Workout Name</Label>
                  <Input 
                    placeholder="e.g., Morning Run, Leg Day" 
                    value={workoutName}
                    onChange={(e) => setWorkoutName(e.target.value)}
                    data-testid="input-workout-name"
                  />
                </div>
                {plans.length > 0 && (
                  <div className="space-y-2">
                    <Label>From Plan (optional)</Label>
                    <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a plan" />
                      </SelectTrigger>
                      <SelectContent>
                        {plans.map((plan) => (
                          <SelectItem key={plan.id} value={plan.id}>{plan.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Duration (min)</Label>
                    <Input 
                      type="number" 
                      min={1}
                      value={workoutDuration}
                      onChange={(e) => setWorkoutDuration(parseInt(e.target.value) || 1)}
                      data-testid="input-workout-duration"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Calories (optional)</Label>
                    <Input 
                      type="number" 
                      min={0}
                      placeholder="0"
                      value={workoutCalories || ""}
                      onChange={(e) => setWorkoutCalories(e.target.value ? parseInt(e.target.value) : undefined)}
                      data-testid="input-workout-calories"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notes (optional)</Label>
                  <Textarea 
                    placeholder="How did it go?"
                    value={workoutNotes}
                    onChange={(e) => setWorkoutNotes(e.target.value)}
                    data-testid="input-workout-notes"
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleLogWorkout} disabled={loggingWorkout} data-testid="button-submit-workout">
                  {loggingWorkout ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                  Log Workout
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Dialog open={showCreatePlan} onOpenChange={setShowCreatePlan}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-plan">
                <Plus className="w-4 h-4 mr-2" />
                Create Plan
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Workout Plan</DialogTitle>
                <DialogDescription>Design a personalized workout routine</DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Plan Name *</Label>
                    <Input 
                      placeholder="e.g., Full Body Strength" 
                      value={planName}
                      onChange={(e) => setPlanName(e.target.value)}
                      data-testid="input-plan-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Difficulty</Label>
                    <Select value={planDifficulty} onValueChange={(v: any) => setPlanDifficulty(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Description (optional)</Label>
                  <Textarea 
                    placeholder="What's the goal of this plan?"
                    value={planDescription}
                    onChange={(e) => setPlanDescription(e.target.value)}
                    data-testid="input-plan-description"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Target Days Per Week</Label>
                  <Select value={planDaysPerWeek.toString()} onValueChange={(v) => setPlanDaysPerWeek(parseInt(v))}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                        <SelectItem key={d} value={d.toString()}>{d} {d === 1 ? 'day' : 'days'}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Exercises</Label>
                    <Button type="button" variant="outline" size="sm" onClick={handleAddExercise} data-testid="button-add-exercise">
                      <Plus className="w-4 h-4 mr-1" /> Add Exercise
                    </Button>
                  </div>
                  
                  {planExercises.length === 0 ? (
                    <div className="text-center py-8 border border-dashed rounded-lg">
                      <Dumbbell className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                      <p className="text-muted-foreground text-sm">No exercises added yet</p>
                      <Button type="button" variant="ghost" size="sm" onClick={handleAddExercise} className="mt-2">
                        <Plus className="w-4 h-4 mr-1" /> Add your first exercise
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {planExercises.map((exercise, index) => (
                        <div key={index} className="p-4 border rounded-lg space-y-3 bg-muted/30">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">Exercise {index + 1}</span>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleRemoveExercise(index)}
                              className="h-8 w-8 text-destructive hover:text-destructive"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="col-span-2 space-y-1">
                              <Label className="text-xs">Name</Label>
                              <Input 
                                placeholder="e.g., Squats"
                                value={exercise.name}
                                onChange={(e) => handleExerciseChange(index, 'name', e.target.value)}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Type</Label>
                              <Select 
                                value={exercise.exerciseType} 
                                onValueChange={(v: any) => handleExerciseChange(index, 'exerciseType', v)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {EXERCISE_TYPES.map((t) => (
                                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Sets</Label>
                              <Input 
                                type="number" 
                                min={1}
                                value={exercise.sets}
                                onChange={(e) => handleExerciseChange(index, 'sets', parseInt(e.target.value) || 1)}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs">Reps</Label>
                              <Input 
                                type="number" 
                                min={1}
                                placeholder="10"
                                value={exercise.reps || ""}
                                onChange={(e) => handleExerciseChange(index, 'reps', e.target.value ? parseInt(e.target.value) : undefined)}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Duration (min)</Label>
                              <Input 
                                type="number" 
                                min={1}
                                placeholder="—"
                                value={exercise.durationMinutes || ""}
                                onChange={(e) => handleExerciseChange(index, 'durationMinutes', e.target.value ? parseInt(e.target.value) : undefined)}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Rest (sec)</Label>
                              <Input 
                                type="number" 
                                min={0}
                                value={exercise.restSeconds}
                                onChange={(e) => handleExerciseChange(index, 'restSeconds', parseInt(e.target.value) || 0)}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleCreatePlan} disabled={creatingPlan} data-testid="button-submit-plan">
                  {creatingPlan ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                  Create Plan
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/20">
                  <Target className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalSessions}</p>
                  <p className="text-xs text-muted-foreground">Total Workouts</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-500/20">
                  <Clock className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{Math.round(stats.totalMinutes / 60)}</p>
                  <p className="text-xs text-muted-foreground">Hours Trained</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-orange-500/20">
                  <Flame className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalCalories.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Calories Burned</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-500/20">
                  <Calendar className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.sessionsThisWeek}</p>
                  <p className="text-xs text-muted-foreground">This Week</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="plans" data-testid="tab-plans">My Plans</TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-history">Workout History</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : plans.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="py-12 text-center">
                <Dumbbell className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
                <h3 className="font-semibold text-lg mb-2">No workout plans yet</h3>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-4">
                  Create your first personalized workout plan to start tracking your fitness journey.
                </p>
                <Button onClick={() => setShowCreatePlan(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Plan
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plans.map((plan) => (
                <Card key={plan.id} className="glass-card hover:border-primary/50 transition-colors" data-testid={`card-plan-${plan.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{plan.name}</CardTitle>
                        {plan.description && (
                          <CardDescription className="mt-1">{plan.description}</CardDescription>
                        )}
                      </div>
                      <Badge className={DIFFICULTY_COLORS[plan.difficulty]}>
                        {plan.difficulty}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-1">
                        <Dumbbell className="w-4 h-4" />
                        {plan.workout_exercises?.length || 0} exercises
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {plan.target_days_per_week}x/week
                      </span>
                    </div>
                    
                    {plan.workout_exercises && plan.workout_exercises.length > 0 && (
                      <div className="space-y-2 mb-4">
                        {plan.workout_exercises.slice(0, 3).map((ex, i) => (
                          <div key={i} className="flex items-center justify-between text-sm p-2 rounded bg-muted/50">
                            <span>{ex.name || 'Unnamed exercise'}</span>
                            <span className="text-muted-foreground">
                              {ex.sets} sets {ex.reps ? `× ${ex.reps}` : ''}
                            </span>
                          </div>
                        ))}
                        {plan.workout_exercises.length > 3 && (
                          <p className="text-xs text-muted-foreground text-center">
                            +{plan.workout_exercises.length - 3} more exercises
                          </p>
                        )}
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="default" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => {
                          setSelectedPlanId(plan.id);
                          setWorkoutName(plan.name);
                          setShowLogWorkout(true);
                        }}
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Start
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeletePlan(plan.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : sessions.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="py-12 text-center">
                <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
                <h3 className="font-semibold text-lg mb-2">No workouts logged yet</h3>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-4">
                  Start logging your workouts to track your progress over time.
                </p>
                <Button onClick={() => setShowLogWorkout(true)}>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Log Your First Workout
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <Card key={session.id} className="glass-card" data-testid={`card-session-${session.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-primary/20">
                          <CheckCircle2 className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{session.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {new Date(session.completed_at).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          {session.duration_minutes} min
                        </span>
                        {session.calories_burned && (
                          <span className="flex items-center gap-1 text-orange-400">
                            <Flame className="w-4 h-4" />
                            {session.calories_burned}
                          </span>
                        )}
                      </div>
                    </div>
                    {session.notes && (
                      <p className="text-sm text-muted-foreground mt-3 pl-12">{session.notes}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
