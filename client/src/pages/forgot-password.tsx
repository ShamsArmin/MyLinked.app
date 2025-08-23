import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { ArrowLeft, Mail } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [, setLocation] = useLocation();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const form = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: ForgotPasswordForm) => {
      const response = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send reset email");
      }
      
      return response.json();
    },
    onSuccess: () => {
      setIsSubmitted(true);
      setErrorMessage(null);
    },
    onError: (error: any) => {
      console.error("Forgot password error:", error);
      setErrorMessage(error.message || "Failed to send reset email. Please try again.");
    },
  });

  const onSubmit = (data: ForgotPasswordForm) => {
    setErrorMessage(null);
    forgotPasswordMutation.mutate(data);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg shadow-xl border-white/20 dark:border-gray-700/50">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <Mail className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Check Your Email
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <p className="text-gray-600 dark:text-gray-300">
                If an account with this email exists, you will receive a password reset link shortly.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Check your spam folder if you don't see the email in your inbox.
              </p>
              <Button
                onClick={() => setLocation("/auth")}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium"
              >
                Back to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg shadow-xl border-white/20 dark:border-gray-700/50">
          <CardHeader className="text-center space-y-4">
            {/* Logo */}
            <div className="flex justify-center">
              <img 
                src="/assets/logo-horizontal.png" 
                alt="MyLinked" 
                className="h-12 object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                  (e.currentTarget.nextElementSibling as HTMLElement)!.style.display = 'block';
                }}
              />
              <div 
                className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hidden"
              >
                MyLinked
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              Forgot Password
            </CardTitle>
            <p className="text-gray-600 dark:text-gray-300">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </CardHeader>

          <CardContent>
            {errorMessage && (
              <Alert className="mb-6 border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
                <AlertDescription className="text-red-800 dark:text-red-300">
                  {errorMessage}
                </AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Enter your email address"
                          {...field}
                          autoComplete="email"
                          className="h-12"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium"
                  disabled={forgotPasswordMutation.isPending}
                >
                  {forgotPasswordMutation.isPending ? "Sending..." : "Send Reset Link"}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full h-12 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
                  onClick={() => setLocation("/auth")}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Login
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}