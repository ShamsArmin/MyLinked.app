import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

const logoPath = "/assets/logo-horizontal.png";
import {
  Award,
  TrendingUp,
  RefreshCw,
  Loader2,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Info,
  User,
  Globe,
  Users,
  BarChart2 as BarChart,
  Calendar,
  Activity,
  BookOpen,
  Sparkles,
  Eye
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  PieChart,
  Pie,
  Cell,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  Tooltip as RechartsTooltip
} from "recharts";
import { Progress } from "@/components/ui/progress";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";

// Types
interface SocialScoreData {
  currentScore: number;
  previousScore: number;
  change: number;
  stats: {
    views: number;
    clicks: number;
    ctr: number;
  };
  historicalData: {
    date: string;
    score: number;
    views: number;
    clicks: number;
  }[];
  compareData: {
    category: string;
    userScore: number;
    avgScore: number;
  }[];
  followers: number;
  following: number;
}

interface AIScoreResult {
  score: number;
  previousScore: number;
  change: number;
  insights: {
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  };
}

// Score Recommendation Card Component
function ScoreRecommendationCard({ 
  title, 
  description, 
  status = "neutral",
  action = null,
  onAction = () => {}
}: { 
  title: string; 
  description: string; 
  status?: "good" | "bad" | "neutral";
  action?: string | null;
  onAction?: () => void;
}) {
  return (
    <Card className={`
      ${status === "good" ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/20" : ""}
      ${status === "bad" ? "border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/20" : ""}
      ${status === "neutral" ? "bg-white dark:bg-gray-900" : ""}
    `}>
      <CardContent className="p-4 flex items-start">
        <div className="mr-3 mt-1">
          {status === "good" && (
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          )}
          {status === "bad" && (
            <XCircle className="h-5 w-5 text-rose-500" />
          )}
          {status === "neutral" && (
            <Info className="h-5 w-5 text-blue-500" />
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-sm mb-1 dark:text-gray-200">{title}</h3>
          <p className="text-xs text-muted-foreground dark:text-gray-400">{description}</p>
          
          {action && (
            <Button 
              variant="link" 
              className="px-0 py-1 h-auto text-xs" 
              onClick={onAction}
            >
              {action} <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Main component
export default function SocialScorePage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [showInsightsDialog, setShowInsightsDialog] = useState(false);
  
  // Fetch social score data
  const { data, isLoading, refetch } = useQuery<SocialScoreData>({
    queryKey: ["/api/social-score"],
    enabled: !!user,
  });
  
  // Calculate score mutation
  const calculateScoreMutation = useMutation<AIScoreResult>({
    mutationFn: async () => {
      // apiRequest throws on non-2xx responses and returns parsed JSON
      return await apiRequest("POST", "/api/social-score/calculate");
    },
    onSuccess: (data) => {
      toast({
        title: "Social Score Calculated",
        description: `Your score is now ${data.score}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/social-score"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setShowInsightsDialog(true);
    },
    onError: (error: any) => {
      const errorMsg = error instanceof Error ? error.message : "An error occurred";

      // Handle rate limit or quota exceeded errors
      if (
        errorMsg.includes('429') ||
        errorMsg.toLowerCase().includes('quota') ||
        errorMsg.toLowerCase().includes('rate limit')
      ) {
        toast({
          title: "Service Temporarily Unavailable",
          description: "Our AI service is currently busy. Please try again in a few minutes.",
          variant: "destructive",
        });
      }
      // Handle API key errors
      else if (errorMsg.toLowerCase().includes("api key")) {
        toast({
          title: "API Key Required",
          description: "OpenAI API key is required to calculate social score.",
          variant: "destructive",
        });
      }
      // Generic error fallback
      else {
        toast({
          title: "Failed to Calculate Score",
          description: "Unable to calculate your social score at this time. Please try again later.",
          variant: "destructive",
        });
      }
    },
  });
  
  // Social score data for visualization
  const historicalData = data?.historicalData || [];
  const compareData = data?.compareData || [];
  const currentScore = data?.currentScore || 0;
  
  // Get score color based on value
  const getScoreColor = (score: number) => {
    if (score >= 80) return "#10b981"; // Green
    if (score >= 60) return "#3b82f6"; // Blue
    if (score >= 40) return "#f59e0b"; // Yellow
    return "#ef4444"; // Red
  };
  
  // Recommendations based on the score
  const recommendations = [
    {
      title: "Complete Your Profile",
      description: "Add a profile picture, bio, and profession to improve your score.",
      status: user?.profileImage ? "good" : "bad",
      action: user?.profileImage ? null : "Update Profile",
      onAction: () => {
        window.scrollTo(0, 0);
        navigate("/profile");
      },
    },
    {
      title: "Add More Platforms",
      description: "Connect with your audience across multiple platforms for better reach.",
      status: (data?.compareData && data.compareData.some(d => d.category === "Link Diversity" && d.userScore >= 60))
        ? "good" : "neutral",
      action: "Add Links",
      onAction: () => {
        window.scrollTo(0, 0);
        navigate("/");
      },
    },
    {
      title: "Create a Welcome Message",
      description: "Personalize your profile with a welcome message for visitors.",
      status: user?.welcomeMessage ? "good" : "neutral",
      action: user?.welcomeMessage ? null : "Create Message",
      onAction: () => {
        window.scrollTo(0, 0);
        navigate("/profile");
      },
    },
    {
      title: "Enable Pitch Mode",
      description: "Create a professional pitch layout for business connections.",
      status: user?.pitchMode ? "good" : "neutral",
      action: user?.pitchMode ? null : "Enable Pitch Mode",
      onAction: () => {
        // Navigate to the main dashboard and reset the scroll position to the top first
        window.scrollTo(0, 0);
        navigate("/");
        // Use setTimeout to ensure navigation completes before scrolling
        setTimeout(() => {
          const pitchModeElement = document.getElementById("pitch-mode");
          if (pitchModeElement) {
            pitchModeElement.scrollIntoView({ behavior: "smooth" });
          }
        }, 300);
      },
    },
    {
      title: "Optimize Link Order",
      description: "Use AI to suggest the optimal order for your links based on analytics.",
      status: "neutral",
      action: "Optimize Links",
      onAction: () => {
        // Navigate to the dedicated optimize links page
        navigate("/optimize-links");
      },
    },
  ];
  
  // Filter recommendations based on score
  const getRecommendations = () => {
    // For scores under 40, show all recommendations
    if (currentScore < 40) return recommendations;
    
    // For scores 40-70, show recommendations that aren't "good"
    if (currentScore < 70) {
      return recommendations.filter(rec => rec.status !== "good");
    }
    
    // For scores over 70, only show neutral or bad recommendations
    return recommendations.filter(rec => rec.status !== "good").slice(0, 2);
  };
  
  // Handle score calculation
  const handleCalculateScore = () => {
    calculateScoreMutation.mutate();
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <header className="border-b bg-card">
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
              />
            </div>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col space-y-8">
          {/* Page Title */}
          <div>
            <h1 className="text-2xl font-bold">Social Score</h1>
            <p className="text-muted-foreground">
              Boost your profile's effectiveness with personalized recommendations
            </p>
          </div>
          
          {/* Score Overview */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-6">
            {/* Score Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Your Social Score</CardTitle>
                <CardDescription>Based on profile optimization and engagement</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-col items-center">
                  <div className="relative w-44 h-44">
                    <svg className="w-44 h-44 transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="8"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke={getScoreColor(currentScore)}
                        strokeWidth="8"
                        strokeDasharray={`${(currentScore / 100) * 283} 283`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <div className="text-5xl font-bold">{currentScore}</div>
                      <div className="text-sm text-muted-foreground">out of 100</div>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex space-x-2">
                    <Button onClick={handleCalculateScore} disabled={calculateScoreMutation.isPending}>
                      {calculateScoreMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Calculating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Calculate with AI
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-center pb-4">
                <p className="text-sm text-center text-muted-foreground max-w-xs">
                  AI analysis uses engagement data, profile completeness, and optimization to generate your score.
                </p>
              </CardFooter>
            </Card>
            
            {/* Category Breakdown */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Score Breakdown</CardTitle>
                <CardDescription>How your profile compares in different areas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {compareData.map((item) => (
                    <div key={item.category} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">{item.category}</span>
                        <span className="text-sm font-medium">{item.userScore}</span>
                      </div>
                      <div className="relative h-2 w-full bg-muted rounded-full overflow-hidden">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className="absolute left-0 top-0 h-full bg-primary"
                                style={{ width: `${item.userScore}%` }}
                              />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Your score: {item.userScore}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className="absolute left-0 top-0 h-full bg-muted-foreground/30"
                                style={{ width: `${item.avgScore}%` }}
                              />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Average: {item.avgScore}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <div>Your score</div>
                        <div>Average</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Top Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Recommendations to Improve</CardTitle>
              <CardDescription>Follow these tips to boost your Social Score</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {getRecommendations().map((recommendation, index) => (
                  <ScoreRecommendationCard
                    key={index}
                    title={recommendation.title}
                    description={recommendation.description}
                    status={recommendation.status as "good" | "bad" | "neutral"}
                    action={recommendation.action}
                    onAction={recommendation.onAction}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Advanced Analytics */}
          <div>
            <Tabs defaultValue="trends">
              <TabsList className="mb-4">
                <TabsTrigger value="trends">Score Trends</TabsTrigger>
                <TabsTrigger value="profile">Profile Health</TabsTrigger>
                <TabsTrigger value="engagement">Engagement</TabsTrigger>
              </TabsList>
              
              {/* Score Trends */}
              <TabsContent value="trends">
                <Card>
                  <CardHeader>
                    <CardTitle>Score Trends</CardTitle>
                    <CardDescription>Your score evolution over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={historicalData}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis domain={[0, 100]} />
                          <RechartsTooltip />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="score"
                            stroke="#0070f3"
                            strokeWidth={2}
                            activeDot={{ r: 8 }}
                            name="Social Score"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Profile Health */}
              <TabsContent value="profile">
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Health</CardTitle>
                    <CardDescription>Track your profile completeness</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <h3 className="text-lg font-medium mb-4">Profile Completeness</h3>
                        <Accordion type="single" collapsible className="w-full">
                          <AccordionItem value="personal">
                            <AccordionTrigger className="py-2">
                              <div className="flex justify-between w-full pr-4">
                                <div className="flex items-center">
                                  <User className="h-4 w-4 mr-2" />
                                  Personal Information
                                </div>
                                <div className="text-sm">
                                  {user?.profileImage && user?.name && user?.bio ? "100%" : "66%"}
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-2 py-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <div className="w-6">
                                      {user?.name ? (
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                      ) : (
                                        <XCircle className="h-4 w-4 text-rose-500" />
                                      )}
                                    </div>
                                    <span className="text-sm">Display Name</span>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <div className="w-6">
                                      {user?.profileImage ? (
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                      ) : (
                                        <XCircle className="h-4 w-4 text-rose-500" />
                                      )}
                                    </div>
                                    <span className="text-sm">Profile Picture</span>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <div className="w-6">
                                      {user?.bio ? (
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                      ) : (
                                        <XCircle className="h-4 w-4 text-rose-500" />
                                      )}
                                    </div>
                                    <span className="text-sm">Bio</span>
                                  </div>
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                          
                          <AccordionItem value="links">
                            <AccordionTrigger className="py-2">
                              <div className="flex justify-between w-full pr-4">
                                <div className="flex items-center">
                                  <Globe className="h-4 w-4 mr-2" />
                                  Links
                                </div>
                                <div className="text-sm">
                                  {data && data.compareData.find(d => d.category === "Link Diversity")?.userScore || 0}%
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="py-2">
                                <p className="text-sm text-muted-foreground mb-2">
                                  Link diversity measures how many different platforms you've connected.
                                </p>
                                <Progress 
                                  value={data?.compareData.find(d => d.category === "Link Diversity")?.userScore || 0} 
                                  className="h-2" 
                                />
                                <div className="mt-2">
                                  <Button variant="link" className="px-0 h-auto text-sm" onClick={() => navigate("/my-links")}>
                                    Add more links <ChevronRight className="h-3 w-3 ml-1" />
                                  </Button>
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                          
                          <AccordionItem value="features">
                            <AccordionTrigger className="py-2">
                              <div className="flex justify-between w-full pr-4">
                                <div className="flex items-center">
                                  <Sparkles className="h-4 w-4 mr-2" />
                                  Features
                                </div>
                                <div className="text-sm">
                                  {user?.welcomeMessage && user?.pitchMode ? "100%" : 
                                   user?.welcomeMessage || user?.pitchMode ? "50%" : "0%"}
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-2 py-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <div className="w-6">
                                      {user?.welcomeMessage ? (
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                      ) : (
                                        <XCircle className="h-4 w-4 text-rose-500" />
                                      )}
                                    </div>
                                    <span className="text-sm">Welcome Message</span>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <div className="w-6">
                                      {user?.pitchMode ? (
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                      ) : (
                                        <XCircle className="h-4 w-4 text-rose-500" />
                                      )}
                                    </div>
                                    <span className="text-sm">Pitch Mode</span>
                                  </div>
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </div>
                      
                      <div className="flex items-center justify-center">
                        <div className="w-52 h-52 relative">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={[
                                  { name: "Complete", value: currentScore },
                                  { name: "Incomplete", value: 100 - currentScore },
                                ]}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                labelLine={false}
                              >
                                <Cell fill={getScoreColor(currentScore)} />
                                <Cell fill="#f3f4f6" />
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="absolute inset-0 flex items-center justify-center flex-col">
                            <div className="text-4xl font-bold">{currentScore}</div>
                            <div className="text-xs text-muted-foreground">out of 100</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Engagement */}
              <TabsContent value="engagement">
                <Card>
                  <CardHeader>
                    <CardTitle>Engagement Metrics</CardTitle>
                    <CardDescription>Measure interactions with your profile</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <Card>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm text-muted-foreground mb-1">Views</p>
                                  <h3 className="text-2xl font-bold">{data?.stats.views || 0}</h3>
                                </div>
                                <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                                  <Eye className="h-5 w-5 text-primary" />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                          
                          <Card>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm text-muted-foreground mb-1">Clicks</p>
                                  <h3 className="text-2xl font-bold">{data?.stats.clicks || 0}</h3>
                                </div>
                                <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                                  <Activity className="h-5 w-5 text-primary" />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                        
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Click-Through Rate</p>
                                <h3 className="text-2xl font-bold">{data?.stats.ctr.toFixed(1) || 0}%</h3>
                              </div>
                              <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                                <TrendingUp className="h-5 w-5 text-primary" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Network</p>
                                <div className="flex space-x-4">
                                  <div>
                                    <div className="text-xs text-muted-foreground">Followers</div>
                                    <div className="font-medium">{data?.followers || 0}</div>
                                  </div>
                                  <div>
                                    <div className="text-xs text-muted-foreground">Following</div>
                                    <div className="font-medium">{data?.following || 0}</div>
                                  </div>
                                </div>
                              </div>
                              <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                                <Users className="h-5 w-5 text-primary" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      
                      <div className="h-[350px]">
                        {/* Wrap the chart in a try-catch rendering pattern for better error handling */}
                        <div className="h-full w-full">
                          {historicalData && historicalData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <RechartsBarChart
                                data={historicalData}
                                margin={{
                                  top: 20,
                                  right: 30,
                                  left: 0,
                                  bottom: 5,
                                }}
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis yAxisId="left" orientation="left" />
                                <YAxis yAxisId="right" orientation="right" />
                                <RechartsTooltip />
                                <Legend />
                                <Bar yAxisId="left" dataKey="views" name="Views" fill="#8884d8" />
                                <Bar yAxisId="left" dataKey="clicks" name="Clicks" fill="#82ca9d" />
                              </RechartsBarChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="h-full w-full flex items-center justify-center flex-col">
                              <p className="text-muted-foreground">No engagement data available yet</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
      
      {/* AI Insights Dialog */}
      <Dialog open={showInsightsDialog} onOpenChange={setShowInsightsDialog}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Sparkles className="h-5 w-5 mr-2 text-primary" />
              AI Score Insights
            </DialogTitle>
            <DialogDescription>
              Our AI has analyzed your profile and generated personalized insights.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 my-2">
            {calculateScoreMutation.data ? (
              <>
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="text-5xl font-bold">{calculateScoreMutation.data.score}</div>
                      <div className="text-lg">
                        {calculateScoreMutation.data.change > 0 ? (
                          <div className="flex items-center text-emerald-500">
                            <ChevronUp className="h-5 w-5" />
                            <span>+{calculateScoreMutation.data.change}</span>
                          </div>
                        ) : calculateScoreMutation.data.change < 0 ? (
                          <div className="flex items-center text-rose-500">
                            <ChevronDown className="h-5 w-5" />
                            <span>{calculateScoreMutation.data.change}</span>
                          </div>
                        ) : (
                          <span>No change</span>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">Your new social score</div>
                  </div>
                </div>
                
                <Accordion type="single" collapsible className="w-full">
                  {calculateScoreMutation.data.insights.strengths.length > 0 && (
                    <AccordionItem value="strengths">
                      <AccordionTrigger>
                        <div className="flex items-center">
                          <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-500" />
                          Strengths
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <ul className="space-y-2">
                          {calculateScoreMutation.data.insights.strengths.map((strength, index) => (
                            <li key={index} className="text-sm flex">
                              <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-500 flex-shrink-0 mt-0.5" />
                              <span>{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  )}
                  
                  {calculateScoreMutation.data.insights.weaknesses.length > 0 && (
                    <AccordionItem value="weaknesses">
                      <AccordionTrigger>
                        <div className="flex items-center">
                          <XCircle className="h-4 w-4 mr-2 text-rose-500" />
                          Areas to Improve
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <ul className="space-y-2">
                          {calculateScoreMutation.data.insights.weaknesses.map((weakness, index) => (
                            <li key={index} className="text-sm flex">
                              <XCircle className="h-4 w-4 mr-2 text-rose-500 flex-shrink-0 mt-0.5" />
                              <span>{weakness}</span>
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  )}
                  
                  {calculateScoreMutation.data.insights.recommendations.length > 0 && (
                    <AccordionItem value="recommendations">
                      <AccordionTrigger>
                        <div className="flex items-center">
                          <Sparkles className="h-4 w-4 mr-2 text-primary" />
                          Recommendations
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <ul className="space-y-2">
                          {calculateScoreMutation.data.insights.recommendations.map((recommendation, index) => (
                            <li key={index} className="text-sm flex">
                              <Sparkles className="h-4 w-4 mr-2 text-primary flex-shrink-0 mt-0.5" />
                              <span>{recommendation}</span>
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  )}
                </Accordion>
              </>
            ) : (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
          </div>
          
          <div className="flex justify-end space-x-2 mt-4">
            <Button onClick={() => setShowInsightsDialog(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}