import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect, useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { insertUserSchema } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ArrowLeft, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { FaGoogle, FaFacebook, FaTwitter, FaGithub } from "react-icons/fa";
const logoPath = "/assets/logo-horizontal.png";

// Extended schema for login form
const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Extended schema for registration form
const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
  confirmPassword: z.string(),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address").optional().nullable(),
  bio: z.string().optional().nullable(),
})
.refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { user, isLoading, loginMutation, registerMutation } = useAuth();
  const [location, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<string>("login");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  // Check for OAuth errors and success messages in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const message = urlParams.get('message');
    const auth = urlParams.get('auth');
    const provider = urlParams.get('provider');

    if (error) {
      if (error === 'facebook_permission_config') {
        setAuthError('Facebook login is temporarily unavailable. Please use Google login or create an account with username/password.');
      } else if (error === 'facebook_access_denied') {
        setAuthError('Facebook login was cancelled. Please try again or use an alternative sign-in method.');
      } else if (error.startsWith('facebook_')) {
        setAuthError('Facebook login encountered an issue. Please use Google login or create an account with username/password.');
      } else {
        setAuthError(message || 'Authentication failed. Please try again.');
      }
    }

    if (auth === 'success') {
      setAuthSuccess(`Successfully signed in${provider ? ` with ${provider}` : ''}!`);
      setTimeout(() => {
        const intendedPath = urlParams.get("redirect");
        navigate(intendedPath || "/");
      }, 1500);
    }

    // Clear URL parameters
    if (error || auth) {
      window.history.replaceState({}, '', '/auth');
    }
  }, [navigate]);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      const intendedPath = new URLSearchParams(window.location.search).get("redirect");
      navigate(intendedPath || "/");
    }
  }, [user, navigate]);

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      bio: "",
    },
  });

  // Handle login submission
  function onLoginSubmit(values: LoginFormValues) {
    loginMutation.mutate(values);
  }

  // Handle registration submission
  function onRegisterSubmit(values: RegisterFormValues) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { confirmPassword, ...data } = values;
    
    // Clean up data - ensure no null values are sent to the server
    const registerData = {
      username: data.username,
      password: data.password,
      name: data.name,
      email: data.email || undefined,  // Convert null to undefined
      bio: data.bio || undefined       // Convert null to undefined
    };
    
    console.log("Registration data:", registerData);
    registerMutation.mutate(registerData);
  }

  // Handle social login
  function handleSocialLogin(provider: string) {
    // Clear any previous errors
    setAuthError(null);
    
    // Redirect to backend social auth endpoint
    window.location.href = `/api/auth/${provider}`;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="grid lg:grid-cols-2 min-h-screen">
      {/* Auth Form */}
      <div className="flex items-center justify-center p-6 lg:p-8">
        <div className="mx-auto w-full max-w-sm space-y-6">
          <div className="relative">
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute -left-14 top-0" 
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="space-y-2 text-center">
              <div className="flex justify-center mb-4">
                <img 
                  src={logoPath} 
                  alt="MyLinked" 
                  className="h-12 w-auto"
                />
              </div>
              <p className="text-gray-500">
                Enter your details to {activeTab === "login" ? "sign in" : "create an account"}
              </p>
            </div>
          </div>

          {/* OAuth Error/Success Messages */}
          {authError && (
            <Alert className="border-red-200 bg-red-50 text-red-800">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{authError}</AlertDescription>
            </Alert>
          )}

          {authSuccess && (
            <Alert className="border-green-200 bg-green-50 text-green-800">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{authSuccess}</AlertDescription>
            </Alert>
          )}
          
          <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            {/* Login Form */}
            <TabsContent value="login" className="mt-6">
              {/* Social Login Buttons */}
              <div className="space-y-3 mb-6">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 bg-gradient-to-r from-blue-50 to-green-50 hover:from-blue-100 hover:to-green-100 border-blue-200 text-gray-700 font-semibold shadow-sm ring-1 ring-blue-200"
                  onClick={() => handleSocialLogin('google')}
                >
                  <FaGoogle className="mr-3 h-5 w-5 text-red-500" />
                  Continue with Google
                  <CheckCircle className="ml-2 h-4 w-4 text-green-500" />
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 bg-white hover:bg-gray-50 border-gray-200 text-gray-700 font-medium"
                  onClick={() => window.location.href = '/api/auth/facebook'}
                >
                  <FaFacebook className="mr-3 h-5 w-5 text-blue-600" />
                  Continue with Facebook
                </Button>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 bg-white hover:bg-gray-50 border-gray-200 text-gray-700 font-medium"
                    onClick={() => handleSocialLogin('twitter')}
                  >
                    <FaTwitter className="mr-2 h-4 w-4 text-blue-400" />
                    Twitter
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 bg-white hover:bg-gray-50 border-gray-200 text-gray-700 font-medium"
                    onClick={() => handleSocialLogin('github')}
                  >
                    <FaGithub className="mr-2 h-4 w-4 text-gray-800" />
                    GitHub
                  </Button>
                </div>
              </div>

              {/* Divider */}
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-4 text-gray-500">Or continue with email</span>
                </div>
              </div>

              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter your username" 
                            {...field} 
                            autoComplete="username"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="Enter your password" 
                            {...field} 
                            autoComplete="current-password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </form>
              </Form>
            </TabsContent>
            
            {/* Register Form */}
            <TabsContent value="register" className="mt-6">
              {/* Social Login Buttons */}
              <div className="space-y-3 mb-6">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 bg-gradient-to-r from-blue-50 to-green-50 hover:from-blue-100 hover:to-green-100 border-blue-200 text-gray-700 font-semibold shadow-sm ring-1 ring-blue-200"
                  onClick={() => handleSocialLogin('google')}
                >
                  <FaGoogle className="mr-3 h-5 w-5 text-red-500" />
                  Sign up with Google
                  <CheckCircle className="ml-2 h-4 w-4 text-green-500" />
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 bg-white hover:bg-gray-50 border-gray-200 text-gray-700 font-medium"
                  onClick={() => window.location.href = '/api/auth/facebook'}
                >
                  <FaFacebook className="mr-3 h-5 w-5 text-blue-600" />
                  Sign up with Facebook
                </Button>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 bg-white hover:bg-gray-50 border-gray-200 text-gray-700 font-medium"
                    onClick={() => handleSocialLogin('twitter')}
                  >
                    <FaTwitter className="mr-2 h-4 w-4 text-blue-400" />
                    Twitter
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 bg-white hover:bg-gray-50 border-gray-200 text-gray-700 font-medium"
                    onClick={() => handleSocialLogin('github')}
                  >
                    <FaGithub className="mr-2 h-4 w-4 text-gray-800" />
                    GitHub
                  </Button>
                </div>
              </div>

              {/* Divider */}
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-4 text-gray-500">Or create account with email</span>
                </div>
              </div>

              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                  <FormField
                    control={registerForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Choose a username" 
                            {...field} 
                            autoComplete="username"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registerForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter your full name" 
                            {...field} 
                            autoComplete="name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="Enter your email" 
                            {...field} 
                            autoComplete="email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="Create a password" 
                            {...field} 
                            autoComplete="new-password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registerForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="Confirm your password" 
                            {...field} 
                            autoComplete="new-password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registerForm.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Short Bio (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Tell us a bit about yourself" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Hero Section */}
      <div className="hidden lg:flex flex-col bg-gradient-to-br from-primary to-blue-600 text-white p-12 items-center justify-center relative">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMTAgOCkiIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCI+PGNpcmNsZSBzdHJva2U9IiMwMDAiIHN0cm9rZS1vcGFjaXR5PSIuMiIgY3g9IjE4MCIgY3k9IjE4MCIgcj0iMTgwIi8+PGNpcmNsZSBzdHJva2U9IiMwMDAiIHN0cm9rZS1vcGFjaXR5PSIuMiIgY3g9IjE4MCIgY3k9IjE4MCIgcj0iMTcwIi8+PGNpcmNsZSBzdHJva2U9IiMwMDAiIHN0cm9rZS1vcGFjaXR5PSIuMiIgY3g9IjE4MCIgY3k9IjE4MCIgcj0iMTYwIi8+PGNpcmNsZSBzdHJva2U9IiMwMDAiIHN0cm9rZS1vcGFjaXR5PSIuMiIgY3g9IjE4MCIgY3k9IjE4MCIgcj0iMTUwIi8+PGNpcmNsZSBzdHJva2U9IiMwMDAiIHN0cm9rZS1vcGFjaXR5PSIuMiIgY3g9IjE4MCIgY3k9IjE4MCIgcj0iMTQwIi8+PGNpcmNsZSBzdHJva2U9IiMwMDAiIHN0cm9rZS1vcGFjaXR5PSIuMiIgY3g9IjE4MCIgY3k9IjE4MCIgcj0iMTMwIi8+PGNpcmNsZSBzdHJva2U9IiMwMDAiIHN0cm9rZS1vcGFjaXR5PSIuMiIgY3g9IjE4MCIgY3k9IjE4MCIgcj0iMTIwIi8+PGNpcmNsZSBzdHJva2U9IiMwMDAiIHN0cm9rZS1vcGFjaXR5PSIuMiIgY3g9IjE4MCIgY3k9IjE4MCIgcj0iMTEwIi8+PGNpcmNsZSBzdHJva2U9IiMwMDAiIHN0cm9rZS1vcGFjaXR5PSIuMiIgY3g9IjE4MCIgY3k9IjE4MCIgcj0iMTAwIi8+PGNpcmNsZSBzdHJva2U9IiMwMDAiIHN0cm9rZS1vcGFjaXR5PSIuMiIgY3g9IjE4MCIgY3k9IjE4MCIgcj0iOTAiLz48Y2lyY2xlIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLW9wYWNpdHk9Ii4yIiBjeD0iMTgwIiBjeT0iMTgwIiByPSI4MCIvPjxjaXJjbGUgc3Ryb2tlPSIjMDAwIiBzdHJva2Utb3BhY2l0eT0iLjIiIGN4PSIxODAiIGN5PSIxODAiIHI9IjcwIi8+PGNpcmNsZSBzdHJva2U9IiMwMDAiIHN0cm9rZS1vcGFjaXR5PSIuMiIgY3g9IjE4MCIgY3k9IjE4MCIgcj0iNjAiLz48Y2lyY2xlIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLW9wYWNpdHk9Ii4yIiBjeD0iMTgwIiBjeT0iMTgwIiByPSI1MCIvPjxjaXJjbGUgc3Ryb2tlPSIjMDAwIiBzdHJva2Utb3BhY2l0eT0iLjIiIGN4PSIxODAiIGN5PSIxODAiIHI9IjQwIi8+PGNpcmNsZSBzdHJva2U9IiMwMDAiIHN0cm9rZS1vcGFjaXR5PSIuMiIgY3g9IjE4MCIgY3k9IjE4MCIgcj0iMzAiLz48Y2lyY2xlIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLW9wYWNpdHk9Ii4yIiBjeD0iMTgwIiBjeT0iMTgwIiByPSIyMCIvPjxjaXJjbGUgc3Ryb2tlPSIjMDAwIiBzdHJva2Utb3BhY2l0eT0iLjIiIGN4PSIxODAiIGN5PSIxODAiIHI9IjEwIi8+PC9nPjwvc3ZnPg==')] opacity-10"></div>
        <div className="z-10 max-w-lg text-center">
          <h2 className="text-4xl font-bold mb-6">All Your Links in One Place</h2>
          <p className="text-lg mb-8 text-white/90">
            Create a personalized profile to showcase all your social media and important links — making it easy for others to explore your digital presence.
          </p>
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 mr-3 bg-white/20 p-2 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </div>
              <p className="text-white/90">Customizable profile with multiple view modes</p>
            </div>
            <div className="flex items-center">
              <div className="flex-shrink-0 mr-3 bg-white/20 p-2 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9"></path>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                </svg>
              </div>
              <p className="text-white/90">Live previews of your social content</p>
            </div>
            <div className="flex items-center">
              <div className="flex-shrink-0 mr-3 bg-white/20 p-2 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20v-6M6 20V10M18 20V4"></path>
                </svg>
              </div>
              <p className="text-white/90">Track analytics and optimize your link performance</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}