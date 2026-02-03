import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/authContext";
import { useProfile, AgeRange, StartMode, Interest, INTEREST_OPTIONS, OnboardingStep } from "@/lib/useProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { 
  Leaf, User, Users, ArrowRight, Loader2, Check, 
  MapPin, Bell, TreePine, Zap, Bike, Recycle, Heart, Sparkles
} from "lucide-react";
import heroImage from "@assets/generated_images/minimalist_dark_green_and_neon_abstract_topography.png";

const AGE_RANGES: AgeRange[] = ['12 - 15', '16 - 20', '21 - 28', '29 - 35', '36 or older'];

const AVATARS = [
  { key: 'leaf', icon: Leaf, color: 'bg-green-500' },
  { key: 'tree', icon: TreePine, color: 'bg-emerald-600' },
  { key: 'zap', icon: Zap, color: 'bg-yellow-500' },
  { key: 'bike', icon: Bike, color: 'bg-blue-500' },
  { key: 'recycle', icon: Recycle, color: 'bg-teal-500' },
  { key: 'heart', icon: Heart, color: 'bg-pink-500' },
  { key: 'sparkles', icon: Sparkles, color: 'bg-purple-500' },
  { key: 'user', icon: User, color: 'bg-gray-500' },
];

const INTEREST_ICONS: Record<Interest, typeof Leaf> = {
  'Nature & Outdoors': TreePine,
  'Energy Saver': Zap,
  'Movement & Transport': Bike,
  'Waste & Recycling': Recycle,
  'Community & Action': Users,
  'Mindful Living': Heart,
};

const STEP_ORDER: OnboardingStep[] = ['welcome', 'profile', 'mode', 'interests', 'permissions', 'complete'];

