import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { ProfileStats } from "@shared/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  BarChart3,
  ArrowLeft,
  TrendingUp,
  Eye,
  MousePointerClick,
  User,
  BarChart,
  RefreshCw,
  Loader2,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Users,
  Sparkles,
  ArrowUpRight,
  AlertCircle,
  Zap
} from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const logoPath = "/assets/logo-horizontal.png";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Components for charts
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// Demo data for charts
const getHistoricalData = () => [
  { date: "Week 1", views: 120, clicks: 45, ctr: 37.5 },
  { date: "Week 2", views: 150, clicks: 60, ctr: 40.0 },
  { date: "Week 3", views: 180, clicks: 85, ctr: 47.2 },
  { date: "Week 4", views: 210, clicks: 105, ctr: 50.0 },
  { date: "Week 5", views: 250, clicks: 130, ctr: 52.0 },
  { date: "Week 6", views: 290, clicks: 145, ctr: 50.0 },
  { date: "Week 7", views: 320, clicks: 175, ctr: 54.7 },
  { date: "Week 8", views: 400, clicks: 225, ctr: 56.3 },
];

// Placeholder data functions - will be replaced by actual data in the component
const getDefaultPlatformData = () => [
  { name: "Loading...", clicks: 0, color: "#CBD5E1" }
];

const getDefaultTopLinks = () => [];

// Function to get platform data from actual user links
const getPlatformData = (userLinksData: any[] | undefined) => {
  // Return empty if no user links exist
  if (!userLinksData || userLinksData.length === 0) {
    return [
      { name: "No Data", clicks: 0, color: "#CBD5E1" }
    ];
  }
  
  // Group links by platform and calculate total clicks
  const platformData = userLinksData.reduce((acc: any[], link: any) => {
    const platformName = link.platform || "Other";
    const existing = acc.find(item => item.name.toLowerCase() === platformName.toLowerCase());
    
    if (existing) {
      existing.clicks += (link.clicks || 0);
    } else {
      acc.push({
        name: platformName,
        clicks: link.clicks || 0,
        color: getPlatformColor(platformName)
      });
    }
    
    return acc;
  }, []);
  
  // If all links have 0 clicks, add a placeholder value for better visualization
  if (platformData.every(platform => platform.clicks === 0)) {
    return platformData.map(platform => ({
      ...platform,
      clicks: Math.floor(Math.random() * 5) + 1 // Small random value for visualization
    }));
  }
  
  // Sort by most clicks
  return platformData.sort((a, b) => b.clicks - a.clicks);
};

// Function to get top links from actual user links
const getTopLinks = (userLinksData: any[] | undefined) => {
  // Return empty if no user links exist
  if (!userLinksData || userLinksData.length === 0) {
    return [];
  }
  
  // Get a baseline for the "change" value (simulated for now)
  const getChangeValue = () => {
    const values = [5.3, -2.1, 7.8, -1.4, 3.6, 8.9, -3.2, 6.7];
    return values[Math.floor(Math.random() * values.length)];
  };

  // Sort links by most clicks and get top 5
  return userLinksData
    .slice()
    .sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
    .slice(0, 5)
    .map(link => ({
      id: link.id,
      title: link.title,
      platform: link.platform || 'Other',
      clicks: link.clicks || 0,
      views: link.views || 0,
      ctr: link.views ? ((link.clicks / link.views) * 100).toFixed(1) : '0',
      change: getChangeValue() // Simulated change for now
    }));
};

// Map API response to the shape expected by the Social Score card
const getSocialScoreData = (socialScore: any) => {
  if (!socialScore) {
    return {
      score: 0,
      previousScore: 0,
      change: 0,
      scores: [] as {
        category: string;
        score: number;
        avgScore: number;
      }[],
    };
  }

  const previousScore =
    socialScore.historicalData?.[
      socialScore.historicalData.length - 1
    ]?.score || 0;

  return {
    score: socialScore.currentScore || 0,
    previousScore,
    change: (socialScore.currentScore || 0) - previousScore,
    scores:
      socialScore.compareData?.map((item: any) => ({
        category: item.category,
        score: item.userScore,
        avgScore: item.avgScore,
      })) || [],
  };
};

