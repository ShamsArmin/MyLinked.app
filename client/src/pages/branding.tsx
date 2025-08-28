import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  Loader2,
  Paintbrush,
  Type,
  MessageSquare,
  Image as ImageIcon,
  CheckCircle2,
  Share2,
  Copy,
  Zap,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Feature flag for AI Branding
const FEATURE_BRANDING = import.meta.env.VITE_FEATURE_BRANDING === "true"; // AI Branding temporarily disabled for MVP

interface BrandingSuggestions {
  colorPalette: {
    primary: string;
    secondary: string;
    accent: string;
  };
  tagline: string;
  profileBio: string;
  imageryThemes: string[];
  fontRecommendations: string[];
}

export default function BrandingPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentTab, setCurrentTab] = useState("colors");
  const [isGenerating, setIsGenerating] = useState(false);
  const [brandingData, setBrandingData] = useState<BrandingSuggestions | null>(null);

  if (!FEATURE_BRANDING) {
    return <div className="p-4">AI Branding temporarily disabled for MVP.</div>;
  }

  // Branding generation mutation
  const generateBrandingMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/branding/suggest", data);
    },
    onSuccess: (data) => {
      setBrandingData(data.suggestions);
      setIsGenerating(false);
      
      // Special handling for demo/fallback data
      if (data.isDemo) {
        toast({
          title: "Example Branding Suggestions",
          description: "Using example data while AI service is unavailable. The suggestions shown are examples only.",
        });
      } else {
        toast({
          title: "Branding Suggestions Generated",
          description: "AI has created personalized branding recommendations based on your profile.",
        });
      }
    },
    onError: (error) => {
      setIsGenerating(false);
      const errorMsg = error instanceof Error ? error.message : "An error occurred";
      
      if (errorMsg.includes("API key")) {
        toast({
          title: "API Key Required",
          description: "API key is required to generate branding suggestions. We'll show you example data instead.",
          variant: "destructive",
        });
      } else if (errorMsg.includes("rate limit") || errorMsg.includes("usage limits")) {
        toast({
          title: "Service Temporarily Unavailable",
          description: "The AI service is currently busy. We'll show you example suggestions instead.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Using Sample Suggestions",
          description: "We're showing example branding suggestions instead of AI-generated ones.",
          variant: "destructive",
        });
      }
    },
  });
  
  // Links query
  const { data: links = [] } = useQuery<any[]>({
    queryKey: ["/api/links"],
    enabled: !!user,
  });
  
  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PATCH", "/api/profile", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Profile updated",
        description: "Your profile has been updated with the new branding.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update profile",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });
  
  // Generate branding based on profile and social platforms
  const handleGenerateBranding = () => {
    setIsGenerating(true);
    
    const profession = user?.profession || "";
    const interests = user?.interests || [];
    const socialAccounts = links.map((link: any) => link.platform);
    
    generateBrandingMutation.mutate({
      profession,
      interests,
      socialAccounts,
    });
  };
  
  // Apply bio to profile
  const handleApplyBio = () => {
    if (brandingData) {
      updateProfileMutation.mutate({
        bio: brandingData.profileBio,
      });
    }
  };
  
  // Handle copy to clipboard
  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Text has been copied to your clipboard.",
    });
  };
  
  // Color examples for the color palette
  const renderColorExamples = (color: string, label: string) => {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{label}</span>
          <span className="text-xs text-muted-foreground">{color}</span>
        </div>
        <div className="flex flex-col rounded-md overflow-hidden w-full">
          <div 
            className="h-16 rounded-t-md" 
            style={{ backgroundColor: color }}
          />
          <div className="flex">
            <div 
              className="h-8 w-1/3" 
              style={{ backgroundColor: color, opacity: 0.75 }}
            />
            <div 
              className="h-8 w-1/3" 
              style={{ backgroundColor: color, opacity: 0.5 }}
            />
            <div 
              className="h-8 w-1/3" 
              style={{ backgroundColor: color, opacity: 0.25 }}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => handleCopyText(color)}
          >
            <Copy className="h-3 w-3 mr-1" />
            Copy
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-background min-h-screen">
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex flex-col space-y-8">
          {/* Header Section */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="mr-2">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">AI Branding Boost</h1>
                <p className="text-muted-foreground mt-1">
                  Get personalized brand suggestions to enhance your profile
                </p>
              </div>
            </div>
          </div>
          
          {/* Generate Button */}
          <div className="flex justify-center">
            <Button
              size="lg"
              className="relative"
              onClick={handleGenerateBranding}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating branding recommendations...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Generate AI Branding Suggestions
                </>
              )}
            </Button>
          </div>
          
          {/* Results Tabs */}
          {brandingData && (
            <Tabs defaultValue={currentTab} onValueChange={setCurrentTab}>
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="colors">
                  <Paintbrush className="h-4 w-4 mr-2 hidden md:inline" />
                  Colors
                </TabsTrigger>
                <TabsTrigger value="typography">
                  <Type className="h-4 w-4 mr-2 hidden md:inline" />
                  Typography
                </TabsTrigger>
                <TabsTrigger value="messaging">
                  <MessageSquare className="h-4 w-4 mr-2 hidden md:inline" />
                  Messaging
                </TabsTrigger>
                <TabsTrigger value="imagery">
                  <ImageIcon className="h-4 w-4 mr-2 hidden md:inline" />
                  Imagery
                </TabsTrigger>
              </TabsList>
              
              {/* Colors Content */}
              <TabsContent value="colors" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Color Palette</CardTitle>
                    <CardDescription>
                      A harmonious color scheme that reflects your personal brand
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {renderColorExamples(brandingData.colorPalette.primary, "Primary")}
                      {renderColorExamples(brandingData.colorPalette.secondary, "Secondary")}
                      {renderColorExamples(brandingData.colorPalette.accent, "Accent")}
                    </div>
                    
                    <div className="mt-8">
                      <h3 className="text-lg font-medium mb-4">Color Application Examples</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="overflow-hidden">
                          <div 
                            className="h-2" 
                            style={{ backgroundColor: brandingData.colorPalette.primary }}
                          />
                          <CardContent className="p-4">
                            <div className="flex items-center space-x-3">
                              <div 
                                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                                style={{ backgroundColor: brandingData.colorPalette.primary }}
                              >
                                {user?.name?.charAt(0) || "U"}
                              </div>
                              <div>
                                <h3 className="font-bold">{user?.name || "Your Name"}</h3>
                                <p 
                                  className="text-sm" 
                                  style={{ color: brandingData.colorPalette.secondary }}
                                >
                                  {user?.profession || brandingData.tagline}
                                </p>
                              </div>
                            </div>
                            
                            <div className="mt-4 space-y-2">
                              <div 
                                className="p-2 rounded-md border" 
                                style={{ borderColor: brandingData.colorPalette.accent + "50" }}
                              >
                                <span className="text-sm">Twitter Profile</span>
                              </div>
                              <div 
                                className="p-2 rounded-md" 
                                style={{ backgroundColor: brandingData.colorPalette.primary + "15" }}
                              >
                                <span className="text-sm">Instagram Page</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card className="overflow-hidden">
                          <div 
                            className="h-24 flex items-end p-4"
                            style={{ 
                              background: `linear-gradient(to right, ${brandingData.colorPalette.primary}, ${brandingData.colorPalette.secondary})`,
                            }}
                          >
                            <h3 className="text-lg font-bold text-white">{user?.name || "Your Name"}</h3>
                          </div>
                          <CardContent className="p-4">
                            <p className="text-sm italic mb-3">{brandingData.tagline}</p>
                            
                            <div className="flex flex-wrap gap-2 mt-2">
                              <Badge style={{ backgroundColor: brandingData.colorPalette.primary }}>
                                Web
                              </Badge>
                              <Badge style={{ backgroundColor: brandingData.colorPalette.secondary }}>
                                Design
                              </Badge>
                              <Badge style={{ backgroundColor: brandingData.colorPalette.accent }}>
                                Social
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Typography Content */}
              <TabsContent value="typography" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Typography Recommendations</CardTitle>
                    <CardDescription>
                      Font suggestions that complement your brand style
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {brandingData.fontRecommendations.map((font, index) => (
                          <Card key={index}>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-lg">{font}</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                <div>
                                  <h4 className="text-sm text-muted-foreground mb-1">Header Example</h4>
                                  <p className="text-xl font-bold" style={{ fontFamily: font.toLowerCase().replace(' ', '-') }}>
                                    {user?.name || "Your Name"}
                                  </p>
                                </div>
                                
                                <div>
                                  <h4 className="text-sm text-muted-foreground mb-1">Body Text Example</h4>
                                  <p className="text-sm" style={{ fontFamily: font.toLowerCase().replace(' ', '-') }}>
                                    {brandingData.profileBio}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                            <CardFooter>
                              <Button 
                                variant="outline" 
                                className="w-full"
                                onClick={() => updateProfileMutation.mutate({ font: font.toLowerCase() })}
                              >
                                Apply Font
                              </Button>
                            </CardFooter>
                          </Card>
                        ))}
                      </div>
                      
                      <div className="bg-muted p-4 rounded-md">
                        <h3 className="text-sm font-medium mb-2">Font Pairing Tip</h3>
                        <p className="text-sm text-muted-foreground">
                          For best results, use one font for headings and another for body text. This creates visual
                          hierarchy and improves readability.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Messaging Content */}
              <TabsContent value="messaging" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Messaging & Voice</CardTitle>
                    <CardDescription>
                      Compelling copy to communicate your personal brand
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-8">
                      {/* Tagline */}
                      <div>
                        <h3 className="text-lg font-medium mb-3">Professional Tagline</h3>
                        <Card className="bg-muted/50">
                          <CardContent className="p-4">
                            <p className="text-lg italic text-center py-2">{brandingData.tagline}</p>
                          </CardContent>
                        </Card>
                        <div className="flex justify-end mt-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleCopyText(brandingData.tagline)}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copy Tagline
                          </Button>
                        </div>
                      </div>
                      
                      {/* Bio */}
                      <div>
                        <h3 className="text-lg font-medium mb-3">Profile Bio</h3>
                        <div className="space-y-2">
                          <Textarea 
                            className="min-h-[120px]" 
                            value={brandingData.profileBio} 
                            readOnly 
                          />
                          <div className="flex justify-between items-center text-xs text-muted-foreground">
                            <span>{brandingData.profileBio.length} characters (max 160)</span>
                            <div>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleCopyText(brandingData.profileBio)}
                                className="mr-2"
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                Copy
                              </Button>
                              <Button 
                                size="sm" 
                                onClick={handleApplyBio}
                              >
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Apply to Profile
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Voice Tips */}
                      <div className="bg-muted p-4 rounded-md">
                        <h3 className="text-sm font-medium mb-2">Brand Voice Recommendations</h3>
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">
                            <strong>Tone:</strong> Professional yet approachable, confident, and authentic.
                          </p>
                          <p className="text-sm text-muted-foreground">
                            <strong>Key messages:</strong> Emphasize your expertise, unique perspective, and the value you provide.
                          </p>
                          <p className="text-sm text-muted-foreground">
                            <strong>Content focus:</strong> Share insights, accomplishments, and content that reinforces your personal brand.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Imagery Content */}
              <TabsContent value="imagery" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Visual Identity</CardTitle>
                    <CardDescription>
                      Imagery themes and visual elements for your brand
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Imagery Themes */}
                      <div>
                        <h3 className="text-lg font-medium mb-3">Recommended Imagery Themes</h3>
                        <div className="flex flex-wrap gap-2">
                          {brandingData.imageryThemes.map((theme, index) => (
                            <Badge 
                              key={index} 
                              variant="outline" 
                              className="px-3 py-1 border-2"
                              style={{ borderColor: brandingData.colorPalette.primary + "50" }}
                            >
                              {theme}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      {/* Photo Style */}
                      <div>
                        <h3 className="text-lg font-medium mb-3">Photo Style Guidelines</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Card>
                            <CardHeader className="py-3">
                              <CardTitle className="text-sm">Profile Photos</CardTitle>
                            </CardHeader>
                            <CardContent className="px-4 pb-4 pt-0">
                              <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                                <li>Professional headshot</li>
                                <li>Good lighting & clarity</li>
                                <li>Neutral background</li>
                                <li>Authentic expression</li>
                              </ul>
                            </CardContent>
                          </Card>
                          
                          <Card>
                            <CardHeader className="py-3">
                              <CardTitle className="text-sm">Content Photos</CardTitle>
                            </CardHeader>
                            <CardContent className="px-4 pb-4 pt-0">
                              <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                                <li>Consistent editing style</li>
                                <li>Thematic color palette</li>
                                <li>Balanced composition</li>
                                <li>Authentic moments</li>
                              </ul>
                            </CardContent>
                          </Card>
                          
                          <Card>
                            <CardHeader className="py-3">
                              <CardTitle className="text-sm">Background Images</CardTitle>
                            </CardHeader>
                            <CardContent className="px-4 pb-4 pt-0">
                              <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                                <li>Subtle patterns or textures</li>
                                <li>Abstract representations</li>
                                <li>On-brand color gradients</li>
                                <li>Minimal and clean</li>
                              </ul>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                      
                      {/* Visual Elements */}
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg">Visual Elements</CardTitle>
                          <CardDescription>Cohesive visual style across platforms</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="space-y-2 text-center">
                              <div 
                                className="aspect-square rounded-md flex items-center justify-center"
                                style={{ backgroundColor: brandingData.colorPalette.primary + "15" }}
                              >
                                <div 
                                  className="w-12 h-12 rounded-full"
                                  style={{ background: `linear-gradient(to right, ${brandingData.colorPalette.primary}, ${brandingData.colorPalette.secondary})` }}
                                />
                              </div>
                              <p className="text-xs text-muted-foreground">Shapes</p>
                            </div>
                            
                            <div className="space-y-2 text-center">
                              <div 
                                className="aspect-square rounded-md flex items-center justify-center"
                                style={{ backgroundColor: brandingData.colorPalette.secondary + "15" }}
                              >
                                <div className="space-y-1 w-16">
                                  <div className="h-1 rounded-full" style={{ backgroundColor: brandingData.colorPalette.secondary }} />
                                  <div className="h-1 rounded-full" style={{ backgroundColor: brandingData.colorPalette.secondary + "80" }} />
                                  <div className="h-1 rounded-full" style={{ backgroundColor: brandingData.colorPalette.secondary + "60" }} />
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground">Lines</p>
                            </div>
                            
                            <div className="space-y-2 text-center">
                              <div 
                                className="aspect-square rounded-md flex items-center justify-center"
                                style={{ backgroundColor: brandingData.colorPalette.accent + "15" }}
                              >
                                <div className="w-16 h-12 flex space-x-1">
                                  <div 
                                    className="w-1/3 h-full rounded-md" 
                                    style={{ backgroundColor: brandingData.colorPalette.accent + "90" }}
                                  />
                                  <div 
                                    className="w-1/3 h-full rounded-md" 
                                    style={{ backgroundColor: brandingData.colorPalette.accent + "60" }}
                                  />
                                  <div 
                                    className="w-1/3 h-full rounded-md" 
                                    style={{ backgroundColor: brandingData.colorPalette.accent + "30" }}
                                  />
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground">Patterns</p>
                            </div>
                            
                            <div className="space-y-2 text-center">
                              <div 
                                className="aspect-square rounded-md flex items-center justify-center"
                                style={{ 
                                  background: `radial-gradient(circle, ${brandingData.colorPalette.primary + "30"} 0%, ${brandingData.colorPalette.secondary + "10"} 100%)` 
                                }}
                              >
                                <div className="w-12 h-12 rounded-md border-2" style={{ borderColor: brandingData.colorPalette.primary }} />
                              </div>
                              <p className="text-xs text-muted-foreground">Backgrounds</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
          
          {/* Placeholder */}
          {!brandingData && !isGenerating && (
            <Card className="border-dashed mt-4">
              <CardContent className="p-8 flex flex-col items-center justify-center min-h-[400px] text-center">
                <Paintbrush className="h-12 w-12 mb-4 text-muted-foreground" />
                <h3 className="text-xl font-medium mb-2">Get AI Branding Recommendations</h3>
                <p className="text-muted-foreground max-w-md mb-6">
                  Our AI will analyze your profile and social links to generate personalized branding suggestions 
                  including color palette, typography, messaging, and visual style.
                </p>
                <Button onClick={handleGenerateBranding}>
                  <Zap className="h-4 w-4 mr-2" />
                  Generate Branding
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}