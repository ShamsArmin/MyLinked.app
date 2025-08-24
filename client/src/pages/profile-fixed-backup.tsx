import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { User, Link } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Edit3, 
  Save, 
  User as UserIcon, 
  Settings, 
  Palette, 
  Eye, 
  MessageCircle, 
  ExternalLink, 
  Share2, 
  CheckCircle,
  LinkIcon,
  Loader2,

  Upload,
  X
} from "lucide-react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";


import { zodResolver } from "@hookform/resolvers/zod";
import { updateUserSchema } from "@shared/schema";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Form validation schema
const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  bio: z.string().max(160, "Bio must be less than 160 characters").optional(),
  email: z.string().email("Invalid email address").optional(),
  profession: z.string().max(100, "Profession must be less than 100 characters").optional(),
  welcomeMessage: z.string().optional(),
  profileImage: z.string().optional(),
  darkMode: z.boolean().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("general");
  




  // Fetch user profile data
  const { data: profile, isLoading: isLoadingProfile } = useQuery<User>({
    queryKey: ["/api/profile"],
    enabled: !!user,
  });



  // Form setup
  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      bio: "",
      email: "",
      profession: "",
      welcomeMessage: "",
      profileImage: "",
      darkMode: false,
    },
  });

  // Update form when profile data loads
  useEffect(() => {
    if (profile) {
      form.reset({
        name: profile.name || "",
        bio: profile.bio ?? undefined,
        email: profile.email ?? undefined,
        profession: profile.profession ?? undefined,
        welcomeMessage: profile.welcomeMessage ?? undefined,
        profileImage: profile.profileImage ?? undefined,
        darkMode: profile.darkMode || false,
      });
      

    }
  }, [profile, form]);







  const playRecording = () => {
    if (audioBlob && !isPlaying) {
      try {
        const browserInfo = getBrowserInfo();
        
        console.log('Attempting playback:', {
          size: audioBlob.size,
          type: audioBlob.type,
          browser: browserInfo
        });
        
        // Verify blob has valid type
        if (!audioBlob.type || audioBlob.type === '') {
          toast({
            title: "Invalid audio format",
            description: "The recording has no format information. Please record again.",
            variant: "destructive",
          });
          return;
        }
        
        // Check if the audio format is supported for playback
        const isSupported = isAudioFormatSupported(audioBlob.type);
        if (!isSupported) {
          console.warn(`Audio format ${audioBlob.type} not supported for playback`);
          toast({
            title: "Format not supported",
            description: `Your browser cannot play ${audioBlob.type} format. Please try recording again.`,
            variant: "destructive",
          });
          return;
        }
        
        // Clean up previous audio instance
        if (audioRef.current) {
          audioRef.current.pause();
          if (audioRef.current.src) {
            URL.revokeObjectURL(audioRef.current.src);
          }
          audioRef.current = null;
        }
        
        // Create fresh audio element with Safari-optimized settings
        audioRef.current = new Audio();
        const audioUrl = URL.createObjectURL(audioBlob);
        
        console.log('Creating audio playback for:', {
          browser: browserInfo.isSafari ? 'Safari' : browserInfo.isAndroid ? 'Android' : 'Desktop',
          mimeType: audioBlob.type,
          size: audioBlob.size,
          url: audioUrl
        });
        
        // Enhanced error handling with Safari-specific messages
        audioRef.current.onerror = (e) => {
          console.error('Audio playback error:', e);
          console.error('Audio element error details:', audioRef.current?.error);
          
          let errorMsg = "Playback failed. Try recording again.";
          
          if (audioRef.current?.error?.code === 4) {
            if (browserInfo.isSafari || browserInfo.isIOS) {
              if (audioBlob.type.includes('webm')) {
                errorMsg = `Safari doesn't support WebM format. Please refresh and record again for M4A format.`;
              } else if (audioBlob.type.includes('mp4') && !audioBlob.type.includes('m4a')) {
                errorMsg = `Safari audio/mp4 issue detected. Try refreshing and recording again for M4A format.`;
              } else {
                errorMsg = `Safari compatibility issue with ${audioBlob.type}. Try recording again.`;
              }
            } else {
              errorMsg = `Unsupported format: ${audioBlob.type}. Please record again.`;
            }
          }
            
          toast({
            title: "Playback error",
            description: errorMsg,
            variant: "destructive",
          });
          setIsPlaying(false);
          URL.revokeObjectURL(audioUrl);
        };
        
        audioRef.current.onended = () => {
          console.log('Audio playback ended normally');
          setIsPlaying(false);
          URL.revokeObjectURL(audioUrl);
        };
        
        audioRef.current.onloadeddata = () => {
          console.log('Audio data loaded successfully for playback:', {
            type: audioBlob.type,
            duration: audioRef.current?.duration,
            readyState: audioRef.current?.readyState
          });
        };
        
        audioRef.current.oncanplay = () => {
          console.log('Audio element can play - ready for playback');
        };
        
        // Safari-optimized audio element configuration
        audioRef.current.preload = 'auto';
        audioRef.current.crossOrigin = null; // Reset any cross-origin settings
        
        // Set source and force load
        audioRef.current.src = audioUrl;
        audioRef.current.load(); // Critical for Safari - force reload of source
        
        // Attempt to play with enhanced error handling
        const playPromise = audioRef.current.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('Audio playback started successfully');
              setIsPlaying(true);
              toast({
                title: "Playing recording",
                description: `${audioBlob.type} - ${Math.round(audioBlob.size / 1024)}KB`,
              });
            })
            .catch((error) => {
              console.error('Audio play() promise failed:', error);
              
              let errorMsg = "Could not start playback. Try again.";
              if (browserInfo.isSafari || browserInfo.isIOS) {
                errorMsg = "Safari playback issue. Try using the HTML5 audio controls below.";
              }
              
              toast({
                title: "Playback failed",
                description: errorMsg,
                variant: "destructive",
              });
              URL.revokeObjectURL(audioUrl);
            });
        } else {
          // Fallback for older browsers
          setIsPlaying(true);
        }
          
      } catch (error) {
        console.error('Playback setup error:', error);
        toast({
          title: "Error",
          description: "Failed to initialize audio playback",
          variant: "destructive",
        });
      }
    } else if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const deleteRecording = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setAudioBlob(null);
    setIsPlaying(false);
    setRecordingTime(0);
    form.setValue('welcomeMessage', '');
    setWelcomeMessageType('text');
    
    toast({
      title: "Recording deleted",
      description: "Voice message has been removed",
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };



  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const response = await apiRequest("PATCH", "/api/profile", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  if (isLoadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Profile not found</h2>
          <Button onClick={() => navigate("/")}>Go back to dashboard</Button>
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
                src="/assets/logo-horizontal.png" 
                alt="MyLinked" 
                className="h-8 w-auto"
                style={{ imageRendering: 'crisp-edges' }}
                onError={(e) => {
                  const img = e.currentTarget as HTMLImageElement;
                  img.style.display = 'none';
                  const fallback = document.createElement('div');
                  fallback.className = 'font-bold text-lg bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent';
                  fallback.textContent = 'MyLinked';
                  img.parentNode?.appendChild(fallback);
                }}
              />
            </div>
          </div>
        </div>
      </header>
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <Card>
                  <CardHeader>
                    <CardTitle>General Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Display Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Your display name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="profession"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Profession</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Software Developer" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bio</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Tell people about yourself..." 
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Brief description for your profile (max 160 characters)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="your@email.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Welcome Message
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant={welcomeMessageType === 'text' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setWelcomeMessageType('text')}
                        >
                          Text
                        </Button>
                        <Button
                          type="button"
                          variant={welcomeMessageType === 'voice' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setWelcomeMessageType('voice')}
                        >
                          <Mic className="h-4 w-4 mr-1" />
                          Voice
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {welcomeMessageType === 'text' ? (
                      <FormField
                        control={form.control}
                        name="welcomeMessage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Welcome Message</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Write a welcome message for your visitors..." 
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium">Voice Welcome Message</h4>
                          {audioBlob && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={deleteRecording}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          )}
                        </div>
                        
                        {!audioBlob ? (
                          <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg">
                            <Mic className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                            <p className="text-sm text-gray-600 mb-4">
                              Record a voice message for your visitors
                            </p>
                            <Button
                              type="button"
                              onClick={isRecording ? stopRecording : startRecording}
                              className={`flex items-center gap-2 ${isRecording ? 'bg-red-500 hover:bg-red-600' : ''}`}
                            >
                              {isRecording ? (
                                <>
                                  <MicOff className="h-4 w-4" />
                                  Stop Recording ({formatTime(recordingTime)})
                                </>
                              ) : (
                                <>
                                  <Mic className="h-4 w-4" />
                                  Start Recording
                                </>
                              )}
                            </Button>
                          </div>
                        ) : (
                          <div className="p-4 bg-gray-50 rounded-lg border">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-medium">Voice Recording</span>
                              <span className="text-xs text-gray-500">
                                Duration: {formatTime(recordingTime)}
                              </span>
                            </div>
                            
                            {/* Native HTML5 Audio Player with Enhanced Compatibility */}
                            <div className="mb-3">
                              {audioBlob && (
                                <div className="border border-gray-200 rounded-lg p-2">
                                  <div className="text-xs text-gray-600 mb-1">HTML5 Audio Player:</div>
                                  <audio 
                                    controls 
                                    className="w-full"
                                    key={`audio-${audioBlob.size}-${audioBlob.type}-${Date.now()}`}
                                    preload="auto"
                                    onError={(e) => {
                                      console.error('HTML5 audio element error:', e);
                                      const audio = e.target as HTMLAudioElement;
                                      const errorDetails = {
                                        code: audio.error?.code,
                                        message: audio.error?.message,
                                        src: audio.src,
                                        type: audioBlob.type,
                                        browser: getBrowserInfo()
                                      };
                                      console.error('HTML5 Error details:', errorDetails);
                                      
                                      // Show user-friendly error message
                                      if (errorDetails.code === 4) {
                                        toast({
                                          title: "HTML5 Player Error",
                                          description: `Cannot play ${audioBlob.type} in this browser`,
                                          variant: "destructive",
                                        });
                                      }
                                    }}
                                    onLoadedData={() => {
                                      console.log('HTML5 audio loaded successfully:', {
                                        type: audioBlob.type,
                                        size: audioBlob.size
                                      });
                                    }}
                                    onCanPlay={() => {
                                      console.log('HTML5 audio can play');
                                    }}
                                    ref={(audio) => {
                                      if (audio && audioBlob) {
                                        const browser = getBrowserInfo();
                                        
                                        // Create URL and set source
                                        const url = URL.createObjectURL(audioBlob);
                                        
                                        // Safari-specific audio element configuration
                                        if (browser.isSafari || browser.isIOS) {
                                          audio.setAttribute('crossOrigin', 'anonymous');
                                          audio.preload = 'metadata'; // Conservative preload for Safari
                                          
                                          // Add Safari-specific event handlers
                                          audio.addEventListener('loadstart', () => {
                                            console.log('Safari HTML5 audio: Load started');
                                          });
                                          
                                          audio.addEventListener('canplay', () => {
                                            console.log('Safari HTML5 audio: Can play');
                                          });
                                        } else {
                                          audio.preload = 'auto';
                                        }
                                        
                                        audio.src = url;
                                        audio.load(); // Force load for better Safari compatibility
                                        
                                        // Store URL for cleanup
                                        audio.dataset.blobUrl = url;
                                        
                                        console.log('HTML5 audio element configured:', {
                                          browser: browser.isSafari ? 'Safari' : 'Other',
                                          mimeType: audioBlob.type,
                                          preload: audio.preload,
                                          src: url.slice(0, 50) + '...'
                                        });
                                        
                                        // Clean up URL when component unmounts or audio changes
                                        return () => {
                                          if (audio.dataset.blobUrl) {
                                            URL.revokeObjectURL(audio.dataset.blobUrl);
                                          }
                                        };
                                      }
                                    }}
                                  >
                                    {/* Fallback message for unsupported browsers */}
                                    <div className="text-center p-4 text-gray-500">
                                      Your browser does not support audio playback.
                                      <br />
                                      Format: {audioBlob.type}
                                    </div>
                                  </audio>
                                  
                                  {/* Format compatibility indicator */}
                                  <div className="text-xs mt-1 flex items-center gap-2">
                                    {isAudioFormatSupported(audioBlob.type) ? (
                                      <span className="text-green-600">✓ Format supported</span>
                                    ) : (
                                      <span className="text-red-600">⚠️ Format may not be supported</span>
                                    )}
                                    <span className="text-gray-500">({audioBlob.type})</span>
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            {/* Custom Controls as Secondary Option */}
                            <div className="flex items-center gap-3">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={playRecording}
                              >
                                {isPlaying ? (
                                  <Pause className="h-4 w-4" />
                                ) : (
                                  <Play className="h-4 w-4" />
                                )}
                              </Button>
                              <div className="flex-1 bg-gray-200 h-2 rounded-full">
                                <div className="bg-blue-500 h-2 rounded-full w-1/3"></div>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setAudioBlob(null);
                                  setWelcomeMessageType('voice');
                                }}
                              >
                                Re-record
                              </Button>
                            </div>
                            
                            {/* Enhanced Debug Info */}
                            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded text-xs">
                              <div className="font-semibold text-blue-800 mb-2">Debug Information:</div>
                              <div className="space-y-1 text-blue-700">
                                {/* Browser Detection */}
                                {(() => {
                                  const browser = getBrowserInfo();
                                  const browserName = browser.isSafari ? 'Safari' : 
                                                     browser.isChrome ? 'Chrome' : 
                                                     browser.isFirefox ? 'Firefox' : 'Unknown';
                                  const platform = browser.isIOS ? 'iOS' : 
                                                  browser.isAndroid ? 'Android' : 'Desktop';
                                  return (
                                    <div>
                                      <span className="font-semibold">Browser:</span> {browserName} ({platform})
                                    </div>
                                  );
                                })()}
                                
                                {/* Audio Format Info */}
                                <div>
                                  <span className="font-semibold">MIME Type:</span> 
                                  <span className="font-mono ml-1">{audioBlob?.type || 'MISSING'}</span>
                                </div>
                                
                                <div>
                                  <span className="font-semibold">Size:</span> {audioBlob ? Math.round(audioBlob.size / 1024) : 0}KB ({audioBlob?.size || 0} bytes)
                                </div>
                                
                                {/* Format Compatibility Check */}
                                {audioBlob?.type && (
                                  <div>
                                    <span className="font-semibold">Playback Support:</span> 
                                    {isAudioFormatSupported(audioBlob.type) ? (
                                      <span className="text-green-600 ml-1">✓ Supported</span>
                                    ) : (
                                      <span className="text-red-600 ml-1">✗ Not Supported</span>
                                    )}
                                  </div>
                                )}
                                
                                {/* Status Indicators */}
                                {!audioBlob?.type && (
                                  <div className="text-red-600 font-semibold mt-1">
                                    ⚠️ Missing MIME type - will cause playback issues!
                                  </div>
                                )}
                                
                                {audioBlob?.type && isAudioFormatSupported(audioBlob.type) && (
                                  <div className="text-green-600 font-semibold mt-1">
                                    ✓ Ready for playback
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={updateProfileMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    {updateProfileMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
        </div>
      </div>
    </div>
  );
}