import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Link, insertLinkSchema, ProfileStats } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { z } from "zod";
const compactLogoPath = "/assets/logo-compact.png";
const logoPath = "/assets/logo-horizontal.png";

// Feature flags
const FEATURE_CONTENT_PREVIEW = false; // Set to true to re-enable Content Preview feature

import {
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  ArrowUp,
  ArrowDown,
  MessageSquare,
  Bell,
  Eye,
  Settings,
  User,
  BarChart4,
  FileText,
  Share2,
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  ThumbsUp,
  GitBranch,
  Activity,
  Linkedin,
  Twitter,
  Facebook,
  Github,
  Instagram,
  ArrowRight,
  Youtube,
  Figma,
  Mail,
  Globe,
  Grid,
  List,
  LayoutGrid,
  Award,
  Shuffle,
  Brain,
  Sparkles,
  LogOut,
  Palette,
  Star,
  ExternalLink,
  Presentation,
  Briefcase,
  Rocket,
  Zap,
  Switch,
  Save,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Switch as UISwitch } from "@/components/ui/switch";
import { SpotlightCard } from "@/components/spotlight-card";

import { InstagramPreview } from "@/components/instagram-preview";
import SocialMediaIntegration from "@/components/social-media-integration";

// Extended Zod schema for link forms
const linkFormSchema = insertLinkSchema.extend({
  platform: z.string().min(1, "Please select a platform"),
  title: z.string().min(1, "Title is required"),
  url: z.string().url("Please enter a valid URL").min(1, "URL is required"),
});

type LinkFormValues = z.infer<typeof linkFormSchema>;

// Platform options with icons
const platformOptions = [
  { value: "twitter", label: "Twitter", icon: <Twitter className="h-4 w-4" />, color: "#1DA1F2" },
  { value: "instagram", label: "Instagram", icon: <Instagram className="h-4 w-4" />, color: "#E1306C" },
  { value: "linkedin", label: "LinkedIn", icon: <Linkedin className="h-4 w-4" />, color: "#0077B5" },
  { value: "facebook", label: "Facebook", icon: <Facebook className="h-4 w-4" />, color: "#1877F2" },
  { value: "youtube", label: "YouTube", icon: <Youtube className="h-4 w-4" />, color: "#FF0000" },
  { value: "github", label: "GitHub", icon: <Github className="h-4 w-4" />, color: "#333" },
  { value: "figma", label: "Figma", icon: <Figma className="h-4 w-4" />, color: "#F24E1E" },
  { value: "email", label: "Email", icon: <Mail className="h-4 w-4" />, color: "#4CAF50" },
  { value: "website", label: "Website", icon: <Globe className="h-4 w-4" />, color: "#6200EA" },
];

// Get platform icon
function getPlatformIcon(platform: string) {
  const platformOption = platformOptions.find(p => p.value === platform);
  return platformOption ? platformOption.icon : <Globe className="h-4 w-4" />;
}

// Get platform color
function getPlatformColor(platform: string) {
  const platformOption = platformOptions.find(p => p.value === platform);
  return platformOption ? platformOption.color : "#6200EA";
}

// Link Card Component
import { PitchModeSync } from "@/components/pitch-mode-sync";

