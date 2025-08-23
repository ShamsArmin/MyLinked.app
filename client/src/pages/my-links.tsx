import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Link, insertLinkSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { apiRequest } from "@/lib/queryClient";
import {
  fetchLinks,
  LINKS_QK,
  createLink,
  deleteLink,
  addLinkOptimistic,
  removeLinkOptimistic,
  invalidateLinks,
} from "@/lib/links-api";
import { z } from "zod";
import { usePlatformIcons } from "@/hooks/use-platform-icons";
import { useLocation } from "wouter";

import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  MousePointer,
  ArrowUp,
  ArrowDown,
  Grid,
  List,
  LayoutGrid,
  Search,
  Filter,
  ExternalLink,
  Copy,
  BarChart3,
  TrendingUp,
  Globe,
  Star,
  Calendar,
  Activity,
  ArrowLeft,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const linkFormSchema = insertLinkSchema.extend({
  customIcon: z.string().optional(),
});

type LinkFormValues = z.infer<typeof linkFormSchema>;

const viewModes = [
  { value: 'grid', label: 'Grid View', icon: Grid },
  { value: 'list', label: 'List View', icon: List },
  { value: 'table', label: 'Table View', icon: LayoutGrid },
];

export default function MyLinksPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'table'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'title' | 'platform' | 'clicks' | 'createdAt'>('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentLink, setCurrentLink] = useState<Link | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  
  const { getPlatformIcon } = usePlatformIcons();
  const [, navigate] = useLocation();

  // Handle back navigation
  const handleBackToDashboard = () => {
    navigate("/");
  };

  // Fetch links
  const {
    data: links = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: LINKS_QK,
    queryFn: fetchLinks,
    refetchOnMount: 'always',
    enabled: !!user,
  });

  // Create link mutation
  const createLinkMutation = useMutation({
    mutationFn: (data: LinkFormValues) => createLink(data),
    onSuccess: (created) => {
      addLinkOptimistic(created);
      invalidateLinks();
      toast({
        title: 'Success',
        description: 'Link created successfully',
      });
      setIsAddDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to create link: ${error.message}`,
        variant: 'destructive',
      });
      invalidateLinks();
    },
  });

  // Update link mutation
  const updateLinkMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: LinkFormValues }) => {
      return await apiRequest('PATCH', `/api/links/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Link updated successfully',
      });
      setIsEditDialogOpen(false);
      setCurrentLink(null);
      editForm.reset();
      invalidateLinks();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to update link: ${error.message}`,
        variant: 'destructive',
      });
      invalidateLinks();
    },
  });

  // Delete link mutation
  const deleteLinkMutation = useMutation({
    mutationFn: (id: number) => deleteLink(id),
    onMutate: (id: number) => {
      removeLinkOptimistic(id);
    },
    onSuccess: () => {
      invalidateLinks();
      toast({
        title: 'Success',
        description: 'Link deleted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to delete link: ${error.message}`,
        variant: 'destructive',
      });
      invalidateLinks();
    },
  });

  // Forms
  const form = useForm<LinkFormValues>({
    resolver: zodResolver(linkFormSchema),
    defaultValues: {
      platform: '',
      title: '',
      url: '',
      description: '',
      customIcon: '',
    },
  });

  const editForm = useForm<LinkFormValues>({
    resolver: zodResolver(linkFormSchema),
    defaultValues: {
      platform: '',
      title: '',
      url: '',
      description: '',
      customIcon: '',
    },
  });

  // Handle form submissions
  const onSubmit = (data: LinkFormValues) => {
    createLinkMutation.mutate(data);
  };

  const onEditSubmit = (data: LinkFormValues) => {
    if (currentLink) {
      updateLinkMutation.mutate({ id: currentLink.id, data });
    }
  };

  // Handle edit link
  const handleEditLink = (link: Link) => {
    setCurrentLink(link);
    editForm.reset({
      platform: link.platform,
      title: link.title,
      url: link.url,
      description: link.description || '',
      customIcon: link.customIcon || '',
    });
    setIsEditDialogOpen(true);
  };

  // Handle delete link
  const handleDeleteLink = (id: number) => {
    deleteLinkMutation.mutate(id);
  };

  // Handle copy link
  const handleCopyLink = async (link: Link) => {
    try {
      await navigator.clipboard.writeText(link.url);
      setCopiedId(link.id);
      toast({
        title: 'Copied!',
        description: 'Link URL copied to clipboard',
      });
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to copy link to clipboard',
        variant: 'destructive',
      });
    }
  };

  // Filter and sort links
  const filteredLinks = links
    .filter(link => {
      const matchesSearch = link.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           link.platform.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           link.url.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPlatform = selectedPlatform === 'all' || link.platform === selectedPlatform;
      return matchesSearch && matchesPlatform;
    })
    .sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'clicks') {
        aValue = a.clicks || 0;
        bValue = b.clicks || 0;
      }
      
      if (sortBy === 'createdAt') {
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  // Get unique platforms
  const uniquePlatforms = [...new Set(links.map(link => link.platform))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-black dark:via-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">

        {/* Header Section */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={handleBackToDashboard} className="mr-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">My Links</h1>
              <p className="text-muted-foreground mt-1">
                Manage and organize all your social links
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white/70 backdrop-blur-lg border-0 shadow-md dark:bg-gray-900/70">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Links</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{links.length}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/70 backdrop-blur-lg border-0 shadow-md dark:bg-gray-900/70">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Clicks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {links.reduce((sum, link) => sum + (link.clicks || 0), 0)}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/70 backdrop-blur-lg border-0 shadow-md dark:bg-gray-900/70">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Platforms</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{uniquePlatforms.length}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/70 backdrop-blur-lg border-0 shadow-md dark:bg-gray-900/70">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Avg. Clicks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {links.length > 0 ? Math.round(links.reduce((sum, link) => sum + (link.clicks || 0), 0) / links.length) : 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <Card className="bg-white/70 backdrop-blur-lg border-0 shadow-md dark:bg-gray-900/70 mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col md:flex-row gap-4 items-center">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search links..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>

                {/* Platform Filter */}
                <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Platforms</SelectItem>
                    {uniquePlatforms.map(platform => (
                      <SelectItem key={platform} value={platform}>
                        {platform}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Sort */}
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="title">Title</SelectItem>
                    <SelectItem value="platform">Platform</SelectItem>
                    <SelectItem value="clicks">Clicks</SelectItem>
                    <SelectItem value="createdAt">Created Date</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  {sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                </Button>
              </div>

              {/* View Mode Toggle and Add Link Button */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {viewModes.map(mode => (
                    <Button
                      key={mode.value}
                      variant={viewMode === mode.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode(mode.value as any)}
                    >
                      <mode.icon className="h-4 w-4" />
                    </Button>
                  ))}
                </div>
                
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Link
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Links Display */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-500">Loading links...</div>
          </div>
        ) : filteredLinks.length === 0 ? (
          <Card className="bg-white/70 backdrop-blur-lg border-0 shadow-md dark:bg-gray-900/70">
            <CardContent className="p-12 text-center">
              <Globe className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No links found</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {searchTerm || selectedPlatform !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Start by adding your first social link'
                }
              </p>
              {!searchTerm && selectedPlatform === 'all' && (
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Link
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className={`
            ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 
              viewMode === 'list' ? 'space-y-4' : ''}
          `}>
            {viewMode === 'table' ? (
              <Card className="bg-white/70 backdrop-blur-lg border-0 shadow-md dark:bg-gray-900/70">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Link</TableHead>
                        <TableHead>Platform</TableHead>
                        <TableHead>Clicks</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLinks.map((link) => (
                        <TableRow key={link.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {getPlatformIcon(link.platform, 'h-5 w-5')}
                              <div>
                                <div className="font-medium">{link.title}</div>
                                <div className="text-sm text-gray-500 truncate max-w-xs">{link.url}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{link.platform}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <MousePointer className="h-4 w-4 text-gray-400" />
                              {link.clicks || 0}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              {new Date(link.createdAt).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCopyLink(link)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditLink(link)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteLink(link.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ) : (
              filteredLinks.map((link) => (
                <Card key={link.id} className="bg-white/70 backdrop-blur-lg border-0 shadow-md dark:bg-gray-900/70 hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {getPlatformIcon(link.platform, 'h-8 w-8')}
                        <div>
                          <h3 className="font-semibold text-gray-900">{link.title}</h3>
                          <Badge variant="secondary" className="mt-1">{link.platform}</Badge>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => handleEditLink(link)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleCopyLink(link)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy URL
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteLink(link.id)}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    {link.description && (
                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">{link.description}</p>
                    )}
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <MousePointer className="h-4 w-4" />
                          {link.clicks || 0} clicks
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(link.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(link.url, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Visit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Add Link Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Link</DialogTitle>
              <DialogDescription>
                Create a new social link for your profile
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="platform"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Platform</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select platform" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="instagram">
                            <div className="flex items-center gap-2">
                              {getPlatformIcon('instagram', 'h-4 w-4')}
                              Instagram
                            </div>
                          </SelectItem>
                          <SelectItem value="twitter">
                            <div className="flex items-center gap-2">
                              {getPlatformIcon('twitter', 'h-4 w-4')}
                              X (Twitter)
                            </div>
                          </SelectItem>
                          <SelectItem value="linkedin">
                            <div className="flex items-center gap-2">
                              {getPlatformIcon('linkedin', 'h-4 w-4')}
                              LinkedIn
                            </div>
                          </SelectItem>
                          <SelectItem value="youtube">
                            <div className="flex items-center gap-2">
                              {getPlatformIcon('youtube', 'h-4 w-4')}
                              YouTube
                            </div>
                          </SelectItem>
                          <SelectItem value="tiktok">
                            <div className="flex items-center gap-2">
                              {getPlatformIcon('tiktok', 'h-4 w-4')}
                              TikTok
                            </div>
                          </SelectItem>
                          <SelectItem value="facebook">
                            <div className="flex items-center gap-2">
                              {getPlatformIcon('facebook', 'h-4 w-4')}
                              Facebook
                            </div>
                          </SelectItem>
                          <SelectItem value="github">
                            <div className="flex items-center gap-2">
                              {getPlatformIcon('github', 'h-4 w-4')}
                              GitHub
                            </div>
                          </SelectItem>
                          <SelectItem value="whatsapp">
                            <div className="flex items-center gap-2">
                              {getPlatformIcon('whatsapp', 'h-4 w-4')}
                              WhatsApp
                            </div>
                          </SelectItem>
                          <SelectItem value="telegram">
                            <div className="flex items-center gap-2">
                              {getPlatformIcon('telegram', 'h-4 w-4')}
                              Telegram
                            </div>
                          </SelectItem>
                          <SelectItem value="pinterest">
                            <div className="flex items-center gap-2">
                              {getPlatformIcon('pinterest', 'h-4 w-4')}
                              Pinterest
                            </div>
                          </SelectItem>
                          <SelectItem value="spotify">
                            <div className="flex items-center gap-2">
                              {getPlatformIcon('spotify', 'h-4 w-4')}
                              Spotify
                            </div>
                          </SelectItem>
                          <SelectItem value="soundcloud">
                            <div className="flex items-center gap-2">
                              {getPlatformIcon('soundcloud', 'h-4 w-4')}
                              SoundCloud
                            </div>
                          </SelectItem>
                          <SelectItem value="twitch">
                            <div className="flex items-center gap-2">
                              {getPlatformIcon('twitch', 'h-4 w-4')}
                              Twitch
                            </div>
                          </SelectItem>
                          <SelectItem value="medium">
                            <div className="flex items-center gap-2">
                              {getPlatformIcon('medium', 'h-4 w-4')}
                              Medium
                            </div>
                          </SelectItem>
                          <SelectItem value="etsy">
                            <div className="flex items-center gap-2">
                              {getPlatformIcon('etsy', 'h-4 w-4')}
                              Etsy
                            </div>
                          </SelectItem>
                          <SelectItem value="website">
                            <div className="flex items-center gap-2">
                              {getPlatformIcon('website', 'h-4 w-4')}
                              Website
                            </div>
                          </SelectItem>
                          <SelectItem value="portfolio">
                            <div className="flex items-center gap-2">
                              {getPlatformIcon('portfolio', 'h-4 w-4')}
                              Portfolio
                            </div>
                          </SelectItem>
                          <SelectItem value="email">
                            <div className="flex items-center gap-2">
                              {getPlatformIcon('email', 'h-4 w-4')}
                              Email
                            </div>
                          </SelectItem>
                          <SelectItem value="phone">
                            <div className="flex items-center gap-2">
                              {getPlatformIcon('phone', 'h-4 w-4')}
                              Phone
                            </div>
                          </SelectItem>
                          <SelectItem value="calendar">
                            <div className="flex items-center gap-2">
                              {getPlatformIcon('calendar', 'h-4 w-4')}
                              Calendar
                            </div>
                          </SelectItem>
                          <SelectItem value="store">
                            <div className="flex items-center gap-2">
                              {getPlatformIcon('store', 'h-4 w-4')}
                              Store
                            </div>
                          </SelectItem>
                          <SelectItem value="custom">
                            <div className="flex items-center gap-2">
                              {getPlatformIcon('custom', 'h-4 w-4')}
                              Custom Link
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter link title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter URL" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createLinkMutation.isPending}>
                    {createLinkMutation.isPending ? 'Creating...' : 'Create Link'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Edit Link Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Link</DialogTitle>
              <DialogDescription>
                Update your social link information
              </DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="platform"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Platform</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select platform" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="instagram">
                            <div className="flex items-center gap-2">
                              {getPlatformIcon('instagram', 'h-4 w-4')}
                              Instagram
                            </div>
                          </SelectItem>
                          <SelectItem value="twitter">
                            <div className="flex items-center gap-2">
                              {getPlatformIcon('twitter', 'h-4 w-4')}
                              X (Twitter)
                            </div>
                          </SelectItem>
                          <SelectItem value="linkedin">
                            <div className="flex items-center gap-2">
                              {getPlatformIcon('linkedin', 'h-4 w-4')}
                              LinkedIn
                            </div>
                          </SelectItem>
                          <SelectItem value="youtube">
                            <div className="flex items-center gap-2">
                              {getPlatformIcon('youtube', 'h-4 w-4')}
                              YouTube
                            </div>
                          </SelectItem>
                          <SelectItem value="tiktok">
                            <div className="flex items-center gap-2">
                              {getPlatformIcon('tiktok', 'h-4 w-4')}
                              TikTok
                            </div>
                          </SelectItem>
                          <SelectItem value="facebook">
                            <div className="flex items-center gap-2">
                              {getPlatformIcon('facebook', 'h-4 w-4')}
                              Facebook
                            </div>
                          </SelectItem>
                          <SelectItem value="github">
                            <div className="flex items-center gap-2">
                              {getPlatformIcon('github', 'h-4 w-4')}
                              GitHub
                            </div>
                          </SelectItem>
                          <SelectItem value="whatsapp">
                            <div className="flex items-center gap-2">
                              {getPlatformIcon('whatsapp', 'h-4 w-4')}
                              WhatsApp
                            </div>
                          </SelectItem>
                          <SelectItem value="telegram">
                            <div className="flex items-center gap-2">
                              {getPlatformIcon('telegram', 'h-4 w-4')}
                              Telegram
                            </div>
                          </SelectItem>
                          <SelectItem value="pinterest">
                            <div className="flex items-center gap-2">
                              {getPlatformIcon('pinterest', 'h-4 w-4')}
                              Pinterest
                            </div>
                          </SelectItem>
                          <SelectItem value="spotify">
                            <div className="flex items-center gap-2">
                              {getPlatformIcon('spotify', 'h-4 w-4')}
                              Spotify
                            </div>
                          </SelectItem>
                          <SelectItem value="soundcloud">
                            <div className="flex items-center gap-2">
                              {getPlatformIcon('soundcloud', 'h-4 w-4')}
                              SoundCloud
                            </div>
                          </SelectItem>
                          <SelectItem value="twitch">
                            <div className="flex items-center gap-2">
                              {getPlatformIcon('twitch', 'h-4 w-4')}
                              Twitch
                            </div>
                          </SelectItem>
                          <SelectItem value="medium">
                            <div className="flex items-center gap-2">
                              {getPlatformIcon('medium', 'h-4 w-4')}
                              Medium
                            </div>
                          </SelectItem>
                          <SelectItem value="etsy">
                            <div className="flex items-center gap-2">
                              {getPlatformIcon('etsy', 'h-4 w-4')}
                              Etsy
                            </div>
                          </SelectItem>
                          <SelectItem value="website">
                            <div className="flex items-center gap-2">
                              {getPlatformIcon('website', 'h-4 w-4')}
                              Website
                            </div>
                          </SelectItem>
                          <SelectItem value="portfolio">
                            <div className="flex items-center gap-2">
                              {getPlatformIcon('portfolio', 'h-4 w-4')}
                              Portfolio
                            </div>
                          </SelectItem>
                          <SelectItem value="email">
                            <div className="flex items-center gap-2">
                              {getPlatformIcon('email', 'h-4 w-4')}
                              Email
                            </div>
                          </SelectItem>
                          <SelectItem value="phone">
                            <div className="flex items-center gap-2">
                              {getPlatformIcon('phone', 'h-4 w-4')}
                              Phone
                            </div>
                          </SelectItem>
                          <SelectItem value="calendar">
                            <div className="flex items-center gap-2">
                              {getPlatformIcon('calendar', 'h-4 w-4')}
                              Calendar
                            </div>
                          </SelectItem>
                          <SelectItem value="store">
                            <div className="flex items-center gap-2">
                              {getPlatformIcon('store', 'h-4 w-4')}
                              Store
                            </div>
                          </SelectItem>
                          <SelectItem value="custom">
                            <div className="flex items-center gap-2">
                              {getPlatformIcon('custom', 'h-4 w-4')}
                              Custom Link
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter link title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter URL" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateLinkMutation.isPending}>
                    {updateLinkMutation.isPending ? 'Updating...' : 'Update Link'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
