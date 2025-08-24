import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Mail, Phone, MapPin } from "lucide-react";
import { useLocation } from "wouter";

export default function PrivacyPolicy() {
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
              <Shield className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl font-bold">Privacy Policy</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-gray-900">Privacy Policy</CardTitle>
            <p className="text-gray-600 mt-2">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </CardHeader>
          
          <CardContent className="prose prose-gray max-w-none space-y-6">
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-700 leading-relaxed">
                Welcome to MyLinked ("we," "our," or "us"). We respect your privacy and are committed to protecting your personal data. 
                This privacy policy explains how we collect, use, disclose, and safeguard your information when you use our MyLinked 
                application and services (the "Service").
              </p>
            </section>

            {/* Information We Collect */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-2">2.1 Personal Information</h3>
              <p className="text-gray-700 mb-4">When you register for an account, we may collect:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 mb-4">
                <li>Name and email address</li>
                <li>Username and password</li>
                <li>Profile information (bio, profile picture, background image)</li>
                <li>Social media account connections and public profile data</li>
                <li>Links and content you share on your profile</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-2">2.2 Usage Information</h3>
              <p className="text-gray-700 mb-4">We automatically collect information about how you use our Service:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 mb-4">
                <li>IP address and device information</li>
                <li>Browser type and version</li>
                <li>Pages visited and time spent on the Service</li>
                <li>Click-through rates and engagement metrics</li>
                <li>Referral sources and search terms</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-2">2.3 Social Media Data</h3>
              <p className="text-gray-700">
                When you connect social media accounts, we may access and store publicly available information 
                such as your username, profile picture, and recent posts as permitted by the respective platform's terms.
              </p>
            </section>

            {/* How We Use Information */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-700 mb-4">We use the collected information to:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Provide, operate, and maintain our Service</li>
                <li>Create and manage your account</li>
                <li>Enable profile customization and social media integration</li>
                <li>Analyze usage patterns and improve our Service</li>
                <li>Provide customer support and respond to inquiries</li>
                <li>Send important updates and security notifications</li>
                <li>Detect and prevent fraud, abuse, and security issues</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            {/* Information Sharing */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Information Sharing and Disclosure</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-2">4.1 Public Information</h3>
              <p className="text-gray-700 mb-4">
                Your profile information, links, and connected social media content are publicly visible by design. 
                Anyone with access to your MyLinked profile URL can view this information.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-2">4.2 Service Providers</h3>
              <p className="text-gray-700 mb-4">
                We may share your information with trusted third-party service providers who assist us in operating 
                our Service, such as hosting, analytics, and customer support providers.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-2">4.3 Legal Requirements</h3>
              <p className="text-gray-700">
                We may disclose your information if required by law, legal process, or to protect our rights, 
                users, or the public from harm.
              </p>
            </section>

            {/* Data Security */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Security</h2>
              <p className="text-gray-700">
                We implement appropriate technical and organizational security measures to protect your personal 
                information against unauthorized access, alteration, disclosure, or destruction. However, no method 
                of transmission over the internet is 100% secure.
              </p>
            </section>

            {/* Data Retention */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Data Retention</h2>
              <p className="text-gray-700">
                We retain your personal information for as long as necessary to provide our Service and comply with 
                legal obligations. You may delete your account at any time, and we will remove your personal data 
                within 30 days, except where retention is required by law.
              </p>
            </section>

            {/* Your Rights */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Your Rights</h2>
              <p className="text-gray-700 mb-4">Depending on your location, you may have the following rights:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Access to your personal data</li>
                <li>Correction of inaccurate data</li>
                <li>Deletion of your data</li>
                <li>Data portability</li>
                <li>Objection to processing</li>
                <li>Withdrawal of consent</li>
              </ul>
            </section>

            {/* Cookies */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Cookies and Tracking</h2>
              <p className="text-gray-700">
                We use cookies and similar tracking technologies to enhance your experience, analyze usage, and 
                provide personalized content. You can control cookie settings through your browser preferences.
              </p>
            </section>

            {/* International Transfers */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. International Data Transfers</h2>
              <p className="text-gray-700">
                Your information may be transferred to and processed in countries other than your country of residence. 
                We ensure appropriate safeguards are in place to protect your data in accordance with applicable laws.
              </p>
            </section>

            {/* Children's Privacy */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Children's Privacy</h2>
              <p className="text-gray-700">
                Our Service is not intended for children under 13 years of age. We do not knowingly collect personal 
                information from children under 13. If you become aware that a child has provided us with personal 
                information, please contact us immediately.
              </p>
            </section>

            {/* Changes to Policy */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Changes to This Privacy Policy</h2>
              <p className="text-gray-700">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by 
                posting the new Privacy Policy on this page and updating the "Last updated" date.
              </p>
            </section>

            {/* Contact Information */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Contact Us</h2>
              <p className="text-gray-700 mb-4">
                If you have any questions about this Privacy Policy or our privacy practices, please contact us:
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
          </CardContent>
        </Card>
      </main>
    </div>
  );
}