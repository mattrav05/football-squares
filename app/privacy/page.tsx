import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "Privacy Policy - Football Squares",
  description: "Privacy Policy for Football Squares",
};

export default function PrivacyPage() {
  return (
    <div className="container py-12 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Privacy Policy</CardTitle>
          <p className="text-muted-foreground">Last updated: January 2025</p>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none">
          <h2>1. Information We Collect</h2>
          <p>We collect information you provide directly to us, such as:</p>
          <ul>
            <li>Account information (name, email address, password)</li>
            <li>Game information (team names, game dates, payout structures)</li>
            <li>Payment information (processed securely through Stripe)</li>
          </ul>

          <h2>2. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Provide and maintain the service</li>
            <li>Send you notifications about your games</li>
            <li>Process payments</li>
            <li>Respond to your requests and support needs</li>
          </ul>

          <h2>3. Information Sharing</h2>
          <p>
            We do not sell your personal information. We may share your information with:
          </p>
          <ul>
            <li>Other players in games you participate in (name only)</li>
            <li>Service providers who assist in operating our platform</li>
            <li>Law enforcement when required by law</li>
          </ul>

          <h2>4. Data Security</h2>
          <p>
            We implement appropriate security measures to protect your personal information.
            Passwords are hashed and payment information is processed through secure,
            PCI-compliant providers.
          </p>

          <h2>5. Cookies</h2>
          <p>
            We use cookies to maintain your session and preferences. You can disable
            cookies in your browser, but this may affect the functionality of the service.
          </p>

          <h2>6. Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access your personal data</li>
            <li>Correct inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Export your data</li>
          </ul>

          <h2>7. Children&apos;s Privacy</h2>
          <p>
            Our service is not intended for users under the age of 18. We do not knowingly
            collect information from children.
          </p>

          <h2>8. Changes to Privacy Policy</h2>
          <p>
            We may update this privacy policy from time to time. We will notify you of
            any changes by posting the new policy on this page.
          </p>

          <h2>9. Contact Us</h2>
          <p>
            If you have questions about this privacy policy, please contact us through
            the help center.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
