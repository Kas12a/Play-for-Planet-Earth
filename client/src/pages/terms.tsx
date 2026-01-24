import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TermsPage() {
  return (
    <div className="container max-w-3xl mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Terms of Service</CardTitle>
          <p className="text-sm text-muted-foreground">Last updated: January 2026</p>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <h2 className="text-lg font-semibold mt-4">1. Acceptance of Terms</h2>
          <p className="text-muted-foreground">
            By accessing and using Play for Planet Earth ("PfPE"), you agree to be bound by these Terms of Service. 
            If you do not agree to these terms, please do not use the service.
          </p>

          <h2 className="text-lg font-semibold mt-6">2. Service Description</h2>
          <p className="text-muted-foreground">
            PfPE is a gamified eco-action tracking platform that rewards sustainable behaviors with credits. 
            The platform tracks activities, allows participation in quests, and provides educational content about environmental sustainability.
          </p>

          <h2 className="text-lg font-semibold mt-6">3. User Accounts</h2>
          <p className="text-muted-foreground">
            You must provide accurate information when creating an account. You are responsible for maintaining 
            the confidentiality of your account credentials and for all activities under your account.
          </p>

          <h2 className="text-lg font-semibold mt-6">4. Credits and Points</h2>
          <p className="text-muted-foreground">
            Credits and points earned on the platform have no cash value and cannot be exchanged for currency. 
            They may be used only within the platform ecosystem as specified. Credits are non-transferable 
            and cannot be sold or traded.
          </p>

          <h2 className="text-lg font-semibold mt-6">5. Activity Verification</h2>
          <p className="text-muted-foreground">
            The platform uses connected fitness providers (such as Strava) to verify activities. 
            Self-declared activities are subject to daily limits and earn reduced points. 
            Any attempt to falsify activity data may result in account suspension.
          </p>

          <h2 className="text-lg font-semibold mt-6">6. Third-Party Services</h2>
          <p className="text-muted-foreground">
            When you connect third-party services (like Strava), you authorize us to access your activity data 
            from those services. Your use of third-party services is subject to their respective terms and privacy policies.
          </p>

          <h2 className="text-lg font-semibold mt-6">7. Pilot Program</h2>
          <p className="text-muted-foreground">
            PfPE is currently in pilot mode. Features may change, be added, or removed during this period. 
            We appreciate your feedback in helping us improve the platform.
          </p>

          <h2 className="text-lg font-semibold mt-6">8. Limitation of Liability</h2>
          <p className="text-muted-foreground">
            The service is provided "as is" without warranties of any kind. We are not liable for any 
            indirect, incidental, or consequential damages arising from your use of the platform.
          </p>

          <h2 className="text-lg font-semibold mt-6">9. Contact</h2>
          <p className="text-muted-foreground">
            For questions about these terms, please contact us at info@playearth.co.uk
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
