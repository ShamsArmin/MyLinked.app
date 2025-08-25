import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Users, 
  Search, 
  Filter, 
  MapPin, 
  Briefcase, 
  Star,
  Eye,
  MessageCircle,
  UserPlus,
  ArrowLeft,
  Sparkles,
  TrendingUp,
  Plus,
  ChevronDown,
  Building2,
  Zap,
  X,
  Send
} from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
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

interface CollaborationUser {
  id: number;
  name: string;
  username: string;
  profileImage: string;
  bio: string;
  profession: string;
  location: string;
  industry: { id: number; name: string };
  tags: string[];
  rating?: number;
  completedProjects?: number;
}

const sampleUsers: CollaborationUser[] = [
  {
    id: 1,
    name: "Alex Johnson",
    username: "alexj",
    profileImage: "",
    bio: "Full-stack developer with 10+ years experience in React, Node.js, and cloud architecture. Building scalable solutions for enterprise clients.",
    profession: "Senior Software Engineer",
    location: "San Francisco, CA",
    industry: { id: 1, name: "Technology" },
    tags: ["react", "node.js", "aws", "typescript"],
    rating: 4.9,
    completedProjects: 23
  },
  {
    id: 2,
    name: "Sophia Chen",
    username: "sophiac",
    profileImage: "",
    bio: "UX/UI designer specializing in user-centered design. Creating intuitive interfaces that balance aesthetics with functionality.",
    profession: "Lead Product Designer",
    location: "New York, NY",
    industry: { id: 2, name: "Design" },
    tags: ["ui/ux", "figma", "product design", "user research"],
    rating: 4.8,
    completedProjects: 18
  },
  {
    id: 3,
    name: "Marcus Williams",
    username: "marcusw",
    profileImage: "",
    bio: "Digital marketing specialist with expertise in SEO, content strategy, and performance analytics. Driving growth through data-driven campaigns.",
    profession: "Marketing Director",
    location: "Chicago, IL",
    industry: { id: 3, name: "Marketing" },
    tags: ["seo", "content marketing", "analytics", "growth"],
    rating: 4.7,
    completedProjects: 31
  },
  {
    id: 4,
    name: "Elena Rodriguez",
    username: "elenar",
    profileImage: "",
    bio: "Healthcare innovation consultant working with medical startups. Former clinician with 8 years experience in patient care technologies.",
    profession: "Healthcare Consultant",
    location: "Boston, MA",
    industry: { id: 5, name: "Finance" },
    tags: ["healthtech", "telemedicine", "medical devices", "patient care"],
    rating: 4.9,
    completedProjects: 15
  }
];

const industries = [
  { id: "all", name: "All Industries" },
  { id: "technology", name: "Technology" },
  { id: "design", name: "Design & Creative" },
  { id: "marketing", name: "Marketing & Sales" },
  { id: "finance", name: "Finance & Banking" },
  { id: "education", name: "Education & Training" },
  { id: "healthcare", name: "Healthcare & Medical" },
  { id: "consulting", name: "Consulting" },
  { id: "retail", name: "Retail & E-commerce" },
  { id: "manufacturing", name: "Manufacturing" },
  { id: "real-estate", name: "Real Estate" },
  { id: "hospitality", name: "Hospitality & Tourism" },
  { id: "media", name: "Media & Entertainment" },
  { id: "nonprofit", name: "Non-profit" },
  { id: "government", name: "Government & Public" },
  { id: "automotive", name: "Automotive" },
  { id: "energy", name: "Energy & Utilities" },
  { id: "telecommunications", name: "Telecommunications" },
  { id: "agriculture", name: "Agriculture" },
  { id: "construction", name: "Construction" },
  { id: "transportation", name: "Transportation & Logistics" },
  { id: "food-beverage", name: "Food & Beverage" },
  { id: "fashion", name: "Fashion & Apparel" },
  { id: "sports", name: "Sports & Recreation" },
  { id: "legal", name: "Legal Services" },
  { id: "aerospace", name: "Aerospace & Defense" },
  { id: "pharmaceuticals", name: "Pharmaceuticals" },
  { id: "insurance", name: "Insurance" },
  { id: "biotechnology", name: "Biotechnology" },
  { id: "environmental", name: "Environmental Services" },
];

const availableSkills = [
  "React", "Node.js", "Python", "JavaScript", "TypeScript", "UI/UX Design", 
  "Figma", "Adobe Creative Suite", "Digital Marketing", "SEO", "Content Strategy",
  "Data Analysis", "Project Management", "Leadership", "Communication", "Vue.js",
  "Angular", "Django", "Flask", "Machine Learning", "Data Science", "DevOps",
  "AWS", "Azure", "Google Cloud", "Docker", "Kubernetes", "Blockchain",
  "Mobile Development", "iOS Development", "Android Development", "Flutter",
  "React Native", "Photoshop", "Illustrator", "Video Editing", "3D Modeling",
  "Social Media Marketing", "Email Marketing", "PPC Advertising", "Analytics",
  "Sales", "Business Development", "Product Management", "Agile", "Scrum"
];

