import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useLocation } from 'wouter';
import * as z from 'zod';
import { apiRequest } from '@/lib/queryClient';

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
  Edit, Heart, Award, Gift, User, Briefcase, BarChart3, Plus,
  Upload, Image as ImageIcon
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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

// Local types for the referral links
interface ReferralLink {
  id: number;
  userId: number;
  title: string;
  url: string;
  description: string;
  image?: string;
  linkType: 'friend' | 'sponsor' | 'affiliate';
  referenceCompany?: string;
  clicks: number;
  createdAt: string;
}

// Create form schema
const referralLinkSchema = z.object({
  title: z.string().min(1, "Title is required"),
  url: z.string().url("Must be a valid URL"),
  description: z.string().optional(),
  image: z.string().optional(),
  linkType: z.enum(['friend', 'sponsor', 'affiliate']),
  referenceCompany: z.string().optional(),
});

type ReferralLinkFormValues = z.infer<typeof referralLinkSchema>;

// Sample data for demo
const sampleLinks: ReferralLink[] = [
  {
    id: 1,
    userId: 1,
    title: 'My Designer Friend',
    url: 'https://example.com/designer',
    description: 'Check out my friend\'s amazing design portfolio',
    linkType: 'friend',
    clicks: 24,
    createdAt: '2024-05-01T10:30:00Z'
  },
  {
    id: 2,
    userId: 1,
    title: 'Acme Design Tools',
    url: 'https://acmedesign.com',
    description: 'The best design tools I use every day',
    linkType: 'sponsor',
    referenceCompany: 'Acme Design',
    image: 'https://placehold.co/50x50',
    clicks: 47,
    createdAt: '2024-05-05T14:22:00Z'
  },
  {
    id: 3,
    userId: 1,
    title: 'Premium Hosting Service',
    url: 'https://hostingservice.com/ref123',
    description: 'Get 20% off your first month of hosting with my code',
    linkType: 'affiliate',
    referenceCompany: 'Premium Hosting',
    clicks: 12,
    createdAt: '2024-05-10T09:15:00Z'
  }
];

