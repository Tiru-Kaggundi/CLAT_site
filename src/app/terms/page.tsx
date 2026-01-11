import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export const metadata = {
  title: "Terms of Service - GK Daily Scan",
  description: "Terms of Service for GK Daily Scan",
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-muted/50">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Terms of Service</CardTitle>
            <CardDescription>Last updated: {new Date().toLocaleDateString()}</CardDescription>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-3">1. Acceptance of Terms</h2>
              <p>
                By accessing and using GK Daily Scan ("the Service"), you accept and agree to be bound by the 
                terms and provision of this agreement. If you do not agree to these Terms of Service, please 
                do not use our Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">2. Description of Service</h2>
              <p>
                GK Daily Scan is an educational platform that provides daily General Knowledge multiple-choice 
                questions (MCQs) for competitive exam preparation, including CLAT, UPSC, and other competitive 
                examinations. The questions are generated using AI technology based on recent news and current affairs.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">3. User Accounts</h2>
              <h3 className="text-xl font-semibold mb-2">3.1 Account Creation</h3>
              <p>
                To use certain features of our Service, you must create an account. You agree to provide accurate, 
                current, and complete information during registration and to update such information to keep it 
                accurate, current, and complete.
              </p>
              
              <h3 className="text-xl font-semibold mb-2 mt-4">3.2 Account Security</h3>
              <p>
                You are responsible for maintaining the confidentiality of your account credentials and for all 
                activities that occur under your account.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">4. Acceptable Use</h2>
              <p>You agree not to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Use the Service for any illegal purpose or in violation of any laws</li>
                <li>Attempt to gain unauthorized access to the Service or its related systems</li>
                <li>Interfere with or disrupt the Service or servers</li>
                <li>Use automated systems (bots, scrapers) to access the Service</li>
                <li>Share your account credentials with others</li>
                <li>Attempt to manipulate scores or game the system</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">5. Intellectual Property</h2>
              <p>
                The Service, including all content, features, and functionality, is owned by GK Daily Scan and 
                is protected by copyright, trademark, and other intellectual property laws. You may not reproduce, 
                distribute, or create derivative works from our content without permission.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">6. AI-Generated Content</h2>
              <p>
                Questions and content on our platform are generated using AI technology. While we strive for 
                accuracy, we do not guarantee that all content is error-free. The Service is provided for 
                educational and practice purposes only.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">7. Disclaimer of Warranties</h2>
              <p>
                The Service is provided "as is" and "as available" without warranties of any kind, either express 
                or implied. We do not warrant that the Service will be uninterrupted, error-free, or free from 
                viruses or other harmful components.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">8. Limitation of Liability</h2>
              <p>
                To the fullest extent permitted by law, GK Daily Scan shall not be liable for any indirect, 
                incidental, special, consequential, or punitive damages, or any loss of profits or revenues, 
                whether incurred directly or indirectly.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">9. Termination</h2>
              <p>
                We reserve the right to terminate or suspend your account and access to the Service at our sole 
                discretion, without prior notice, for conduct that we believe violates these Terms of Service or 
                is harmful to other users, us, or third parties.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">10. Changes to Terms</h2>
              <p>
                We reserve the right to modify these Terms of Service at any time. We will notify users of any 
                material changes by updating the "Last updated" date. Your continued use of the Service after 
                such modifications constitutes acceptance of the updated terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">11. Governing Law</h2>
              <p>
                These Terms of Service shall be governed by and construed in accordance with the laws of India, 
                without regard to its conflict of law provisions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">12. Contact Information</h2>
              <p>
                If you have any questions about these Terms of Service, please contact us through our website 
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