const skillLevels = [
  { id: "beginner", name: "Beginner", description: "Learning the basics" },
  { id: "intermediate", name: "Intermediate", description: "Can work independently" },
  { id: "advanced", name: "Advanced", description: "Can mentor others" },
  { id: "expert", name: "Expert", description: "Industry recognized expert" }
];

interface UserSkill {
  name: string;
  level: string;
}

export default function CollaborationPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState("ai-matches");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState("all");
  const [userSkills, setUserSkills] = useState<UserSkill[]>([]);
  const [isAddSkillOpen, setIsAddSkillOpen] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [newSkillLevel, setNewSkillLevel] = useState("intermediate");
  const [filteredUsers, setFilteredUsers] = useState<CollaborationUser[]>(sampleUsers);

  // Filter users based on search criteria
  useEffect(() => {
    let filtered = sampleUsers;

    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.bio.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.profession.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedIndustry && selectedIndustry !== "all") {
      filtered = filtered.filter(user => 
        user.industry.name.toLowerCase() === selectedIndustry.toLowerCase()
      );
    }

    setFilteredUsers(filtered);
  }, [searchTerm, selectedIndustry]);

  const handleConnect = (userId: number) => {
    toast({
      title: "Connection Request Sent",
      description: "Your collaboration request has been sent successfully.",
    });
  };

  const handleViewProfile = (username: string) => {
    navigate(`/profile/${username}`);
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !userSkills.some(skill => skill.name === newSkill.trim())) {
      setUserSkills([...userSkills, { name: newSkill.trim(), level: newSkillLevel }]);
      setNewSkill("");
      setNewSkillLevel("intermediate");
      setIsAddSkillOpen(false);
      toast({
        title: "Skill Added",
        description: `"${newSkill.trim()}" (${skillLevels.find(l => l.id === newSkillLevel)?.name}) has been added to your skills.`,
      });
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setUserSkills(userSkills.filter(skill => skill.name !== skillToRemove));
    toast({
      title: "Skill Removed",
      description: `"${skillToRemove}" has been removed from your skills.`,
    });
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-6">
            <h2 className="text-xl font-bold mb-4">Authentication Required</h2>
            <p className="text-gray-600 mb-4">Please sign in to access collaboration features.</p>
            <Button onClick={() => navigate("/auth")}>Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/")}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Collaboration Matchmaker</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Discover potential collaborators based on your skills, projects, and industry. Connect with like-minded professionals and start working together.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-lg mb-6">
            <TabsTrigger value="ai-matches" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              AI Matches
            </TabsTrigger>
            <TabsTrigger value="all-matches" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              All Matches
            </TabsTrigger>
            <TabsTrigger value="my-requests" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              My Requests
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ai-matches" className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Sidebar - Find Your Perfect Collaborators */}
            <div className="lg:col-span-1 space-y-6">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Building2 className="h-4 w-4" />
                    Find Your Perfect Collaborators
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Industry Sector</label>
                    <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All Industries" />
                      </SelectTrigger>
                      <SelectContent>
                        {industries.map((industry) => (
                          <SelectItem key={industry.id} value={industry.id}>
                            {industry.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Skills or Keywords</label>
                    <Input
                      placeholder="Search skills, names, or keywords"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  {/* Industry Tags */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {["All", "Technology", "Design & Creative", "Marketing & Sales", "Finance & Banking", "Healthcare & Medical"].map((tag) => (
                        <Badge 
                          key={tag}
                          variant={selectedIndustry === (tag === "All" ? "all" : tag === "Design & Creative" ? "design" : tag === "Marketing & Sales" ? "marketing" : tag === "Finance & Banking" ? "finance" : tag === "Healthcare & Medical" ? "healthcare" : tag.toLowerCase()) ? "default" : "secondary"}
                          className="cursor-pointer text-xs"
                          onClick={() => setSelectedIndustry(tag === "All" ? "all" : tag === "Design & Creative" ? "design" : tag === "Marketing & Sales" ? "marketing" : tag === "Finance & Banking" ? "finance" : tag === "Healthcare & Medical" ? "healthcare" : tag.toLowerCase())}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500">And 24 more industries available in the dropdown</p>
                  </div>
                </CardContent>
              </Card>

              {/* AI-Powered Matching */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Sparkles className="h-4 w-4 text-yellow-500" />
                    AI-Powered Matching
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Our AI has analyzed your profile, skills, and interests to recommend the best potential collaborators for you.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Center Content - No Matches Found */}
            <div className="lg:col-span-2">
              <div className="text-center py-20">
                <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No AI matches found</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  Add more skills to your profile or try again later to get AI-powered collaboration recommendations.
                </p>
                <Button 
                  onClick={() => setIsAddSkillOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Skills
                </Button>
              </div>
            </div>

            {/* Right Sidebar - My Skills */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">My Skills</CardTitle>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsAddSkillOpen(true)}
                      className="flex items-center gap-1 text-xs"
                    >
                      <Plus className="h-3 w-3" />
                      Add
                    </Button>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Skills help us match you with potential collaborators
                  </p>
                </CardHeader>
                <CardContent>
                  {userSkills.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-sm text-gray-500 mb-4">You haven't added any skills yet.</p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setIsAddSkillOpen(true)}
                        className="flex items-center gap-2"
                      >
                        <Plus className="h-3 w-3" />
                        Add Your First Skill
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {userSkills.map((skill) => (
                        <div key={skill.name} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-md px-3 py-2">
                          <div className="flex-1">
                            <div className="text-sm font-medium">{skill.name}</div>
                            <div className="text-xs text-gray-500">{skillLevels.find(l => l.id === skill.level)?.name}</div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveSkill(skill.name)}
                            className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="all-matches" className="space-y-6">
            {/* Search and Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Find Collaborators
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Input
                      placeholder="Search by name, skills, or keywords..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div>
                    <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Industries" />
                      </SelectTrigger>
                      <SelectContent>
                        {industries.map((industry) => (
                          <SelectItem key={industry.id} value={industry.id}>
                            {industry.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Input placeholder="Location..." />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Results */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredUsers.map((collaborator) => (
                <Card key={collaborator.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={collaborator.profileImage} />
                        <AvatarFallback>
                          {collaborator.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold">{collaborator.name}</h3>
                        <p className="text-sm text-gray-600">{collaborator.profession}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs text-gray-600">
                            {collaborator.rating} • {collaborator.completedProjects} projects
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-700 line-clamp-3">
                      {collaborator.bio}
                    </p>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <MapPin className="h-3 w-3" />
                        {collaborator.location}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <Briefcase className="h-3 w-3" />
                        {collaborator.industry.name}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {collaborator.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {collaborator.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{collaborator.tags.length - 3}
                        </Badge>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewProfile(collaborator.username)}
                        className="flex-1"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleConnect(collaborator.id)}
                        className="flex-1"
                      >
                        <UserPlus className="h-3 w-3 mr-1" />
                        Connect
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredUsers.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No collaborators found</h3>
                  <p className="text-gray-600">Try adjusting your search criteria or filters.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="my-requests" className="space-y-6">
            <CollaborationRequests />
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Skill Dialog */}
      <Dialog open={isAddSkillOpen} onOpenChange={setIsAddSkillOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add a Skill</DialogTitle>
            <DialogDescription>
              Add skills to help us match you with the right collaborators.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Skill Name</label>
              <Input
                placeholder="e.g., React, UI/UX Design, Project Management"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Skill Level</label>
              <Select value={newSkillLevel} onValueChange={setNewSkillLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your skill level" />
                </SelectTrigger>
                <SelectContent>
                  {skillLevels.map((level) => (
                    <SelectItem key={level.id} value={level.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{level.name}</span>
                        <span className="text-xs text-gray-500">{level.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Popular Skills</label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {availableSkills.slice(0, 12).map((skill) => (
                  <Badge 
                    key={skill}
                    variant="outline" 
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => {
                      setNewSkill(skill);
                    }}
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-gray-500">Click a skill to add it to the name field, then select your level</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddSkillOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSkill} disabled={!newSkill.trim()}>
              Add Skill
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Collaboration Requests Management Component
function CollaborationRequests() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch collaboration requests
  const { data: requests = [], isLoading, error } = useQuery({
    queryKey: ["/api/collaboration-requests/received"],
    queryFn: async () => {
      const response = await fetch('/api/collaboration-requests/received');
      if (!response.ok) {
        throw new Error('Failed to fetch collaboration requests');
      }
      return response.json();
    },
  });

  // Mutation for updating request status
  const updateRequestMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await fetch(`/api/collaboration-requests/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        throw new Error('Failed to update request');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/collaboration-requests/received"] });
      toast({
        title: "Success",
        description: "Request status updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update request status",
        variant: "destructive",
      });
    },
  });

  const handleStatusUpdate = (id: number, status: string) => {
    updateRequestMutation.mutate({ id, status });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Group requests by status
  const pendingRequests = requests.filter((req: any) => req.status === 'pending');
  const acceptedRequests = requests.filter((req: any) => req.status === 'accepted');
  const rejectedRequests = requests.filter((req: any) => req.status === 'rejected');

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-red-600">Failed to load collaboration requests</p>
          <Button 
            variant="outline" 
            className="mt-2"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/collaboration-requests/received"] })}
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Requests */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-orange-500" />
          Pending Requests ({pendingRequests.length})
        </h3>
        {pendingRequests.length > 0 ? (
          <div className="space-y-4">
            {pendingRequests.map((request: any) => (
              <Card key={request.id} className="border-orange-200">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={request.sender.profileImage} alt={request.sender.name} />
                      <AvatarFallback>
                        {request.sender.name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-semibold">{request.name}</h4>
                          <p className="text-sm text-gray-600">@{request.sender.username}</p>
                        </div>
                        <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                          Pending
                        </Badge>
                      </div>
                      
                      {/* Contact Details */}
                      <div className="mb-3 space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="font-medium">Email:</span>
                          <a href={`mailto:${request.email}`} className="text-blue-600 hover:underline">
                            {request.email}
                          </a>
                        </div>
                        {request.phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span className="font-medium">Phone:</span>
                            <a href={`tel:${request.phone}`} className="text-blue-600 hover:underline">
                              {request.phone}
                            </a>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="font-medium">Field of Work:</span>
                          <span>{request.fieldOfWork}</span>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <span className="font-medium text-sm text-gray-700">Message:</span>
                        <p className="text-gray-700 mt-1">{request.message}</p>
                      </div>
                      <p className="text-xs text-gray-500 mb-4">
                        Sent on {formatDate(request.createdAt)}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleStatusUpdate(request.id, 'accepted')}
                          disabled={updateRequestMutation.isPending}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <UserPlus className="h-4 w-4 mr-1" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusUpdate(request.id, 'rejected')}
                          disabled={updateRequestMutation.isPending}
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No pending collaboration requests</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Accepted Requests */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-green-500" />
          Accepted Requests ({acceptedRequests.length})
        </h3>
        {acceptedRequests.length > 0 ? (
          <div className="space-y-4">
            {acceptedRequests.map((request: any) => (
              <Card key={request.id} className="border-green-200">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={request.sender.profileImage} alt={request.sender.name} />
                      <AvatarFallback>
                        {request.sender.name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{request.name}</h4>
                          <p className="text-sm text-gray-600">@{request.sender.username}</p>
                        </div>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Accepted
                        </Badge>
                      </div>
                      
                      {/* Contact Details */}
                      <div className="mb-2 space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="font-medium">Email:</span>
                          <a href={`mailto:${request.email}`} className="text-blue-600 hover:underline">
                            {request.email}
                          </a>
                        </div>
                        {request.phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span className="font-medium">Phone:</span>
                            <a href={`tel:${request.phone}`} className="text-blue-600 hover:underline">
                              {request.phone}
                            </a>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="font-medium">Field of Work:</span>
                          <span>{request.fieldOfWork}</span>
                        </div>
                      </div>
                      
                      <div className="mb-2">
                        <span className="font-medium text-sm text-gray-700">Message:</span>
                        <p className="text-gray-700 text-sm mt-1">{request.message}</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        Accepted on {formatDate(request.updatedAt)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              <UserPlus className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No accepted collaboration requests</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Rejected Requests */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <X className="h-5 w-5 text-red-500" />
          Rejected Requests ({rejectedRequests.length})
        </h3>
        {rejectedRequests.length > 0 ? (
          <div className="space-y-4">
            {rejectedRequests.map((request: any) => (
              <Card key={request.id} className="border-red-200">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={request.sender.profileImage} alt={request.sender.name} />
                      <AvatarFallback>
                        {request.sender.name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{request.name}</h4>
                          <p className="text-sm text-gray-600">@{request.sender.username}</p>
                        </div>
                        <Badge variant="secondary" className="bg-red-100 text-red-800">
                          Rejected
                        </Badge>
                      </div>
                      
                      {/* Contact Details */}
                      <div className="mb-2 space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="font-medium">Email:</span>
                          <a href={`mailto:${request.email}`} className="text-blue-600 hover:underline">
                            {request.email}
                          </a>
                        </div>
                        {request.phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span className="font-medium">Phone:</span>
                            <a href={`tel:${request.phone}`} className="text-blue-600 hover:underline">
                              {request.phone}
                            </a>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="font-medium">Field of Work:</span>
                          <span>{request.fieldOfWork}</span>
                        </div>
                      </div>
                      
                      <div className="mb-2">
                        <span className="font-medium text-sm text-gray-700">Message:</span>
                        <p className="text-gray-700 text-sm mt-1">{request.message}</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        Rejected on {formatDate(request.updatedAt)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              <X className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No rejected collaboration requests</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}