const ReferralLinks = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [_, navigate] = useLocation();
  
  // States for dialogs
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
const [currentLink, setCurrentLink] = useState<ReferralLink | null>(null);
const [copiedId, setCopiedId] = useState<number | null>(null);
const [imageUploadType, setImageUploadType] = useState<'url' | 'file'>('url');
const [editImageUploadType, setEditImageUploadType] = useState<'url' | 'file'>('url');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (imageUploadType === 'file') {
      fileInputRef.current?.click();
    }
  }, [imageUploadType]);

  useEffect(() => {
    if (editImageUploadType === 'file') {
      editFileInputRef.current?.click();
    }
  }, [editImageUploadType]);

  // Handle file upload for images
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>, formField: any) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        formField.onChange(result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Get all referral links
  const { 
    data: referralLinks, 
    isLoading: isLoadingLinks 
  } = useQuery({
    queryKey: ['/api/referral-links'],
    select: (data: ReferralLink[]) => data,
  });

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
    mutationFn: async (data: Partial<ReferralLinkFormValues>) => {
      return await apiRequest('POST', '/api/referral-links', data);
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
      return await apiRequest('PATCH', `/api/referral-links/${id}`, data);
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
      return await apiRequest('DELETE', `/api/referral-links/${id}`);
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
      return await apiRequest('PATCH', `/api/referral-requests/${id}/status`, { status });
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
  const cleanPayload = (data: ReferralLinkFormValues) => {
    const cleaned: any = { ...data };
    Object.keys(cleaned).forEach((key) => {
      if (cleaned[key as keyof ReferralLinkFormValues] === "") {
        delete cleaned[key as keyof ReferralLinkFormValues];
      }
    });
    return cleaned as Partial<ReferralLinkFormValues>;
  };

  const onSubmit = (data: ReferralLinkFormValues) => {
    createLinkMutation.mutate(cleanPayload(data));
  };
  
  // Handle form submission for updating a referral link
  const onEditSubmit = (data: ReferralLinkFormValues) => {
    if (currentLink) {
      updateLinkMutation.mutate({ id: currentLink.id, data: cleanPayload(data) });
    }
  };
  
  // Copy to clipboard with graceful fallback for older browsers or insecure contexts
  const copyTextToClipboard = async (text: string) => {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.setAttribute('readonly', '');
    textArea.style.position = 'absolute';
    textArea.style.left = '-9999px';
    textArea.style.top = (document.body.scrollTop || 0) + 'px';
    document.body.appendChild(textArea);
    textArea.select();
    textArea.setSelectionRange(0, textArea.value.length);

    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);

    if (!successful) {
      throw new Error('Copy command was unsuccessful');
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
    deleteLinkMutation.mutate(id);
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
      referenceCompany: link.referenceCompany || '',
    });
    setEditDialogOpen(true);
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
  const getFriendLinks = () => referralLinks?.filter(link => link.linkType === 'friend') || [];
  const getSponsorLinks = () => referralLinks?.filter(link => link.linkType === 'sponsor') || [];
  const getAffiliateLinks = () => referralLinks?.filter(link => link.linkType === 'affiliate') || [];
  
  return (
    <div className="container mx-auto max-w-3xl py-6 px-4 overflow-x-hidden">
      <div className="flex flex-col space-y-4">
        <div className="relative">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <div className="flex items-center mb-2">
                <h1 className="text-3xl font-bold">Referral Links</h1>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => navigate('/')}
                  title="Return to Dashboard"
                  className="ml-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                    <path d="M18 6 6 18"></path>
                    <path d="m6 6 12 12"></path>
                  </svg>
                </Button>
              </div>
              <p className="text-muted-foreground">
                Create and manage your referral links for friends, sponsors, and affiliates
              </p>
            </div>
            <div>
              <Button onClick={() => setAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add New Link
              </Button>
            </div>
          </div>
        </div>
        
        <Alert>
          <BarChart3 className="h-4 w-4" />
          <AlertTitle>Track your referrals</AlertTitle>
          <AlertDescription>
            All your referral links are automatically tracked. You'll see how many clicks each link receives.
          </AlertDescription>
        </Alert>
        
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
              <CardContent className="px-4 py-3">
                <ScrollArea className="h-[400px] pr-2 w-full">
                  {isLoadingLinks ? (
                    <div className="flex justify-center p-8">
                      <p>Loading referral links...</p>
                    </div>
                  ) : referralLinks && referralLinks.length > 0 ? (
                    <div className="space-y-4 max-w-full">
                      {referralLinks.map((link) => (
                        <ReferralLinkCard
                          key={link.id}
                          link={link}
                          onCopy={handleCopyLink}
                          onEdit={() => handleEditLink(link)}
                          onDelete={() => handleDeleteLink(link.id)}
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
              <CardContent className="px-4 py-3">
                <ScrollArea className="h-[400px] pr-2 w-full">
                  {isLoadingLinks ? (
                    <div className="flex justify-center p-8">
                      <p>Loading friend referrals...</p>
                    </div>
                  ) : getFriendLinks().length > 0 ? (
                    <div className="space-y-4 max-w-full">
                      {getFriendLinks().map((link) => (
                        <ReferralLinkCard
                          key={link.id}
                          link={link}
                          onCopy={handleCopyLink}
                          onEdit={() => handleEditLink(link)}
                          onDelete={() => handleDeleteLink(link.id)}
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
              <CardContent className="px-4 py-3">
                <ScrollArea className="h-[400px] pr-2 w-full">
                  {isLoadingLinks ? (
                    <div className="flex justify-center p-8">
                      <p>Loading sponsor links...</p>
                    </div>
                  ) : getSponsorLinks().length > 0 ? (
                    <div className="space-y-4 max-w-full">
                      {getSponsorLinks().map((link) => (
                        <ReferralLinkCard
                          key={link.id}
                          link={link}
                          onCopy={handleCopyLink}
                          onEdit={() => handleEditLink(link)}
                          onDelete={() => handleDeleteLink(link.id)}
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
              <CardContent className="px-4 py-3">
                <ScrollArea className="h-[400px] pr-2 w-full">
                  {isLoadingLinks ? (
                    <div className="flex justify-center p-8">
                      <p>Loading affiliate links...</p>
                    </div>
                  ) : getAffiliateLinks().length > 0 ? (
                    <div className="space-y-4 max-w-full">
                      {getAffiliateLinks().map((link) => (
                        <ReferralLinkCard
                          key={link.id}
                          link={link}
                          onCopy={handleCopyLink}
                          onEdit={() => handleEditLink(link)}
                          onDelete={() => handleDeleteLink(link.id)}
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
              <CardContent className="px-2 sm:px-4">
                <ScrollArea className="h-[500px] pr-1 sm:pr-4">
                  {isLoadingRequests ? (
                    <div className="flex justify-center p-8">
                      <p>Loading referral requests...</p>
                    </div>
                  ) : referralRequests && referralRequests.length > 0 ? (
                    <div className="space-y-4">
                      {referralRequests.map((request: any) => (
                        <Card key={request.id} className="border-l-4 border-l-blue-500 w-full max-w-full">
                          <CardHeader className="pb-2 px-3 sm:px-6">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                              <div className="min-w-0 flex-1">
                                <CardTitle className="text-base sm:text-lg truncate">{request.requesterName}</CardTitle>
                                <CardDescription className="text-sm break-words">{request.requesterEmail}</CardDescription>
                              </div>
                              <Badge 
                                variant={request.status === 'pending' ? 'secondary' : 
                                        request.status === 'approved' ? 'default' : 'destructive'}
                                className="flex-shrink-0 self-start"
                              >
                                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="px-3 sm:px-6">
                            <div className="space-y-3">
                              <div className="min-w-0">
                                <p className="text-sm font-medium">Requested Link:</p>
                                <p className="text-sm text-muted-foreground truncate">{request.linkTitle}</p>
                                <p className="text-sm text-blue-600 break-all overflow-hidden">{request.linkUrl}</p>
                              </div>
                              {request.fieldOfWork && (
                                <div className="min-w-0">
                                  <p className="text-sm font-medium">Field of Work:</p>
                                  <p className="text-sm text-muted-foreground break-words">{request.fieldOfWork}</p>
                                </div>
                              )}
                              {request.description && (
                                <div className="min-w-0">
                                  <p className="text-sm font-medium">Description:</p>
                                  <p className="text-sm text-muted-foreground break-words">{request.description}</p>
                                </div>
                              )}
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 pt-2">
                                <p className="text-xs text-muted-foreground">
                                  Requested on {new Date(request.createdAt).toLocaleDateString()}
                                </p>
                                {request.status === 'pending' && (
                                  <div className="flex flex-col sm:flex-row gap-2">
                                    <Button 
                                      size="sm" 
                                      className="w-full sm:w-auto"
                                      onClick={() => updateRequestStatusMutation.mutate({ id: request.id, status: 'approved' })}
                                      disabled={updateRequestStatusMutation.isPending}
                                    >
                                      <Check className="h-4 w-4 mr-1" />
                                      Approve
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="destructive"
                                      className="w-full sm:w-auto"
                                      onClick={() => updateRequestStatusMutation.mutate({ id: request.id, status: 'rejected' })}
                                      disabled={updateRequestStatusMutation.isPending}
                                    >
                                      <Trash2 className="h-4 w-4 mr-1" />
                                      Reject
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                      <h3 className="mt-4 text-lg font-medium">No requests yet</h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Visitors can request referral links from your public profile
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
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
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
                    <FormLabel>Image (Optional)</FormLabel>
                    <div className="space-y-3">
                      {/* Upload Type Selector */}
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant={imageUploadType === 'url' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setImageUploadType('url')}
                          className="flex items-center gap-2"
                        >
                          <Link className="h-4 w-4" />
                          URL
                        </Button>
                        <Button
                          type="button"
                          variant={imageUploadType === 'file' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setImageUploadType('file')}
                          className="flex items-center gap-2"
                        >
                          <Upload className="h-4 w-4" />
                          Upload
                        </Button>
                      </div>

                      {/* URL Input */}
                      {imageUploadType === 'url' && (
                        <FormControl>
                          <Input 
                            placeholder="https://example.com/image.jpg" 
                            {...field} 
                            value={field.value || ''}
                          />
                        </FormControl>
                      )}

                      {/* File Upload */}
                      {imageUploadType === 'file' && (
                        <FormControl>
                          <div className="space-y-2">
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(e, field)}
                              className="cursor-pointer"
                              ref={fileInputRef}
                            />
                            {field.value && field.value.startsWith('data:') && (
                              <div className="mt-2">
                                <img
                                  src={field.value}
                                  alt="Preview" 
                                  className="h-16 w-16 object-cover rounded border"
                                />
                              </div>
                            )}
                          </div>
                        </FormControl>
                      )}
                    </div>
                    <FormDescription>
                      A small logo or image to display with this link (max 5MB)
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
                <Button type="submit" disabled={createLinkMutation.isPending}>
                  {createLinkMutation.isPending ? 'Creating...' : 'Create Link'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Dialog for editing a referral link */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
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
                    <FormLabel>Image (Optional)</FormLabel>
                    <div className="space-y-3">
                      {/* Upload Type Selector */}
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant={editImageUploadType === 'url' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setEditImageUploadType('url')}
                          className="flex items-center gap-2"
                        >
                          <Link className="h-4 w-4" />
                          URL
                        </Button>
                        <Button
                          type="button"
                          variant={editImageUploadType === 'file' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setEditImageUploadType('file')}
                          className="flex items-center gap-2"
                        >
                          <Upload className="h-4 w-4" />
                          Upload
                        </Button>
                      </div>

                      {/* URL Input */}
                      {editImageUploadType === 'url' && (
                        <FormControl>
                          <Input 
                            placeholder="https://example.com/image.jpg" 
                            {...field} 
                            value={field.value || ''}
                          />
                        </FormControl>
                      )}

                      {/* File Upload */}
                      {editImageUploadType === 'file' && (
                        <FormControl>
                          <div className="space-y-2">
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(e, field)}
                              className="cursor-pointer"
                              ref={editFileInputRef}
                            />
                            {field.value && field.value.startsWith('data:') && (
                              <div className="mt-2">
                                <img
                                  src={field.value}
                                  alt="Preview" 
                                  className="h-16 w-16 object-cover rounded border"
                                />
                              </div>
                            )}
                          </div>
                        </FormControl>
                      )}
                    </div>
                    <FormDescription>
                      A small logo or image to display with this link (max 5MB)
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
                <Button type="submit" disabled={updateLinkMutation.isPending}>
                  {updateLinkMutation.isPending ? 'Updating...' : 'Update Link'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Referral Link Card Component
const ReferralLinkCard = ({
  link,
  onCopy,
  onEdit,
  onDelete,
  isCopied
}: {
  link: ReferralLink;
  onCopy: (link: ReferralLink) => void;
  onEdit: () => void;
  onDelete: () => void;
  isCopied: boolean;
}) => {
  // Function to handle link click - opens the link in a new tab
  const handleLinkClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
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
  const getLinkTypeBadgeVariant = (type: string): "default" | "secondary" | "outline" => {
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
    <Card className="overflow-hidden w-full">
      <CardHeader className="pb-2 px-3">
        <div className="flex justify-between items-start w-full">
          <div className="flex items-start overflow-hidden max-w-[75%]">
            {link.image ? (
              <div className="mr-2 flex-shrink-0">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={link.image} alt={link.title} />
                  <AvatarFallback>
                    {link.linkType === 'friend' ? 'FR' : link.linkType === 'sponsor' ? 'SP' : 'AF'}
                  </AvatarFallback>
                </Avatar>
              </div>
            ) : (
              <div className="mr-2 flex-shrink-0">
                <Avatar className="h-9 w-9">
                  <AvatarFallback>
                    {link.linkType === 'friend' ? 'FR' : link.linkType === 'sponsor' ? 'SP' : 'AF'}
                  </AvatarFallback>
                </Avatar>
              </div>
            )}
            <div className="min-w-0 overflow-hidden">
              <CardTitle className="text-base truncate">{link.title}</CardTitle>
              <div className="flex items-center gap-1 mt-1 flex-wrap">
                <Badge variant={getLinkTypeBadgeVariant(link.linkType)} className="text-xs py-0 h-5">
                  <div className="flex items-center">
                    {getLinkTypeIcon(link.linkType)}
                    <span className="truncate">{getLinkTypeName(link.linkType)}</span>
                  </div>
                </Badge>
                {link.referenceCompany && (
                  <Badge variant="outline" className="truncate max-w-[100px] text-xs py-0 h-5">
                    <Briefcase className="h-3 w-3 mr-1 flex-shrink-0" />
                    <span className="truncate">{link.referenceCompany}</span>
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
      <CardContent className="pb-2 px-3 pt-1">
        {link.description && (
          <p className="text-xs text-muted-foreground mb-2 break-words line-clamp-2">
            {link.description}
          </p>
        )}
        <div className="flex items-center gap-1 bg-muted p-1.5 rounded-md cursor-pointer overflow-hidden hover:bg-muted/80 transition-colors" 
          onClick={() => handleLinkClick(link.url)}>
          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <a 
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono truncate flex-1 hover:underline text-primary min-w-0"
            onClick={(e) => e.stopPropagation()}
          >
            {link.url}
          </a>
          <div className="flex-shrink-0">
            <Button 
              variant="outline" 
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onCopy(link);
              }}
              className="h-6 w-6 p-0"
            >
              {isCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center text-xs text-muted-foreground px-3 py-1.5">
        <div className="flex items-center">
          <BarChart3 className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
          {link.clicks} clicks
        </div>
        <div className="truncate max-w-[45%]">
          Created {new Date(link.createdAt).toLocaleDateString()}
        </div>
      </CardFooter>
    </Card>
  );
};

export default ReferralLinks;