import { useState } from "react";
import { useStore, AgeBand } from "@/lib/store";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Leaf, User, Users, FileText } from "lucide-react";

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const { user, completeOnboarding } = useStore();
  const [, setLocation] = useLocation();

  const [formData, setFormData] = useState({
    name: user?.name || "",
    ageBand: "" as AgeBand,
    parentEmail: "",
    cohortCode: "",
    acceptedTerms: false
  });

  const totalSteps = 3;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      completeOnboarding({
        name: formData.name,
        ageBand: formData.ageBand,
        parentEmail: formData.ageBand === 'Under 16' ? formData.parentEmail : undefined,
        cohortId: formData.cohortCode ? 'custom-cohort' : undefined,
      });
      setLocation("/");
    }
  };

  const isStepValid = () => {
    if (step === 1) return formData.name.length > 0 && formData.ageBand;
    if (step === 2) return formData.ageBand !== 'Under 16' || formData.parentEmail.includes('@');
    if (step === 3) return formData.acceptedTerms;
    return false;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md space-y-8">
        <div className="space-y-2">
          <Progress value={(step / totalSteps) * 100} className="h-2" />
          <p className="text-right text-xs text-muted-foreground">Step {step} of {totalSteps}</p>
        </div>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          {step === 1 && (
            <>
              <CardHeader>
                <CardTitle>Tell us about you</CardTitle>
                <CardDescription>Let's set up your profile.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Display Name</Label>
                  <Input 
                    id="name" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="EcoWarrior123"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Age Group</Label>
                  <RadioGroup 
                    value={formData.ageBand} 
                    onValueChange={(val) => setFormData({...formData, ageBand: val as AgeBand})}
                    className="grid grid-cols-2 gap-4"
                  >
                    {['Under 16', '16-18', '19-30', '31+'].map((age) => (
                      <div key={age}>
                        <RadioGroupItem value={age} id={age} className="peer sr-only" />
                        <Label 
                          htmlFor={age}
                          className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:text-primary cursor-pointer transition-all"
                        >
                          <User className="mb-2 h-6 w-6" />
                          {age}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </CardContent>
            </>
          )}

          {step === 2 && (
            <>
              <CardHeader>
                <CardTitle>Join a Cohort</CardTitle>
                <CardDescription>Are you part of a school or organization?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {formData.ageBand === 'Under 16' && (
                  <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-200 text-sm mb-4">
                    <p className="font-semibold mb-1">Parent Consent Required</p>
                    <p>Since you are under 16, we need a parent or guardian's email to verify your account.</p>
                    <div className="mt-3">
                      <Label htmlFor="parentEmail">Parent/Guardian Email</Label>
                      <Input 
                        id="parentEmail" 
                        type="email"
                        value={formData.parentEmail}
                        onChange={(e) => setFormData({...formData, parentEmail: e.target.value})}
                        placeholder="parent@example.com"
                        className="mt-1"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="cohort">Cohort Code (Optional)</Label>
                  <Input 
                    id="cohort" 
                    value={formData.cohortCode}
                    onChange={(e) => setFormData({...formData, cohortCode: e.target.value})}
                    placeholder="e.g. SCHOOL-2024"
                  />
                  <p className="text-xs text-muted-foreground">If you don't have one, you can skip this.</p>
                </div>
              </CardContent>
            </>
          )}

          {step === 3 && (
            <>
              <CardHeader>
                <CardTitle>Final Steps</CardTitle>
                <CardDescription>Review and agree to our terms.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-md border border-border p-4 h-40 overflow-y-auto text-sm text-muted-foreground bg-background/50">
                  <h4 className="font-semibold mb-2">Terms of Service</h4>
                  <p>Welcome to PfPE. By using this app, you agree to track your eco-actions honestly...</p>
                  <p className="mt-2">Privacy: We collect minimal data to run the game...</p>
                  {/* Truncated for mock */}
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="terms" 
                    checked={formData.acceptedTerms}
                    onCheckedChange={(c) => setFormData({...formData, acceptedTerms: c as boolean})}
                  />
                  <Label htmlFor="terms" className="text-sm font-normal">
                    I agree to the Terms of Service and Privacy Policy
                  </Label>
                </div>
              </CardContent>
            </>
          )}

          <CardFooter className="flex justify-between">
            {step > 1 ? (
              <Button variant="outline" onClick={() => setStep(step - 1)}>Back</Button>
            ) : (
              <div></div>
            )}
            <Button onClick={handleNext} disabled={!isStepValid()}>
              {step === totalSteps ? "Finish" : "Next"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
