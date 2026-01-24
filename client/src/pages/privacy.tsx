import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PrivacyPage() {
  return (
    <div className="container max-w-3xl mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Privacy Policy</CardTitle>
          <p className="text-sm text-muted-foreground">Last updated: January 2026</p>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <h2 className="text-lg font-semibold mt-4">1. Information We Collect</h2>
          <p className="text-muted-foreground">We collect the following types of information:</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li><strong>Account Information:</strong> Email address, name, and profile details you provide</li>
            <li><strong>Activity Data:</strong> Actions you log, quests you join, and lessons you complete</li>
            <li><strong>Connected Service Data:</strong> Activity data from connected fitness apps (Strava, etc.)</li>
            <li><strong>Usage Data:</strong> How you interact with the platform</li>
          </ul>

          <h2 className="text-lg font-semibold mt-6">2. How We Use Your Information</h2>
          <p className="text-muted-foreground">We use your information to:</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li>Provide and improve the PfPE service</li>
            <li>Calculate and award points and credits</li>
            <li>Display leaderboards (using anonymized display names)</li>
            <li>Send important service updates</li>
            <li>Analyze usage patterns to improve the platform</li>
          </ul>

          <h2 className="text-lg font-semibold mt-6">3. Connected Fitness Apps</h2>
          <p className="text-muted-foreground">
            When you connect a fitness app like Strava, we access:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li>Your activity history (type, duration, distance)</li>
            <li>Your athlete profile (name only)</li>
          </ul>
          <p className="text-muted-foreground mt-2">
            We store OAuth tokens securely on our servers. Tokens are never exposed to the client-side application. 
            You can disconnect your fitness app at any time from the Settings page.
          </p>

          <h2 className="text-lg font-semibold mt-6">4. Data Security</h2>
          <p className="text-muted-foreground">
            We implement security measures including:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li>Encrypted data transmission (HTTPS)</li>
            <li>Secure token storage (server-side only)</li>
            <li>Row-level security policies on our database</li>
            <li>Regular security reviews</li>
          </ul>

          <h2 className="text-lg font-semibold mt-6">5. Leaderboard Privacy</h2>
          <p className="text-muted-foreground">
            Leaderboards display anonymized usernames only. Your email address and real name are never 
            publicly visible. You can set a custom display name in your profile.
          </p>

          <h2 className="text-lg font-semibold mt-6">6. Data Retention</h2>
          <p className="text-muted-foreground">
            We retain your data while your account is active. You may request deletion of your account 
            and associated data by contacting us at info@playearth.co.uk
          </p>

          <h2 className="text-lg font-semibold mt-6">7. Children's Privacy</h2>
          <p className="text-muted-foreground">
            Users under 16 require parental consent. We collect parent/guardian email for verification 
            and limit data collection for younger users.
          </p>

          <h2 className="text-lg font-semibold mt-6">8. Your Rights</h2>
          <p className="text-muted-foreground">You have the right to:</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li>Access your personal data</li>
            <li>Correct inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Disconnect third-party services</li>
            <li>Export your data</li>
          </ul>

          <h2 className="text-lg font-semibold mt-6">9. Contact</h2>
          <p className="text-muted-foreground">
            For privacy questions or data requests, contact us at info@playearth.co.uk
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
