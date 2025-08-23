import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Loader2, Shield, Mail, User, Lock } from "lucide-react";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const acceptInviteSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  name: z.string().min(2, "Name must be at least 2 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type AcceptInviteFormData = z.infer<typeof acceptInviteSchema>;

interface InvitationDetails {
  id: number;
  email: string;
  role: string;
  roleDisplayName: string;
  inviterName: string;
  organizationName: string;
  expiresAt: string;
  status: string;
}

export default function AcceptInvitePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [token, setToken] = useState<string>("");
  const [invitationDetails, setInvitationDetails] = useState<InvitationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const form = useForm<AcceptInviteFormData>({
    resolver: zodResolver(acceptInviteSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      name: "",
    },
  });

  // Extract token from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const inviteToken = urlParams.get('token');
    
    if (!inviteToken) {
      setError("Invalid invitation link");
      setLoading(false);
      return;
    }
    
    setToken(inviteToken);
    fetchInvitationDetails(inviteToken);
  }, []);

  const fetchInvitationDetails = async (inviteToken: string) => {
    try {
      const response = await fetch(`/api/admin/invitation/${inviteToken}`, {
        credentials: 'include',
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch invitation details");
      }
      
      setInvitationDetails(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load invitation");
    } finally {
      setLoading(false);
    }
  };

  const acceptInviteMutation = useMutation({
    mutationFn: async (formData: AcceptInviteFormData) => {
      const response = await apiRequest("POST", "/api/admin/accept-invitation", {
        token,
        ...formData,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Welcome to MyLinked!",
        description: `Your account has been created with ${invitationDetails?.roleDisplayName} privileges.`,
      });
      
      // Redirect to login or dashboard
      setTimeout(() => {
        setLocation("/auth");
      }, 2000);
    },
    onError: (error: Error) => {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AcceptInviteFormData) => {
    acceptInviteMutation.mutate(data);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Card className="w-96">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !invitationDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Card className="w-96">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <CardTitle>Invalid Invitation</CardTitle>
            <CardDescription>
              {error || "This invitation link is invalid or has expired."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setLocation("/")} 
              className="w-full"
            >
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if invitation is expired
  const isExpired = new Date(invitationDetails.expiresAt) < new Date();
  const isAccepted = invitationDetails.status === 'accepted';
  const isCancelled = invitationDetails.status === 'cancelled';

  if (isExpired || isAccepted || isCancelled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Card className="w-96">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <CardTitle>Invitation Unavailable</CardTitle>
            <CardDescription>
              {isExpired && "This invitation has expired."}
              {isAccepted && "This invitation has already been accepted."}
              {isCancelled && "This invitation has been cancelled."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setLocation("/")} 
              className="w-full"
            >
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl">Accept Invitation</CardTitle>
          <CardDescription>
            You've been invited to join {invitationDetails.organizationName}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Invitation Details */}
          <div className="bg-slate-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-slate-500" />
              <span className="text-sm text-slate-600">Email:</span>
              <span className="text-sm font-medium">{invitationDetails.email}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-slate-500" />
              <span className="text-sm text-slate-600">Invited by:</span>
              <span className="text-sm font-medium">{invitationDetails.inviterName}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-slate-500" />
              <span className="text-sm text-slate-600">Role:</span>
              <Badge variant="outline">{invitationDetails.roleDisplayName}</Badge>
            </div>
          </div>

          {/* Registration Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Choose a username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Create a password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Confirm your password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full" 
                disabled={acceptInviteMutation.isPending}
              >
                {acceptInviteMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Accept Invitation & Create Account
                  </>
                )}
              </Button>
            </form>
          </Form>

          <div className="text-center">
            <p className="text-xs text-slate-500">
              By accepting this invitation, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}