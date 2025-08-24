import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Briefcase, Users, MapPin, Search, Building, User as UserIcon, 
  TagIcon, UserPlus, UserMinus, UserCheck, Building2, TrendingUp, X,
  Filter
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

const IndustryDiscoveryDemo = () => {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // States for filters
  const [selectedIndustry, setSelectedIndustry] = useState<string>('1');
  const [locationFilter, setLocationFilter] = useState<string>('');
  const [tagFilter, setTagFilter] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>("similar");
  
  // States for following
  const [followingStatus, setFollowingStatus] = useState<{[key: number]: boolean}>({});
  
  // Example user data for demonstration
  const exampleUsers = [
    {
      id: 101,
      name: "Alex Johnson",
      username: "alexj",
      profileImage: "",
      bio: "Full-stack developer with 10+ years experience in React, Node.js, and cloud architecture. Building scalable solutions for enterprise clients.",
      profession: "Senior Software Engineer",
      location: "San Francisco, CA",
      industry: { id: 1, name: "Technology & Software" },
      tags: ["react", "node.js", "aws", "typescript"]
    },
    {
      id: 102,
      name: "Sophia Chen",
      username: "sophiac",
      profileImage: "",
      bio: "UX/UI designer specializing in user-centered design. Creating intuitive interfaces that balance aesthetics with functionality.",
      profession: "Lead Product Designer",
      location: "New York, NY",
      industry: { id: 2, name: "Design & Creative" },
      tags: ["ui/ux", "figma", "product design", "user research"]
    },
    {
      id: 103,
      name: "Marcus Williams",
      username: "marcusw",
      profileImage: "",
      bio: "Digital marketing specialist with expertise in SEO, content strategy, and performance analytics. Driving growth through data-driven campaigns.",
      profession: "Marketing Director",
      location: "Chicago, IL",
      industry: { id: 3, name: "Marketing & Advertising" },
      tags: ["seo", "content marketing", "analytics", "growth"]
    },
    {
      id: 104,
      name: "Elena Rodriguez",
      username: "elenar",
      profileImage: "",
      bio: "Healthcare innovation consultant working with medical startups. Former clinician with 8 years experience in patient care technologies.",
      profession: "Healthcare Consultant",
      location: "Boston, MA",
      industry: { id: 5, name: "Healthcare & Life Sciences" },
      tags: ["healthtech", "telemedicine", "medical devices", "patient care"]
    },
    {
      id: 105,
      name: "David Kim",
      username: "davidk",
      profileImage: "",
      bio: "Fintech entrepreneur and blockchain developer. Building decentralized financial solutions to democratize access to banking services.",
      profession: "Founder & CTO",
      location: "Austin, TX",
      industry: { id: 4, name: "Finance & Fintech" },
      tags: ["blockchain", "cryptocurrency", "fintech", "defi"]
    }
  ];
  
  // Enhanced industries data with icons and descriptions
  const enhancedIndustries = [
    { id: 1, name: 'Technology & Software', icon: '💻', description: 'Software development, IT services, cloud computing, and tech solutions' },
    { id: 2, name: 'Design & Creative', icon: '🎨', description: 'Graphic design, UX/UI, creative direction, and digital art' },
    { id: 3, name: 'Marketing & Advertising', icon: '📊', description: 'Digital marketing, brand strategy, social media, and market research' },
    { id: 4, name: 'Finance & Fintech', icon: '💰', description: 'Banking, investments, financial services, and fintech innovation' },
    { id: 5, name: 'Healthcare & Life Sciences', icon: '🏥', description: 'Medical services, biotechnology, healthcare IT, and research' },
    { id: 6, name: 'Education & E-learning', icon: '🎓', description: 'Educational technology, teaching, curriculum development, and training' },
    { id: 7, name: 'Entertainment & Media', icon: '🎬', description: 'Film production, media, journalism, music, and entertainment tech' },
    { id: 8, name: 'Real Estate & Construction', icon: '🏢', description: 'Property development, architecture, construction, and proptech' },
    { id: 9, name: 'Manufacturing & Industry', icon: '🏭', description: 'Production, industrial engineering, supply chain, and automation' },
    { id: 10, name: 'Retail & E-commerce', icon: '🛍️', description: 'Online stores, retail operations, consumer goods, and sales platforms' },
    { id: 11, name: 'Food & Hospitality', icon: '🍽️', description: 'Restaurants, hotels, catering services, and food tech innovation' },
    { id: 12, name: 'Travel & Transportation', icon: '✈️', description: 'Tourism, aviation, logistics, and mobility solutions' }
  ];
  
  // Create more discovered users by extending the example users
  const discoveredUsers = [
    ...exampleUsers,
    ...exampleUsers.map(u => ({
      ...u, 
      id: u.id + 1000,
      username: `${u.username}_alt`,
      name: `${u.name} (${u.industry.name})`,
      bio: `Similar to ${u.name}, but with additional focus on ${u.tags[0]} and ${u.tags[1] || 'related areas'}.`
    }))
  ];
  
  // Handle industry selection
  const handleIndustryChange = (value: string) => {
    setSelectedIndustry(value);
    
    toast({
      title: "Industry Selected",
      description: `You selected: ${enhancedIndustries.find(i => i.id.toString() === value)?.name}`,
    });
  };
  
  // Enhanced search function for industry discovery
  const handleSearch = () => {
    // Show loading state
    toast({
      title: "Searching...",
      description: "Finding professionals matching your criteria",
    });
    
    // Switch to the discover tab and show success notification
    setActiveTab("discover");
    
    // Show success notification after a short delay to ensure state update
    setTimeout(() => {
      toast({
        title: "Search Complete",
        description: `Found ${discoveredUsers.length} professionals matching your criteria in ${selectedIndustry ? enhancedIndustries.find(i => i.id.toString() === selectedIndustry)?.name || "selected industry" : "all industries"}`,
        variant: "default",
      });
    }, 300);
  };
  
  // Handle follow/unfollow
  const handleFollowToggle = async (userId: number, isFollowing: boolean) => {
    setFollowingStatus({
      ...followingStatus,
      [userId]: !isFollowing
    });
    
    toast({
      title: isFollowing ? "Unfollowed" : "Following",
      description: isFollowing 
        ? "You are no longer following this user" 
        : "You are now following this user",
      variant: "default",
    });
  };
  
  // User card component with enhanced visual appeal
  const UserCard = ({ user, isFollowing }: { user: any, isFollowing: boolean }) => (
    <Card className="mb-4 overflow-hidden border hover:shadow-md transition-all">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12 border-2 border-background">
              <AvatarImage src={user.profileImage || ''} alt={user.name} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                {user.name ? user.name.substring(0, 2).toUpperCase() : user.username.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{user.name}</CardTitle>
              <CardDescription>
                {user.profession && (
                  <div className="flex items-center text-sm mt-1">
                    <Briefcase className="h-3 w-3 mr-1" />
                    {user.profession}
                  </div>
                )}
                {user.location && (
                  <div className="flex items-center text-sm mt-1">
                    <MapPin className="h-3 w-3 mr-1" />
                    {user.location}
                  </div>
                )}
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <Button 
              variant={isFollowing ? "outline" : "default"}
              size="sm"
              onClick={() => handleFollowToggle(user.id, isFollowing)}
              className={isFollowing ? "border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-950" : ""}
            >
              {isFollowing ? (
                <>
                  <UserMinus className="h-4 w-4 mr-1" />
                  Unfollow
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-1" />
                  Follow
                </>
              )}
            </Button>
            {user.industry && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                {user.industry.name}
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-sm text-base-content/70">
          {user.bio || 'No bio available'}
        </p>
        <div className="flex flex-wrap gap-1 mt-2">
          {user.tags && user.tags.map((tag: string, index: number) => (
            <Badge key={index} variant="secondary" className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="pt-2 flex justify-between">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => navigate(`/profile/${user.username}`)}
          className="text-primary hover:text-primary/80"
        >
          <UserIcon className="h-3.5 w-3.5 mr-1.5" />
          Visit Profile
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
          View Stats
        </Button>
      </CardFooter>
    </Card>
  );
  
  return (
    <div className="container max-w-7xl py-6">
      <div className="flex flex-col gap-6">
        {/* Enhanced Header Section */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Industry Discovery</h1>
            <p className="text-base-content/70">
              Connect with professionals across 25+ industries. Discover opportunities, build your network, and find like-minded collaborators.
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="mt-1" 
            onClick={() => navigate("/")}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Enhanced Industry Grid */}
        <div className="mb-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2 flex items-center">
              <Building2 className="h-5 w-5 mr-2 text-primary" />
              Explore Industries
            </h2>
            <p className="text-sm text-base-content/70">
              Select an industry to discover professionals and expand your network
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {enhancedIndustries.map((industry) => (
              <Card 
                key={industry.id} 
                className={`cursor-pointer transition-all hover:shadow-md hover:scale-105 ${
                  selectedIndustry === industry.id.toString() 
                    ? 'border-primary bg-primary/5 shadow-md' 
                    : 'hover:border-primary/30'
                }`}
                onClick={() => handleIndustryChange(industry.id.toString())}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{industry.icon}</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm mb-1 leading-tight">
                        {industry.name}
                      </h3>
                      <p className="text-xs text-base-content/70 line-clamp-2">
                        {industry.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Filter Panel */}
        {selectedIndustry && (
          <Card className="mb-6 bg-base-200/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Refine Your Search
              </CardTitle>
              <CardDescription>
                Use these filters to find exactly who you're looking for
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center">
                    <Building2 className="h-3 w-3 mr-1.5" />
                    Industry
                  </label>
                  <Select value={selectedIndustry} onValueChange={handleIndustryChange}>
                    <SelectTrigger className="w-full bg-white dark:bg-slate-900">
                      <SelectValue placeholder="Select an industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {enhancedIndustries.map((industry) => (
                        <SelectItem key={industry.id} value={industry.id.toString()}>
                          {industry.icon} {industry.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center">
                    <MapPin className="h-3 w-3 mr-1.5" />
                    Location
                  </label>
                  <Input 
                    placeholder="City, state, or country..." 
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="bg-white dark:bg-slate-900"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center">
                    <TagIcon className="h-3 w-3 mr-1.5" />
                    Skills & Interests
                  </label>
                  <Input 
                    placeholder="JavaScript, design, marketing..." 
                    value={tagFilter}
                    onChange={(e) => setTagFilter(e.target.value)}
                    className="bg-white dark:bg-slate-900"
                  />
                </div>
                
                <div className="space-y-2 md:col-span-3">
                  <label className="text-sm font-medium flex items-center">
                    <Search className="h-3 w-3 mr-1.5" />
                    Search
                  </label>
                  <Button 
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700" 
                    onClick={handleSearch}
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Discover Professionals
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="similar">
              <Users className="h-4 w-4 mr-2" />
              Similar Professionals
            </TabsTrigger>
            <TabsTrigger value="discover">
              <Building className="h-4 w-4 mr-2" />
              Discover More
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="similar">
            <Card>
              <CardHeader>
                <CardTitle>
                  <div className="flex items-center">
                    <Users className="h-5 w-5 mr-2 text-primary" />
                    Similar Professionals
                  </div>
                </CardTitle>
                <CardDescription>
                  People in your industry that you might want to connect with
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                  {exampleUsers.map((user) => (
                    <UserCard 
                      key={user.id} 
                      user={user} 
                      isFollowing={!!followingStatus[user.id]} 
                    />
                  ))}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="discover">
            <Card>
              <CardHeader>
                <CardTitle>
                  <div className="flex items-center">
                    <Building className="h-5 w-5 mr-2 text-primary" />
                    Discover More Professionals
                  </div>
                </CardTitle>
                <CardDescription>
                  Broaden your network with professionals matching your search criteria
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                  {discoveredUsers.map((user) => (
                    <UserCard 
                      key={user.id} 
                      user={user} 
                      isFollowing={!!followingStatus[user.id]} 
                    />
                  ))}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default IndustryDiscoveryDemo;