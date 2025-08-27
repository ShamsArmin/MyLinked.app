import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Award,
  Plus,
  Edit,
  Trash,
  ExternalLink,
  Eye,
  Copy,
  UserPlus,
  Check,
  Loader2,
  ArrowLeft,
  Pin,
  Users,
  Calendar,
  Tag,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Image as ImageIcon,
  Link as LinkIcon,
  X,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Types
interface SpotlightContributor {
  id: number;
  name: string;
  email?: string;
  role?: string;
  userId?: number;
  isRegisteredUser: boolean;
  user?: {
    id: number;
    username: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

interface SpotlightTag {
  id: number;
  label: string;
  icon?: string;
  type: string;
}

interface SpotlightProject {
  id: number;
  userId: number;
  title: string;
  url: string;
  description?: string;
  thumbnail?: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  clickCount: number;
  contributors?: SpotlightContributor[];
  tags?: SpotlightTag[];
}

// Form Schemas
const createProjectSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  url: z.string().url("Please enter a valid URL"),
  description: z.string().optional(),
  thumbnail: z.string().optional(),
  isPinned: z.boolean().default(false),
  contributors: z.array(
    z.object({
      name: z.string().min(1, "Name is required"),
      role: z.string().optional(),
    })
  ).optional(),
  tags: z.array(
    z.object({
      label: z.string().min(1, "Label is required"),
      type: z.string().optional(),
    })
  ).max(3).optional(),
});