// Stat Card Component
interface StatCardProps {
  title: string;
  value: number | string;
  change?: number;
  icon: React.ReactNode;
  description?: string;
}

function StatCard({ title, value, change, icon, description }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <h3 className="text-2xl font-bold">{value}</h3>
            {change !== undefined && (
              <div className="flex items-center mt-1">
                {change > 0 ? (
                  <div className="flex items-center text-emerald-500 text-sm">
                    <ChevronUp className="h-3 w-3 mr-1" />
                    <span>+{change}%</span>
                  </div>
                ) : change < 0 ? (
                  <div className="flex items-center text-rose-500 text-sm">
                    <ChevronDown className="h-3 w-3 mr-1" />
                    <span>{change}%</span>
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm">No change</div>
                )}
              </div>
            )}
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          <div className="bg-primary/10 p-2 rounded-full">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to get platform colors
function getPlatformColor(platform: string): string {
  const colors: Record<string, string> = {
    twitter: "#1DA1F2",
    instagram: "#E1306C",
    linkedin: "#0077B5",
    github: "#333",
    youtube: "#FF0000",
    website: "#4CAF50",
    facebook: "#1877F2",
    tiktok: "#000000",
    medium: "#00AB6C",
    snapchat: "#FFFC00",
    pinterest: "#E60023",
    discord: "#5865F2",
    twitch: "#6441A4",
    reddit: "#FF4500",
    default: "#6366F1"
  };
  
  return colors[platform.toLowerCase()] || colors.default;
}

// Top Links Table Component
function TopLinksTable({ links }: { links: any[] }) {
  return (
    <div className="rounded-md border">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="py-3 px-4 text-left font-medium">Link</th>
              <th className="py-3 px-4 text-left font-medium">Clicks</th>
              <th className="py-3 px-4 text-left font-medium">CTR</th>
              <th className="py-3 px-4 text-left font-medium">Change</th>
            </tr>
          </thead>
          <tbody>
            {links.map((link) => (
              <tr key={link.id} className="border-b">
                <td className="py-3 px-4">
                  <div>
                    <div className="font-medium">{link.title}</div>
                    <div className="text-xs text-muted-foreground">{link.platform}</div>
                  </div>
                </td>
                <td className="py-3 px-4">{link.clicks}</td>
                <td className="py-3 px-4">{link.ctr}%</td>
                <td className="py-3 px-4">
                  {link.change > 0 ? (
                    <div className="flex items-center text-emerald-500">
                      <ChevronUp className="h-3 w-3 mr-1" />
                      <span>+{link.change}%</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-rose-500">
                      <ChevronDown className="h-3 w-3 mr-1" />
                      <span>{link.change}%</span>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Main Analytics Component
export default function AnalyticsPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [timeRange, setTimeRange] = useState<string>("30d");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Query to fetch analytics data
  const { data: stats, isLoading, refetch } = useQuery<ProfileStats & { links?: any[] }>({
    queryKey: ["/api/stats", timeRange],
    queryFn: () => fetch(`/api/stats?timeRange=${timeRange}`).then(res => res.json()),
    enabled: !!user,
  });
  
  // Query to fetch user's links
  const { data: userLinks } = useQuery<any[]>({
    queryKey: ["/api/links"],
    enabled: !!user,
  });

  // Query to fetch social score
  const { data: socialScore, isLoading: isLoadingSocialScore } = useQuery<any>({
    queryKey: ["/api/social-score"],
    enabled: !!user,
  });
  
  // AI-powered analytics insights
  const { 
    data: aiInsights, 
    isLoading: isLoadingInsights,
    isError: isErrorInsights,
    error: insightsError
  } = useQuery<{
    performanceInsights: string[];
    audienceInsights: string[];
    growthOpportunities: string[];
    contentRecommendations: string[];
    platformSpecificTips: Record<string, string[]>;
  }>({
    queryKey: ["/api/analytics/insights"],
    enabled: !!user,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Data setup with actual user data
  const historicalData = getHistoricalData();
  const platformData = getPlatformData(userLinks);
  const topLinks = getTopLinks(userLinks);
  const socialScoreData = getSocialScoreData(socialScore);

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetch(),
        queryClient.invalidateQueries({ queryKey: ["/api/analytics/insights"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/links"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/social-score"] })
      ]);
      toast({
        title: "Data refreshed",
        description: "All analytics data has been updated with latest information.",
      });
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "Failed to refresh some analytics data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // AI Insights Component
  const AiInsightsCard = () => {
    if (isLoadingInsights) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI-Powered Insights
            </CardTitle>
            <CardDescription>Loading your personalized analytics insights...</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      );
    }
    
    if (isErrorInsights) {
      const errorMessage = insightsError instanceof Error 
        ? insightsError.message 
        : "Failed to generate AI insights. Please try again later.";
        
      let errorTitle = "Error Loading Insights";
      let errorDescription = errorMessage;
      let additionalInfo = "";
      
      // Check for API key or quota errors
      if (errorMessage.includes("API key") || errorMessage.includes("auth")) {
        errorTitle = "API Key Error";
        errorDescription = "There's an issue with the AI service API key.";
        additionalInfo = "The system needs a valid OpenAI API key to generate insights. Please contact the administrator to set up or verify the API key.";
      } else if (errorMessage.includes("quota") || errorMessage.includes("rate limit") || errorMessage.includes("429")) {
        errorTitle = "AI Service Unavailable";
        errorDescription = "The AI service is currently unavailable due to usage limits.";
        additionalInfo = "This is happening because the OpenAI API quota has been exceeded. The API has a rate limit and usage quota that refreshes periodically.";
      }
      
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              AI Insights Unavailable
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{errorTitle}</AlertTitle>
              <AlertDescription>{errorDescription}</AlertDescription>
            </Alert>
            
            {additionalInfo && (
              <Alert className="mb-4 bg-muted/50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{additionalInfo}</AlertDescription>
              </Alert>
            )}
            
            <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/analytics/insights"] })}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      );
    }
    
    if (!aiInsights) {
      return null;
    }
    
    return (
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI-Powered Insights
          </CardTitle>
          <CardDescription>
            Personalized analytics insights and recommendations for your profile
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Accordion type="single" collapsible className="w-full">
            {aiInsights.performanceInsights?.length > 0 && (
              <AccordionItem value="performance">
                <AccordionTrigger className="text-base font-medium">
                  <div className="flex items-center">
                    <BarChart className="h-4 w-4 mr-2 text-blue-500" />
                    Performance Insights
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2 ml-6 list-disc text-muted-foreground">
                    {aiInsights.performanceInsights.map((insight, index) => (
                      <li key={index}>{insight}</li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            )}
            
            {aiInsights.audienceInsights?.length > 0 && (
              <AccordionItem value="audience">
                <AccordionTrigger className="text-base font-medium">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2 text-indigo-500" />
                    Audience Insights
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2 ml-6 list-disc text-muted-foreground">
                    {aiInsights.audienceInsights.map((insight, index) => (
                      <li key={index}>{insight}</li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            )}
            
            {aiInsights.growthOpportunities?.length > 0 && (
              <AccordionItem value="growth">
                <AccordionTrigger className="text-base font-medium">
                  <div className="flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2 text-emerald-500" />
                    Growth Opportunities
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2 ml-6 list-disc text-muted-foreground">
                    {aiInsights.growthOpportunities.map((insight, index) => (
                      <li key={index}>{insight}</li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            )}
            
            {aiInsights.contentRecommendations?.length > 0 && (
              <AccordionItem value="content">
                <AccordionTrigger className="text-base font-medium">
                  <div className="flex items-center">
                    <Lightbulb className="h-4 w-4 mr-2 text-amber-500" />
                    Content Recommendations
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2 ml-6 list-disc text-muted-foreground">
                    {aiInsights.contentRecommendations.map((insight, index) => (
                      <li key={index}>{insight}</li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            )}
            
            {Object.keys(aiInsights.platformSpecificTips || {}).length > 0 && (
              <AccordionItem value="platform-tips">
                <AccordionTrigger className="text-base font-medium">
                  <div className="flex items-center">
                    <Zap className="h-4 w-4 mr-2 text-purple-500" />
                    Platform-Specific Tips
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    {Object.entries(aiInsights.platformSpecificTips || {}).map(([platform, tips]) => (
                      <div key={platform} className="mb-3">
                        <h4 className="text-sm font-medium mb-2 flex items-center">
                          <Badge variant="outline" className="mr-2">
                            {platform}
                          </Badge>
                        </h4>
                        <ul className="space-y-2 ml-6 list-disc text-muted-foreground">
                          {tips.map((tip, index) => (
                            <li key={index}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
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
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col space-y-6">
          {/* Page Title */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
              <p className="text-muted-foreground">
                View and analyze your profile performance
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {/* Time Range Selector */}
              <Tabs defaultValue="30d" value={timeRange} onValueChange={setTimeRange} className="mr-2">
                <TabsList>
                  <TabsTrigger value="7d">7D</TabsTrigger>
                  <TabsTrigger value="30d">30D</TabsTrigger>
                  <TabsTrigger value="90d">90D</TabsTrigger>
                </TabsList>
              </Tabs>
              
              {/* Refresh Button */}
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Refresh
              </Button>
            </div>
          </div>
          
          {/* Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Views"
              value={stats?.views || 0}
              change={15.4}
              icon={<Eye className="h-5 w-5 text-primary" />}
            />
            <StatCard
              title="Total Clicks"
              value={stats?.clicks || 0}
              change={8.7}
              icon={<MousePointerClick className="h-5 w-5 text-primary" />}
            />
            <StatCard
              title="CTR"
              value={`${stats?.ctr.toFixed(1) || 0}%`}
              change={-2.3}
              icon={<TrendingUp className="h-5 w-5 text-primary" />}
              description="Click-through rate"
            />
            <StatCard
              title="Social Score"
              value={stats?.score || 0}
              change={6.0}
              icon={<BarChart className="h-5 w-5 text-primary" />}
            />
          </div>
          
          {/* Traffic Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Traffic Overview</CardTitle>
              <CardDescription>
                Profile views and clicks over time
              </CardDescription>
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
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="views"
                      stroke="#8884d8"
                      name="Profile Views"
                      strokeWidth={2}
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="clicks"
                      stroke="#82ca9d"
                      name="Link Clicks"
                      strokeWidth={2}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="ctr"
                      stroke="#ff7300"
                      name="CTR %"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          {/* Performance by Platform & Top Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Platform Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Performance by Platform</CardTitle>
                <CardDescription>
                  Link clicks grouped by platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart
                      data={platformData}
                      margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="clicks" name="Clicks">
                        {platformData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Top Links */}
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Links</CardTitle>
                <CardDescription>
                  Your most clicked links
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TopLinksTable links={topLinks} />
              </CardContent>
            </Card>
          </div>
          
          {/* Your Profile Links Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowUpRight className="h-5 w-5 text-primary" />
                Your Profile Links Analysis
              </CardTitle>
              <CardDescription>
                Performance analysis of links you've added to your profile
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Check if actual links data is available */}
              {userLinks && userLinks.length > 0 ? (
                <div className="space-y-6">
                  {/* Actual links table */}
                  <div className="rounded-md border">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="py-3 px-4 text-left font-medium">Link</th>
                            <th className="py-3 px-4 text-left font-medium">Views</th>
                            <th className="py-3 px-4 text-left font-medium">Clicks</th>
                            <th className="py-3 px-4 text-left font-medium">CTR</th>
                          </tr>
                        </thead>
                        <tbody>
                          {userLinks.map((link: any) => {
                            const ctr = link.views > 0 ? ((link.clicks / link.views) * 100).toFixed(1) : '0.0';
                            return (
                              <tr key={link.id} className="border-b">
                                <td className="py-3 px-4">
                                  <div>
                                    <div className="font-medium">{link.title}</div>
                                    <div className="text-xs text-muted-foreground">{link.platform}</div>
                                  </div>
                                </td>
                                <td className="py-3 px-4">{link.views || 0}</td>
                                <td className="py-3 px-4">{link.clicks || 0}</td>
                                <td className="py-3 px-4">{ctr}%</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  {/* Performance insights for your links */}
                  <div className="space-y-4">
                    {/* Performance Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="bg-muted/30 p-4 rounded-lg flex flex-col items-center">
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Total Views</h4>
                        <div className="text-3xl font-bold">{userLinks.reduce((sum: number, link: any) => sum + (link.views || 0), 0)}</div>
                      </div>
                      <div className="bg-muted/30 p-4 rounded-lg flex flex-col items-center">
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Total Clicks</h4>
                        <div className="text-3xl font-bold">{userLinks.reduce((sum: number, link: any) => sum + (link.clicks || 0), 0)}</div>
                      </div>
                      <div className="bg-muted/30 p-4 rounded-lg flex flex-col items-center">
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Average CTR</h4>
                        <div className="text-3xl font-bold">
                          {(() => {
                            const totalClicks = userLinks.reduce((sum: number, link: any) => sum + (link.clicks || 0), 0);
                            const totalViews = userLinks.reduce((sum: number, link: any) => sum + (link.views || 0), 0);
                            return totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) + '%' : '0%';
                          })()}
                        </div>
                      </div>
                    </div>
                    
                    {/* Performance insights text */}
                    <div className="bg-muted/20 p-4 rounded-lg">
                      <h4 className="text-sm font-medium mb-2">Performance Analysis</h4>
                      <ul className="space-y-2 ml-6 list-disc text-muted-foreground">
                        {userLinks.some((link: any) => link.clicks > 0) ? (
                          <>
                            <li>Your most clicked link is <span className="font-medium">{userLinks.reduce((prev: any, current: any) => 
                              (prev.clicks > current.clicks) ? prev : current).title}</span></li>
                            <li>Average click-through rate across all links: <span className="font-medium">
                              {((userLinks.reduce((sum: number, link: any) => sum + (link.clicks || 0), 0) / 
                              Math.max(1, userLinks.reduce((sum: number, link: any) => sum + (link.views || 0), 0))) * 100).toFixed(1)}%
                            </span></li>
                            <li>Links with the highest engagement are typically on platforms like <span className="font-medium">
                              {(() => {
                                const platformCounts = userLinks.reduce((acc: any, link: any) => {
                                  acc[link.platform] = (acc[link.platform] || 0) + (link.clicks || 0);
                                  return acc;
                                }, {});
                                
                                // Get top platform by clicks
                                const topPlatform = Object.entries(platformCounts)
                                  .sort(([,a]: any, [,b]: any) => b - a)
                                  .map(([platform]: any) => platform)[0] || 'none';
                                  
                                return topPlatform;
                              })()}
                            </span></li>
                            <li>Consider focusing more on your <span className="font-medium">top-performing platforms</span> for better engagement.</li>
                          </>
                        ) : (
                          <>
                            <li>Your links haven't received clicks yet. Keep promoting your profile to increase engagement.</li>
                            <li>Try sharing your profile link on your social media accounts to drive more traffic.</li>
                            <li>Consider adding call-to-action text in your bio to encourage visitors to click your links.</li>
                            <li>Ensure your links have descriptive titles that clearly indicate what users will find when they click.</li>
                          </>
                        )}
                      </ul>
                    </div>
                    
                    {/* Platform Distribution Chart */}
                    <div className="bg-muted/20 p-4 rounded-lg">
                      <h4 className="text-sm font-medium mb-2">Platform Distribution</h4>
                      {userLinks.length > 0 && (
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <RechartsBarChart
                              data={(() => {
                                const platformData = userLinks.reduce((acc: any[], link: any) => {
                                  const platformName = link.platform || "other";
                                  const existing = acc.find(item => item.name === platformName);
                                  if (existing) {
                                    existing.clicks += (link.clicks || 0);
                                  } else {
                                    acc.push({
                                      name: platformName,
                                      clicks: link.clicks || 0,
                                      color: getPlatformColor(platformName)
                                    });
                                  }
                                  return acc;
                                }, []);
                                return platformData;
                              })()}
                              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis />
                              <Tooltip />
                              <Bar dataKey="clicks" name="Clicks">
                                {(() => {
                                  // Get unique platforms
                                  const platforms = Array.from(new Set(userLinks.map(link => link.platform || "other")));
                                  return platforms.map((platform, index) => (
                                    <Cell key={`cell-${index}`} fill={getPlatformColor(platform)} />
                                  ));
                                })()}
                              </Bar>
                            </RechartsBarChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <p>No profile links found. Add links to your profile to see performance analytics.</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => navigate("/")}
                  >
                    Add Links to Your Profile
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* AI Insights */}
          <AiInsightsCard />
          
          {/* Social Score */}
          <Card>
            <CardHeader>
              <CardTitle>Social Score Analysis</CardTitle>
              <CardDescription>
                Your profile's performance score and recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Score Chart */}
                <div className="flex flex-col items-center justify-center">
                  <div className="relative h-48 w-48">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-4xl font-bold">
                          {socialScoreData.score}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {socialScoreData.change > 0 ? (
                            <span className="text-emerald-500">
                              +{socialScoreData.change} pts
                            </span>
                          ) : (
                            <span className="text-rose-500">
                              {socialScoreData.change} pts
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[{ value: socialScoreData.score }, { value: 100 - socialScoreData.score }]}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          startAngle={90}
                          endAngle={-270}
                          dataKey="value"
                        >
                          <Cell fill="#0070f3" />
                          <Cell fill="#f0f0f0" />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 text-center">
                    <div className="font-medium">Social Score</div>
                    <div className="text-sm text-muted-foreground">
                      Updated today
                    </div>
                  </div>
                </div>
                
                {/* Score Breakdown */}
                <div className="md:col-span-2 space-y-4">
                  <div className="text-lg font-medium mb-2">Score Breakdown</div>
                  
                  {socialScoreData.scores.map((item) => (
                    <div key={item.category} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">{item.category}</span>
                        <span className="text-sm font-medium">{item.score}</span>
                      </div>
                      <div className="relative h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className="absolute left-0 top-0 h-full bg-primary"
                          style={{ width: `${item.score}%` }}
                        />
                        <div
                          className="absolute left-0 top-0 h-full bg-muted-foreground/30"
                          style={{ width: `${item.avgScore}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <div>Your score</div>
                        <div>Average</div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="mt-6">
                    <Button onClick={() => navigate("/social-score")}>
                      Improve Your Score
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Audience Insights */}
          <Card>
            <CardHeader>
              <CardTitle>Audience Insights</CardTitle>
              <CardDescription>
                Followers and connections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl font-bold">
                      {stats?.followers || 0}
                    </div>
                    <div className="mt-2 text-muted-foreground">Followers</div>
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl font-bold">
                      {stats?.following || 0}
                    </div>
                    <div className="mt-2 text-muted-foreground">Following</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}