function LinkCard({ 
  link, 
  onEdit, 
  onDelete, 
  onMoveUp, 
  onMoveDown, 
  onFeature, 
  onOptimize
}: { 
  link: Link;
  onEdit: (link: Link) => void;
  onDelete: (id: number) => void;
  onMoveUp: (id: number) => void;
  onMoveDown: (id: number) => void;
  onFeature: (id: number) => void;
  onOptimize: (link: Link) => void;
}) {
  return (
    <Card className="relative overflow-hidden">
      {link.featured && (
        <div className="absolute top-0 right-0">
          <div className="bg-primary text-primary-foreground text-xs font-semibold px-2 py-1 rounded-bl-md">
            Featured
          </div>
        </div>
      )}
      
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <div 
              className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center mr-3" 
              style={{ backgroundColor: `${getPlatformColor(link.platform)}20` }} 
            >
              {getPlatformIcon(link.platform)}
            </div>
            
            <div>
              <h3 className="font-medium text-base-content">{link.title}</h3>
              <a 
                href={link.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-sm text-base-content/70 hover:underline truncate max-w-[200px] inline-block"
              >
                {link.url}
              </a>
            </div>
          </div>
          
          <div className="flex items-center">
            {/* AI Score indicator */}
            {link.aiScore !== null && (
              <div className="mr-4 flex items-center" title="Content Quality Score">
                <div className="w-8 h-8 rounded-full border-2 border-background flex items-center justify-center relative">
                  <span className="text-xs font-medium">{link.aiScore}</span>
                  <div 
                    className="absolute inset-0 rounded-full border-2 border-transparent"
                    style={{ 
                      borderTopColor: link.aiScore > 70 ? "#10b981" : link.aiScore > 40 ? "#f59e0b" : "#ef4444",
                      transform: "rotate(-45deg)"
                    }}
                  ></div>
                </div>
              </div>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVerticalIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onEdit(link)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onOptimize(link)}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Optimize Content
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onFeature(link.id)}>
                  {link.featured ? (
                    <>
                      <X className="h-4 w-4 mr-2" />
                      Unfeature
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Feature
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onMoveUp(link.id)}>
                  <ArrowUp className="h-4 w-4 mr-2" />
                  Move Up
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onMoveDown(link.id)}>
                  <ArrowDown className="h-4 w-4 mr-2" />
                  Move Down
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onDelete(link.id)} 
                  className="text-red-500 dark:text-red-400 focus:text-red-500 dark:focus:text-red-400"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {link.description && (
          <p className="mt-3 text-sm text-base-content/70">
            {link.description}
          </p>
        )}
        
        <div className="flex items-center justify-between mt-3 text-xs text-base-content/70">
          <div className="flex items-center">
            <Eye className="h-3 w-3 mr-1" />
            <span>{link.views || 0} views</span>
            <span className="mx-2">•</span>
            <ExternalLink className="h-3 w-3 mr-1" />
            <span>{link.clicks || 0} clicks</span>
          </div>
          
          <a 
            href={link.url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-primary hover:underline text-xs font-medium inline-flex items-center"
          >
            Visit <ArrowRight className="h-3 w-3 ml-1" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

// View Mode Selector Component
function ViewModeSelector({ 
  currentMode, 
  onModeChange 
}: { 
  currentMode: string; 
  onModeChange: (mode: string) => void 
}) {
  return (
    <div className="inline-flex items-center rounded-md border border-base-300 shadow-sm p-1 bg-base-100">
      <Button
        variant={currentMode === "list" ? "secondary" : "ghost"}
        size="sm"
        className="h-8 px-2"
        onClick={() => onModeChange("list")}
      >
        <List className="h-4 w-4 mr-1" /> List
      </Button>
      <Button
        variant={currentMode === "grid" ? "secondary" : "ghost"}
        size="sm"
        className="h-8 px-2"
        onClick={() => onModeChange("grid")}
      >
        <Grid className="h-4 w-4 mr-1" /> Grid
      </Button>
    </div>
  );
}

function MoreVerticalIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="19" r="1" />
    </svg>
  )
}

export default function Dashboard() {
  const { toast } = useToast();
  
  // State
  const [showAddLinkDialog, setShowAddLinkDialog] = useState(false);
  const [showEditLinkDialog, setShowEditLinkDialog] = useState(false);
  const [currentLink, setCurrentLink] = useState<Link | null>(null);
  const [showOptimizeDialog, setShowOptimizeDialog] = useState(false);
  const [currentOptimizeLink, setCurrentOptimizeLink] = useState<Link | null>(null);
  
  // Add these missing projects states
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [projects, setProjects] = useState([]);
  
  // For the view mode toggle
  const [viewMode, setViewMode] = useState<string>("list");
  
  // Queries
  const {
    user
  } = useAuth();
  
  const [, navigate] = useLocation();
  
  // Get all links
  const {
    data: links = [],
    isLoading: isLoadingLinks,
    isError: isErrorLinks,
  } = useQuery({
    queryKey: ["/api/links"],
    enabled: !!user,
  });
  
  // Get stats
  const {
    data: stats,
    isLoading: isLoadingStats,
    isError: isErrorStats,
  } = useQuery<ProfileStats>({
    queryKey: ["/api/stats"],
    enabled: !!user,
  });
  
  // Create link mutation
  const createLinkMutation = useMutation({
    mutationFn: async (data: LinkFormValues) => {
      return await apiRequest("POST", "/api/links", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/links"] });
      setShowAddLinkDialog(false);
      toast({
        title: "Link added",
        description: "Your link has been successfully added.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add link",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update link mutation
  const updateLinkMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Link> }) => {
      const response = await apiRequest("PATCH", `/api/links/${id}`, data);
      const result = await response.json();
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/links"] });
      setShowEditLinkDialog(false);
      toast({
        title: "Link updated",
        description: "Your link has been successfully updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update link",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Delete link mutation
  const deleteLinkMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/links/${id}`);
      if (!response.ok) {
        throw new Error("Failed to delete link");
      }
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/links"] });
      toast({
        title: "Link deleted",
        description: "Your link has been successfully deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete link",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Feature link mutation
  const featureLinkMutation = useMutation({
    mutationFn: async (id: number) => {
      const link = links.find((l) => l.id === id);
      if (!link) throw new Error("Link not found");
      
      const response = await apiRequest("PATCH", `/api/links/${id}`, {
        featured: !link.featured,
      });
      const result = await response.json();
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/links"] });
      toast({
        title: "Link updated",
        description: "Featured status has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update link",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Reorder links mutation
  const reorderLinksMutation = useMutation({
    mutationFn: async ({ id, direction, linkScores }: { id?: number; direction?: 'up' | 'down'; linkScores?: any[] }) => {
      if (linkScores) {
        // Direct reorder with linkScores
        const response = await apiRequest("POST", "/api/links/reorder", { linkScores });
        return await response.json();
      }
      
      if (!id || !direction) throw new Error("Missing id or direction");
      
      // Find the link and its current index
      const linkIndex = links.findIndex(l => l.id === id);
      if (linkIndex === -1) throw new Error("Link not found");
      
      // Determine the new index based on direction
      let newIndex = linkIndex;
      if (direction === 'up' && linkIndex > 0) {
        newIndex = linkIndex - 1;
      } else if (direction === 'down' && linkIndex < links.length - 1) {
        newIndex = linkIndex + 1;
      } else {
        // No change needed
        return { success: true };
      }
      
      // Calculate scores for the reordering
      const calculatedLinkScores = links.map((link, index) => {
        if (index === linkIndex) return { id: link.id, score: links[newIndex].score || 0 };
        if (index === newIndex) return { id: link.id, score: links[linkIndex].score || 0 };
        return { id: link.id, score: link.score || 0 };
      });
      
      const response = await apiRequest("POST", "/api/links/reorder", { linkScores: calculatedLinkScores });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/links"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to reorder links",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
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
  
  // Add Link form
  const addLinkForm = useForm<LinkFormValues>({
    resolver: zodResolver(linkFormSchema),
    defaultValues: {
      platform: "",
      title: "",
      url: "",
      description: "",
    },
  });
  
  // Edit Link form
  const editLinkForm = useForm<LinkFormValues>({
    resolver: zodResolver(linkFormSchema),
    defaultValues: {
      platform: "",
      title: "",
      url: "",
      description: "",
    },
  });
  
  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!showAddLinkDialog) {
      addLinkForm.reset();
    }
  }, [showAddLinkDialog, addLinkForm]);
  
  // Load the current link data into the edit form
  useEffect(() => {
    if (currentLink && showEditLinkDialog) {
      editLinkForm.reset({
        platform: currentLink.platform,
        title: currentLink.title,
        url: currentLink.url,
        description: currentLink.description || "",
      });
    }
  }, [currentLink, showEditLinkDialog, editLinkForm]);
  
  // Handle form submissions
  const onAddLinkSubmit = (data: LinkFormValues) => {
    createLinkMutation.mutate(data);
  };
  
  const onEditLinkSubmit = (data: LinkFormValues) => {
    if (currentLink) {
      updateLinkMutation.mutate({
        id: currentLink.id,
        data: data,
      });
    }
  };
  
  // Handle link actions
  const handleEditLink = (link: Link) => {
    setCurrentLink(link);
    setShowEditLinkDialog(true);
  };
  
  const handleDeleteLink = (id: number) => {
    if (confirm("Are you sure you want to delete this link?")) {
      deleteLinkMutation.mutate(id);
    }
  };
  
  const handleMoveUp = (id: number) => {
    reorderLinksMutation.mutate({ id, direction: 'up' });
  };
  
  const handleMoveDown = (id: number) => {
    reorderLinksMutation.mutate({ id, direction: 'down' });
  };
  
  const handleFeatureLink = (id: number) => {
    featureLinkMutation.mutate(id);
  };
  
  const handleOptimizeContent = (link: Link) => {
    setCurrentOptimizeLink(link);
    setShowOptimizeDialog(true);
  };

  // Add missing functions for LinkCard component
  const handleToggleVisibility = (id: number) => {
    // Toggle link visibility
    const link = links.find(l => l.id === id);
    if (link) {
      updateLinkMutation.mutate({
        id: link.id,
        data: { visible: !link.visible }
      });
    }
  };

  const handleReorder = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= links.length) return;
    
    // Calculate new scores for reordering
    const linkScores = links.map((link, index) => {
      if (index === fromIndex) return { id: link.id, score: links[toIndex].score || 0 };
      if (index === toIndex) return { id: link.id, score: links[fromIndex].score || 0 };
      return { id: link.id, score: link.score || 0 };
    });
    
    reorderLinksMutation.mutate({ linkScores });
  };
  
  const handleOptimizeSubmit = (improvements: Partial<Link>) => {
    if (currentOptimizeLink) {
      optimizeLinkMutation.mutate({
        id: currentOptimizeLink.id,
        improvements,
      });
    }
  };
  
  // Mock data for the charts
  const chartData = [
    { date: 'May 1', views: 12, clicks: 5 },
    { date: 'May 2', views: 19, clicks: 8 },
    { date: 'May 3', views: 15, clicks: 7 },
    { date: 'May 4', views: 27, clicks: 12 },
    { date: 'May 5', views: 25, clicks: 10 },
    { date: 'May 6', views: 32, clicks: 14 },
    { date: 'May 7', views: 29, clicks: 13 },
  ];
  
  return (
    <div className="min-h-screen bg-base-200 text-base-content">
      {/* Dashboard Header */}
      <header className="border-b shadow-sm">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-4">
            <img 
              src={`/assets/logo-horizontal.png?v=${Date.now()}`}
              alt="MyLinked" 
              className="h-8 w-auto"
              style={{ imageRendering: 'crisp-edges' }}
              onLoad={() => console.log('Dashboard logo loaded successfully')}
              onError={(e) => {
                console.error('Dashboard logo failed to load:', e);
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
          

          
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              className="md:hidden"
              onClick={() => {}}
            >
              <Menu className="h-4 w-4" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <img
                    src={user?.profileImage || "https://github.com/shadcn.png"}
                    alt="User"
                    className="rounded-full"
                    width="32"
                    height="32"
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{user?.name}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/settings")}>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600 dark:text-red-400">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      
      {/* Dashboard Main Content */}
      <main className="container px-4 md:px-6 py-6">
        <div className="grid gap-6">
          {/* Page Title */}
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-base-content/70">
              Manage your profile and monitor your performance.
            </p>
          </div>
          
          {/* Performance Overview */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Profile Views</CardTitle>
                <CardDescription>Total views this month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoadingStats ? (
                    <div className="h-8 w-16 bg-base-200 animate-pulse rounded"></div>
                  ) : (
                    stats?.views || 0
                  )}
                </div>
                {!isLoadingStats && (
                  <p className="text-xs text-base-content/70">
                    <span className="text-green-500 dark:text-green-400">+12.5%</span> from last month
                  </p>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Click-Through Rate</CardTitle>
                <CardDescription>Average CTR for all links</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoadingStats ? (
                    <div className="h-8 w-16 bg-base-200 animate-pulse rounded"></div>
                  ) : (
                    `${(stats?.ctr || 0).toFixed(1)}%`
                  )}
                </div>
                {!isLoadingStats && (
                  <p className="text-xs text-base-content/70">
                    <span className="text-green-500 dark:text-green-400">+2.3%</span> from last month
                  </p>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Social Score</CardTitle>
                <CardDescription>Profile optimization level</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="text-2xl font-bold">
                    {isLoadingStats ? (
                      <div className="h-8 w-16 bg-base-200 animate-pulse rounded"></div>
                    ) : (
                      stats?.score || 0
                    )}
                  </div>
                  {!isLoadingStats && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs"
                      onClick={() => navigate("/social-score")}
                    >
                      View Details
                    </Button>
                  )}
                </div>
                {!isLoadingStats && (
                  <div className="w-full bg-secondary h-2 rounded-full mt-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full" 
                      style={{ width: `${stats?.score || 0}%`, maxWidth: '100%' }}
                    ></div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Instagram Content Preview - NEW FEATURE SECTION */}
          {FEATURE_CONTENT_PREVIEW && (
            <Card className="mb-8 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 border-2 border-pink-200 dark:border-pink-700 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-3 text-xl text-pink-600 dark:text-pink-400">
                    <Instagram className="h-7 w-7" />
                    Instagram Content Preview
                    <Badge variant="secondary" className="bg-pink-100 text-pink-700 border-pink-300">NEW</Badge>
                  </CardTitle>
                  <CardDescription className="text-base mt-2">
                    Showcase your latest Instagram post on your profile. This replaces the old Live Profile Feed.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Your Preview
                  </h3>
                  <div className="p-6 border-2 border-dashed border-pink-300 rounded-lg text-center">
                    <Instagram className="h-12 w-12 mx-auto text-pink-400 mb-4" />
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Instagram Not Connected</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Connect your Instagram account to show your latest post here
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Connect Instagram
                  </h3>
                  <div className="space-y-4">
                    <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">
                      <Instagram className="h-4 w-4 mr-2" />
                      Connect Instagram Account
                    </Button>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <p className="mb-2">Once connected, your latest Instagram post will appear:</p>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>On your public profile</li>
                        <li>In visitor views</li>
                        <li>As a clickable thumbnail</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            </Card>
          )}

          {/* Main Content Grid */}
          <div className="grid gap-6 md:grid-cols-7">
            {/* Links Section - 4 columns on medium screens */}
            <div className="md:col-span-4 space-y-6">
              <Card className="shadow-md border-t-4 border-t-blue-500 dark:border-t-blue-700">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle>My Links</CardTitle>
                    <Button onClick={() => setShowAddLinkDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Link
                    </Button>
                  </div>
                  <CardDescription>Manage your social links and websites.</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-sm text-base-content/70">
                      {links.length} link{links.length !== 1 ? 's' : ''} total
                    </p>
                    
                    <ViewModeSelector
                      currentMode={viewMode}
                      onModeChange={setViewMode}
                    />
                  </div>
                  
                  {isLoadingLinks ? (
                    <div className="space-y-4">
                      <div className="h-28 bg-base-200 rounded animate-pulse"></div>
                      <div className="h-28 bg-base-200 rounded animate-pulse"></div>
                    </div>
                  ) : isErrorLinks ? (
                    <div className="text-center py-8">
                      <div className="text-red-500 dark:text-red-400 mb-2">
                        <X className="h-8 w-8 mx-auto" />
                      </div>
                      <h3 className="font-medium">Error Loading Links</h3>
                      <p className="text-sm text-base-content/70">Could not load your links. Please try again.</p>
                    </div>
                  ) : links.length === 0 ? (
                    <div className="text-center py-8 bg-base-200/10 rounded-lg border border-dashed">
                      <Link className="h-8 w-8 mx-auto text-base-content/70" />
                      <h3 className="mt-2 font-medium">No Links Yet</h3>
                      <p className="text-sm text-base-content/70">Add your first link to get started.</p>
                      <Button 
                        onClick={() => setShowAddLinkDialog(true)} 
                        className="mt-4"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Link
                      </Button>
                    </div>
                  ) : (
                    <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "space-y-4"}>
                      {links.map((link, index) => (
                        <LinkCard
                          key={link.id}
                          link={link}
                          onEdit={handleEditLink}
                          onDelete={handleDeleteLink}
                          onMoveUp={handleMoveUp}
                          onMoveDown={handleMoveDown}
                          onFeature={handleFeatureLink}
                          onOptimize={handleOptimizeContent}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Engagement Trends Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Engagement Trends</CardTitle>
                  <CardDescription>View your profile performance over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={chartData}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="clicksGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Area
                          type="monotone"
                          dataKey="views"
                          stroke="#6366f1"
                          fillOpacity={1}
                          fill="url(#viewsGradient)"
                        />
                        <Area
                          type="monotone"
                          dataKey="clicks"
                          stroke="#f43f5e"
                          fillOpacity={1}
                          fill="url(#clicksGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center mt-4 space-x-6">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-indigo-500 rounded-full mr-2"></div>
                      <span className="text-sm">Views</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-rose-500 rounded-full mr-2"></div>
                      <span className="text-sm">Clicks</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="justify-end pt-0">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => navigate("/analytics")}
                  >
                    <BarChart4 className="h-4 w-4 mr-2" />
                    View Detailed Analytics
                  </Button>
                </CardFooter>
              </Card>
            </div>
            
            {/* Instagram Content Preview Section - Full Width */}
            {FEATURE_CONTENT_PREVIEW && (
              <div className="md:col-span-7 mb-6">
              <Card className="shadow-md border-t-4 border-t-pink-500 dark:border-t-pink-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Instagram className="h-5 w-5 text-pink-500" />
                    Instagram Content Preview
                  </CardTitle>
                  <CardDescription>
                    Connect your Instagram to showcase your latest post on your profile
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <InstagramPreview userId={user?.id} isOwner={true} />
                    </div>
                    <div>
                      <SocialMediaIntegration />
                    </div>
                  </div>
                </CardContent>
              </Card>
              </div>
            )}
          </div>
          
          
            
            {/* Right Sidebar - 3 columns on medium screens */}
            <div className="md:col-span-3 space-y-6">
              {/* Quick Actions Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Quick Actions</CardTitle>
                  <CardDescription>Frequently used tools</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-3 gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex flex-col h-auto py-3 text-center justify-center"
                      onClick={() => navigate("/analytics")}
                    >
                      <BarChart4 className="h-4 w-4 mb-1" />
                      <span className="text-xs">Analytics</span>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex flex-col h-auto py-3 text-center justify-center"
                      onClick={() => navigate("/social-score")}
                    >
                      <Star className="h-4 w-4 mb-1" />
                      <span className="text-xs">Score</span>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex flex-col h-auto py-3 text-center justify-center"
                      onClick={() => navigate("/profile")}
                    >
                      <User className="h-4 w-4 mb-1" />
                      <span className="text-xs">Profile</span>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex flex-col h-auto py-3 text-center justify-center"
                      onClick={() => setShowAddLinkDialog(true)}
                    >
                      <Plus className="h-4 w-4 mb-1" />
                      <span className="text-xs">Add Link</span>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex flex-col h-auto py-3 text-center justify-center"
                      onClick={() => navigate("/spotlight")}
                    >
                      <GitBranch className="h-4 w-4 mb-1" />
                      <span className="text-xs">Spotlight</span>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex flex-col h-auto py-3 text-center justify-center"
                      onClick={() => navigate("/branding")}
                    >
                      <Palette className="h-4 w-4 mb-1" />
                      <span className="text-xs">Branding</span>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex flex-col h-auto py-3 text-center justify-center"
                      onClick={() => navigate("/settings")}
                    >
                      <Settings className="h-4 w-4 mb-1" />
                      <span className="text-xs">Settings</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {/* Profile Preview Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Profile Preview</CardTitle>
                  <CardDescription>Your public profile</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center text-center p-4">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 mb-3 flex items-center justify-center text-white font-bold text-xl">
                    {user?.name ? user.name.charAt(0) : 'U'}
                  </div>
                  <h3 className="font-medium">{user?.name || 'User'}</h3>
                  <p className="text-sm text-base-content/70 mb-3">{user?.bio || 'Your bio here'}</p>
                  
                  <div className="w-full grid grid-cols-2 gap-2 mt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs"
                      onClick={() => navigate("/profile")}
                    >
                      Edit Profile
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs flex items-center"
                      onClick={() => window.open(`/profile/${user?.username}`, '_blank')}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Preview
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {/* Pitch Mode Card */}
              <PitchModeSync variant="dashboard" />
              
              {/* Spotlight Card for Collaborative Projects */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Collaborative Spotlight</CardTitle>
                  <CardDescription>Showcase projects with others</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <SpotlightCard />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      
      {/* Add Link Dialog */}
      <Dialog open={showAddLinkDialog} onOpenChange={setShowAddLinkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Link</DialogTitle>
            <DialogDescription>
              Add a new link to your profile.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...addLinkForm}>
            <form onSubmit={addLinkForm.handleSubmit(onAddLinkSubmit)} className="space-y-4">
              <FormField
                control={addLinkForm.control}
                name="platform"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Platform</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a platform" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {platformOptions.map((platform) => (
                          <SelectItem key={platform.value} value={platform.value}>
                            <div className="flex items-center">
                              {platform.icon}
                              <span className="ml-2">{platform.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select the platform or website type.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={addLinkForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="My Twitter Profile" {...field} />
                    </FormControl>
                    <FormDescription>
                      A descriptive name for this link.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={addLinkForm.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://twitter.com/yourusername" {...field} />
                    </FormControl>
                    <FormDescription>
                      The full URL including https://.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={addLinkForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Follow me for updates on web development and design."
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      A brief description of the link.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit" disabled={createLinkMutation.isPending}>
                  {createLinkMutation.isPending && (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  Save Link
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Link Dialog */}
      <Dialog open={showEditLinkDialog} onOpenChange={setShowEditLinkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Link</DialogTitle>
            <DialogDescription>
              Update the details of your link.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editLinkForm}>
            <form onSubmit={editLinkForm.handleSubmit(onEditLinkSubmit)} className="space-y-4">
              <FormField
                control={editLinkForm.control}
                name="platform"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Platform</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a platform" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {platformOptions.map((platform) => (
                          <SelectItem key={platform.value} value={platform.value}>
                            <div className="flex items-center">
                              {platform.icon}
                              <span className="ml-2">{platform.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select the platform or website type.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editLinkForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>
                      A descriptive name for this link.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editLinkForm.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>
                      The full URL including https://.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editLinkForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormDescription>
                      A brief description of the link.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit" disabled={updateLinkMutation.isPending}>
                  {updateLinkMutation.isPending && (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  Update Link
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Optimize Content Dialog */}
      <Dialog open={showOptimizeDialog} onOpenChange={setShowOptimizeDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Optimize Content</DialogTitle>
            <DialogDescription>
              AI-powered suggestions to improve engagement.
            </DialogDescription>
          </DialogHeader>
          
          {currentOptimizeLink && (
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              <div className="border rounded-md p-3 bg-base-200/20">
                <div className="flex items-center mb-2">
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center mr-2 flex-shrink-0"
                    style={{ backgroundColor: `${getPlatformColor(currentOptimizeLink.platform)}20` }}
                  >
                    {getPlatformIcon(currentOptimizeLink.platform)}
                  </div>
                  <h4 className="font-medium text-sm truncate">{currentOptimizeLink.title}</h4>
                </div>
                <p className="text-xs text-base-content/70 truncate">{currentOptimizeLink.url}</p>
              </div>
              
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-sm mb-1">Title Improvement</h4>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-base-content/70">Current quality score:</p>
                    <div className="flex items-center flex-shrink-0">
                      <div className="h-2 w-16 bg-base-200 rounded-full overflow-hidden mr-2">
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
                  <div className="border rounded-md p-2 text-sm mb-2 break-words">
                    <span className="text-base-content/70">Current: </span>
                    <span className="break-all">{currentOptimizeLink.title}</span>
                  </div>
                  <div className="border rounded-md p-2 text-sm bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900 break-words">
                    <span className="text-base-content/70">Suggestion: </span>
                    <span className="text-green-600 dark:text-green-400 font-medium break-words">
                      {currentOptimizeLink.platform === "twitter" 
                        ? "Follow My Twitter for Tech Insights & Updates" 
                        : `Improved ${currentOptimizeLink.title} with Better Keywords`}
                    </span>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-sm mb-1">Description Improvement</h4>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-base-content/70">Current quality score:</p>
                    <div className="flex items-center flex-shrink-0">
                      <div className="h-2 w-16 bg-base-200 rounded-full overflow-hidden mr-2">
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
                  <div className="border rounded-md p-2 text-sm mb-2 break-words">
                    <span className="text-base-content/70">Current: </span>
                    <span className="break-words">{currentOptimizeLink.description || "No description provided."}</span>
                  </div>
                  <div className="border rounded-md p-2 text-sm bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900 break-words">
                    <span className="text-base-content/70">Suggestion: </span>
                    <span className="text-green-600 dark:text-green-400 break-words">
                      {currentOptimizeLink.platform === "twitter" 
                        ? "Daily insights on web development, tech trends, and design. Join my 5K+ followers for practical tips and industry news!"
                        : "Join our community of professionals for exclusive insights, resources, and networking opportunities. Stay ahead in your career with our expert-curated content."}
                    </span>
                  </div>
                </div>
                
                <div className="pt-2">
                  <h4 className="font-medium text-sm mb-1">Platform-Specific Tips</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="break-words">
                        {currentOptimizeLink.platform === "twitter" 
                          ? "Add hashtags like #WebDev #Tech to increase discovery."
                          : "Include a strong call-to-action to encourage clicks."}
                      </span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="break-words">
                        {currentOptimizeLink.platform === "twitter" 
                          ? "Tweet consistently to maximize profile visits."
                          : "Use keywords relevant to your target audience."}
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
              
              <DialogFooter className="pt-2 flex-shrink-0">
                <Button 
                  variant="outline" 
                  onClick={() => setShowOptimizeDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleOptimizeSubmit({
                    title: currentOptimizeLink.platform === "twitter" 
                      ? "Follow My Twitter for Tech Insights & Updates" 
                      : `Improved ${currentOptimizeLink.title} with Better Keywords`,
                    description: currentOptimizeLink.platform === "twitter" 
                      ? "Daily insights on web development, tech trends, and design. Join my 5K+ followers for practical tips and industry news!"
                      : "Join our community of professionals for exclusive insights, resources, and networking opportunities. Stay ahead in your career with our expert-curated content.",
                    aiScore: 85
                  })}
                  disabled={optimizeLinkMutation.isPending}
                >
                  {optimizeLinkMutation.isPending && (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  Apply Suggestions
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Menu(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  )
}