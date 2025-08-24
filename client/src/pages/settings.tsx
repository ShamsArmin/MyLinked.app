import React, { useEffect, useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { UpdateUser, User } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Cropper from 'react-easy-crop';
import { useLocation, Link } from "wouter";
import { Loader2, User as UserIcon, Lock, Bell, Shield, Camera, Upload, Briefcase, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { PitchModeSync } from "@/components/pitch-mode-sync";
import { useToast } from "@/hooks/use-toast";
const logoPath = "/assets/logo-horizontal.png";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";


// Define the area type for cropping
interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function Settings() {
  const { user, isLoading: authLoading, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // Check for URL parameters to set initial tab
  const urlParams = new URLSearchParams(window.location.search);
  const tabParam = urlParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || "profile");
  
  // State for image cropping
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropType, setCropType] = useState<'profile' | 'background'>('profile');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  
  useEffect(() => {
    if (!authLoading && !user) {
      console.log("User not authenticated, redirecting to auth page");
      navigate("/auth");
      return;
    }
  }, [user, authLoading, navigate]);

  // Show loading while authentication is being determined
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If user is not authenticated, don't render anything (redirect will handle it)
  if (!user) {
    return null;
  }

  // Return the main settings component now that we know user is authenticated
  return <SettingsComponent user={user} />;
}

// Separate component that handles profile loading and settings UI
function SettingsComponent({ user }: { user: any }) {
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Check for URL parameters to set initial tab
  const urlParams = new URLSearchParams(window.location.search);
  const tabParam = urlParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || "profile");
  
  // State for image cropping
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropType, setCropType] = useState<'profile' | 'background'>('profile');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  // State for password visibility
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Fetch the user's profile with proper error handling
  const { 
    data: profile, 
    isLoading: isProfileLoading,
    error: profileError,
    isError: isProfileError 
  } = useQuery<User>({
    queryKey: ["/api/profile"],
    enabled: !!user,
    retry: (failureCount, error: any) => {
      // Don't retry on authentication errors
      if (error?.status === 401 || error?.message?.includes('401')) {
        console.log("Profile fetch failed due to authentication, redirecting to login");
        navigate("/auth");
        return false;
      }
      return failureCount < 2;
    },
    staleTime: 30000, // 30 seconds
  });

  // Define validation schema for profile form
  const profileFormSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    bio: z.string().max(160, "Bio must be 160 characters or less").optional(),
    profileImage: z.string().optional().nullable(),
    profileBackground: z.string().optional().nullable(),
    showSocialScore: z.boolean().optional(),
  });

  // Define validation schema for account form
  const accountFormSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    username: z.string().min(3, "Username must be at least 3 characters"),
    email: z.string().email("Please enter a valid email address").optional(),
  });

  // Define validation schema for security form
  const securityFormSchema = z.object({
    currentPassword: z.string().min(6, "Password must be at least 6 characters"),
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

  // Create profile form
  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: profile?.name || "",
      bio: profile?.bio || "",
      profileImage: profile?.profileImage || "",
      profileBackground: profile?.profileBackground || "",
      showSocialScore: profile?.showSocialScore || false,
    },
  });

  // Create account form
  const accountForm = useForm<z.infer<typeof accountFormSchema>>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      name: profile?.name || "",
      username: profile?.username || "",
      email: "", // Email not implemented yet
    },
  });

  // Create security form
  const securityForm = useForm<z.infer<typeof securityFormSchema>>({
    resolver: zodResolver(securityFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Handle file selection for images
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'background') => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      // Check file size (limit to 5MB to avoid 413 errors)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive"
        });
        return;
      }
      
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        // Both profile and background now use cropper
        setCropType(type);
        setImageSrc(reader.result as string);
        setCropperOpen(true);
      });
      reader.readAsDataURL(file);
    }
  };

  // This function will be called when the user is done cropping the image
  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Create the cropped image when user clicks "Apply"
  const createCroppedImage = async () => {
    try {
      if (imageSrc && croppedAreaPixels) {
        const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
        if (croppedImage) {
          // Set the appropriate form field based on crop type
          if (cropType === 'profile') {
            profileForm.setValue('profileImage', croppedImage);
            toast({
              title: "Profile image updated",
              description: "Your profile image has been cropped and updated."
            });
          } else {
            profileForm.setValue('profileBackground', croppedImage);
            toast({
              title: "Background image updated",
              description: "Your background image has been cropped and updated."
            });
          }
          setCropperOpen(false);
        }
      }
    } catch (e) {
      console.error('Error creating cropped image:', e);
      toast({
        title: "Error",
        description: "There was an error processing your image.",
        variant: "destructive"
      });
    }
  };

  // Update profile when it's loaded
  useEffect(() => {
    if (profile) {
      profileForm.reset({
        name: profile.name || "",
        bio: profile.bio || "",
        profileImage: profile.profileImage || "",
        profileBackground: profile.profileBackground || "",
        showSocialScore: profile.showSocialScore || false,
      });
      
      accountForm.reset({
        name: profile.name || "",
        username: profile.username || "",
        email: "", // Email not implemented yet
      });
    }
  }, [profile, profileForm, accountForm]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updates: UpdateUser) => {
      console.log('Sending profile update to API:', updates);
      const res = await apiRequest("PATCH", "/api/profile", updates);
      const result = await res.json();
      console.log('API response:', result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle profile form submission
  const onProfileSubmit = (data: z.infer<typeof profileFormSchema>) => {
    console.log('Profile form submission data:', data);
    console.log('showSocialScore value:', data.showSocialScore);
    updateProfileMutation.mutate(data);
  };

  // Add form validation debugging
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submit triggered');
    console.log('Form errors:', profileForm.formState.errors);
    console.log('Form values:', profileForm.getValues());
    profileForm.handleSubmit(onProfileSubmit)(e);
  };

  // Handle account form submission
  const onAccountSubmit = (data: z.infer<typeof accountFormSchema>) => {
    const updates: any = {};
    
    // Update profile with name if changed
    if (data.name !== profile?.name) {
      updates.name = data.name;
    }
    
    // Update username if changed
    if (data.username !== profile?.username) {
      updates.username = data.username;
    }
    
    // Only make the API call if there are actual changes
    if (Object.keys(updates).length > 0) {
      updateProfileMutation.mutate(updates);
    } else {
      toast({
        title: "No changes",
        description: "No changes were made to your account.",
      });
    }
  };

  // Password change mutation
  const passwordChangeMutation = useMutation({
    mutationFn: async (data: z.infer<typeof securityFormSchema>) => {
      const { currentPassword, newPassword } = data;
      const res = await apiRequest("POST", "/api/change-password", {
        currentPassword,
        newPassword
      });
      return await res.json();
    },
    onSuccess: () => {
      // Reset the form
      securityForm.reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      
      // Show success message
      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Password change failed",
        description: error.message || "Please check your current password and try again.",
        variant: "destructive",
      });
    },
  });

  // Handle security form submission
  const onSecuritySubmit = (data: z.infer<typeof securityFormSchema>) => {
    passwordChangeMutation.mutate(data);
  };

  // Delete account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      console.log("Starting account deletion API call");
      const res = await apiRequest("DELETE", "/api/profile");
      const result = await res.json();
      console.log("Account deletion API response:", result);
      return result;
    },
    onSuccess: (data) => {
      console.log("Account deletion successful:", data);
      toast({
        title: "Account deleted",
        description: "Your account has been permanently deleted.",
      });
      
      // Redirect to homepage after successful deletion
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    },
    onError: (error: Error) => {
      console.error("Account deletion failed:", error);
      toast({
        title: "Deletion failed",
        description: error.message || "Failed to delete account. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle account deletion with enhanced confirmation
  const handleDeleteAccount = () => {
    console.log("Delete account button clicked");
    
    // First check if user is authenticated
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to delete your account.",
        variant: "destructive",
      });
      return;
    }
    
    const confirmation = window.confirm(
      "⚠️ WARNING: This will permanently delete your account and ALL data including:\n\n" +
      "• Your profile and personal information\n" +
      "• All your links and analytics\n" +
      "• Spotlight projects and collaborations\n" +
      "• Social connections and referral links\n" +
      "• All settings and preferences\n\n" +
      "This action CANNOT be undone. Are you absolutely sure you want to proceed?"
    );
    
    if (confirmation) {
      const finalConfirmation = window.confirm(
        "Last chance to cancel!\n\n" +
        "Type 'DELETE' in your mind and click OK to permanently delete your account, or Cancel to keep your account safe."
      );
      
      if (finalConfirmation) {
        console.log("Proceeding with account deletion");
        deleteAccountMutation.mutate();
      }
    }
  };

  // State for notification preferences
  const [notificationPreferences, setNotificationPreferences] = useState({
    emailNotifications: false,
    linkReports: false,
    securityAlerts: true,
    realtimeClicks: false,
    profileViews: false,
    featureUpdates: true
  });
  
  // Default notification preferences
  const defaultNotificationPreferences = {
    emailNotifications: false,
    linkReports: false,
    securityAlerts: true,
    realtimeClicks: false,
    profileViews: false,
    featureUpdates: true
  };
  
  // Handle save notification preferences
  const handleSaveNotificationPreferences = () => {
    // In a real app, this would call an API to save the preferences
    toast({
      title: "Preferences saved",
      description: "Your notification preferences have been saved."
    });
  };
  
  // Handle reset notification preferences
  const handleResetNotificationPreferences = () => {
    setNotificationPreferences(defaultNotificationPreferences);
    toast({
      title: "Preferences reset",
      description: "Your notification preferences have been reset to defaults."
    });
  };
  
  // Handle cloud storage option clicks
  const handleCloudStorageClick = (service: string) => {
    toast({
      title: `${service} Integration`,
      description: `${service} integration will be available soon!`,
    });
  };

  // Authentication is already handled in the parent component
  
  // If no user is logged in, redirect to auth page is handled by useEffect
  
  // If data is loading
  if (isProfileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading settings...</span>
      </div>
    );
  }

  // Handle errors - if authentication error, redirect to login
  if (isProfileError) {
    const errorMessage = profileError?.message || "Failed to load settings";
    
    // If it's an authentication error, redirect to login
    if ((profileError as any)?.status === 401 || errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
      navigate("/auth");
      return null;
    }
    
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
        <p className="text-gray-600 mb-6 text-center">{errorMessage}</p>
        <div className="flex gap-4">
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium"
          >
            Try Again
          </button>
          <button 
            onClick={() => navigate("/auth")}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium border"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 text-base-content">
      {/* Header */}
      <header className="border-b bg-base-100">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate("/")}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <img 
                src={`/assets/logo-horizontal.png?v=${Date.now()}`}
                alt="MyLinked" 
                className="h-8 w-auto"
                style={{ imageRendering: 'crisp-edges' }}
                onLoad={() => console.log('Settings logo loaded successfully')}
                onError={(e) => {
                  console.error('Settings logo failed to load:', e);
                  console.log('Trying fallback logo path');
                  const img = e.currentTarget as HTMLImageElement;
                  img.src = '/assets/logo-compact.png';
                  img.onerror = () => {
                    // Final fallback to text
                    img.style.display = 'none';
                    const fallback = document.createElement('div');
                    fallback.className = 'font-bold text-lg bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent';
                    fallback.textContent = 'MyLinked';
                    img.parentNode?.appendChild(fallback);
                  };
                }}
              />
            </div>
          </div>
        </div>
      </header>
      
      {/* Image Cropper Dialog */}
      <Dialog open={cropperOpen} onOpenChange={setCropperOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Crop Image</DialogTitle>
          </DialogHeader>
          <div className="relative w-full h-64 my-4">
            {imageSrc && (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={cropType === 'profile' ? 1 : 16/9}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            )}
          </div>
          <div className="mt-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Zoom:</span>
              <div className="flex-1">
                <Slider 
                  value={[zoom]} 
                  min={1} 
                  max={3} 
                  step={0.1} 
                  onValueChange={(value) => setZoom(value[0] || 1)} 
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCropperOpen(false)}>Cancel</Button>
            <Button onClick={createCroppedImage}>Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <main className="flex-1 py-6 px-4 md:px-6 bg-base-100">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-8">
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-base-content mb-2">
              Settings
            </h1>
            <p className="text-base-content/70">Manage your account settings and preferences</p>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-8 flex flex-wrap">
              <TabsTrigger value="profile" className="flex items-center gap-2 min-w-[120px]">
                <UserIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Profile</span>
              </TabsTrigger>
              <TabsTrigger value="account" className="flex items-center gap-2 min-w-[120px]">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Account</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2 min-w-[120px]">
                <Lock className="h-4 w-4" />
                <span className="hidden sm:inline">Security</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2 min-w-[120px]">
                <Bell className="h-4 w-4" />
                <span className="hidden sm:inline">Notifications</span>
              </TabsTrigger>
              <TabsTrigger value="pitch-mode" className="flex items-center gap-2 min-w-[120px]">
                <Briefcase className="h-4 w-4" />
                <span className="hidden sm:inline">Pitch Mode</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your profile information and how others see you
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...profileForm}>
                    <form onSubmit={handleFormSubmit} className="space-y-6">
                      <FormField
                        control={profileForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormDescription>
                              This is your public display name
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="bio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bio</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Tell others a bit about yourself"
                                className="min-h-32 resize-none"
                                {...field}
                                value={field.value || ''}
                                maxLength={160}
                              />
                            </FormControl>
                            <FormDescription>
                              A short bio to introduce yourself to others (max 160 characters)
                              <span className="block text-sm text-base-content/70">
                                {(field.value || '').length}/160 characters
                              </span>
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* Social Score Visibility Toggle */}
                      <FormField
                        control={profileForm.control}
                        name="showSocialScore"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                Show Social Score on My Public Profile
                              </FormLabel>
                              <FormDescription>
                                Control whether your Social Score is visible to visitors on your public profile page
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={(value) => {
                                  console.log('Switch toggled to:', value);
                                  field.onChange(value);
                                }}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="profileImage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Profile Image</FormLabel>
                            <div className="space-y-4">
                              {/* Image preview */}
                              {field.value && (
                                <div className="w-24 h-24 rounded-full overflow-hidden border border-gray-200 mb-2">
                                  <img 
                                    src={field.value} 
                                    alt="Profile preview" 
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                              
                              {/* File upload */}
                              <div className="flex flex-col space-y-2">
                                <div className="flex items-center space-x-2">
                                  <div className="relative flex-1">
                                    <Input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => onFileChange(e, 'profile')}
                                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                                    />
                                    <Button
                                      type="button"
                                      variant="outline"
                                      className="w-full flex items-center justify-center"
                                    >
                                      <Camera className="mr-2 h-4 w-4" />
                                      Choose Profile Image
                                    </Button>
                                  </div>
                                  {field.value && (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        field.onChange("");
                                      }}
                                    >
                                      Clear
                                    </Button>
                                  )}
                                </div>
                                <FormDescription>
                                  Upload your profile picture (recommended size: 500×500px)
                                </FormDescription>
                                
                                {/* Cloud storage options */}
                                <div className="mt-2 flex flex-wrap gap-2">
                                  <Button 
                                    type="button" 
                                    variant="outline" 
                                    size="sm"
                                    className="flex items-center gap-1"
                                    onClick={() => handleCloudStorageClick("Google Drive")}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                                      <path d="M12.01 1.485c-2.082 0-3.825 1.070-4.889 2.684L.55 14.041a6.744 6.744 0 0 0-.55 2.683c0 3.744 3.076 6.773 6.813 6.773 2.065 0 3.825-1.070 4.889-2.684l6.571-9.872c.361-.542.55-1.214.55-1.867 0-1.903-1.574-3.458-3.45-3.458H12.01v-3.13z" fill="#EA4335" />
                                      <path d="M23.409 14.023h-9.349l-4.201 6.31c1.066 1.597 2.826 2.684 4.889 2.684h3.077c3.737 0 6.813-3.028 6.813-6.773 0-.885-.413-1.718-1.23-2.22z" fill="#34A853" />
                                      <path d="M7.152 12.3h9.349l4.201-6.31C19.636 4.41 17.876 3.306 15.813 3.306h-3.077c-3.737 0-6.813 3.045-6.813 6.79 0 .868.413 1.7 1.23 2.203z" fill="#FBBC05" />
                                      <path d="M16.582 12.3H7.233L.662 22.19c1.066 1.597 2.826 2.684 4.889 2.684h11.03a6.741 6.741 0 0 0 6.263-4.185L16.581 12.3z" fill="#4285F4" />
                                    </svg>
                                    Google Drive
                                  </Button>
                                  
                                  <Button 
                                    type="button" 
                                    variant="outline" 
                                    size="sm"
                                    className="flex items-center gap-1"
                                    onClick={() => handleCloudStorageClick("Dropbox")}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                                      <path d="M6 2L0 6l6 4-6 4 6 4 6-4-6-4 6-4zm12 4l-6-4-6 4 6 4zm0 8l-6 4-6-4 6-4z" fill="#0061FF" />
                                    </svg>
                                    Dropbox
                                  </Button>
                                  
                                  <Button 
                                    type="button" 
                                    variant="outline" 
                                    size="sm"
                                    className="flex items-center gap-1"
                                    onClick={() => handleCloudStorageClick("OneDrive")}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                                      <path d="M10.5 18.2L7.7 15.4 3.5 17.5 3.5 6.8 10.5 3 16.5 5.7 21.5 3 21.5 13.7 16.5 17.4 10.5 18.2z" fill="#0364B8" />
                                    </svg>
                                    OneDrive
                                  </Button>
                                </div>
                              </div>
                              
                              {/* URL input */}
                              <div>
                                <FormLabel className="text-sm text-gray-500">Or enter a URL</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="https://example.com/profile.jpg"
                                    {...field}
                                    value={field.value || ''}
                                  />
                                </FormControl>
                              </div>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="profileBackground"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Profile Background Image</FormLabel>
                            <div className="space-y-4">
                              {/* Image preview */}
                              {field.value && (
                                <div className="rounded-md overflow-hidden border border-gray-200 mb-2 h-32">
                                  <img 
                                    src={field.value} 
                                    alt="Background preview" 
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                              
                              {/* File upload */}
                              <div className="flex flex-col space-y-2">
                                <div className="flex items-center space-x-2">
                                  <div className="relative flex-1">
                                    <Input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => onFileChange(e, 'background')}
                                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                                    />
                                    <Button
                                      type="button"
                                      variant="outline"
                                      className="w-full flex items-center justify-center"
                                    >
                                      <Upload className="mr-2 h-4 w-4" />
                                      Choose Background Image
                                    </Button>
                                  </div>
                                  {field.value && (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        field.onChange("");
                                      }}
                                    >
                                      Clear
                                    </Button>
                                  )}
                                </div>
                                <FormDescription>
                                  Upload your background image (recommended size: 1920×1080px)
                                </FormDescription>
                                
                                {/* Cloud storage options */}
                                <div className="mt-2 flex flex-wrap gap-2">
                                  <Button 
                                    type="button" 
                                    variant="outline" 
                                    size="sm"
                                    className="flex items-center gap-1"
                                    onClick={() => handleCloudStorageClick("Google Drive")}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                                      <path d="M12.01 1.485c-2.082 0-3.825 1.070-4.889 2.684L.55 14.041a6.744 6.744 0 0 0-.55 2.683c0 3.744 3.076 6.773 6.813 6.773 2.065 0 3.825-1.070 4.889-2.684l6.571-9.872c.361-.542.55-1.214.55-1.867 0-1.903-1.574-3.458-3.45-3.458H12.01v-3.13z" fill="#EA4335" />
                                      <path d="M23.409 14.023h-9.349l-4.201 6.31c1.066 1.597 2.826 2.684 4.889 2.684h3.077c3.737 0 6.813-3.028 6.813-6.773 0-.885-.413-1.718-1.23-2.22z" fill="#34A853" />
                                      <path d="M7.152 12.3h9.349l4.201-6.31C19.636 4.41 17.876 3.306 15.813 3.306h-3.077c-3.737 0-6.813 3.045-6.813 6.79 0 .868.413 1.7 1.23 2.203z" fill="#FBBC05" />
                                      <path d="M16.582 12.3H7.233L.662 22.19c1.066 1.597 2.826 2.684 4.889 2.684h11.03a6.741 6.741 0 0 0 6.263-4.185L16.581 12.3z" fill="#4285F4" />
                                    </svg>
                                    Google Drive
                                  </Button>
                                  
                                  <Button 
                                    type="button" 
                                    variant="outline" 
                                    size="sm"
                                    className="flex items-center gap-1"
                                    onClick={() => handleCloudStorageClick("Unsplash")}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                                      <path d="M7.5 6.75V0h9v6.75h-9zm9 3.75H24V24H0V10.5h7.5v6.75h9V10.5z"/>
                                    </svg>
                                    Unsplash
                                  </Button>
                                  
                                  <Button 
                                    type="button" 
                                    variant="outline" 
                                    size="sm"
                                    className="flex items-center gap-1"
                                    onClick={() => handleCloudStorageClick("Pexels")}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                                      <path d="M9.6 8.4a2.4 2.4 0 1 0 4.8 0 2.4 2.4 0 0 0-4.8 0zm6 0a3.6 3.6 0 1 1-7.2 0 3.6 3.6 0 0 1 7.2 0zM0 19.2a3.6 3.6 0 0 0 3.6-3.6V7.2A3.6 3.6 0 0 0 0 3.6v15.6zm3.6-14.4v10.8a2.4 2.4 0 0 1-2.4 2.4V4.8a2.4 2.4 0 0 1 2.4 0zm3.6 14.4h15.6a3.6 3.6 0 0 0-3.6-3.6H7.2a3.6 3.6 0 0 0 0 7.2v-3.6zm0 0h13.2a2.4 2.4 0 0 1-2.4 2.4H7.2a2.4 2.4 0 0 1 0-4.8v2.4zm13.2-12a3.6 3.6 0 0 0-3.6-3.6H7.2a3.6 3.6 0 0 0 0 7.2h9.6a3.6 3.6 0 0 0 3.6-3.6zm-14.4 0a2.4 2.4 0 0 1 2.4-2.4h9.6a2.4 2.4 0 1 1 0 4.8H8.4a2.4 2.4 0 0 1-2.4-2.4z" fill="#05A081"/>
                                    </svg>
                                    Pexels
                                  </Button>
                                </div>
                              </div>
                              
                              {/* URL input */}
                              <div>
                                <FormLabel className="text-sm text-gray-500">Or enter a URL</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="https://example.com/background.jpg"
                                    {...field}
                                    value={field.value || ''}
                                  />
                                </FormControl>
                              </div>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* Save Changes Button for Profile Settings - moved to end */}
                      <div className="flex justify-end pt-4">
                        <Button 
                          type="submit" 
                          className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
                          disabled={updateProfileMutation.isPending}
                        >
                          {updateProfileMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            "Save Changes"
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="account">
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                  <CardDescription>
                    Update your account details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...accountForm}>
                    <form onSubmit={accountForm.handleSubmit(onAccountSubmit)} className="space-y-6">
                      <FormField
                        control={accountForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormDescription>
                              Your name as shown on your profile
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={accountForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormDescription>
                              This is your unique username for your profile URL
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={accountForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input 
                                type="email" 
                                {...field} 
                                placeholder="your.email@example.com" 
                              />
                            </FormControl>
                            <FormDescription>
                              Your email address for notifications and account recovery
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full sm:w-auto"
                        disabled={updateProfileMutation.isPending}
                      >
                        {updateProfileMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Changes"
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-red-600">Danger Zone</CardTitle>
                  <CardDescription>
                    Permanently delete your account and all data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Once you delete your account, there is no going back. All of your data will be permanently removed.
                  </p>
                  <Button 
                    variant="destructive"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log("Button clicked, calling handleDeleteAccount");
                      handleDeleteAccount();
                    }}
                    disabled={deleteAccountMutation.isPending}
                  >
                    {deleteAccountMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting Account...
                      </>
                    ) : (
                      "Delete Account"
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>
                    Update your password and security settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...securityForm}>
                    <form onSubmit={securityForm.handleSubmit(onSecuritySubmit)} className="space-y-6">
                      <FormField
                        control={securityForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  type={showCurrentPassword ? "text" : "password"} 
                                  {...field} 
                                  className="pr-12"
                                />
                                <button
                                  type="button"
                                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 focus:outline-none focus:text-gray-700 cursor-pointer z-10"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setShowCurrentPassword(!showCurrentPassword);
                                  }}
                                  onMouseDown={(e) => e.preventDefault()}
                                >
                                  {showCurrentPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                            </FormControl>
                            <FormDescription>
                              Enter your current password to confirm changes
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={securityForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  type={showNewPassword ? "text" : "password"} 
                                  {...field} 
                                  className="pr-12"
                                />
                                <button
                                  type="button"
                                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 focus:outline-none focus:text-gray-700 cursor-pointer z-10"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setShowNewPassword(!showNewPassword);
                                  }}
                                  onMouseDown={(e) => e.preventDefault()}
                                >
                                  {showNewPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                            </FormControl>
                            <FormDescription>
                              Password must be at least 6 characters
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={securityForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm New Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  type={showConfirmPassword ? "text" : "password"} 
                                  {...field} 
                                  className="pr-12"
                                />
                                <button
                                  type="button"
                                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 focus:outline-none focus:text-gray-700 cursor-pointer z-10"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setShowConfirmPassword(!showConfirmPassword);
                                  }}
                                  onMouseDown={(e) => e.preventDefault()}
                                >
                                  {showConfirmPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full sm:w-auto"
                      >
                        Update Password
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>
                    Manage how and when you receive notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Email Notifications</h3>
                    <div className="grid gap-4">
                      <div className="flex items-center justify-between space-x-2">
                        <div>
                          <h4 className="text-sm font-medium">Profile Activity</h4>
                          <p className="text-sm text-gray-500">Receive email notifications about profile views and interactions</p>
                        </div>
                        <Switch 
                          id="email-notifications" 
                          checked={notificationPreferences.emailNotifications}
                          onCheckedChange={(checked) => setNotificationPreferences(prev => ({
                            ...prev,
                            emailNotifications: checked
                          }))}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between space-x-2">
                        <div>
                          <h4 className="text-sm font-medium">Link Click Reports</h4>
                          <p className="text-sm text-gray-500">Get daily or weekly reports of your link clicks</p>
                        </div>
                        <Switch 
                          id="link-reports" 
                          checked={notificationPreferences.linkReports}
                          onCheckedChange={(checked) => setNotificationPreferences(prev => ({
                            ...prev,
                            linkReports: checked
                          }))}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between space-x-2">
                        <div>
                          <h4 className="text-sm font-medium">Security Alerts</h4>
                          <p className="text-sm text-gray-500">Get notified about security-related events for your account</p>
                        </div>
                        <Switch 
                          id="security-alerts" 
                          checked={notificationPreferences.securityAlerts}
                          onCheckedChange={(checked) => setNotificationPreferences(prev => ({
                            ...prev,
                            securityAlerts: checked
                          }))}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">In-app Notifications</h3>
                    <div className="grid gap-4">
                      <div className="flex items-center justify-between space-x-2">
                        <div>
                          <h4 className="text-sm font-medium">Real-time Link Clicks</h4>
                          <p className="text-sm text-gray-500">Show notifications when someone clicks on your links</p>
                        </div>
                        <Switch 
                          id="realtime-clicks" 
                          checked={notificationPreferences.realtimeClicks}
                          onCheckedChange={(checked) => setNotificationPreferences(prev => ({
                            ...prev,
                            realtimeClicks: checked
                          }))}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between space-x-2">
                        <div>
                          <h4 className="text-sm font-medium">Profile Views</h4>
                          <p className="text-sm text-gray-500">Show notifications when someone views your profile</p>
                        </div>
                        <Switch 
                          id="profile-views"
                          checked={notificationPreferences.profileViews}
                          onCheckedChange={(checked) => setNotificationPreferences(prev => ({
                            ...prev,
                            profileViews: checked
                          }))}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between space-x-2">
                        <div>
                          <h4 className="text-sm font-medium">New Features & Updates</h4>
                          <p className="text-sm text-gray-500">Receive notifications about new app features and updates</p>
                        </div>
                        <Switch 
                          id="feature-updates" 
                          checked={notificationPreferences.featureUpdates}
                          onCheckedChange={(checked) => setNotificationPreferences(prev => ({
                            ...prev,
                            featureUpdates: checked
                          }))}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
                    <Button type="button" onClick={handleSaveNotificationPreferences}>
                      Save Preferences
                    </Button>
                    
                    <Button variant="outline" type="button" onClick={handleResetNotificationPreferences}>
                      Reset to Defaults
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="pitch-mode">
              <div className="space-y-6">
                <PitchModeSync variant="settings" />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="py-6 px-4 md:px-6 bg-base-100 border-t">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="font-bold text-lg bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                  MyLinked
                </div>
              </div>
              <p className="text-sm text-base-content/70 mt-1">© {new Date().getFullYear()} MyLinked. All rights reserved.</p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link to="/terms-of-service" className="text-sm text-base-content/70 hover:text-primary transition-colors">Terms of Service</Link>
              <Link to="/privacy-policy" className="text-sm text-base-content/70 hover:text-primary transition-colors">Privacy Policy</Link>
              <span className="text-sm text-base-content/70">Help Center</span>
              <span className="text-sm text-base-content/70">Contact</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Helper function to create a cropped image from the image source and cropped area pixel
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous'); // To avoid CORS issues
    image.src = url;
  });

const getCroppedImg = async (imageSrc: string, pixelCrop: Area): Promise<string | null> => {
  try {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return null;
    }

    // Set canvas size to the cropped size
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    // Draw the cropped image onto the canvas
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    // Return the data URL for the cropped image
    return canvas.toDataURL('image/jpeg', 0.9);
  } catch (e) {
    console.error('Error cropping image:', e);
    return null;
  }
};