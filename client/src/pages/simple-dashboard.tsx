import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Link as LinkType, ProfileStats } from "@shared/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
  BarChart,
  GitBranch,
  LineChart,
  Link as LinkIcon,
  LayoutGrid,
  List,
  LogOut,
  Plus,
  Settings,
  Activity,
  Users,
  Eye,
  Share2,
  TrendingUp,
  Star,
} from "lucide-react";

export default function SimpleDashboard() {
  const { user, logoutMutation } = useAuth();
  const [, navigate] = useLocation();

  // Fetching performance stats
  const { data: stats = { views: 0, clicks: 0, ctr: 0, score: 40 }, isLoading: isLoadingStats } = useQuery<ProfileStats>({
    queryKey: ["/api/stats"],
    enabled: !!user,
  });

  // Fetching user links
  const { data: links = [], isLoading: isLoadingLinks } = useQuery<LinkType[]>({
    queryKey: ["/api/links"],
    enabled: !!user,
  });

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="hidden md:flex w-64 flex-col bg-base-100 border-r h-screen sticky top-0">
        <div className="py-6 px-4 border-b">
          <h1 className="text-xl font-bold">MyLinked</h1>
        </div>
        <div className="flex flex-col gap-1 p-2 pt-4 flex-1">
          <Button variant="ghost" className="justify-start" onClick={() => navigate("/")}>
            <LayoutGrid className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
          <Button variant="ghost" className="justify-start" onClick={() => navigate("/analytics")}>
            <BarChart className="mr-2 h-4 w-4" />
            Analytics
          </Button>
          <Button variant="ghost" className="justify-start" onClick={() => navigate("/social-score")}>
            <Star className="mr-2 h-4 w-4" />
            Social Score
          </Button>
          <Button variant="ghost" className="justify-start" onClick={() => navigate("/spotlight")}>
            <Users className="mr-2 h-4 w-4" />
            Spotlight
          </Button>
          <Button variant="ghost" className="justify-start" onClick={() => navigate("/profile")}>
            <User className="mr-2 h-4 w-4" />
            Profile
          </Button>
          <Button variant="ghost" className="justify-start" onClick={() => navigate("/settings")}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </div>
        <div className="p-2 border-t mt-auto">
          <Button 
            variant="ghost" 
            className="justify-start w-full text-red-500 hover:text-red-700 hover:bg-red-100"
            onClick={() => logoutMutation.mutate()}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        {/* Mobile Menu */}
        <div className="md:hidden flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold">MyLinked</h1>
          <Button variant="outline" size="icon" onClick={() => {}}>
            <Menu className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-col gap-6">
          {/* Welcome Section */}
          <div>
            <h1 className="text-2xl font-bold">Welcome, {user?.name || 'User'}</h1>
            <p className="text-base-content/70">Manage your digital presence</p>
          </div>

          {/* Performance Overview */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Profile Views</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.views}</div>
                <p className="text-xs text-base-content/70">Total profile views</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Click Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.ctr.toFixed(1)}%</div>
                <p className="text-xs text-base-content/70">Link click-through rate</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Social Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.score}</div>
                <div className="w-full bg-base-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full" 
                    style={{ width: `${stats.score}%` }}
                  ></div>
                </div>
                <p className="text-xs text-base-content/70 mt-1">Profile optimization score</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="links">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="links">My Links</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="profile">Profile</TabsTrigger>
            </TabsList>
            
            {/* Links Tab */}
            <TabsContent value="links" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium">Manage Links</h2>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" /> Add Link
                </Button>
              </div>
              
              {isLoadingLinks ? (
                <div className="space-y-3">
                  <div className="h-12 bg-base-200 rounded animate-pulse"></div>
                  <div className="h-12 bg-base-200 rounded animate-pulse"></div>
                  <div className="h-12 bg-base-200 rounded animate-pulse"></div>
                </div>
              ) : links.length > 0 ? (
                <div className="space-y-3">
                  {links.map((link: LinkType, index: number) => (
                    <Card key={link.id || index}>
                      <CardContent className="p-4 flex justify-between items-center">
                        <div>
                          <h3 className="font-medium">{link.title}</h3>
                          <p className="text-xs text-base-content/70">{link.url}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="icon">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <LinkIcon className="h-8 w-8 mx-auto mb-2 text-muted" />
                    <h3 className="font-medium mb-1">No Links Yet</h3>
                    <p className="text-sm text-base-content/70 mb-3">Add your first link to get started</p>
                    <Button>
                      <Plus className="h-4 w-4 mr-1" /> Add Your First Link
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            {/* Analytics Tab */}
            <TabsContent value="analytics">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Trends</CardTitle>
                  <CardDescription>View your profile metrics over time</CardDescription>
                </CardHeader>
                <CardContent className="px-2">
                  <div className="h-[200px] flex items-center justify-center">
                    <div className="text-center">
                      <LineChart className="h-8 w-8 mx-auto mb-2 text-muted" />
                      <p className="text-sm font-medium">Analytics Chart</p>
                      <p className="text-xs text-base-content/70">View detailed analytics on the Analytics page</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="justify-end">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => navigate("/analytics")}
                  >
                    <Activity className="h-4 w-4 mr-1" />
                    View Detailed Analytics
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            {/* Profile Tab */}
            <TabsContent value="profile">
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Preview</CardTitle>
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
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Preview
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Collaborative Spotlight</CardTitle>
                    <CardDescription>Showcase projects with others</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-center py-4">
                      <GitBranch className="h-10 w-10 text-muted mx-auto mb-2" />
                      <h4 className="text-sm font-medium mb-1">Collaborative Projects</h4>
                      <p className="text-xs text-base-content/70 mb-4">Showcase your work with others</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs"
                        onClick={() => navigate("/spotlight")}
                      >
                        View Projects
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function Menu(props: React.SVGProps<SVGSVGElement>) {
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

function Pencil(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  )
}

function User(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}