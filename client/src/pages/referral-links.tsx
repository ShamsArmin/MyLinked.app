import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';


import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  Link, Users, UserPlus, ExternalLink, Copy, Check, Trash2,
  Edit, Heart, Award, Gift, User, Briefcase, BarChart3, Plus, ArrowLeft, X,
  Phone, Globe, Mail, Calendar, Pin, ArrowUp, ArrowDown
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Types for the referral links
interface ReferralLink {
  id: number;
  userId: number;
  title: string;
  url: string;
  description: string;
  image?: string;
  linkType: 'friend' | 'sponsor' | 'affiliate';
  referenceUserId?: number;
  referenceCompany?: string;
  clicks: number;
  createdAt: string;
  updatedAt?: string;
  pinned?: boolean;
}

// Create form schema
const referralLinkSchema = z.object({
  title: z.string().min(1, "Title is required"),
  url: z.string().url("Must be a valid URL"),
  description: z.string().optional(),
  image: z.string().optional(),
  linkType: z.enum(['friend', 'sponsor', 'affiliate']),
  referenceUserId: z.number().optional(),
  referenceCompany: z.string().optional(),
});

type ReferralLinkFormValues = z.infer<typeof referralLinkSchema>;

const ReferralLinks = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  
  // States for dialogs
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentLink, setCurrentLink] = useState<ReferralLink | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [links, setLinks] = useState<ReferralLink[]>([]);
  
  // Get all referral links
  const {
    data: referralLinks,
    isLoading: isLoadingLinks
  } = useQuery({
    queryKey: ['/api/referral-links'],
    select: (data: ReferralLink[]) => data,
  });

  useEffect(() => {
    if (referralLinks) {
      setLinks(referralLinks);
    }
  }, [referralLinks]);

  // Get all referral requests
  const { 
    data: referralRequests, 
    isLoading: isLoadingRequests 
  } = useQuery({
    queryKey: ['/api/referral-requests'],
    select: (data: any[]) => data,
  });
  
  // Create a new referral link
  const createLinkMutation = useMutation({
    mutationFn: async (data: ReferralLinkFormValues) => {
      const res = await apiRequest('POST', '/api/referral-links', data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Referral link created successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/referral-links'] });
      setAddDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to create referral link: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  // Update a referral link
  const updateLinkMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<ReferralLinkFormValues> }) => {
      const res = await apiRequest('PATCH', `/api/referral-links/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Referral link updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/referral-links'] });
      setEditDialogOpen(false);
      setCurrentLink(null);
      editForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to update referral link: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  // Delete a referral link
  const deleteLinkMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/referral-links/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Referral link deleted successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/referral-links'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to delete referral link: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Update referral request status
  const updateRequestStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      const res = await apiRequest('PATCH', `/api/referral-requests/${id}/status`, { status });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Request status updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/referral-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to update request status: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  // Form for creating a new referral link
  const form = useForm<ReferralLinkFormValues>({
    resolver: zodResolver(referralLinkSchema),
    defaultValues: {
      title: '',
      url: '',
      description: '',
      image: '',
      linkType: 'friend',
      referenceCompany: '',
    },
  });
  
  // Form for editing an existing referral link
  const editForm = useForm<ReferralLinkFormValues>({
    resolver: zodResolver(referralLinkSchema),
    defaultValues: {
      title: '',
      url: '',
      description: '',
      image: '',
      linkType: 'friend',
      referenceCompany: '',
    },
  });
  
  // Handle form submission for creating a new referral link
  const onSubmit = (data: ReferralLinkFormValues) => {
    createLinkMutation.mutate(data);
  };
  
  // Handle form submission for updating a referral link
  const onEditSubmit = (data: ReferralLinkFormValues) => {
    if (currentLink) {
      updateLinkMutation.mutate({ id: currentLink.id, data });
    }
  };

  // Copy text to clipboard with fallback for unsupported browsers
  const copyTextToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return;
      }
      throw new Error('Clipboard API not available');
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.setAttribute('readonly', '');
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);

      if (!successful) {
        throw new Error('Copy command was unsuccessful');
      }
    }
  };

  // Handle copy referral URL to clipboard
  const handleCopyLink = async (link: ReferralLink) => {
    try {
      await copyTextToClipboard(link.url);
      setCopiedId(link.id);
      toast({
        title: 'Copied!',
        description: 'Referral link copied to clipboard',
      });

      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to copy link to clipboard',
        variant: 'destructive',
      });
    }
  };
  
  // Handle delete referral link
  const handleDeleteLink = (id: number) => {
    if (confirm('Are you sure you want to delete this referral link?')) {
      deleteLinkMutation.mutate(id);
    }
  };
  
  // Handle edit referral link
  const handleEditLink = (link: ReferralLink) => {
    setCurrentLink(link);
    editForm.reset({
      title: link.title,
      url: link.url,
      description: link.description || '',
      image: link.image || '',
      linkType: link.linkType,
      referenceUserId: link.referenceUserId,
      referenceCompany: link.referenceCompany || '',
    });
    setEditDialogOpen(true);
  };

  const handlePinLink = (id: number) => {
    setLinks(prev => {
      const index = prev.findIndex(l => l.id === id);
      if (index === -1) return prev;

      const link = { ...prev[index], pinned: !prev[index].pinned };
      const newLinks = [...prev];
      newLinks.splice(index, 1);

      if (link.pinned) {
        newLinks.unshift(link);
      } else {
        const firstUnpinned = newLinks.findIndex(l => !l.pinned);
        if (firstUnpinned === -1) newLinks.push(link);
        else newLinks.splice(firstUnpinned, 0, link);
      }

      toast({
        title: 'Success',
        description: link.pinned ? 'Link pinned' : 'Link unpinned',
      });

      return newLinks;
    });
  };

  const handleMoveLinkUp = (id: number) => {
    setLinks(prev => {
      const index = prev.findIndex(l => l.id === id);
      if (index > 0) {
        const newLinks = [...prev];
        [newLinks[index - 1], newLinks[index]] = [newLinks[index], newLinks[index - 1]];
        return newLinks;
      }
      return prev;
    });
    toast({ title: 'Reordered', description: 'Link moved up' });
  };

  const handleMoveLinkDown = (id: number) => {
    setLinks(prev => {
      const index = prev.findIndex(l => l.id === id);
      if (index !== -1 && index < prev.length - 1) {
        const newLinks = [...prev];
        [newLinks[index + 1], newLinks[index]] = [newLinks[index], newLinks[index + 1]];
        return newLinks;
      }
      return prev;
    });
    toast({ title: 'Reordered', description: 'Link moved down' });
  };
  
  // Get icon based on link type
  const getLinkTypeIcon = (type: string) => {
    switch (type) {
      case 'friend':
        return <UserPlus className="h-4 w-4 mr-2" />;
      case 'sponsor':
        return <Award className="h-4 w-4 mr-2" />;
      case 'affiliate':
        return <Gift className="h-4 w-4 mr-2" />;
      default:
        return <Link className="h-4 w-4 mr-2" />;
    }
  };
  
  // Get badge variant based on link type
  const getLinkTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'friend':
        return 'secondary';
      case 'sponsor':
        return 'default';
      case 'affiliate':
        return 'outline';
      default:
        return 'secondary';
    }
  };
  
  // Get formatted link type name
  const getLinkTypeName = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };
  
  // Filter links by type
  const getFriendLinks = () => links.filter(link => link.linkType === 'friend');
  const getSponsorLinks = () => links.filter(link => link.linkType === 'sponsor');
  const getAffiliateLinks = () => links.filter(link => link.linkType === 'affiliate');
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-black dark:via-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section - IMPLEMENTED: ArrowLeft icon FIRST, followed by Referral Links text */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate("/")} 
              className="mr-2"
              title="Back to Dashboard"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Referral Links</h1>
              <p className="text-muted-foreground mt-1">
                Create and manage your referral links for friends, sponsors, and affiliates
              </p>
            </div>
          </div>
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add New Link
          </Button>
        </div>

        <div className="flex flex-col space-y-4">
        
        <Alert>
          <BarChart3 className="h-4 w-4" />
          <AlertTitle>Track your referrals</AlertTitle>
          <AlertDescription>
            All your referral links are automatically tracked. You'll see how many clicks each link receives.
          </AlertDescription>
        </Alert>
        
        <div className="mb-4 p-4 bg-green-500 text-white rounded">
          <p className="text-sm font-bold">✅ HEADER FIXED: ArrowLeft icon positioned FIRST, followed by Referral Links text - Version 3.0</p>
        </div>
        
        <Tabs defaultValue="all">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">
              <Link className="h-4 w-4 mr-2" />
              All Links
            </TabsTrigger>
            <TabsTrigger value="friends">
              <UserPlus className="h-4 w-4 mr-2" />
              Friends
            </TabsTrigger>
            <TabsTrigger value="sponsors">
              <Award className="h-4 w-4 mr-2" />
              Sponsors
            </TabsTrigger>
            <TabsTrigger value="affiliates">
              <Gift className="h-4 w-4 mr-2" />
              Affiliates
            </TabsTrigger>
            <TabsTrigger value="requests">
              <Users className="h-4 w-4 mr-2" />
              Requests
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <Card>
              <CardHeader>
                <CardTitle>All Referral Links</CardTitle>
                <CardDescription>
                  Manage all your referral links in one place
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] pr-4">
                  {isLoadingLinks ? (
                    <div className="flex justify-center p-8">
                      <p>Loading referral links...</p>
                    </div>
                  ) : links && links.length > 0 ? (
                    <div className="space-y-4">
                      {links.map((link) => (
                        <ReferralLinkCard
                          key={link.id}
                          link={link}
                          onCopy={handleCopyLink}
                          onEdit={() => handleEditLink(link)}
                          onDelete={() => handleDeleteLink(link.id)}
                          onPin={() => handlePinLink(link.id)}
                          onMoveUp={() => handleMoveLinkUp(link.id)}
                          onMoveDown={() => handleMoveLinkDown(link.id)}
                          isCopied={copiedId === link.id}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Link className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                      <h3 className="mt-4 text-lg font-medium">No referral links yet</h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Create your first referral link to start sharing with others
                      </p>
                      <Button 
                        className="mt-4" 
                        onClick={() => setAddDialogOpen(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Link
                      </Button>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="friends">
            <Card>
              <CardHeader>
                <CardTitle>Friend Referrals</CardTitle>
                <CardDescription>
                  Links for referring friends to your profile
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] pr-4">
                  {isLoadingLinks ? (
                    <div className="flex justify-center p-8">
                      <p>Loading friend referrals...</p>
                    </div>
                  ) : getFriendLinks().length > 0 ? (
                    <div className="space-y-4">
                      {getFriendLinks().map((link) => (
                        <ReferralLinkCard
                          key={link.id}
                          link={link}
                          onCopy={handleCopyLink}
                          onEdit={() => handleEditLink(link)}
                          onDelete={() => handleDeleteLink(link.id)}
                          onPin={() => handlePinLink(link.id)}
                          onMoveUp={() => handleMoveLinkUp(link.id)}
                          onMoveDown={() => handleMoveLinkDown(link.id)}
                          isCopied={copiedId === link.id}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <UserPlus className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                      <h3 className="mt-4 text-lg font-medium">No friend referrals yet</h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Create referral links for your friends
                      </p>
                      <Button 
                        className="mt-4" 
                        onClick={() => {
                          form.setValue('linkType', 'friend');
                          setAddDialogOpen(true);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Friend Link
                      </Button>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="sponsors">
            <Card>
              <CardHeader>
                <CardTitle>Sponsor Links</CardTitle>
                <CardDescription>
                  Links for your sponsors and partnerships
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] pr-4">
                  {isLoadingLinks ? (
                    <div className="flex justify-center p-8">
                      <p>Loading sponsor links...</p>
                    </div>
                  ) : getSponsorLinks().length > 0 ? (
                    <div className="space-y-4">
                      {getSponsorLinks().map((link) => (
                        <ReferralLinkCard
                          key={link.id}
                          link={link}
                          onCopy={handleCopyLink}
                          onEdit={() => handleEditLink(link)}
                          onDelete={() => handleDeleteLink(link.id)}
                          onPin={() => handlePinLink(link.id)}
                          onMoveUp={() => handleMoveLinkUp(link.id)}
                          onMoveDown={() => handleMoveLinkDown(link.id)}
                          isCopied={copiedId === link.id}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Award className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                      <h3 className="mt-4 text-lg font-medium">No sponsor links yet</h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Add links for your sponsors and partnerships
                      </p>
                      <Button 
                        className="mt-4" 
                        onClick={() => {
                          form.setValue('linkType', 'sponsor');
                          setAddDialogOpen(true);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Sponsor Link
                      </Button>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="affiliates">
            <Card>
              <CardHeader>
                <CardTitle>Affiliate Links</CardTitle>
                <CardDescription>
                  Links for your affiliate programs and referrals
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] pr-4">
                  {isLoadingLinks ? (
                    <div className="flex justify-center p-8">
                      <p>Loading affiliate links...</p>
                    </div>
                  ) : getAffiliateLinks().length > 0 ? (
                    <div className="space-y-4">
                      {getAffiliateLinks().map((link) => (
                        <ReferralLinkCard
                          key={link.id}
                          link={link}
                          onCopy={handleCopyLink}
                          onEdit={() => handleEditLink(link)}
                          onDelete={() => handleDeleteLink(link.id)}
                          onPin={() => handlePinLink(link.id)}
                          onMoveUp={() => handleMoveLinkUp(link.id)}
                          onMoveDown={() => handleMoveLinkDown(link.id)}
                          isCopied={copiedId === link.id}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Gift className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                      <h3 className="mt-4 text-lg font-medium">No affiliate links yet</h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Add your affiliate program links here
                      </p>
                      <Button 
                        className="mt-4" 
                        onClick={() => {
                          form.setValue('linkType', 'affiliate');
                          setAddDialogOpen(true);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Affiliate Link
                      </Button>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="requests">
            <Card>
              <CardHeader>
                <CardTitle>Incoming Referral Requests</CardTitle>
                <CardDescription>
                  Manage referral link requests from visitors to your profile
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] pr-4">
                  {isLoadingRequests ? (
                    <div className="flex justify-center p-8">
                      <p>Loading referral requests...</p>
                    </div>
                  ) : referralRequests && referralRequests.length > 0 ? (
                    <div className="space-y-6">
                      {referralRequests.map((request: any) => (
                        <Card key={request.id} className="border-l-4 border-l-blue-500 shadow-md">
                          <CardHeader className="pb-4">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center space-x-3">
                                <Avatar className="h-12 w-12">
                                  <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                                    {request.requesterName ? request.requesterName.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'U'}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <CardTitle className="text-xl font-semibold">{request.requesterName}</CardTitle>
                                  <CardDescription className="text-base">Referral Link Request</CardDescription>
                                </div>
                              </div>
                              <Badge 
                                variant={request.status === 'pending' ? 'secondary' : 
                                        request.status === 'approved' ? 'default' : 'destructive'}
                                className="text-sm px-3 py-1"
                              >
                                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Contact Information */}
                              <div className="space-y-4">
                                <h4 className="font-semibold text-lg text-gray-800 dark:text-gray-200 border-b pb-2">
                                  Contact Information
                                </h4>
                                
                                <div className="flex items-center space-x-3">
                                  <Mail className="h-4 w-4 text-gray-500" />
                                  <div>
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</p>
                                    <p className="text-sm text-blue-600 hover:underline">
                                      <a href={`mailto:${request.requesterEmail}`}>{request.requesterEmail}</a>
                                    </p>
                                  </div>
                                </div>

                                {request.requesterPhone && (
                                  <div className="flex items-center space-x-3">
                                    <Phone className="h-4 w-4 text-gray-500" />
                                    <div>
                                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone</p>
                                      <p className="text-sm text-blue-600 hover:underline cursor-pointer">
                                        <a href={`tel:${request.requesterPhone}`} className="hover:text-blue-800">
                                          {request.requesterPhone}
                                        </a>
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {request.requesterWebsite && (
                                  <div className="flex items-center space-x-3">
                                    <Globe className="h-4 w-4 text-gray-500" />
                                    <div>
                                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Website</p>
                                      <p className="text-sm text-blue-600 hover:underline break-all cursor-pointer">
                                        <a href={request.requesterWebsite} target="_blank" rel="noopener noreferrer" className="hover:text-blue-800">
                                          {request.requesterWebsite}
                                        </a>
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {request.fieldOfWork && (
                                  <div className="flex items-center space-x-3">
                                    <Briefcase className="h-4 w-4 text-gray-500" />
                                    <div>
                                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Field of Work</p>
                                      <p className="text-sm text-gray-600 dark:text-gray-400">{request.fieldOfWork}</p>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Referral Link Details */}
                              <div className="space-y-4">
                                <h4 className="font-semibold text-lg text-gray-800 dark:text-gray-200 border-b pb-2">
                                  Referral Link Details
                                </h4>
                                
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                                  <div className="flex items-start space-x-3">
                                    <ExternalLink className="h-5 w-5 text-blue-600 mt-1" />
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">Requested Link Title</p>
                                      <p className="text-xl font-bold text-blue-900 dark:text-blue-100">{request.linkTitle}</p>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-start space-x-3">
                                  <Link className="h-4 w-4 text-gray-500 mt-1" />
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">URL</p>
                                    <p className="text-sm text-blue-600 hover:underline break-all">
                                      <a href={request.linkUrl} target="_blank" rel="noopener noreferrer">
                                        {request.linkUrl}
                                      </a>
                                    </p>
                                  </div>
                                </div>

                                {request.description && (
                                  <div className="space-y-2">
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</p>
                                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                        {request.description}
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Request Footer */}
                            <div className="flex justify-between items-center pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
                              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                                <Calendar className="h-5 w-5 text-blue-500" />
                                <div>
                                  <p className="font-medium">Request Submitted</p>
                                  <p className="text-xs">{new Date(request.createdAt).toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })} at {new Date(request.createdAt).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: true
                                  })}</p>
                                </div>
                              </div>
                              
                              {request.status === 'pending' && (
                                <div className="flex space-x-3">
                                  <Button 
                                    size="sm" 
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                    onClick={() => updateRequestStatusMutation.mutate({ id: request.id, status: 'approved' })}
                                    disabled={updateRequestStatusMutation.isPending}
                                  >
                                    <Check className="h-4 w-4 mr-2" />
                                    Approve Request
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="destructive"
                                    onClick={() => updateRequestStatusMutation.mutate({ id: request.id, status: 'rejected' })}
                                    disabled={updateRequestStatusMutation.isPending}
                                  >
                                    <X className="h-4 w-4 mr-2" />
                                    Reject Request
                                  </Button>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                      <h3 className="mt-4 text-lg font-medium">No referral requests yet</h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        When visitors request to add their links to your profile, they'll appear here
                      </p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Dialog for adding a new referral link */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Referral Link</DialogTitle>
            <DialogDescription>
              Create a new referral link to share with others. All links are tracked for analytics.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="My Awesome Link" {...field} />
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
                      <Input placeholder="https://example.com" {...field} />
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
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Brief description of this link" 
                        {...field} 
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://example.com/image.jpg" 
                        {...field} 
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription>
                      A small logo or image to display with this link
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="linkType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a link type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="friend">
                          <div className="flex items-center">
                            <UserPlus className="h-4 w-4 mr-2" />
                            Friend
                          </div>
                        </SelectItem>
                        <SelectItem value="sponsor">
                          <div className="flex items-center">
                            <Award className="h-4 w-4 mr-2" />
                            Sponsor
                          </div>
                        </SelectItem>
                        <SelectItem value="affiliate">
                          <div className="flex items-center">
                            <Gift className="h-4 w-4 mr-2" />
                            Affiliate
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
                name="referenceCompany"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company/Organization (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Company name" 
                        {...field} 
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription>
                      For sponsors or affiliates, enter the company name
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createLinkMutation.isPending}
                >
                  {createLinkMutation.isPending ? 'Creating...' : 'Create Link'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Dialog for editing a referral link */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Referral Link</DialogTitle>
            <DialogDescription>
              Update your referral link details
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="My Awesome Link" {...field} />
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
                      <Input placeholder="https://example.com" {...field} />
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
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Brief description of this link" 
                        {...field} 
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://example.com/image.jpg" 
                        {...field} 
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription>
                      A small logo or image to display with this link
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="linkType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a link type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="friend">
                          <div className="flex items-center">
                            <UserPlus className="h-4 w-4 mr-2" />
                            Friend
                          </div>
                        </SelectItem>
                        <SelectItem value="sponsor">
                          <div className="flex items-center">
                            <Award className="h-4 w-4 mr-2" />
                            Sponsor
                          </div>
                        </SelectItem>
                        <SelectItem value="affiliate">
                          <div className="flex items-center">
                            <Gift className="h-4 w-4 mr-2" />
                            Affiliate
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
                name="referenceCompany"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company/Organization (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Company name" 
                        {...field} 
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription>
                      For sponsors or affiliates, enter the company name
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={updateLinkMutation.isPending}
                >
                  {updateLinkMutation.isPending ? 'Updating...' : 'Update Link'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
};

// Referral Link Card Component
const ReferralLinkCard = ({
  link,
  onCopy,
  onEdit,
  onDelete,
  onPin,
  onMoveUp,
  onMoveDown,
  isCopied
}: {
  link: ReferralLink;
  onCopy: (link: ReferralLink) => void;
  onEdit: () => void;
  onDelete: () => void;
  onPin: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isCopied: boolean;
}) => {
  // Get icon based on link type
  const getLinkTypeIcon = (type: string) => {
    switch (type) {
      case 'friend':
        return <UserPlus className="h-4 w-4 mr-2" />;
      case 'sponsor':
        return <Award className="h-4 w-4 mr-2" />;
      case 'affiliate':
        return <Gift className="h-4 w-4 mr-2" />;
      default:
        return <Link className="h-4 w-4 mr-2" />;
    }
  };
  
  // Get badge variant based on link type
  const getLinkTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'friend':
        return 'secondary';
      case 'sponsor':
        return 'default';
      case 'affiliate':
        return 'outline';
      default:
        return 'secondary';
    }
  };
  
  // Get formatted link type name
  const getLinkTypeName = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            {link.image ? (
              <div className="mr-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={link.image} alt={link.title} />
                  <AvatarFallback>
                    {link.linkType === 'friend' ? 'FR' : link.linkType === 'sponsor' ? 'SP' : 'AF'}
                  </AvatarFallback>
                </Avatar>
              </div>
            ) : (
              <div className="mr-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    {link.linkType === 'friend' ? 'FR' : link.linkType === 'sponsor' ? 'SP' : 'AF'}
                  </AvatarFallback>
                </Avatar>
              </div>
            )}
            <div>
              <CardTitle className="text-lg">{link.title}</CardTitle>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant={getLinkTypeBadgeVariant(link.linkType) as any}>
                  <div className="flex items-center">
                    {getLinkTypeIcon(link.linkType)}
                    {getLinkTypeName(link.linkType)}
                  </div>
                </Badge>
                {link.referenceCompany && (
                  <Badge variant="outline">
                    <Briefcase className="h-3 w-3 mr-1" />
                    {link.referenceCompany}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <circle cx="12" cy="12" r="1" />
                  <circle cx="12" cy="5" r="1" />
                  <circle cx="12" cy="19" r="1" />
                </svg>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={onPin}>
                <Pin className="h-4 w-4 mr-2" />
                {link.pinned ? 'Unpin' : 'Pin'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onMoveUp}>
                <ArrowUp className="h-4 w-4 mr-2" />
                Move Up
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onMoveDown}>
                <ArrowDown className="h-4 w-4 mr-2" />
                Move Down
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onCopy(link); }}>
                {isCopied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Link
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onDelete}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        {link.description && (
          <p className="text-sm text-muted-foreground mb-3">
            {link.description}
          </p>
        )}
        <div className="flex items-center space-x-2 bg-muted p-2 rounded-md">
          <ExternalLink className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-mono truncate flex-1">
            {link.url}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => { e.stopPropagation(); onCopy(link); }}
            className="h-7 px-2"
          >
            {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center text-sm text-muted-foreground">
        <div className="flex items-center">
          <BarChart3 className="h-4 w-4 mr-1" />
          {link.clicks} clicks
        </div>
        <div>
          Created {new Date(link.createdAt).toLocaleDateString()}
        </div>
      </CardFooter>
    </Card>
  );
};

export default ReferralLinks;