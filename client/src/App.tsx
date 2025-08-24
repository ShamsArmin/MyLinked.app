import { Route, Switch } from "wouter";
import AuthPage from "./pages/auth-page";
import AIEnhancedDashboard from "./pages/ai-enhanced-dashboard";
import BrandingPage from "./pages/branding";
import ProfilePage from "./pages/profile-fixed";
import SettingsPage from "./pages/settings";
import SocialScorePage from "./pages/social-score";
import AnalyticsPage from "./pages/analytics";
import LandingPage from "./pages/landing-page";
import LiveFeedPage from "./pages/live-feed";
import NotFound from "./pages/not-found";
import PrivacyPolicy from "./pages/privacy-policy";
import TermsOfService from "./pages/terms-of-service";
import { useAuth, AuthProvider } from "./hooks/use-auth";
import { ThemeProvider } from "./hooks/use-theme";
import { ProtectedRoute } from "./lib/protected-route";
import { AdminProtectedRoute } from "./lib/admin-protected-route";
import { Award, Loader2 } from "lucide-react";
import SpotlightPage from "./pages/spotlight-page";
import IndustryDiscoveryPage from "./pages/industry-discovery";
import IndustryDiscoveryDemo from "./pages/industry-discovery-demo";
import IndustryDiscoveryFixed from "./pages/industry-discovery-fixed";
import IndustryExamples from "./pages/industry-examples";
import ReferralLinksPage from "./pages/referral-links-fixed";
import OptimizeLinksPage from "./pages/optimize-links-page";

import ThemesPage from "./pages/themes-page";
import SimpleThemesDemo from "./pages/simple-themes-demo";
import SupportPage from "./pages/support-page";
import PublicSupportPage from "./pages/public-support";
import AboutUsPage from "./pages/about-us";
import VisitorProfileWorking from "./pages/visitor-profile-working";
import VisitorProfileNew from "./pages/visitor-profile-new";
import TestVisitor from "./pages/test-visitor";
import EnhancedAdminPanel from "./pages/enhanced-admin-panel";
import ProfessionalAdminDashboard from "./pages/professional-admin-dashboard";
import AdminLogin from "./pages/admin-login";
import AcceptInvitePage from "./pages/accept-invite";
import { Toaster } from "@/components/ui/toaster";
import ScrollToTop from "@/components/ui/scroll-to-top";
import { AIChatbot } from "@/components/ai-chatbot";
import ContactPage from "./pages/contact-page";
import CookiePolicyPage from "./pages/cookie-policy-page";
import GDPRPage from "./pages/gdpr-page";
import MyLinksPage from "./pages/my-links";
import ForgotPasswordPage from "./pages/forgot-password";
import ResetPasswordPage from "./pages/reset-password";
import CollaborationPage from "./pages/collaboration-page";

// Deprecated landing page - use the new component instead
function OldLandingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-black dark:via-gray-900 dark:to-gray-800">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        <div className="mb-6">
          <div className="flex items-center justify-center mb-2">
            <h1 className="text-3xl font-bold text-blue-600">MyLinked</h1>
            <div className="bg-blue-100 text-blue-600 text-xs font-medium ml-2 px-2 py-1 rounded-full flex items-center">
              <Award className="w-3 h-3 mr-1" />
              <span>Social Score</span>
            </div>
          </div>
          <p className="text-gray-600">All your social links in one place</p>
        </div>

        <div className="mb-8">
          <div className="flex items-center mb-4">
            <div className="bg-blue-100 p-2 rounded-full mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-left text-gray-700">Create a personalized profile</p>
          </div>
          
          <div className="flex items-center mb-4">
            <div className="bg-blue-100 p-2 rounded-full mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-left text-gray-700">Add all your social media links</p>
          </div>
          
          <div className="flex items-center mb-4">
            <div className="bg-blue-100 p-2 rounded-full mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-left text-gray-700">Track engagement with analytics</p>
          </div>
          
          <div className="flex items-center">
            <div className="bg-blue-100 p-2 rounded-full mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-left text-gray-700">Improve with Social Score gamification</p>
          </div>
        </div>

        <a 
          href="/auth" 
          className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition duration-200 shadow-md"
        >
          Get Started
        </a>
      </div>
    </div>
  );
}

