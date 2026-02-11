import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MessageSquare, Send, Loader2, Camera, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/authContext";
import { useLocation } from "wouter";
import { useUpload } from "@/hooks/use-upload";
import { ScrollArea } from "@/components/ui/scroll-area";

type FeedbackType = "praise" | "idea" | "bug" | "confusing" | "other";

const FEEDBACK_TYPES: { value: FeedbackType; label: string }[] = [
  { value: "praise", label: "Praise / Good" },
  { value: "idea", label: "Idea / Suggestion" },
  { value: "bug", label: "Bug / Issue" },
  { value: "confusing", label: "Confusing" },
  { value: "other", label: "Other" },
];

export default function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>("idea");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useStore();
  const { session } = useAuth();
  const [location] = useLocation();

  const [severity, setSeverity] = useState("");
  const [stepsToReproduce, setStepsToReproduce] = useState("");
  const [expectedResult, setExpectedResult] = useState("");
  const [actualResult, setActualResult] = useState("");

  const [userIntent, setUserIntent] = useState("");
  const [expectation, setExpectation] = useState("");

  const [problemSolved, setProblemSolved] = useState("");
  const [targetUser, setTargetUser] = useState("");
  const [valueRating, setValueRating] = useState("");

  const [canContact, setCanContact] = useState(false);
  const [contactEmail, setContactEmail] = useState("");

  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { uploadFile, isUploading } = useUpload();

  const resetForm = () => {
    setMessage("");
    setType("idea");
    setSeverity("");
    setStepsToReproduce("");
    setExpectedResult("");
    setActualResult("");
    setUserIntent("");
    setExpectation("");
    setProblemSolved("");
    setTargetUser("");
    setValueRating("");
    setCanContact(false);
    setContactEmail("");
    setScreenshotFile(null);
    setScreenshotPreview(null);
  };

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["image/png", "image/jpeg", "image/webp"];
    if (!allowed.includes(file.type)) {
      toast({ title: "Invalid file type", description: "Please upload a PNG, JPG, or WebP image.", variant: "destructive" });
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      toast({ title: "File too large", description: "Screenshot must be under 4 MB.", variant: "destructive" });
      return;
    }

    setScreenshotFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setScreenshotPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const removeScreenshot = () => {
    setScreenshotFile(null);
    setScreenshotPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    const minLen = type === "praise" ? 10 : 20;
    if (!message.trim() || message.trim().length < minLen) {
      toast({
        title: "Message too short",
        description: `Please write at least ${minLen} characters.`,
        variant: "destructive",
      });
      return;
    }

    if (type === "bug" && !severity) {
      toast({ title: "Severity required", description: "Please select the bug severity.", variant: "destructive" });
      return;
    }

    if (canContact && contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      toast({ title: "Invalid email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    try {
      let screenshot_url: string | null = null;

      if (screenshotFile) {
        const uploadRes = await uploadFile(screenshotFile);
        if (uploadRes?.objectPath) {
          screenshot_url = uploadRes.objectPath;
        }
      }

      const payload = {
        type,
        message: message.trim(),
        screen_path: location,
        url: window.location.href,
        user_agent: navigator.userAgent,
        app_version: "1.5.0-pilot",
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        referrer: document.referrer || null,
        session_id: null,
        can_contact: canContact,
        email: canContact ? (contactEmail || user?.email || null) : null,
        severity: type === "bug" ? severity : undefined,
        steps_to_reproduce: type === "bug" ? stepsToReproduce || undefined : undefined,
        expected_result: type === "bug" ? expectedResult || undefined : undefined,
        actual_result: type === "bug" ? actualResult || undefined : undefined,
        user_intent: type === "confusing" ? userIntent || undefined : undefined,
        expectation: type === "confusing" ? expectation || undefined : undefined,
        problem_solved: type === "idea" ? problemSolved || undefined : undefined,
        target_user: type === "idea" ? targetUser || undefined : undefined,
        value_rating: type === "idea" ? valueRating || undefined : undefined,
        screenshot_url,
      };

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const response = await fetch("/api/feedback", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to submit feedback");
      }

      toast({
        title: "Thanks! We got it.",
        description: "Your feedback helps us improve the experience.",
      });

      resetForm();
      setIsOpen(false);
    } catch (error: any) {
      toast({
        title: "Submission failed",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="fixed bottom-20 right-4 md:bottom-4 z-40 shadow-lg gap-2 bg-background/95 backdrop-blur-sm"
          data-testid="button-feedback"
        >
          <MessageSquare className="w-4 h-4" />
          Feedback
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>Share Your Feedback</DialogTitle>
          <DialogDescription>
            Help us improve the pilot experience. Your feedback goes directly to{" "}
            <span className="font-medium text-foreground">info@playearth.co.uk</span>
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 overflow-y-auto" style={{ maxHeight: "60vh" }}>
          <div className="space-y-5 py-2 pr-2">
            {/* Type Selection */}
            <div className="space-y-3">
              <Label>What type of feedback is this?</Label>
              <RadioGroup
                value={type}
                onValueChange={(v) => setType(v as FeedbackType)}
                className="grid grid-cols-2 gap-2"
              >
                {FEEDBACK_TYPES.map((ft) => (
                  <div key={ft.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={ft.value} id={`fb-${ft.value}`} />
                    <Label htmlFor={`fb-${ft.value}`} className="cursor-pointer text-sm">
                      {ft.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="fb-message">
                {type === "praise" ? "What did you like?" : "Your feedback"}
              </Label>
              <Textarea
                id="fb-message"
                placeholder={
                  type === "praise"
                    ? "Tell us what you enjoyed..."
                    : type === "bug"
                    ? "Describe the issue you encountered..."
                    : type === "confusing"
                    ? "What was confusing and where..."
                    : type === "idea"
                    ? "Describe your idea or suggestion..."
                    : "Tell us what you think..."
                }
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                data-testid="input-feedback-message"
              />
              <p className="text-xs text-muted-foreground">
                Min {type === "praise" ? 10 : 20} characters
              </p>
            </div>

            {/* Bug-specific fields */}
            {type === "bug" && (
              <div className="space-y-3 rounded-lg border p-3 bg-destructive/5">
                <div className="space-y-2">
                  <Label>Severity *</Label>
                  <Select value={severity} onValueChange={setSeverity}>
                    <SelectTrigger data-testid="select-severity">
                      <SelectValue placeholder="Select severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fb-steps">Steps to reproduce</Label>
                  <Textarea
                    id="fb-steps"
                    placeholder="1. Go to...&#10;2. Click on...&#10;3. See error..."
                    value={stepsToReproduce}
                    onChange={(e) => setStepsToReproduce(e.target.value)}
                    rows={3}
                    data-testid="input-steps-to-reproduce"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fb-expected">Expected result (optional)</Label>
                  <Input
                    id="fb-expected"
                    placeholder="What should have happened?"
                    value={expectedResult}
                    onChange={(e) => setExpectedResult(e.target.value)}
                    data-testid="input-expected-result"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fb-actual">Actual result (optional)</Label>
                  <Input
                    id="fb-actual"
                    placeholder="What actually happened?"
                    value={actualResult}
                    onChange={(e) => setActualResult(e.target.value)}
                    data-testid="input-actual-result"
                  />
                </div>
              </div>
            )}

            {/* Confusing-specific fields */}
            {type === "confusing" && (
              <div className="space-y-3 rounded-lg border p-3 bg-yellow-500/5">
                <div className="space-y-2">
                  <Label htmlFor="fb-intent">What were you trying to do?</Label>
                  <Textarea
                    id="fb-intent"
                    placeholder="I was trying to..."
                    value={userIntent}
                    onChange={(e) => setUserIntent(e.target.value)}
                    rows={2}
                    data-testid="input-user-intent"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fb-expectation">What did you expect to happen? (optional)</Label>
                  <Input
                    id="fb-expectation"
                    placeholder="I expected..."
                    value={expectation}
                    onChange={(e) => setExpectation(e.target.value)}
                    data-testid="input-expectation"
                  />
                </div>
              </div>
            )}

            {/* Idea-specific fields */}
            {type === "idea" && (
              <div className="space-y-3 rounded-lg border p-3 bg-blue-500/5">
                <div className="space-y-2">
                  <Label htmlFor="fb-problem">What problem does this solve?</Label>
                  <Textarea
                    id="fb-problem"
                    placeholder="This would help with..."
                    value={problemSolved}
                    onChange={(e) => setProblemSolved(e.target.value)}
                    rows={2}
                    data-testid="input-problem-solved"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fb-target">Who is it for? (optional)</Label>
                  <Input
                    id="fb-target"
                    placeholder="e.g. new users, teachers, groups..."
                    value={targetUser}
                    onChange={(e) => setTargetUser(e.target.value)}
                    data-testid="input-target-user"
                  />
                </div>
                <div className="space-y-2">
                  <Label>How valuable is this?</Label>
                  <Select value={valueRating} onValueChange={setValueRating}>
                    <SelectTrigger data-testid="select-value-rating">
                      <SelectValue placeholder="Select value" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nice-to-have">Nice-to-have</SelectItem>
                      <SelectItem value="important">Important</SelectItem>
                      <SelectItem value="must-have">Must-have</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Screenshot */}
            <div className="space-y-2">
              <Label>Screenshot (optional)</Label>
              {screenshotPreview ? (
                <div className="relative inline-block">
                  <img
                    src={screenshotPreview}
                    alt="Screenshot preview"
                    className="max-h-32 rounded border"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={removeScreenshot}
                    type="button"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => fileInputRef.current?.click()}
                  type="button"
                  data-testid="button-add-screenshot"
                >
                  <Camera className="w-4 h-4" />
                  Add Screenshot
                </Button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleScreenshotChange}
              />
            </div>

            {/* Contact Toggle */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="fb-contact" className="text-sm">
                  Can we contact you about this?
                </Label>
                <Switch
                  id="fb-contact"
                  checked={canContact}
                  onCheckedChange={setCanContact}
                  data-testid="switch-can-contact"
                />
              </div>
              {canContact && (
                <Input
                  placeholder="Your email address"
                  type="email"
                  value={contactEmail || user?.email || ""}
                  onChange={(e) => setContactEmail(e.target.value)}
                  data-testid="input-contact-email"
                />
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Current screen: {location}
            </p>
          </div>
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || isUploading}
            data-testid="button-submit-feedback"
          >
            {isSubmitting || isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isUploading ? "Uploading..." : "Sending..."}
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Feedback
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
