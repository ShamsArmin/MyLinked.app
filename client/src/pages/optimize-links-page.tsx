import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Helper function to display platform icons
function getPlatformIcon(platform: string) {
  const iconClasses = "h-5 w-5";
  
  switch (platform.toLowerCase()) {
    case 'twitter':
    case 'x':
      return <svg className={iconClasses} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg>;
    case 'instagram':
      return <svg className={iconClasses} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>;
    case 'linkedin':
      return <svg className={iconClasses} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>;
    case 'github':
      return <svg className={iconClasses} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" /></svg>;
    case 'youtube':
      return <svg className={iconClasses} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>;
    case 'facebook':
      return <svg className={iconClasses} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>;
    case 'tiktok':
      return <svg className={iconClasses} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" /></svg>;
    case 'discord':
      return <svg className={iconClasses} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" /></svg>;
    default:
      return <svg className={iconClasses} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>;
  }
}

function getPlatformColor(platform: string) {
  switch (platform.toLowerCase()) {
    case 'twitter':
    case 'x':
      return "#1DA1F2";
    case 'instagram':
      return "#E1306C";
    case 'linkedin':
      return "#0077B5";
    case 'github':
      return "#333";
    case 'youtube':
      return "#FF0000";
    case 'facebook':
      return "#1877F2";
    case 'tiktok':
      return "#000000";
    case 'discord':
      return "#5865F2";
    default:
      return "#6E6E6E";
  }
}