// Basic Loading component
function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
    </div>
  );
}

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <Loading />;
  }

  return (
    <>
      {/* This component will automatically scroll to top on route changes */}
      <ScrollToTop />
      
      <Switch>
        <Route path="/auth">
          {user ? <AIEnhancedDashboard /> : <AuthPage />}
        </Route>
        
        <Route path="/forgot-password" component={ForgotPasswordPage} />
        <Route path="/reset-password" component={ResetPasswordPage} />
        
        <Route path="/admin/login" component={AdminLogin} />
        <AdminProtectedRoute path="/admin" component={ProfessionalAdminDashboard} />
        <ProtectedRoute path="/admin-legacy" component={EnhancedAdminPanel} />
        <Route path="/accept-invite" component={AcceptInvitePage} />
        <ProtectedRoute path="/feed" component={LiveFeedPage} />
        <ProtectedRoute path="/branding" component={BrandingPage} />
        <ProtectedRoute path="/social-score" component={SocialScorePage} />
        <ProtectedRoute path="/analytics" component={AnalyticsPage} />
        {/* Public profile route - must come before protected /profile route */}
        <Route path="/profile/:username" component={VisitorProfileNew} />
        
        <ProtectedRoute path="/profile" component={ProfilePage} />
        <ProtectedRoute path="/settings" component={SettingsPage} />
        <ProtectedRoute path="/spotlight" component={SpotlightPage} />
        <Route path="/industry-discovery" component={IndustryExamples} />
        <Route path="/industry-discovery-demo" component={IndustryDiscoveryDemo} />
        <Route path="/industry-discovery-fixed" component={IndustryDiscoveryFixed} />
        <Route path="/industry-examples" component={IndustryExamples} />
        <ProtectedRoute path="/referral-links" component={ReferralLinksPage} />
        <ProtectedRoute path="/optimize-links" component={OptimizeLinksPage} />
        <ProtectedRoute path="/collaboration" component={CollaborationPage} />

        <ProtectedRoute path="/my-links" component={MyLinksPage} />
        <ProtectedRoute path="/themes" component={ThemesPage} />
        <ProtectedRoute path="/themes-demo" component={SimpleThemesDemo} />
        {/* Legal Pages - must come before username route */}
        <Route path="/support" component={SupportPage} />
        <Route path="/privacy-policy" component={PrivacyPolicy} />
        <Route path="/terms-of-service" component={TermsOfService} />
        <Route path="/help" component={PublicSupportPage} />
        <Route path="/about" component={AboutUsPage} />
        <Route path="/contact" component={ContactPage} />
        <Route path="/cookies" component={CookiePolicyPage} />
        <Route path="/gdpr" component={GDPRPage} />
        
        {/* Direct username access route - must be last */}
        <Route path="/:username" component={VisitorProfileNew} />
        
        <Route path="/">
          {user ? <AIEnhancedDashboard /> : <LandingPage />}
        </Route>
        
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  // Log that the App component is running
  console.log("App component rendering");

  try {
    return (
      <AuthProvider>
        <ThemeProvider>
          <Router />
          <AIChatbot />
          <Toaster />
        </ThemeProvider>
      </AuthProvider>
    );
  } catch (error) {
    console.error("Error in App component:", error);
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Application Error</h1>
        <p className="text-gray-800 mb-4">
          There was an error initializing the application. Please check the console for details.
        </p>
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-w-full">
          {error instanceof Error ? error.message : String(error)}
        </pre>
      </div>
    );
  }
}

export default App;
