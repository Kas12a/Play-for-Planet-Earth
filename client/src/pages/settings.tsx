import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/authContext';
import { useAppConfig } from '@/lib/configContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Link, ExternalLink, RefreshCw, CheckCircle2, XCircle, Activity, Shield, KeyRound, Eye, EyeOff, Loader2 } from 'lucide-react';

interface StravaStatus {
  connected: boolean;
  athlete?: { firstname: string; lastname: string };
  lastSync?: string;
}

export default function SettingsPage() {
  const { session, updatePassword } = useAuth();
  const { config } = useAppConfig();
  const { toast } = useToast();
  const [stravaStatus, setStravaStatus] = useState<StravaStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast({ title: 'Password too short', description: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Passwords don\'t match', description: 'Please make sure both passwords are the same', variant: 'destructive' });
      return;
    }
    setChangingPassword(true);
    const { error } = await updatePassword(newPassword);
    setChangingPassword(false);
    if (error) {
      toast({ title: 'Failed to update password', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Password updated', description: 'Your password has been changed successfully' });
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  useEffect(() => {
    if (session?.access_token) {
      fetchStravaStatus();
    }

    // Check URL params for Strava callback result
    const params = new URLSearchParams(window.location.search);
    const stravaParam = params.get('strava');
    if (stravaParam === 'connected') {
      toast({
        title: 'Strava Connected!',
        description: 'Your Strava account is now connected. Sync your activities to earn verified points.',
      });
      // Clean URL
      window.history.replaceState({}, '', '/settings');
    } else if (stravaParam === 'error') {
      toast({
        title: 'Connection Failed',
        description: params.get('message') || 'Failed to connect Strava',
        variant: 'destructive',
      });
      window.history.replaceState({}, '', '/settings');
    }
  }, [session]);

  const fetchStravaStatus = async () => {
    try {
      const response = await fetch('/api/strava/status', {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setStravaStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch Strava status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectStrava = async () => {
    setConnecting(true);
    try {
      const response = await fetch('/api/strava/connect', {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });
      const data = await response.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error('Failed to connect Strava:', error);
      toast({
        title: 'Connection Failed',
        description: 'Could not initiate Strava connection',
        variant: 'destructive',
      });
      setConnecting(false);
    }
  };

  const handleSyncStrava = async () => {
    setSyncing(true);
    try {
      const response = await fetch('/api/strava/sync', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Sync Complete!',
          description: data.message,
        });
        fetchStravaStatus();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: 'Sync Failed',
        description: error.message || 'Failed to sync activities',
        variant: 'destructive',
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnectStrava = async () => {
    if (!confirm('Are you sure you want to disconnect Strava? Your verified activity history will remain.')) {
      return;
    }
    
    setDisconnecting(true);
    try {
      const response = await fetch('/api/strava/disconnect', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });
      if (response.ok) {
        setStravaStatus({ connected: false });
        toast({
          title: 'Disconnected',
          description: 'Strava has been disconnected from your account',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to disconnect Strava',
        variant: 'destructive',
      });
    } finally {
      setDisconnecting(false);
    }
  };

  if (!session) {
    return (
      <div className="container max-w-2xl mx-auto py-8 px-4">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Please sign in to access settings.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account and connected services</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Activity Tracking
          </CardTitle>
          <CardDescription>
            Connect fitness apps to earn verified points automatically
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <div>
                <div className="font-medium flex items-center gap-2">
                  Strava
                  {stravaStatus?.connected && (
                    <Badge variant="secondary" className="text-xs">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Connected
                    </Badge>
                  )}
                </div>
                {stravaStatus?.connected && stravaStatus.athlete ? (
                  <p className="text-sm text-muted-foreground">
                    {stravaStatus.athlete.firstname} {stravaStatus.athlete.lastname}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Cycling, running, swimming & more
                  </p>
                )}
              </div>
            </div>

            {loading ? (
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : stravaStatus?.connected ? (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSyncStrava}
                  disabled={syncing}
                  data-testid="button-sync-strava"
                >
                  {syncing ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Sync Now
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDisconnectStrava}
                  disabled={disconnecting}
                  className="text-destructive hover:text-destructive"
                  data-testid="button-disconnect-strava"
                >
                  <XCircle className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleConnectStrava}
                disabled={connecting}
                className="bg-orange-500 hover:bg-orange-600"
                data-testid="button-connect-strava"
              >
                {connecting ? (
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Link className="w-4 h-4 mr-2" />
                )}
                Connect
              </Button>
            )}
          </div>

          <div className="bg-muted/50 rounded-lg p-4 text-sm">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              How Verified Points Work
            </h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Connected activities earn <strong>full verified points</strong></li>
              <li>• 1 point per 5 minutes of activity (max 50/activity)</li>
              <li>• Bonus points for cycling, swimming, running</li>
              <li>• Self-declared actions are limited to 10 points/day</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">Email</p>
              <p className="text-sm text-muted-foreground">{session.user?.email}</p>
            </div>
          </div>
          <Separator />
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">Pilot Mode</p>
              <p className="text-sm text-muted-foreground">
                {config?.PILOT_MODE ? 'Active - Thank you for testing!' : 'Inactive'}
              </p>
            </div>
            {config?.PILOT_MODE && (
              <Badge variant="outline">Pilot Tester</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-primary" />
            Change Password
          </CardTitle>
          <CardDescription>Update your account password</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="pr-10"
                data-testid="input-new-password"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                data-testid="button-toggle-new-password"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your new password"
                className="pr-10"
                data-testid="input-confirm-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                data-testid="button-toggle-confirm-password"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          {newPassword && confirmPassword && newPassword !== confirmPassword && (
            <p className="text-sm text-destructive">Passwords don't match</p>
          )}
          <Button
            onClick={handleChangePassword}
            disabled={changingPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
            className="w-full"
            data-testid="button-change-password"
          >
            {changingPassword ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <KeyRound className="w-4 h-4 mr-2" />}
            Update Password
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Legal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <a href="/terms" className="flex items-center gap-2 text-sm text-primary hover:underline">
            <ExternalLink className="w-4 h-4" />
            Terms of Service
          </a>
          <a href="/privacy" className="flex items-center gap-2 text-sm text-primary hover:underline">
            <ExternalLink className="w-4 h-4" />
            Privacy Policy
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