export default function OptimizeLinksPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [showOptimizeDialog, setShowOptimizeDialog] = useState(false);
  const [currentOptimizeLink, setCurrentOptimizeLink] = useState<Link | null>(null);
  
  // Fetch all links
  const { data: links, isLoading } = useQuery<Link[]>({
    queryKey: ["/api/links"],
  });
  
  // Handle going back to dashboard
  const handleBackToDashboard = () => {
    navigate("/");
  };
  
  // Handle optimize link
  const handleOptimizeLink = (link: Link) => {
    setCurrentOptimizeLink(link);
    setShowOptimizeDialog(true);
  };
  
  // Optimize link mutation
  const optimizeLinkMutation = useMutation({
    mutationFn: async ({ id, improvements }: { id: number; improvements: Partial<Link> }) => {
      const response = await apiRequest("PATCH", `/api/links/${id}/optimize`, improvements);
      const result = await response.json();
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/links"] });
      setShowOptimizeDialog(false);
      toast({
        title: "Link optimized",
        description: "Your link has been updated with optimized content.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to optimize link",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle optimize submit
  const handleOptimizeSubmit = (improvements: Partial<Link>) => {
    if (currentOptimizeLink) {
      optimizeLinkMutation.mutate({
        id: currentOptimizeLink.id,
        improvements,
      });
    }
  };
  
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={handleBackToDashboard} className="mr-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Optimize Your Links</h1>
          </div>
        </div>
        
        <div className="mb-8">
          <p className="text-muted-foreground">
            Select any link below to optimize its content using AI suggestions.
          </p>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center my-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : links && links.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {links.map((link) => (
              <Card key={link.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="flex h-10 w-10 items-center justify-center rounded-full"
                      style={{ backgroundColor: `${getPlatformColor(link.platform)}20` }}
                    >
                      <div className="text-primary">{getPlatformIcon(link.platform)}</div>
                    </div>
                    <CardTitle className="text-lg">{link.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4 truncate">
                    {link.url}
                  </p>
                  {link.description && (
                    <p className="text-sm mb-4 line-clamp-2">
                      {link.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <span className="mr-3">{link.clicks || 0} clicks</span>
                      <span>{link.views || 0} views</span>
                    </div>
                    <Button 
                      variant="default" 
                      size="sm" 
                      onClick={() => handleOptimizeLink(link)}
                    >
                      Optimize Content
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium mb-2">No links found</h3>
            <p className="text-muted-foreground mb-4">You haven't added any links yet.</p>
            <Button onClick={handleBackToDashboard}>Go back to Dashboard</Button>
          </div>
        )}
      </main>
      
      {/* Optimize Dialog */}
      <Dialog open={showOptimizeDialog} onOpenChange={setShowOptimizeDialog}>
        <DialogContent className="max-w-md overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Optimize Link Content</DialogTitle>
            <DialogDescription>
              AI-powered suggestions to improve your content
            </DialogDescription>
          </DialogHeader>
          
          {currentOptimizeLink && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3 mb-4">
                <div 
                  className="flex h-9 w-9 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${getPlatformColor(currentOptimizeLink.platform)}20` }}
                >
                  {getPlatformIcon(currentOptimizeLink.platform)}
                </div>
                <div>
                  <h4 className="font-medium text-sm">{currentOptimizeLink.title}</h4>
                  <p className="text-xs text-muted-foreground truncate">{currentOptimizeLink.url}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-sm mb-1">Title Improvement</h4>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-muted-foreground">Current quality score:</p>
                    <div className="flex items-center">
                      <div className="h-2 w-16 bg-muted rounded-full overflow-hidden mr-2">
                        <div 
                          className="h-full rounded-full" 
                          style={{ 
                            width: `${70}%`,
                            backgroundColor: 70 > 70 ? "#10b981" : 70 > 40 ? "#f59e0b" : "#ef4444"
                          }}
                        ></div>
                      </div>
                      <span className="text-xs font-medium">70%</span>
                    </div>
                  </div>
                  <div className="border rounded-md p-2 text-sm mb-2">
                    <span className="text-muted-foreground">Current: </span>
                    {currentOptimizeLink.title}
                  </div>
                  <div className="border rounded-md p-2 text-sm bg-green-50 border-green-200">
                    <span className="text-muted-foreground">Suggestion: </span>
                    <span className="text-green-600 font-medium">
                      {currentOptimizeLink.platform === "twitter" || currentOptimizeLink.platform === "x"
                        ? "Follow My X for Tech Insights & Updates" 
                        : `Improved ${currentOptimizeLink.title} with Better Keywords`}
                    </span>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-sm mb-1">Description Improvement</h4>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-muted-foreground">Current quality score:</p>
                    <div className="flex items-center">
                      <div className="h-2 w-16 bg-muted rounded-full overflow-hidden mr-2">
                        <div 
                          className="h-full rounded-full" 
                          style={{ 
                            width: `${45}%`,
                            backgroundColor: 45 > 70 ? "#10b981" : 45 > 40 ? "#f59e0b" : "#ef4444"
                          }}
                        ></div>
                      </div>
                      <span className="text-xs font-medium">45%</span>
                    </div>
                  </div>
                  <div className="border rounded-md p-2 text-sm mb-2">
                    <span className="text-muted-foreground">Current: </span>
                    {currentOptimizeLink.description || "No description provided."}
                  </div>
                  <div className="border rounded-md p-2 text-sm bg-green-50 border-green-200">
                    <span className="text-muted-foreground">Suggestion: </span>
                    <span className="text-green-600">
                      {currentOptimizeLink.platform === "twitter" || currentOptimizeLink.platform === "x"
                        ? "Daily insights on web development, tech trends, and design. Join my 5K+ followers for practical tips and industry news!"
                        : "Join our community of professionals for exclusive insights, resources, and networking opportunities. Stay ahead in your career with our expert-curated content."}
                    </span>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-sm mb-1">Key Improvement Tips</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      <span>
                        {currentOptimizeLink.platform === "twitter" || currentOptimizeLink.platform === "x"
                        ? "Include specific numbers for credibility."
                        : "Use action verbs to enhance engagement."}
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      <span>
                        {currentOptimizeLink.platform === "twitter" || currentOptimizeLink.platform === "x"
                        ? "Add hashtags to increase visibility."
                        : "Include your unique value proposition."}
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      <span>
                        {currentOptimizeLink.platform === "twitter" || currentOptimizeLink.platform === "x"
                        ? "Post consistently to maximize profile visits."
                        : "Use keywords relevant to your target audience."}
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
              
              <DialogFooter className="pt-2 mt-4 sticky bottom-0 bg-background">
                <Button 
                  variant="outline" 
                  onClick={() => setShowOptimizeDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleOptimizeSubmit({
                    title: currentOptimizeLink.platform === "twitter" || currentOptimizeLink.platform === "x"
                      ? "Follow My X for Tech Insights & Updates" 
                      : `Improved ${currentOptimizeLink.title} with Better Keywords`,
                    description: currentOptimizeLink.platform === "twitter" || currentOptimizeLink.platform === "x"
                      ? "Daily insights on web development, tech trends, and design. Join my 5K+ followers for practical tips and industry news!"
                      : "Join our community of professionals for exclusive insights, resources, and networking opportunities. Stay ahead in your career with our expert-curated content.",
                    aiScore: 85
                  })}
                  disabled={optimizeLinkMutation.isPending}
                >
                  {optimizeLinkMutation.isPending ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Optimizing...
                    </div>
                  ) : (
                    "Apply Suggestions"
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}