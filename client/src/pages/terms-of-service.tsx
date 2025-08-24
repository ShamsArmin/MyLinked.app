import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Mail, Phone, MapPin } from "lucide-react";
import { useLocation } from "wouter";

export default function TermsOfService() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-base-200 text-base-content">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
            <div className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl font-bold">Terms of Service</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-gray-900">Terms of Service</CardTitle>
            <p className="text-gray-600 mt-2">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </CardHeader>
          
          <CardContent className="prose prose-gray max-w-none space-y-6">
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Agreement to Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                These Terms of Service ("Terms") constitute a legally binding agreement between you and MyLinked 
                ("Company," "we," "our," or "us") regarding your use of the MyLinked application and services 
                (the "Service"). By accessing or using our Service, you agree to be bound by these Terms.
              </p>
            </section>

            {/* Acceptance */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Acceptance of Terms</h2>
              <p className="text-gray-700 mb-4">
                By creating an account or using our Service, you acknowledge that you have read, understood, 
                and agree to be bound by these Terms and our Privacy Policy. If you do not agree to these Terms, 
                you must not use our Service.
              </p>
              <p className="text-gray-700">
                You must be at least 13 years old to use our Service. If you are under 18, you represent that 
                you have your parent's or guardian's permission to use the Service.
              </p>
            </section>

            {/* Description of Service */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Description of Service</h2>
              <p className="text-gray-700 mb-4">
                MyLinked is a professional networking platform that allows users to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Create personalized profiles with social media links</li>
                <li>Connect and integrate multiple social media accounts</li>
                <li>Display content previews from connected platforms</li>
                <li>Share professional links and portfolios</li>
                <li>Network with other professionals</li>
                <li>Access analytics and performance metrics</li>
              </ul>
            </section>

            {/* User Accounts */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. User Accounts and Registration</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-2">4.1 Account Creation</h3>
              <p className="text-gray-700 mb-4">
                To access certain features of our Service, you must register for an account. You agree to provide 
                accurate, current, and complete information during registration and to update such information as needed.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-2">4.2 Account Security</h3>
              <p className="text-gray-700 mb-4">
                You are responsible for maintaining the confidentiality of your account credentials and for all 
                activities that occur under your account. You agree to notify us immediately of any unauthorized 
                use of your account.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-2">4.3 Account Termination</h3>
              <p className="text-gray-700">
                We reserve the right to suspend or terminate your account at any time for violations of these Terms 
                or any other reason, with or without notice.
              </p>
            </section>

            {/* User Content */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. User Content and Conduct</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-2">5.1 Content Ownership</h3>
              <p className="text-gray-700 mb-4">
                You retain ownership of any content you submit, upload, or display on the Service ("User Content"). 
                By posting User Content, you grant us a worldwide, non-exclusive, royalty-free license to use, 
                display, and distribute your content in connection with the Service.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-2">5.2 Prohibited Content</h3>
              <p className="text-gray-700 mb-4">You agree not to post User Content that:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 mb-4">
                <li>Is illegal, harmful, threatening, abusive, or offensive</li>
                <li>Violates intellectual property rights</li>
                <li>Contains personal information of others without consent</li>
                <li>Is spam, fraudulent, or misleading</li>
                <li>Contains malicious code or viruses</li>
                <li>Promotes hate speech or discrimination</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-2">5.3 Content Monitoring</h3>
              <p className="text-gray-700">
                We reserve the right to monitor, review, and remove any User Content that violates these Terms, 
                but we are not obligated to do so.
              </p>
            </section>

            {/* Social Media Integration */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Social Media Integration</h2>
              <p className="text-gray-700 mb-4">
                Our Service allows you to connect your social media accounts. By connecting these accounts, you:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Authorize us to access your public profile information</li>
                <li>Agree to comply with the terms of service of each connected platform</li>
                <li>Understand that we may display your public posts and content</li>
                <li>Acknowledge that you can disconnect these accounts at any time</li>
              </ul>
            </section>

            {/* Intellectual Property */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Intellectual Property Rights</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-2">7.1 Our Rights</h3>
              <p className="text-gray-700 mb-4">
                The Service and its original content, features, and functionality are owned by MyLinked and are 
                protected by international copyright, trademark, patent, trade secret, and other intellectual 
                property laws.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-2">7.2 Limited License</h3>
              <p className="text-gray-700 mb-4">
                We grant you a limited, non-exclusive, non-transferable license to access and use the Service 
                for personal, non-commercial purposes in accordance with these Terms.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-2">7.3 DMCA Compliance</h3>
              <p className="text-gray-700">
                We respect intellectual property rights and will respond to valid DMCA takedown notices. 
                If you believe your copyrighted material has been infringed, please contact us with the required information.
              </p>
            </section>

            {/* Privacy and Data */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Privacy and Data Protection</h2>
              <p className="text-gray-700">
                Your privacy is important to us. Please review our Privacy Policy, which explains how we collect, 
                use, and protect your information. By using our Service, you agree to the collection and use of 
                information in accordance with our Privacy Policy.
              </p>
            </section>

            {/* Service Availability */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Service Availability and Modifications</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-2">9.1 Service Availability</h3>
              <p className="text-gray-700 mb-4">
                We strive to maintain the Service, but we cannot guarantee uninterrupted access. The Service may 
                be temporarily unavailable due to maintenance, updates, or technical issues.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-2">9.2 Service Modifications</h3>
              <p className="text-gray-700">
                We reserve the right to modify, suspend, or discontinue any part of the Service at any time, 
                with or without notice. We will not be liable for any modification, suspension, or discontinuation.
              </p>
            </section>

            {/* Payment and Subscriptions */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Payment and Subscriptions</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-2">10.1 Free and Premium Features</h3>
              <p className="text-gray-700 mb-4">
                Our Service offers both free and premium features. Premium features may require payment of fees 
                as described in our pricing information.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-2">10.2 Payment Terms</h3>
              <p className="text-gray-700 mb-4">
                All fees are non-refundable unless otherwise specified. You agree to pay all charges incurred 
                by your account. We may change our fees at any time with reasonable notice.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-2">10.3 Cancellation</h3>
              <p className="text-gray-700">
                You may cancel your subscription at any time. Cancellation will take effect at the end of your 
                current billing period.
              </p>
            </section>

            {/* Disclaimers */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Disclaimers and Limitations</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-2">11.1 Service Disclaimer</h3>
              <p className="text-gray-700 mb-4">
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS 
                OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR 
                PURPOSE, AND NON-INFRINGEMENT.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-2">11.2 Limitation of Liability</h3>
              <p className="text-gray-700">
                IN NO EVENT SHALL MYLINKED BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR 
                PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, OR OTHER INTANGIBLE 
                LOSSES, RESULTING FROM YOUR USE OF THE SERVICE.
              </p>
            </section>

            {/* Indemnification */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Indemnification</h2>
              <p className="text-gray-700">
                You agree to defend, indemnify, and hold harmless MyLinked and its officers, directors, employees, 
                and agents from any claims, liabilities, damages, judgments, awards, losses, costs, expenses, 
                or fees arising out of or relating to your violation of these Terms or your use of the Service.
              </p>
            </section>

            {/* Governing Law */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Governing Law and Jurisdiction</h2>
              <p className="text-gray-700">
                These Terms shall be governed by and construed in accordance with the laws of Italy, without 
                regard to conflict of law provisions. Any disputes arising under these Terms shall be subject 
                to the exclusive jurisdiction of the courts in Turin, Italy.
              </p>
            </section>

            {/* Dispute Resolution */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Dispute Resolution</h2>
              <p className="text-gray-700">
                Before filing any legal claim, you agree to first contact us to attempt to resolve the dispute 
                informally. We encourage the use of mediation or arbitration to resolve disputes when possible.
              </p>
            </section>

            {/* Severability */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">15. Severability</h2>
              <p className="text-gray-700">
                If any provision of these Terms is held to be invalid or unenforceable, the remaining provisions 
                shall remain in full force and effect, and the invalid provision shall be replaced with a valid 
                provision that most closely reflects the original intent.
              </p>
            </section>

            {/* Changes to Terms */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">16. Changes to Terms</h2>
              <p className="text-gray-700">
                We reserve the right to modify these Terms at any time. We will notify users of material changes 
                by posting the updated Terms on our website and updating the "Last updated" date. Your continued 
                use of the Service after changes become effective constitutes acceptance of the new Terms.
              </p>
            </section>

            {/* Contact Information */}
            <section>
              <h2 className="text-2xl font-semibent text-gray-900 mb-4">17. Contact Information</h2>
              <p className="text-gray-700 mb-4">
                If you have any questions about these Terms of Service, please contact us:
              </p>
              
              <div className="bg-gray-50 rounded-lg p-6 space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">Email:</span>
                  <a href="mailto:info@mylinked.app" className="text-blue-600 hover:underline">
                    info@mylinked.app
                  </a>
                </div>
                
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">Phone:</span>
                  <a href="tel:+393792576408" className="text-blue-600 hover:underline">
                    +39 3792576408
                  </a>
                </div>
                
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <span className="font-medium">Address:</span>
                    <div className="text-gray-700">
                      Corso Sebastopoli 310<br />
                      Turin, Italy
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Effective Date */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">18. Effective Date</h2>
              <p className="text-gray-700">
                These Terms of Service are effective as of the date last updated above and will remain in effect 
                until modified or terminated in accordance with these Terms.
              </p>
            </section>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}