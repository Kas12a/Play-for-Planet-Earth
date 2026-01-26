import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/authContext';
import { useProfile } from '@/lib/useProfile';
import { getSupabase } from '@/lib/supabase';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const DISMISS_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

export function EmailVerificationModal() {
  const { user, resendVerification } = useAuth();
  const { profile, updateProfile } = useProfile();
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !profile) return;
    
    // Check if email is already verified
    const isVerified = user.email_confirmed_at || user.confirmed_at;
    if (isVerified) return;
    
    // Check if user dismissed recently
    const dismissedAt = profile.email_verify_dismissed_at;
    if (dismissedAt) {
      const dismissedTime = new Date(dismissedAt).getTime();
      const now = Date.now();
      if (now - dismissedTime < DISMISS_COOLDOWN_MS) {
        return;
      }
    }
    
    // Show modal
    setOpen(true);
  }, [user, profile]);

  const handleSendVerification = async () => {
    if (!user?.email) return;
    setSending(true);
    setError(null);
    setSent(false);
    
    const { error } = await resendVerification(user.email);
    
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
    setSending(false);
  };

  const handleCheckVerified = async () => {
    setChecking(true);
    setError(null);
    
    const supabase = getSupabase();
    if (!supabase) {
      setError('Unable to check verification status');
      setChecking(false);
      return;
    }
    
    const { data: { user: refreshedUser }, error } = await supabase.auth.getUser();
    
    if (error) {
      setError('Failed to check verification status');
      setChecking(false);
      return;
    }
    
    if (refreshedUser?.email_confirmed_at || refreshedUser?.confirmed_at) {
      setOpen(false);
    } else {
      setError('Email not yet verified. Please check your inbox and click the verification link.');
    }
    setChecking(false);
  };

  const handleDismiss = async () => {
    await updateProfile({ email_verify_dismissed_at: new Date().toISOString() });
    setOpen(false);
  };

  if (!user || !profile) return null;
  
  const isVerified = user.email_confirmed_at || user.confirmed_at;
  if (isVerified) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-amber-500" />
          </div>
          <DialogTitle>Verify Your Email</DialogTitle>
          <DialogDescription>
            Please verify your email address to unlock all features and secure your account.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {sent && (
            <Alert className="bg-green-500/10 border-green-500/20">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <AlertDescription className="text-green-200">
                Verification email sent! Check your inbox (and spam folder).
              </AlertDescription>
            </Alert>
          )}
          
          <p className="text-sm text-muted-foreground text-center">
            Email: <strong>{user.email}</strong>
          </p>
        </div>
        
        <div className="flex flex-col gap-2">
          <Button 
            onClick={handleSendVerification} 
            disabled={sending}
            className="w-full"
            data-testid="button-send-verification"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Mail className="w-4 h-4 mr-2" />}
            Send Verification Email
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleCheckVerified}
            disabled={checking}
            className="w-full"
            data-testid="button-check-verified"
          >
            {checking ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
            I've Verified
          </Button>
          
          <Button 
            variant="ghost" 
            onClick={handleDismiss}
            className="w-full text-muted-foreground"
            data-testid="button-dismiss-verification"
          >
            Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function EmailVerificationBanner() {
  const { user } = useAuth();
  
  if (!user) return null;
  
  const isVerified = user.email_confirmed_at || user.confirmed_at;
  if (isVerified) return null;
  
  return (
    <div 
      className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center gap-3"
      data-testid="banner-email-verification"
    >
      <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm text-amber-200" data-testid="text-verification-reminder">
          Please verify your email address to secure your account.
        </p>
      </div>
    </div>
  );
}
