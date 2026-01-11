import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export const metadata = {
  title: "Privacy Policy - GK Daily Scan",
  description: "Privacy Policy for GK Daily Scan",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-muted/50">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Privacy Policy</CardTitle>
            <CardDescription>Last updated: {new Date().toLocaleDateString()}</CardDescription>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-3">1. Introduction</h2>
              <p>
                Welcome to GK Daily Scan ("we," "our," or "us"). We are committed to protecting your privacy. 
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when 
                you use our website and services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">2. Information We Collect</h2>
              <h3 className="text-xl font-semibold mb-2">2.1 Information You Provide</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Email address (for account creation and authentication)</li>
                <li>Profile information (if provided through Google OAuth)</li>
                <li>Answers and responses to quiz questions</li>
              </ul>
              
              <h3 className="text-xl font-semibold mb-2 mt-4">2.2 Automatically Collected Information</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Usage data and interaction with our services</li>
                <li>Device information and browser type</li>
                <li>IP address and general location data</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">3. How We Use Your Information</h2>
              <p>We use the information we collect to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Provide and maintain our service</li>
                <li>Track your progress, scores, and streaks</li>
                <li>Improve and personalize your experience</li>
                <li>Send you updates and notifications (if opted in)</li>
                <li>Ensure security and prevent fraud</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">4. Data Storage and Security</h2>
              <p>
                Your data is stored securely using Supabase, a trusted cloud database service. We implement 
                appropriate technical and organizational measures to protect your personal information. However, 
                no method of transmission over the Internet is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">5. Third-Party Services</h2>
              <p>We use the following third-party services:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Supabase:</strong> For authentication and database storage</li>
                <li><strong>Google OAuth:</strong> For Google sign-in functionality</li>
                <li><strong>Google Gemini AI:</strong> For generating quiz questions</li>
                <li><strong>Vercel:</strong> For hosting and deployment</li>
              </ul>
              <p className="mt-2">
                These services have their own privacy policies governing the use of your information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">6. Your Rights</h2>
              <p>You have the right to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Access your personal data</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your account and data</li>
                <li>Opt-out of certain data collection practices</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">7. Cookies and Tracking</h2>
              <p>
                We use cookies and similar technologies to maintain your session and improve your experience. 
                You can control cookies through your browser settings.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">8. Children's Privacy</h2>
              <p>
                Our service is intended for users preparing for competitive exams. If you are under 13 years of age, 
                please do not use our service without parental consent.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">9. Changes to This Privacy Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any changes by 
                posting the new Privacy Policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">10. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy, please contact us through our website 
                at <Link href="/" className="text-primary hover:underline">www.gktop10.com</Link>.
              </p>
            </section>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Link href="/">
            <button className="text-primary hover:underline">Back to Home</button>
          </Link>
        </div>
      </div>
    </div>
  );
}