export default function SpotlightPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  // Removed tab state as we no longer need tabs
  const [selectedProject, setSelectedProject] = useState<SpotlightProject | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddContributorDialogOpen, setIsAddContributorDialogOpen] = useState(false);
  const [isAddTagDialogOpen, setIsAddTagDialogOpen] = useState(false);
  const [contributorFields, setContributorFields] = useState([{ id: Date.now() }]);
  const [tagFields, setTagFields] = useState([{ id: Date.now() }]);
  
  // Form for creating a project
  const createProjectForm = useForm<z.infer<typeof createProjectSchema>>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      title: "",
      url: "",
      description: "",
      thumbnail: "",
      isPinned: false,
      contributors: [],
      tags: [],
    },
  });
  
  // Form for editing a project
  const editProjectForm = useForm<z.infer<typeof createProjectSchema>>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      title: "",
      url: "",
      description: "",
      thumbnail: "",
      isPinned: false,
      contributors: [],
      tags: [],
    },
  });
  
  // Form for adding a contributor
  const addContributorForm = useForm({
    defaultValues: {
      name: "",
      role: "",
    },
  });
  
  // Form for adding a tag
  const addTagForm = useForm({
    defaultValues: {
      label: "",
      type: "tag",
    },
  });
  
  // Fetch user's spotlight projects with proper configuration
  const { data: projects = [], isLoading: isLoadingProjects } = useQuery<SpotlightProject[]>({
    queryKey: ["/api/spotlight/projects"],
    enabled: !!user,
    staleTime: 1000, // Short stale time to force frequent refetches
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });
  
  // Calculate derived project lists
  const pinnedProjects = projects.filter(project => project.isPinned);
  const unpinnedProjects = projects.filter(project => !project.isPinned);
  
  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createProjectSchema>) => {
      try {
        // Filter empty contributors and tags
        const filtered = {
          ...data,
          contributors: data.contributors?.filter(c => c.name.trim())
            .map(c => ({
              name: c.name.trim(),
              role: c.role?.trim() || ''
            })) || [],
          tags: data.tags?.filter(t => t.label.trim())
            .map(t => ({
              label: t.label.trim(),
              type: t.type || 'tag'
            })) || [],
        };
        
        // Send all project data including contributors and tags
        try {
          return await apiRequest("POST", "/api/spotlight/projects", {
            title: filtered.title,
            url: filtered.url,
            description: filtered.description || '',
            thumbnail: filtered.thumbnail || '',
            isPinned: filtered.isPinned,
            contributors: filtered.contributors,
            tags: filtered.tags
          });
        } catch (error) {
          // If we get a 400 error, try again without contributors and tags
          const message = error instanceof Error ? error.message : "";
          if (message.includes("400")) {
            return await apiRequest("POST", "/api/spotlight/projects", {
              title: filtered.title,
              url: filtered.url,
              description: filtered.description || '',
              thumbnail: filtered.thumbnail || '',
              isPinned: filtered.isPinned
            });
          }
          throw error;
        }
      } catch (err) {
        console.error("Error in project creation:", err);
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/spotlight/projects"] });
      setIsCreateDialogOpen(false);
      createProjectForm.reset();
      setContributorFields([{ id: Date.now() }]);
      setTagFields([{ id: Date.now() }]);
      toast({
        title: "Project created",
        description: "Your spotlight project has been created successfully.",
      });
    },
    onError: (error) => {
      console.error("Project creation error:", error);
      // Create a more user-friendly error message
      toast({
        title: "Failed to create project",
        description: "Please check your input and try again. Make sure all required fields are filled correctly.",
        variant: "destructive",
      });
      
      // Don't close the dialog so user can try again
    },
  });
  
  // Update project mutation with more specific types
  const updateProjectMutation = useMutation({
    mutationFn: async (data: { 
      projectId: number; 
      updates: {
        title?: string;
        url?: string;
        description?: string;
        thumbnail?: string;
        isPinned?: boolean;
        contributors?: any[];
        tags?: any[];
      } 
    }) => {
      // Use a more generic payload type to avoid type issues
      return await apiRequest("PATCH", `/api/spotlight/projects/${data.projectId}`, data.updates);
    },
    onSuccess: () => {
      // Force a refetch to get the updated data including contributors and tags
      queryClient.invalidateQueries({ queryKey: ["/api/spotlight/projects"] });
      if (selectedProject) {
        queryClient.invalidateQueries({ queryKey: ["/api/spotlight/projects", selectedProject.id] });
      }
      setIsEditDialogOpen(false);
      toast({
        title: "Project updated",
        description: "Your spotlight project has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update project",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });
  
  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: number) => {
      await apiRequest("DELETE", `/api/spotlight/projects/${projectId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/spotlight/projects"] });
      if (selectedProject?.id === deleteProjectMutation.variables) {
        setSelectedProject(null);
      }
      toast({
        title: "Project deleted",
        description: "Your spotlight project has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete project",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });
  
  // Toggle pin status mutation
  const togglePinMutation = useMutation({
    mutationFn: async ({ projectId, isPinned }: { projectId: number; isPinned: boolean }) => {
      return await apiRequest("POST", `/api/spotlight/projects/${projectId}/pin`, { isPinned });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/spotlight/projects"] });
      toast({
        title: "Pin status updated",
        description: "The project pin status has been updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update pin status",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });
  
  // Add contributor mutation
  const addContributorMutation = useMutation({
    mutationFn: async (data: { projectId: number; contributor: any }) => {
      return await apiRequest("POST", `/api/spotlight/projects/${data.projectId}/contributors`, data.contributor);
    },
    onSuccess: () => {
      if (selectedProject) {
        queryClient.invalidateQueries({ queryKey: ["/api/spotlight/projects", selectedProject.id] });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/spotlight/projects"] });
      setIsAddContributorDialogOpen(false);
      addContributorForm.reset();
      toast({
        title: "Contributor added",
        description: "The contributor has been added to the project.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to add contributor",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });
  
  // Remove contributor mutation
  const removeContributorMutation = useMutation({
    mutationFn: async (data: { projectId: number; contributorId: number }) => {
      await apiRequest("DELETE", `/api/spotlight/contributors/${data.contributorId}`);
    },
    onSuccess: () => {
      if (selectedProject) {
        queryClient.invalidateQueries({ queryKey: ["/api/spotlight/projects", selectedProject.id] });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/spotlight/projects"] });
      toast({
        title: "Contributor removed",
        description: "The contributor has been removed from the project.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to remove contributor",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });
  
  // Add tag mutation
  const addTagMutation = useMutation({
    mutationFn: async (data: { projectId: number; tag: any }) => {
      return await apiRequest("POST", `/api/spotlight/projects/${data.projectId}/tags`, data.tag);
    },
    onSuccess: () => {
      if (selectedProject) {
        queryClient.invalidateQueries({ queryKey: ["/api/spotlight/projects", selectedProject.id] });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/spotlight/projects"] });
      setIsAddTagDialogOpen(false);
      addTagForm.reset();
      toast({
        title: "Tag added",
        description: "The tag has been added to the project.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to add tag",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });
  
  // Remove tag mutation
  const removeTagMutation = useMutation({
    mutationFn: async (data: { projectId: number; tagId: number }) => {
      await apiRequest("DELETE", `/api/spotlight/tags/${data.tagId}`);
    },
    onSuccess: () => {
      if (selectedProject) {
        queryClient.invalidateQueries({ queryKey: ["/api/spotlight/projects", selectedProject.id] });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/spotlight/projects"] });
      toast({
        title: "Tag removed",
        description: "The tag has been removed from the project.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to remove tag",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });
  
  // Record click mutation
  const recordClickMutation = useMutation({
    mutationFn: async (projectId: number) => {
      await apiRequest("POST", `/api/spotlight/projects/${projectId}/click`, {});
    },
  });
  
  // Handle form submissions - Fixed for reliable project creation with proper contributor and tag handling
  const handleCreateProject = () => {
    // Get form data directly from DOM elements
    const titleInput = document.getElementById("title") as HTMLInputElement;
    const urlInput = document.getElementById("url") as HTMLInputElement;
    const descriptionInput = document.getElementById("description") as HTMLTextAreaElement;
    const isPinnedInput = document.getElementById("isPinned") as HTMLInputElement;
    
    // Validate required fields
    if (!titleInput?.value?.trim() || !urlInput?.value?.trim()) {
      toast({
        title: "Missing required fields",
        description: "Project title and URL are required",
        variant: "destructive"
      });
      return;
    }
    
    // Ensure URL is valid
    let validUrl = urlInput.value.trim();
    if (!validUrl.match(/^https?:\/\//i)) {
      validUrl = `https://${validUrl}`;
    }
    
    // Validate the URL format
    try {
      new URL(validUrl); // Will throw if URL is invalid
    } catch (e) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL",
        variant: "destructive"
      });
      return;
    }
    
    // Process contributors from the form
    const contributors: any[] = [];
    const contributorNameElements = document.querySelectorAll('input[id^="contributor-name-"]');
    const contributorRoleElements = document.querySelectorAll('input[id^="contributor-role-"]');

    // Collect all contributor data by index
    for (let i = 0; i < contributorNameElements.length; i++) {
      const nameInput = contributorNameElements[i] as HTMLInputElement;
      const roleInput = i < contributorRoleElements.length ?
        contributorRoleElements[i] as HTMLInputElement : null;

      if (nameInput && nameInput.value.trim()) {
        contributors.push({
          name: nameInput.value.trim(),
          role: roleInput && roleInput.value ? roleInput.value.trim() : ""
        });
      }
    }
    
    // Process tags from the form
    const tags: any[] = [];
    const tagLabelElements = document.querySelectorAll('input[id^="tag-label-"]');
    const tagTypeElements = document.querySelectorAll('input[id^="tag-type-"]');

    // Collect all tag data by index
    for (let i = 0; i < tagLabelElements.length; i++) {
      const labelInput = tagLabelElements[i] as HTMLInputElement;
      const typeInput = i < tagTypeElements.length ? 
        tagTypeElements[i] as HTMLInputElement : null;
      
      if (labelInput && labelInput.value.trim()) {
        tags.push({
          label: labelInput.value.trim(),
          type: typeInput && typeInput.value ? typeInput.value.trim() : "tag"
        });
      }
    }
    
    const thumbnailInput = document.getElementById("thumbnail") as HTMLInputElement;
    // Create complete project data with proper arrays
    const projectData = {
      title: titleInput.value.trim(),
      url: validUrl,
      description: descriptionInput?.value?.trim() || "",
      thumbnail: thumbnailInput?.value?.trim() || "",
      isPinned: isPinnedInput?.checked || false,
      contributors: contributors,
      tags: tags.slice(0, 3) // Limit to maximum 3 tags
    };
    // Use the mutation to create the project
    createProjectMutation.mutate(projectData);
  };
  
  const handleEditProject = async (data: z.infer<typeof createProjectSchema>) => {
    if (!selectedProject) return;
    
    try {
      // Show loading toast
      toast({
        title: "Saving changes...",
        description: "Please wait while we update your project"
      });
      
      // Ensure required fields are present
      if (!data.title || !data.url) {
        toast({
          title: "Missing required fields",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }
      
      // Prepare project basic details
      const projectUpdate = {
        title: data.title.trim(),
        url: data.url.trim(),
        description: data.description?.trim() || "",
        thumbnail: data.thumbnail || "",
        isPinned: Boolean(data.isPinned)
      };
      
      // Update basic project details using mutation
      try {
        await updateProjectMutation.mutateAsync({
          projectId: selectedProject.id,
          updates: projectUpdate,
        });
        
        // After basic update succeeds, handle contributors and tags
        
        // 1. Handle contributors
        try {
          // Get current contributors
          const response = await fetch(`/api/spotlight/projects/${selectedProject.id}`);
          if (!response.ok) throw new Error("Failed to fetch project details");
          const currentProject = await response.json();
          
          // Delete existing contributors
          if (currentProject.contributors && currentProject.contributors.length > 0) {
            await Promise.all(
              currentProject.contributors.map(contributor => 
                fetch(`/api/spotlight/contributors/${contributor.id}`, { 
                  method: 'DELETE' 
                })
              )
            );
          }
          
          // Add new contributors from form
          const contributorInputs = [];
          for (const field of Object.values(editProjectForm.getValues().contributorFields || {})) {
            // Skip empty fields
            if (!field.name?.trim()) continue;

            contributorInputs.push({
              name: field.name.trim(),
              role: field.role?.trim() || ""
            });
          }
          
          // Add each contributor
          await Promise.all(
            contributorInputs.map(contributor => 
              fetch(`/api/spotlight/projects/${selectedProject.id}/contributors`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(contributor)
              })
            )
          );
        } catch (error) {
          console.error("Error updating contributors:", error);
        }
        
        // 2. Handle tags
        try {
          // Get current tags
          const response = await fetch(`/api/spotlight/projects/${selectedProject.id}`);
          if (!response.ok) throw new Error("Failed to fetch project details");
          const refreshedProject = await response.json();
          
          // Delete existing tags
          if (refreshedProject.tags && refreshedProject.tags.length > 0) {
            await Promise.all(
              refreshedProject.tags.map(tag => 
                fetch(`/api/spotlight/tags/${tag.id}`, { 
                  method: 'DELETE' 
                })
              )
            );
          }
          
          // Add new tags from form
          const tagInputs = [];
          for (const field of Object.values(editProjectForm.getValues().tagFields || {}).slice(0, 3)) {
            // Skip empty fields
            if (!field.label?.trim()) continue;

            tagInputs.push({
              label: field.label.trim(),
              type: field.type || "tag"
            });
          }
          
          // Add each tag
          await Promise.all(
            tagInputs.map(tag => 
              fetch(`/api/spotlight/projects/${selectedProject.id}/tags`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(tag)
              })
            )
          );
        } catch (error) {
          console.error("Error updating tags:", error);
        }
        
        // Force refresh all project data
        queryClient.invalidateQueries({ queryKey: ["/api/spotlight/projects"] });
        
        // Show success toast
        toast({
          title: "Project updated successfully",
          description: "All changes have been saved."
        });
        
        // Close the dialog
        setIsEditDialogOpen(false);
      } catch (error) {
        console.error("Error updating project basics:", error);
        toast({
          title: "Error saving changes",
          description: "There was a problem updating the project basics.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error in handleEditProject:", error);
      toast({
        title: "Error updating project",
        description: "Please check your connection and try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleAddContributor = (data: any) => {
    if (!selectedProject) return;
    
    addContributorMutation.mutate({
      projectId: selectedProject.id,
      contributor: data,
    });
  };
  
  const handleAddTag = (data: any) => {
    if (!selectedProject) return;
    
    addTagMutation.mutate({
      projectId: selectedProject.id,
      tag: data,
    });
  };
  
  const handleProjectClick = (project: SpotlightProject) => {
    // Open external link in a new tab
    window.open(project.url, "_blank");
    
    // Record the click
    recordClickMutation.mutate(project.id);
  };
  
  const handleEditClick = (project: SpotlightProject) => {
    setSelectedProject(project);
    
    // Set form values including contributors and tags
    editProjectForm.reset({
      title: project.title,
      url: project.url,
      description: project.description || "",
      thumbnail: project.thumbnail || "",
      isPinned: project.isPinned,
      contributors: project.contributors?.map(c => ({
        name: c.name,
        role: c.role || "",
      })) || [],
      tags: project.tags?.map(t => ({
        label: t.label,
        type: t.type,
      })) || [],
    });
    
    // Set contributor fields
    if (project.contributors?.length) {
      setContributorFields(
        project.contributors.map(c => ({ id: Date.now() + Math.random() }))
      );
    } else {
      setContributorFields([{ id: Date.now() }]);
    }
    
    // Set tag fields
    if (project.tags?.length) {
      setTagFields(
        project.tags.map(t => ({ id: Date.now() + Math.random() }))
      );
    } else {
      setTagFields([{ id: Date.now() }]);
    }
    
    setIsEditDialogOpen(true);
  };
  
  const handleDeleteClick = (project: SpotlightProject) => {
    if (window.confirm(`Are you sure you want to delete "${project.title}"?`)) {
      deleteProjectMutation.mutate(project.id);
    }
  };
  
  const handleTogglePinClick = (project: SpotlightProject) => {
    togglePinMutation.mutate({
      projectId: project.id,
      isPinned: !project.isPinned,
    });
  };
  
  const truncateText = (text: string = "", maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };
  
  const getInitials = (name: string) => {
    const names = name.split(" ");
    if (names.length === 1) {
      return name.charAt(0).toUpperCase();
    }
    
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };
  
  // Main content
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Please log in to access the Spotlight feature.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => navigate("/auth")} className="w-full">
              Go to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // Error boundary component
  // Create a component to handle errors more gracefully
  const ErrorFallback = ({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) => (
    <div className="p-6 border border-amber-200 rounded-lg bg-amber-50 text-amber-800 mt-4">
      <h3 className="text-lg font-semibold mb-2">Something went wrong</h3>
      <p className="mb-4">There was an issue processing your request. Please try again.</p>
      <Button onClick={resetErrorBoundary} variant="outline">Try again</Button>
    </div>
  );
  
  // Function to sanitize contributor data
  const sanitizeContributorData = (contributors: any[] = []) => {
    return contributors.map(c => ({
      name: c.name?.trim() || "",
      role: c.role?.trim() || ""
    })).filter(c => c.name);
  };

  return (
    <TooltipProvider>
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/")}
            className="rounded-full mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back to Dashboard</span>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Collaborative Spotlight</h1>
            <p className="text-muted-foreground mt-1">
              Showcase your projects and collaborations
            </p>
          </div>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="self-start">
          <Plus className="h-4 w-4 mr-2" />
          Add Project
        </Button>
      </div>
      
      {/* Pinned Projects Carousel */}
      {pinnedProjects.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Pin className="h-4 w-4 text-primary" />
            <h2 className="text-xl font-semibold">Pinned Projects</h2>
          </div>
          <Carousel className="w-full">
            <CarouselContent>
              {pinnedProjects.map((project) => (
                <CarouselItem key={project.id} className="md:basis-1/2 lg:basis-1/3">
                  <Card className="h-full">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{project.title}</CardTitle>
                        <Badge variant="secondary" className="ml-2 whitespace-nowrap">
                          <Eye className="h-3 w-3 mr-1" />
                          {project.viewCount}
                        </Badge>
                      </div>
                      <CardDescription className="line-clamp-2">
                        {truncateText(project.description, 80)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      {/* Project Thumbnail - Always show an image container */}
                      <div className="aspect-video bg-muted rounded-md overflow-hidden mb-4 relative border border-muted-foreground/10">
                        {project.thumbnail ? (
                          <img
                            src={project.thumbnail}
                            alt={project.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/e2e8f0/64748b?text=Project+Image';
                            }}
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                            <div className="text-center px-4">
                              <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                              <p className="text-sm text-muted-foreground">No image available</p>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Tags - Improved visibility */}
                      <div className="mt-3">
                        <div className="flex items-center mb-1">
                          <Tag className="h-3 w-3 mr-1 text-muted-foreground" />
                          <span className="text-sm font-medium">Tags:</span>
                        </div>
                        {project.tags && project.tags.length > 0 ? (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {project.tags.map((tag) => (
                              <Badge key={tag.id} variant="outline" className="flex items-center gap-1 py-1 px-2">
                                <span className="text-xs font-medium">{tag.label}</span>
                                {tag.type && tag.type !== "tag" && (
                                  <span className="text-[10px] text-muted-foreground">({tag.type})</span>
                                )}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">No tags added yet</p>
                        )}
                      </div>
                      
                      {/* Contributors - Enhanced visibility for better display */}
                      <div className="mt-3 border-t pt-2">
                        <div className="flex items-center mb-2">
                          <Users className="h-4 w-4 mr-1 text-primary" />
                          <span className="text-sm font-semibold">Contributors:</span>
                        </div>
                        {project.contributors && project.contributors.length > 0 ? (
                          <div className="space-y-2">
                            {project.contributors.slice(0, 3).map((contributor) => (
                              <div key={contributor.id} className="flex items-center gap-2 bg-muted/30 p-2 rounded-md">
                                <Avatar className="h-7 w-7 border border-primary/20">
                                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">
                                    {getInitials(contributor.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm">{contributor.name}</p>
                                  {contributor.role && 
                                    <p className="text-xs text-muted-foreground">{contributor.role}</p>
                                  }
                                  {contributor.email && 
                                    <p className="text-xs text-muted-foreground italic">{contributor.email}</p>
                                  }
                                </div>
                              </div>
                            ))}
                            {project.contributors.length > 3 && (
                              <div className="text-xs text-center bg-muted/20 p-1 rounded">
                                +{project.contributors.length - 3} more contributors
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-2 bg-muted/20 rounded-md">
                            <p className="text-sm text-muted-foreground">No contributors added yet</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0">
                      <div className="flex justify-between items-center w-full">
                        <Button
                          variant="default"
                          size="sm"
                          className="text-xs h-8"
                          onClick={() => handleProjectClick(project)}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Visit
                        </Button>
                        
                        <div className="flex items-center gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleEditClick(project)}
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit Project</TooltipContent>
                          </Tooltip>
                          
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleTogglePinClick(project)}
                              >
                                <Pin className="h-3.5 w-3.5 text-primary" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Unpin Project</TooltipContent>
                          </Tooltip>
                          
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => handleDeleteClick(project)}
                              >
                                <Trash className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete Project</TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    </CardFooter>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      )}
      
      {/* All Projects Grid */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">All Projects</h2>
        
        {isLoadingProjects ? (
          <div className="flex justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center p-12 border rounded-lg bg-muted/20">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
              <AlertTriangle className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No Projects Yet</h3>
            <p className="text-muted-foreground mb-4 max-w-md mx-auto">
              Start showcasing your collaborative projects by adding your first project.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Project
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {unpinnedProjects.map((project) => (
              <Card key={project.id} className="h-full">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{project.title}</CardTitle>
                    <Badge variant="secondary" className="ml-2 whitespace-nowrap">
                      <Eye className="h-3 w-3 mr-1" />
                      {project.viewCount}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {truncateText(project.description, 80)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  {/* Project Thumbnail - Always show an image container */}
                  <div className="aspect-video bg-muted rounded-md overflow-hidden mb-4 relative border border-muted-foreground/10">
                    {project.thumbnail ? (
                      <img
                        src={project.thumbnail}
                        alt={project.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/e2e8f0/64748b?text=Project+Image';
                        }}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                        <div className="text-center px-4">
                          <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                          <p className="text-sm text-muted-foreground">No image available</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Tags - Enhanced for better visibility */}
                  <div className="mt-3 border-t pt-2">
                    <div className="flex items-center mb-2">
                      <Tag className="h-4 w-4 mr-1 text-primary" />
                      <span className="text-sm font-semibold">Tags:</span>
                    </div>
                    {project.tags && project.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {project.tags.map((tag) => (
                          <Badge key={tag.id} variant="outline" className="flex items-center gap-1 py-1 px-2">
                            <span className="text-xs font-medium">{tag.label}</span>
                            {tag.type && tag.type !== "tag" && (
                              <span className="text-[10px] text-muted-foreground">({tag.type})</span>
                            )}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">No tags added yet</p>
                    )}
                  </div>
                  
                  {/* Contributors - Enhanced for better display */}
                  <div className="mt-3 border-t pt-2">
                    <div className="flex items-center mb-2">
                      <Users className="h-4 w-4 mr-1 text-primary" />
                      <span className="text-sm font-semibold">Contributors:</span>
                    </div>
                    {project.contributors && project.contributors.length > 0 ? (
                      <div className="space-y-2">
                        {project.contributors.slice(0, 3).map((contributor) => (
                          <div key={contributor.id} className="flex items-center gap-2 bg-muted/30 p-2 rounded-md">
                            <Avatar className="h-7 w-7 border border-primary/20">
                              <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">
                                {getInitials(contributor.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">{contributor.name}</p>
                              {contributor.role && 
                                <p className="text-xs text-muted-foreground">{contributor.role}</p>
                              }
                              {contributor.email && 
                                <p className="text-xs text-muted-foreground italic">{contributor.email}</p>
                              }
                            </div>
                          </div>
                        ))}
                        {project.contributors.length > 3 && (
                          <div className="text-xs text-center bg-muted/20 p-1 rounded">
                            +{project.contributors.length - 3} more contributors
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-2 bg-muted/20 rounded-md">
                        <p className="text-sm text-muted-foreground">No contributors added yet</p>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <div className="flex justify-between items-center w-full">
                    <Button
                      variant="default"
                      size="sm"
                      className="text-xs h-8"
                      onClick={() => handleProjectClick(project)}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Visit
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEditClick(project)}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit Project</TooltipContent>
                      </Tooltip>
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleTogglePinClick(project)}
                          >
                            <Pin className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Pin Project</TooltipContent>
                      </Tooltip>
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDeleteClick(project)}
                          >
                            <Trash className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete Project</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      {/* Create Project Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Project</DialogTitle>
            <DialogDescription>
              Showcase your work and collaborations with others.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={createProjectForm.handleSubmit(handleCreateProject)}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="title">Project Title</Label>
                <Input
                  id="title"
                  placeholder="Enter project title"
                  {...createProjectForm.register("title")}
                />
                {createProjectForm.formState.errors.title && (
                  <p className="text-sm text-destructive">
                    {createProjectForm.formState.errors.title.message}
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="url">Project URL</Label>
                <Input
                  id="url"
                  placeholder="https://example.com"
                  {...createProjectForm.register("url")}
                />
                {createProjectForm.formState.errors.url && (
                  <p className="text-sm text-destructive">
                    {createProjectForm.formState.errors.url.message}
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of the project"
                  rows={3}
                  {...createProjectForm.register("description")}
                />
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="thumbnail">Thumbnail URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="thumbnail"
                    placeholder="https://example.com/image.jpg"
                    {...createProjectForm.register("thumbnail")}
                    className="flex-1"
                  />
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      // Create a file input element
                      const fileInput = document.createElement('input');
                      fileInput.type = 'file';
                      fileInput.accept = 'image/*';
                      
                      // Handle file selection
                      fileInput.onchange = async (e) => {
                        const target = e.target as HTMLInputElement;
                        const file = target.files?.[0];
                        
                        if (file) {
                          try {
                            // Show loading toast
                            toast({
                              title: "Processing image...",
                              description: "Converting to base64 format",
                            });
                            
                            // Convert to base64
                            const reader = new FileReader();
                            reader.readAsDataURL(file);
                            reader.onload = () => {
                              const base64Data = reader.result as string;
                              
                              // Update the form with the base64 data
                              createProjectForm.setValue("thumbnail", base64Data);
                              
                              // Show success toast
                              toast({
                                title: "Image uploaded successfully",
                                description: "The image has been converted and added to your project",
                              });
                            };
                          } catch (error) {
                            console.error("Error processing image:", error);
                            toast({
                              title: "Image upload failed",
                              description: "Please try using a direct image URL instead",
                              variant: "destructive",
                            });
                          }
                        }
                      };
                      
                      // Trigger the file selector
                      fileInput.click();
                    }}
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Upload
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Click Upload to select an image from your device, or paste a direct image URL
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isPinned"
                  {...createProjectForm.register("isPinned")}
                />
                <Label htmlFor="isPinned">Pin this project</Label>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <h4 className="text-sm font-medium">Contributors</h4>
                </div>
                
                {contributorFields.map((field) => (
                  <div key={field.id} className="grid grid-cols-1 gap-2">
                    <div className="flex flex-wrap gap-2">
                      <div className="flex-1 min-w-[200px]">
                        <Label htmlFor={`contributor-name-${field.id}`}>Name</Label>
                        <Input
                          id={`contributor-name-${field.id}`}
                          placeholder="Contributor name"
                        />
                      </div>
                      <div className="flex-1 min-w-[150px]">
                        <Label htmlFor={`contributor-role-${field.id}`}>Role (optional)</Label>
                        <Input
                          id={`contributor-role-${field.id}`}
                          placeholder="Designer, Developer, etc."
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const newFields = contributorFields.filter(f => f.id !== field.id);
                          if (newFields.length > 0) {
                            setContributorFields(newFields);
                          }
                        }}
                        disabled={contributorFields.length === 1}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setContributorFields([...contributorFields, { id: Date.now() }])}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Contributor
                </Button>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  <h4 className="text-sm font-medium">Tags (max 3)</h4>
                </div>
                
                {tagFields.slice(0, 3).map((field, index) => (
                  <div key={field.id} className="grid grid-cols-1 gap-2">
                    <div className="flex flex-wrap gap-2">
                      <div className="flex-1 min-w-[200px]">
                        <Label htmlFor={`tag-label-${field.id}`}>Label</Label>
                        <Input
                          id={`tag-label-${field.id}`}
                          placeholder="Tag label"
                        />
                      </div>
                      <div className="flex-1 min-w-[150px]">
                        <Label>Type</Label>
                        <Select defaultValue="tag" onValueChange={(value) => {
                          const typeElement = document.getElementById(`tag-type-${field.id}`) as HTMLSelectElement;
                          if (typeElement) typeElement.value = value;
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="tag">Tag</SelectItem>
                            <SelectItem value="technology">Technology</SelectItem>
                            <SelectItem value="category">Category</SelectItem>
                            <SelectItem value="framework">Framework</SelectItem>
                            <SelectItem value="language">Programming Language</SelectItem>
                            <SelectItem value="tool">Tool</SelectItem>
                            <SelectItem value="platform">Platform</SelectItem>
                            <SelectItem value="design">Design</SelectItem>
                            <SelectItem value="art">Art</SelectItem>
                          </SelectContent>
                        </Select>
                        <input type="hidden" id={`tag-type-${field.id}`} defaultValue="tag" />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const newFields = tagFields.filter(f => f.id !== field.id);
                          if (newFields.length > 0) {
                            setTagFields(newFields);
                          }
                        }}
                        disabled={tagFields.length === 1}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {tagFields.length < 3 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setTagFields([...tagFields, { id: Date.now() }])}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Tag
                  </Button>
                )}
              </div>
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createProjectMutation.isPending}>
                {createProjectMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Project
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Project Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>
              Update your project details and collaborators.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={editProjectForm.handleSubmit(handleEditProject)}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="edit-title">Project Title</Label>
                <Input
                  id="edit-title"
                  placeholder="Enter project title"
                  {...editProjectForm.register("title")}
                />
                {editProjectForm.formState.errors.title && (
                  <p className="text-sm text-destructive">
                    {editProjectForm.formState.errors.title.message}
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="edit-url">Project URL</Label>
                <Input
                  id="edit-url"
                  placeholder="https://example.com"
                  {...editProjectForm.register("url")}
                />
                {editProjectForm.formState.errors.url && (
                  <p className="text-sm text-destructive">
                    {editProjectForm.formState.errors.url.message}
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  placeholder="Brief description of the project"
                  rows={3}
                  {...editProjectForm.register("description")}
                />
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="edit-thumbnail">Thumbnail URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="edit-thumbnail"
                    placeholder="https://example.com/image.jpg"
                    {...editProjectForm.register("thumbnail")}
                    className="flex-1"
                  />
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      // Create a file input element
                      const fileInput = document.createElement('input');
                      fileInput.type = 'file';
                      fileInput.accept = 'image/*';
                      
                      // Handle file selection
                      fileInput.onchange = async (e) => {
                        const target = e.target as HTMLInputElement;
                        const file = target.files?.[0];
                        
                        if (file) {
                          try {
                            // Show loading toast
                            toast({
                              title: "Processing image...",
                              description: "Converting to base64 format",
                            });
                            
                            // Convert to base64
                            const reader = new FileReader();
                            reader.readAsDataURL(file);
                            reader.onload = () => {
                              const base64Data = reader.result as string;
                              
                              // Update the form with the base64 data
                              editProjectForm.setValue("thumbnail", base64Data);
                              
                              // Show success toast
                              toast({
                                title: "Image uploaded successfully",
                                description: "The image has been converted and added to your project",
                              });
                            };
                          } catch (error) {
                            console.error("Error processing image:", error);
                            toast({
                              title: "Image upload failed",
                              description: "Please try using a direct image URL instead",
                              variant: "destructive",
                            });
                          }
                        }
                      };
                      
                      // Trigger the file selector
                      fileInput.click();
                    }}
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Upload
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Click Upload to select an image from your device, or paste a direct image URL
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-isPinned"
                  checked={editProjectForm.watch("isPinned")}
                  onCheckedChange={(checked) => {
                    editProjectForm.setValue("isPinned", checked === true);
                  }}
                />
                <Label htmlFor="edit-isPinned">Pin this project</Label>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <h4 className="text-sm font-medium">Contributors</h4>
                </div>
                
                {contributorFields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-1 gap-2">
                    <div className="flex flex-wrap gap-2">
                      <div className="flex-1 min-w-[200px]">
                        <Label htmlFor={`contributor-name-${field.id}`}>Name</Label>
                        <Input
                          id={`contributor-name-${field.id}`}
                          placeholder="Contributor name"
                          defaultValue={editProjectForm.watch(`contributors.${index}.name`) || ""}
                        />
                      </div>
                      <div className="flex-1 min-w-[150px]">
                        <Label htmlFor={`contributor-role-${field.id}`}>Role (optional)</Label>
                        <Input
                          id={`contributor-role-${field.id}`}
                          placeholder="Designer, Developer, etc."
                          defaultValue={editProjectForm.watch(`contributors.${index}.role`) || ""}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const newFields = contributorFields.filter(f => f.id !== field.id);
                          if (newFields.length > 0) {
                            setContributorFields(newFields);
                          }
                        }}
                        disabled={contributorFields.length === 1}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setContributorFields([...contributorFields, { id: Date.now() }])}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Contributor
                </Button>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  <h4 className="text-sm font-medium">Tags (max 3)</h4>
                </div>
                
                {tagFields.slice(0, 3).map((field, index) => (
                  <div key={field.id} className="grid grid-cols-1 gap-2">
                    <div className="flex flex-wrap gap-2">
                      <div className="flex-1 min-w-[200px]">
                        <Label htmlFor={`tag-label-${field.id}`}>Label</Label>
                        <Input
                          id={`tag-label-${field.id}`}
                          placeholder="Tag label"
                          defaultValue={editProjectForm.watch(`tags.${index}.label`) || ""}
                        />
                      </div>
                      <div className="flex-1 min-w-[150px]">
                        <Label htmlFor={`tag-type-${field.id}`}>Type</Label>
                        <Select
                          defaultValue={editProjectForm.watch(`tags.${index}.type`) || "tag"}
                          onValueChange={(value) => {
                            const tags = editProjectForm.getValues("tags") || [];
                            tags[index] = { ...tags[index], type: value };
                            editProjectForm.setValue("tags", tags);
                          }}
                        >
                          <SelectTrigger id={`tag-type-${field.id}`}>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="tag">Tag</SelectItem>
                            <SelectItem value="technology">Technology</SelectItem>
                            <SelectItem value="category">Category</SelectItem>
                            <SelectItem value="framework">Framework</SelectItem>
                            <SelectItem value="language">Programming Language</SelectItem>
                            <SelectItem value="tool">Tool</SelectItem>
                            <SelectItem value="platform">Platform</SelectItem>
                            <SelectItem value="design">Design</SelectItem>
                            <SelectItem value="art">Art</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const newFields = tagFields.filter(f => f.id !== field.id);
                          if (newFields.length > 0) {
                            setTagFields(newFields);
                          }
                        }}
                        disabled={tagFields.length === 1}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {tagFields.length < 3 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setTagFields([...tagFields, { id: Date.now() }])}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Tag
                  </Button>
                )}
              </div>
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                onClick={async () => {
                  try {
                    // Show saving indicator
                    toast({
                      title: "Saving changes...",
                      description: "Please wait while we update your project"
                    });
                    
                    if (!selectedProject) {
                      toast({
                        title: "Error",
                        description: "No project selected for editing",
                        variant: "destructive"
                      });
                      return;
                    }
                    
                    // Get form values directly
                    const title = document.getElementById('edit-title') as HTMLInputElement;
                    const url = document.getElementById('edit-url') as HTMLInputElement;
                    const description = document.getElementById('edit-description') as HTMLTextAreaElement;
                    const thumbnail = document.getElementById('edit-thumbnail') as HTMLInputElement;
                    const isPinned = document.getElementById('edit-isPinned') as HTMLInputElement;
                    
                    // Validate required fields
                    if (!title?.value || !url?.value) {
                      toast({
                        title: "Required fields missing",
                        description: "Please provide both a title and URL",
                        variant: "destructive"
                      });
                      return;
                    }
                    
                    // Update using direct fetch for better reliability
                    const response = await fetch(`/api/spotlight/projects/${selectedProject.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        title: title.value.trim(),
                        url: url.value.trim(),
                        description: description?.value?.trim() || "",
                        thumbnail: thumbnail?.value || "",
                        isPinned: isPinned?.checked || false
                      })
                    });
                    
                    if (!response.ok) {
                      throw new Error(`Error: ${response.status} - ${response.statusText}`);
                    }
                    
                    // Refresh project data
                    queryClient.invalidateQueries({ queryKey: ["/api/spotlight/projects"] });
                    
                    // Show success toast
                    toast({
                      title: "Project updated",
                      description: "Your changes have been saved successfully"
                    });
                    
                    // Close the dialog
                    setIsEditDialogOpen(false);
                  } catch (error) {
                    console.error("Error saving project:", error);
                    toast({
                      title: "Error saving changes",
                      description: "Please try again with different values",
                      variant: "destructive"
                    });
                  }
                }}
                disabled={updateProjectMutation.isPending}
              >
                {updateProjectMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
    </TooltipProvider>
  );
}