export default function OnboardingPage() {
  const { user, initialized } = useAuth();
  const { profile, loading: profileLoading, updateProfile } = useProfile();
  const [, setLocation] = useLocation();
  
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  
  const [formData, setFormData] = useState({
    display_name: '',
    avatar_key: 'leaf',
    age_range: '' as AgeRange | '',
    start_mode: '' as StartMode | '',
    interests: [] as Interest[],
    allow_location: false,
    enable_notifications: false,
  });

  useEffect(() => {
    if (initialized && !user) {
      setLocation('/auth');
    }
  }, [initialized, user, setLocation]);

  // Only run on initial profile load, not on every update
  useEffect(() => {
    if (profile && !initialLoadDone) {
      if (profile.onboarding_complete) {
        setLocation('/');
        return;
      }
      
      const savedStep = profile.onboarding_step || 'welcome';
      if (STEP_ORDER.includes(savedStep)) {
        setCurrentStep(savedStep);
      }
      
      setFormData(prev => ({
        ...prev,
        display_name: profile.display_name || prev.display_name,
        avatar_key: profile.avatar_key || prev.avatar_key,
        age_range: profile.age_range || prev.age_range,
        start_mode: profile.start_mode || prev.start_mode,
        interests: profile.interests || prev.interests,
        allow_location: profile.allow_location || prev.allow_location,
        enable_notifications: profile.enable_notifications || prev.enable_notifications,
      }));
      
      setInitialLoadDone(true);
    }
  }, [profile, initialLoadDone, setLocation]);
  
  // Handle redirect if onboarding completed (can happen after initial load)
  useEffect(() => {
    if (profile?.onboarding_complete && initialLoadDone) {
      setLocation('/');
    }
  }, [profile?.onboarding_complete, initialLoadDone, setLocation]);

  const stepIndex = STEP_ORDER.indexOf(currentStep);
  const totalSteps = STEP_ORDER.length - 1;
  const progress = ((stepIndex) / totalSteps) * 100;

  const saveAndNext = async (nextStep: OnboardingStep, updates: Record<string, unknown> = {}) => {
    setSaving(true);
    setError(null);
    
    const { error } = await updateProfile({
      ...updates,
      onboarding_step: nextStep,
    } as never);
    
    if (error) {
      setError(error);
      setSaving(false);
      return;
    }
    
    setSaving(false);
    setCurrentStep(nextStep);
  };

  const completeOnboarding = async () => {
    setSaving(true);
    setError(null);
    
    const { error } = await updateProfile({
      allow_location: formData.allow_location,
      enable_notifications: formData.enable_notifications,
      onboarding_step: 'complete',
      onboarding_complete: true,
    });
    
    if (error) {
      setError(error);
      setSaving(false);
      return;
    }
    
    setLocation('/');
  };

  const handleLocationToggle = async (enabled: boolean) => {
    if (enabled) {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        if (result.state === 'denied') {
          setFormData(prev => ({ ...prev, allow_location: false }));
          return;
        }
        navigator.geolocation.getCurrentPosition(
          () => setFormData(prev => ({ ...prev, allow_location: true })),
          () => setFormData(prev => ({ ...prev, allow_location: false }))
        );
      } catch {
        setFormData(prev => ({ ...prev, allow_location: false }));
      }
    } else {
      setFormData(prev => ({ ...prev, allow_location: false }));
    }
  };

  const handleNotificationToggle = async (enabled: boolean) => {
    if (enabled) {
      try {
        const permission = await Notification.requestPermission();
        setFormData(prev => ({ ...prev, enable_notifications: permission === 'granted' }));
      } catch {
        setFormData(prev => ({ ...prev, enable_notifications: false }));
      }
    } else {
      setFormData(prev => ({ ...prev, enable_notifications: false }));
    }
  };

  const toggleInterest = (interest: Interest) => {
    setFormData(prev => {
      const current = prev.interests;
      if (current.includes(interest)) {
        return { ...prev, interests: current.filter(i => i !== interest) };
      }
      if (current.length >= 3) return prev;
      return { ...prev, interests: [...current, interest] };
    });
  };

  if (!initialized || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background relative overflow-hidden">
      <div 
        className="absolute inset-0 opacity-20 z-0"
        style={{ 
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-background/70 z-0" />
      
      <div className="w-full max-w-md space-y-6 relative z-10">
        {currentStep !== 'welcome' && currentStep !== 'complete' && (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-right text-xs text-muted-foreground">
              Step {stepIndex} of {totalSteps}
            </p>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {currentStep === 'welcome' && (
          <Card className="glass-card border-white/[0.08] overflow-hidden">
            <div className="absolute inset-0 hero-gradient pointer-events-none" />
            <CardHeader className="text-center pb-4 relative">
              <div className="w-24 h-24 bg-gradient-to-br from-primary to-emerald-400 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_60px_rgba(34,197,94,0.4)] rotate-3 hover:rotate-0 transition-transform duration-500">
                <Leaf className="w-12 h-12 text-primary-foreground" />
              </div>
              <CardTitle className="text-4xl font-display">
                <span className="gradient-text">Play for Planet Earth</span>
              </CardTitle>
              <CardDescription className="text-base mt-4 leading-relaxed">
                Turn everyday eco-actions into verified impact. Connect your fitness apps, 
                join challenges, and help make a difference.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-center relative">
              <div className="flex items-center justify-center gap-3 text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <p className="text-sm">Earn points for sustainable choices</p>
              </div>
              <div className="flex items-center justify-center gap-3 text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-cyan-500" />
                <p className="text-sm">Track your real environmental impact</p>
              </div>
              <div className="flex items-center justify-center gap-3 text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <p className="text-sm">Join a global community of changemakers</p>
              </div>
            </CardContent>
            <CardFooter className="relative">
              <Button 
                className="w-full btn-premium text-lg py-7 rounded-xl" 
                onClick={() => saveAndNext('profile')}
                disabled={saving}
                data-testid="button-welcome-continue"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                Get Started <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {currentStep === 'profile' && (
          <Card className="glass-card border-white/[0.08]">
            <CardHeader>
              <CardTitle className="text-2xl gradient-text">Create Your Profile</CardTitle>
              <CardDescription>Tell us a bit about yourself</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Choose an Avatar</Label>
                <div className="grid grid-cols-4 gap-4">
                  {AVATARS.map(({ key, icon: Icon, color }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, avatar_key: key }))}
                      className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${color} shadow-lg ${
                        formData.avatar_key === key 
                          ? 'ring-4 ring-primary ring-offset-2 ring-offset-background scale-110 neon-glow' 
                          : 'opacity-60 hover:opacity-100 hover:scale-105'
                      }`}
                      data-testid={`avatar-${key}`}
                    >
                      <Icon className="w-8 h-8 text-white" />
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="display_name">Display Name *</Label>
                <Input 
                  id="display_name" 
                  value={formData.display_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                  placeholder="EcoWarrior"
                  className="bg-background/50"
                  data-testid="input-display-name"
                />
              </div>
              
              <div className="space-y-3">
                <Label>Age Range *</Label>
                <div className="grid grid-cols-1 gap-2">
                  {AGE_RANGES.map((age) => (
                    <button
                      key={age}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, age_range: age }))}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        formData.age_range === age 
                          ? 'border-primary bg-primary/10 text-primary' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      data-testid={`age-${age}`}
                    >
                      {age}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={() => saveAndNext('mode', {
                  display_name: formData.display_name,
                  avatar_key: formData.avatar_key,
                  age_range: formData.age_range,
                })}
                disabled={saving || !formData.display_name || !formData.age_range}
                data-testid="button-profile-continue"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Continue <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {currentStep === 'mode' && (
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>How will you play?</CardTitle>
              <CardDescription>Choose your journey</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, start_mode: 'individual' }))}
                className={`w-full p-6 rounded-xl border-2 text-left transition-all flex items-start gap-4 ${
                  formData.start_mode === 'individual' 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border hover:border-primary/50'
                }`}
                data-testid="mode-individual"
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  formData.start_mode === 'individual' ? 'bg-primary' : 'bg-muted'
                }`}>
                  <User className={`w-6 h-6 ${
                    formData.start_mode === 'individual' ? 'text-primary-foreground' : 'text-muted-foreground'
                  }`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">Play as an Individual</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Track your personal eco-actions and compete on the global leaderboard
                  </p>
                </div>
                {formData.start_mode === 'individual' && (
                  <Check className="w-6 h-6 text-primary flex-shrink-0" />
                )}
              </button>
              
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, start_mode: 'group' }))}
                className={`w-full p-6 rounded-xl border-2 text-left transition-all flex items-start gap-4 ${
                  formData.start_mode === 'group' 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border hover:border-primary/50'
                }`}
                data-testid="mode-group"
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  formData.start_mode === 'group' ? 'bg-primary' : 'bg-muted'
                }`}>
                  <Users className={`w-6 h-6 ${
                    formData.start_mode === 'group' ? 'text-primary-foreground' : 'text-muted-foreground'
                  }`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">Join a Group</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Team up with friends, school, or organization
                  </p>
                </div>
                {formData.start_mode === 'group' && (
                  <Check className="w-6 h-6 text-primary flex-shrink-0" />
                )}
              </button>
              
              {formData.start_mode === 'group' && (
                <Alert className="bg-amber-500/10 border-amber-500/20">
                  <AlertDescription className="text-amber-200">
                    Group features are coming soon! We'll save your preference and notify you when available.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep('profile')}
                className="flex-1"
              >
                Back
              </Button>
              <Button 
                className="flex-1" 
                onClick={() => saveAndNext('interests', { start_mode: formData.start_mode })}
                disabled={saving || !formData.start_mode}
                data-testid="button-mode-continue"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Continue <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {currentStep === 'interests' && (
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>What interests you?</CardTitle>
              <CardDescription>Choose up to 3 topics (required)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {INTEREST_OPTIONS.map((interest) => {
                  const Icon = INTEREST_ICONS[interest];
                  const isSelected = formData.interests.includes(interest);
                  const isDisabled = !isSelected && formData.interests.length >= 3;
                  
                  return (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      disabled={isDisabled}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        isSelected 
                          ? 'border-primary bg-primary/10' 
                          : isDisabled
                          ? 'border-border/50 opacity-50 cursor-not-allowed'
                          : 'border-border hover:border-primary/50'
                      }`}
                      data-testid={`interest-${interest.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <Icon className={`w-6 h-6 mb-2 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                      <p className="text-sm font-medium">{interest}</p>
                    </button>
                  );
                })}
              </div>
              
              <p className="text-sm text-muted-foreground text-center">
                {formData.interests.length}/3 selected
              </p>
            </CardContent>
            <CardFooter className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep('mode')}
                className="flex-1"
              >
                Back
              </Button>
              <Button 
                className="flex-1" 
                onClick={() => saveAndNext('permissions', { interests: formData.interests })}
                disabled={saving || formData.interests.length === 0}
                data-testid="button-interests-continue"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Continue <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {currentStep === 'permissions' && (
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Permissions</CardTitle>
              <CardDescription>These help personalize your experience (optional)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium">Location</p>
                    <p className="text-xs text-muted-foreground">For local challenges & events</p>
                  </div>
                </div>
                <Switch
                  checked={formData.allow_location}
                  onCheckedChange={handleLocationToggle}
                  data-testid="switch-location"
                />
              </div>
              
              <div className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="font-medium">Notifications</p>
                    <p className="text-xs text-muted-foreground">Quest reminders & updates</p>
                  </div>
                </div>
                <Switch
                  checked={formData.enable_notifications}
                  onCheckedChange={handleNotificationToggle}
                  data-testid="switch-notifications"
                />
              </div>
            </CardContent>
            <CardFooter className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep('interests')}
                className="flex-1"
              >
                Back
              </Button>
              <Button 
                className="flex-1" 
                onClick={completeOnboarding}
                disabled={saving}
                data-testid="button-permissions-continue"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Enter App <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}
