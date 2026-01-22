import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "Terms of Service - Football Squares",
  description: "Terms of Service for Football Squares",
};

export default function TermsPage() {
  return (
    <div className="container py-12 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Terms of Service</CardTitle>
          <p className="text-muted-foreground">Last updated: January 2025</p>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none">
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing and using Football Squares, you accept and agree to be bound by
            the terms and provision of this agreement.
          </p>

          <h2>2. Description of Service</h2>
          <p>
            Football Squares is a game management tool that allows users to create and
            manage football squares games with friends and family. <strong>This platform
            is a game management tool only. We do not facilitate gambling or collect/distribute
            any wager funds.</strong>
          </p>

          <h2>3. User Responsibilities</h2>
          <p>
            Users are solely responsible for ensuring compliance with all applicable local,
            state, and federal laws regarding the use of this service. You agree to:
          </p>
          <ul>
            <li>Provide accurate account information</li>
            <li>Maintain the security of your account</li>
            <li>Not use the service for any illegal purposes</li>
            <li>Comply with all applicable laws and regulations</li>
          </ul>

          <h2>4. Payment Terms</h2>
          <p>
            Game creation requires a one-time payment of $5 per game. All payments are
            non-refundable once a game has been created.
          </p>

          <h2>5. Disclaimer</h2>
          <p>
            The service is provided &quot;as is&quot; without warranties of any kind. We are not
            responsible for any disputes between game managers and players regarding
            payments or prizes.
          </p>

          <h2>6. Limitation of Liability</h2>
          <p>
            Football Squares shall not be liable for any indirect, incidental, special,
            consequential, or punitive damages resulting from your use of the service.
          </p>

          <h2>7. Changes to Terms</h2>
          <p>
            We reserve the right to modify these terms at any time. Continued use of the
            service after changes constitutes acceptance of the new terms.
          </p>

          <h2>8. Contact</h2>
          <p>
            For questions about these terms, please contact us through the help center.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
