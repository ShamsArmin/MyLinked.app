import React, { useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { usePlatformIcons } from "@/hooks/use-platform-icons";
import { getThemeColors } from "@/hooks/use-theme";
import { stripLinkUrl } from "@/lib/link-utils";
import MyLinks, { LinkItem } from "@/components/my-links";

import {
  ExternalLink,
  MapPin,
  Users,
  Eye,
  Star,
  Award,
  MessageCircle,
  Play,
  Activity,
  Heart,
  Share2,
  Copy,
  Plus,
  Send,
  X,
  Mail,
  Phone,
  Briefcase,
  User,
  Link as LinkIcon,
  UserPlus,
  Tag,
  ImageIcon,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Globe,
  QrCode,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Flag,
  AlertTriangle
} from "lucide-react";

import { useState } from "react";
import { PitchModeLayout } from "@/components/pitch-mode-layout";
import { ShareProfileDialog } from "@/components/share-profile-dialog";

export default function VisitorProfileNew() {
  const { username } = useParams();
  const [, navigate] = useLocation();
  const { getPlatformConfig } = usePlatformIcons();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [audioPlaying, setAudioPlaying] = useState<string | null>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showSocialScoreDialog, setShowSocialScoreDialog] = useState(false);
  const [showWelcomeMessageDialog, setShowWelcomeMessageDialog] = useState(false);
  const [showReferralDialog, setShowReferralDialog] = useState(false);

  const [isPhoneDialogOpen, setIsPhoneDialogOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");

  const [showReportDialog, setShowReportDialog] = useState(false);
  const [bioDetailsExpanded, setBioDetailsExpanded] = useState(false);
  const [referralForm, setReferralForm] = useState({
    name: '',
    email: '',
    phone: '',
    website: '',
    fieldOfWork: '',
    description: '',
    linkTitle: '',
    linkUrl: ''
  });
  const [reportForm, setReportForm] = useState({
    reporterName: '',
    reporterEmail: '',
    reason: '',
    description: ''
  });

  // Collaboration request state
  const [showCollaborationDialog, setShowCollaborationDialog] = useState(false);
  const [collaborationForm, setCollaborationForm] = useState({
    name: '',
    email: '',
    phone: '',
    fieldOfWork: '',
    message: ''
  });


  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/profile", username],
    queryFn: async () => {
      const response = await fetch(`/api/profile/${username}`);
      if (!response.ok) {
        throw new Error('Profile not found');
      }
      const data = await response.json();
      console.log('Profile data received:', {
        hasImage: !!data.profile.profileImage,
        imageLength: data.profile.profileImage?.length,
        imageStart: data.profile.profileImage?.substring(0, 50)
      });
      return data;
    },
    enabled: !!username,
  });

  // Apply the profile's theme when data is loaded
  useEffect(() => {
    if (data?.profile) {
      const { theme = 'default', darkMode } = data.profile;
      const themeColors = getThemeColors(theme);
      document.documentElement.classList.toggle('dark', !!darkMode);
      document.documentElement.style.setProperty('--primary', themeColors.primary);
      document.documentElement.style.setProperty('--secondary', themeColors.secondary);
      document.documentElement.style.setProperty('--accent', themeColors.accent);
      document.documentElement.style.setProperty('--background', themeColors.background);
      document.documentElement.style.setProperty('--foreground', themeColors.foreground);
      document.documentElement.style.setProperty('--border', themeColors.border);
      document.body.className = '';
      document.body.classList.add(`theme-${theme}`);
    }
  }, [data?.profile]);

  // Collaboration request handler
  const handleSubmitCollaborationRequest = async () => {
    // Check if user is authenticated
    if (!currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please log in to send collaboration requests.",
        variant: "destructive",
      });
      // Redirect to login page
      setTimeout(() => {
        navigate('/auth');
      }, 2000);
      return;
    }

    // Validate required fields
    if (!collaborationForm.name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter your name.",
        variant: "destructive",
      });
      return;
    }

    if (!collaborationForm.email.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    if (!collaborationForm.fieldOfWork.trim()) {
      toast({
        title: "Field of Work Required",
        description: "Please enter your field of work.",
        variant: "destructive",
      });
      return;
    }

    if (!collaborationForm.message.trim()) {
      toast({
        title: "Message Required",
        description: "Please enter a message for your collaboration request.",
        variant: "destructive",
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(collaborationForm.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/collaboration-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiverId: profile.id,
          name: collaborationForm.name.trim(),
          email: collaborationForm.email.trim(),
          phone: collaborationForm.phone.trim() || null,
          fieldOfWork: collaborationForm.fieldOfWork.trim(),
          message: collaborationForm.message.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          toast({
            title: "Authentication Required",
            description: "Please log in to send collaboration requests.",
            variant: "destructive",
          });
          setTimeout(() => {
            navigate('/auth');
          }, 2000);
          return;
        }
        throw new Error(errorData.error || 'Failed to send collaboration request');
      }

      toast({
        title: "Request Sent!",
        description: `Your collaboration request has been sent to ${profile.name || profile.username}.`,
      });

      setShowCollaborationDialog(false);
      setCollaborationForm({ 
        name: '',
        email: '',
        phone: '',
        fieldOfWork: '',
        message: '' 
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send collaboration request. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLinkClick = async (linkId: number, url: string, platform: string) => {
    console.log('Link clicked:', { linkId, url, platform });

    try {
      await fetch(`/api/links/${linkId}/click`, { method: 'POST' });
    } catch (error) {
      console.error('Failed to record click:', error);
    }

    if (platform === 'phone') {
      setPhoneNumber(stripLinkUrl(platform, url));
      setIsPhoneDialogOpen(true);
      return;
    }

    if (platform === 'email') {
      setEmailAddress(stripLinkUrl(platform, url));
      setIsEmailDialogOpen(true);
      return;
    }

    let finalUrl = url;
    if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
      finalUrl = `https://${url}`;
    }

    if (finalUrl) {
      const newWindow = window.open(finalUrl, '_blank');
      if (!newWindow) {
        window.location.href = finalUrl;
      }
    } else {
      console.error('No URL provided for link');
    }
  };

  const handleCopyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copied!',
        description: 'Copied to clipboard',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to copy to clipboard',
        variant: 'destructive',
      });
    }
  };

  const handleAudioPlay = (audioId: string) => {
    setAudioPlaying(audioId);
  };

  const handleAudioEnd = () => {
    setAudioPlaying(null);
  };

  // Social sharing functions - now opens the proper share dialog
  const shareProfile = (platform: string) => {
    // Open the ShareProfileDialog for all sharing options including QR code
    setShowShareDialog(true);
  };

  // Form submission handlers
  const handleReferralSubmit = async () => {
    console.log('Referral form submit clicked');
    console.log('Form data:', referralForm);

    // Validation
    if (
      !referralForm.name ||
      !referralForm.email ||
      !referralForm.fieldOfWork ||
      !referralForm.description ||
      !referralForm.linkTitle ||
      !referralForm.linkUrl
    ) {
      toast({
        title: "Missing required fields",
        description:
          "Please fill in your name, email, field of work, description, link title, and link URL.",
        variant: "destructive",
      });
      return;
    }

    try {
      const requestData = {
        requesterName: referralForm.name,
        requesterEmail: referralForm.email,
        requesterPhone: referralForm.phone,
        requesterWebsite: referralForm.website,
        fieldOfWork: referralForm.fieldOfWork,
        description: referralForm.description,
        linkTitle: referralForm.linkTitle,
        linkUrl: referralForm.linkUrl,
        targetUserId: parseInt(data?.profile.id, 10)
      };

      console.log('Sending request data:', requestData);
      const token = (window as any).getAccessTokenFromClientState?.();

      const response = await fetch('/api/referral-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify(requestData),
      });

      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 401) {
          toast({
            title: 'Please sign in to submit a referral.',
            variant: 'destructive',
          });
          return;
        }
        if (response.status === 422 && responseData?.errors?.[0]?.message) {
          toast({
            title: 'Invalid request',
            description: responseData.errors[0].message,
            variant: 'destructive',
          });
          return;
        }
        toast({
          title: 'Error',
          description: responseData?.message || `Request failed (${response.status})`,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Request sent!',
        description: 'Your referral link request has been submitted.',
      });
      setShowReferralDialog(false);
      setReferralForm({
        name: '',
        email: '',
        phone: '',
        website: '',
        fieldOfWork: '',
        description: '',
        linkTitle: '',
        linkUrl: '',
      });
    } catch (error) {
      console.error('Error sending referral request:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit request. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleReportSubmit = async () => {
    console.log('Report form submit clicked');
    console.log('Form data:', reportForm);

    // Validation
    if (!reportForm.reason || !reportForm.description) {
      toast({
        title: "Missing required fields",
        description: "Please select a reason and provide a description.",
        variant: "destructive",
      });
      return;
    }

    try {
      const requestData = {
        reporterName: reportForm.reporterName,
        reporterEmail: reportForm.reporterEmail,
        reportedUserId: data?.profile.id,
        reportedUsername: data?.profile.username,
        reason: reportForm.reason,
        description: reportForm.description,
      };

      console.log('Sending report request:', requestData);

      const response = await fetch('/api/user-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit report');
      }

      const result = await response.json();
      console.log('Report submitted successfully:', result);

      toast({
        title: "Report submitted",
        description: "Thank you for your report. Our team will review it shortly.",
      });

      // Reset form and close dialog
      setReportForm({
        reporterName: '',
        reporterEmail: '',
        reason: '',
        description: ''
      });
      setShowReportDialog(false);

    } catch (error) {
      console.error('Error submitting report:', error);
      toast({
        title: "Error submitting report",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    }
  };



  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !data?.profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Profile Not Found</h1>
          <p className="text-muted-foreground mb-6">The profile you're looking for doesn't exist.</p>
          <Button
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  const { profile, links = [], spotlightProjects = [], referralLinks = [], skills = [] } = data;

  const platformNames: { [key: string]: string } = {
    linkedin: "LinkedIn",
    instagram: "Instagram",
    twitter: "Twitter",
    facebook: "Facebook",
    tiktok: "TikTok",
    youtube: "YouTube",
    github: "GitHub",
    website: "Website",
    email: "Email",
    phone: "Phone",
  };

  const getDisplayName = (platform: string, title: string) => {
    const name = platformNames[platform.toLowerCase()];
    return name || (title.length > 10 ? title.substring(0, 10) + "..." : title);
  };

  const linkItems: LinkItem[] = links.map((link) => {
    const platformConfig = getPlatformConfig(link.platform);
    const IconComponent = platformConfig?.icon;
    return {
      id: String(link.id),
      label: getDisplayName(link.platform, link.title),
      url: link.url,
      icon: IconComponent ? (
        <IconComponent
          className="h-6 w-6"
          style={{ color: platformConfig.color }}
        />
      ) : null,
      platform: link.platform,
    };
  });

  // Check if pitch mode is enabled
  if (profile.pitchMode) {
    return <PitchModeLayout 
      profile={profile} 
      links={links} 
      spotlightProjects={spotlightProjects} 
      referralLinks={referralLinks} 
    />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Join MyLinked Button - Fixed Position */}
      <div className="fixed top-4 right-4 z-50">
        <Button
          onClick={() => window.location.href = 'https://www.mylinked.app'}
          className="group px-6 py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-full"
        >
          <span className="mr-2">Join</span>
          <img 
            src="/assets/logo-compact.png" 
            alt="MyLinked" 
            className="h-8 w-8 inline-block"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling!.style.display = 'inline';
            }}
          />
          <span style={{ display: 'none' }} className="font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            MyLinked
          </span>
          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>

      <div className="container mx-auto px-2 sm:px-4 py-8 max-w-6xl">
        {/* Top Grid - Profile Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8">
          {/* Left Card - Profile Image & Background */}
          <Card className="relative overflow-hidden bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-white/50 dark:border-gray-600/50 shadow-xl">
            {/* Background Image */}
            <div 
              className={`absolute inset-0 ${profile.profileBackground ? '' : 'bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400'}`}
              style={{
                backgroundImage: profile.profileBackground ? `url(${profile.profileBackground})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            />

            {/* Overlay */}
            <div className="absolute inset-0 bg-black/20" />

            <CardContent className="relative z-10 p-4 min-h-[200px] flex items-center justify-center">
              {/* Profile Avatar and Username - Centered */}
              <div className="flex flex-col items-center gap-3">
                {/* Username Badge - More transparent */}
                <div className="flex justify-center">
                  <Badge variant="secondary" className="bg-white/70 dark:bg-gray-700/70 text-gray-800 dark:text-gray-200 px-4 py-2 text-sm font-medium">
                    @{profile.username}
                  </Badge>
                </div>

                {/* Profile Avatar - 2x bigger */}
                <div className="relative">
                  {profile.profileImage ? (
                    <img 
                      src={profile.profileImage} 
                      alt={profile.name || profile.username}
                      className="h-32 w-32 rounded-full border-4 border-white shadow-xl object-cover"
                      onLoad={() => {
                        console.log('Profile image loaded successfully');
                      }}
                      onError={(e) => {
                        console.error('Profile image failed to load, showing fallback');
                        console.log('Image src length:', profile.profileImage?.length);
                        console.log('Image src start:', profile.profileImage?.substring(0, 100));
                        const fallbackElement = e.currentTarget.parentElement?.querySelector('.avatar-fallback');
                        if (fallbackElement) {
                          e.currentTarget.style.display = 'none';
                          (fallbackElement as HTMLElement).style.display = 'flex';
                        }
                      }}
                    />
                  ) : null}
                  <div 
                    className="avatar-fallback h-32 w-32 rounded-full border-4 border-white shadow-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white flex items-center justify-center text-3xl font-bold"
                    style={{ display: profile.profileImage ? 'none' : 'flex' }}
                  >
                    {profile.name?.charAt(0) || profile.username?.charAt(0)}
                  </div>
                </div>

                {/* Three Icons Below Profile */}
                <div className="flex gap-4 mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowShareDialog(true)}
                    className="p-2 bg-white/80 hover:bg-white/90 dark:bg-gray-700/80 dark:hover:bg-gray-600/90 rounded-full shadow-md"
                  >
                    <Share2 className="h-5 w-5 text-blue-600" />
                  </Button>
                  {/* Only show Social Score button if user has enabled it */}
                  {profile.showSocialScore && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSocialScoreDialog(true)}
                      className="p-2 bg-white/80 hover:bg-white/90 dark:bg-gray-700/80 dark:hover:bg-gray-600/90 rounded-full shadow-md"
                    >
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowWelcomeMessageDialog(true)}
                    className="p-2 bg-white/80 hover:bg-white/90 dark:bg-gray-700/80 dark:hover:bg-gray-600/90 rounded-full shadow-md"
                  >
                    <MessageCircle className="h-5 w-5 text-pink-600" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right Card - Bio & Details */}
          <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-white/50 dark:border-gray-600/50 shadow-xl">
            <CardHeader className="rounded-t-lg card-header-themed">
              <CardTitle 
                className="text-lg sm:text-xl text-gray-800 dark:text-gray-200 flex items-center justify-between sm:cursor-default cursor-pointer"
                onClick={(e) => {
                  // Only allow clicks on mobile screens
                  if (window.innerWidth >= 640) return;
                  setBioDetailsExpanded(!bioDetailsExpanded);
                }}
              >
                <span>Bio & Details</span>
                {/* Show chevron only on mobile */}
                <div className="sm:hidden">
                  {bioDetailsExpanded ? (
                    <ChevronDown className="h-5 w-5 text-gray-600" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-600" />
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            {/* Always show on desktop (sm and up), conditionally show on mobile */}
            <div className={`sm:block ${bioDetailsExpanded ? 'block' : 'hidden'}`}>
              <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                {/* Full Name & Profession */}
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">Full Name</h3>
                    <p className="text-gray-600">{profile.name}</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">Profession</h3>
                    <p className="text-gray-600 flex items-center">
                      <Briefcase className="h-4 w-4 mr-2" />
                      {profile.profession || 'Not specified'}
                    </p>
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Bio</h3>
                  <p className="text-gray-600 leading-relaxed">
                    {profile.bio || 'No bio available'}
                  </p>
                </div>
              </CardContent>
            </div>
          </Card>
        </div>

        {/* My Links Section */}
        <Card className="mb-8 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-white/50 dark:border-gray-600/50 shadow-xl">
          <CardHeader className="rounded-t-lg card-header-themed">
            <CardTitle className="text-lg sm:text-xl text-gray-800 dark:text-gray-200">My Links</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <MyLinks
              links={linkItems}
              onLinkClick={(item) =>
                handleLinkClick(Number(item.id), item.url, item.platform || "")
              }
            />
          </CardContent>
        </Card>

        {/* Bottom Grid - Three Sections */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Referral Links */}
          <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-white/50 dark:border-gray-600/50 shadow-xl">
            <CardHeader className="rounded-t-lg card-header-themed">
              <CardTitle className="text-lg text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <LinkIcon className="h-5 w-5" />
                Referral Links
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {referralLinks && referralLinks.length > 0 ? (
                <div className="space-y-3 mb-4">
                  {referralLinks.slice(0, 3).map((link) => (
                    <div key={link.id} className="p-3 rounded-lg border bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-medium text-white bg-blue-500 px-2 py-1 rounded">
                              {link.linkType?.toUpperCase() || 'REFERRAL'}
                            </span>
                            {link.referenceCompany && (
                              <span className="text-xs text-gray-500 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">
                                {link.referenceCompany}
                              </span>
                            )}
                          </div>
                          <h4 className="font-semibold text-sm text-gray-800 dark:text-gray-200 mb-1">{link.title}</h4>
                          {link.description && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 break-words">{link.description}</p>
                          )}
                          <div className="flex items-center gap-2">
                            <ExternalLink className="h-3 w-3 text-blue-500" />
                            <span className="text-xs text-blue-600 hover:text-blue-800 truncate cursor-pointer" 
                                  onClick={() => window.open(link.url, '_blank')}>
                              {link.url.length > 30 ? link.url.substring(0, 30) + '...' : link.url}
                            </span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="flex-shrink-0 ml-2 hover:bg-blue-50"
                          onClick={() => window.open(link.url, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 text-blue-500" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {/* Show more links if there are more than 3 */}
                  {referralLinks.length > 3 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="w-full hover:bg-blue-50 border-blue-200 flex items-center gap-2"
                        >
                          <span>View {referralLinks.length - 3} more referral links</span>
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-80 max-h-80 overflow-y-auto">
                        <div className="p-4 space-y-3">
                          {referralLinks.slice(3).map((link) => (
                            <div key={link.id} className="p-3 rounded-lg border bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                              <div className="flex justify-between items-start">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xs font-medium text-white bg-blue-500 px-2 py-1 rounded">
                                      {link.linkType?.toUpperCase() || 'REFERRAL'}
                                    </span>
                                    {link.referenceCompany && (
                                      <span className="text-xs text-gray-500 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">
                                        {link.referenceCompany}
                                      </span>
                                    )}
                                  </div>
                                  <h4 className="font-semibold text-sm text-gray-800 dark:text-gray-200 mb-1">{link.title}</h4>
                                  {link.description && (
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 break-words">{link.description}</p>
                                  )}
                                  <div className="flex items-center gap-2">
                                    <ExternalLink className="h-3 w-3 text-blue-500" />
                                    <span className="text-xs text-blue-600 hover:text-blue-800 truncate cursor-pointer" 
                                          onClick={() => window.open(link.url, '_blank')}>
                                      {link.url.length > 30 ? link.url.substring(0, 30) + '...' : link.url}
                                    </span>
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="flex-shrink-0 ml-2 hover:bg-blue-50"
                                  onClick={() => window.open(link.url, '_blank')}
                                >
                                  <ExternalLink className="h-4 w-4 text-blue-500" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <LinkIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 mb-4">No referral links available yet.</p>
                </div>
              )}

              <Dialog open={showReferralDialog} onOpenChange={setShowReferralDialog}>
                <DialogTrigger asChild>
                  <Button
                    className="w-full bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--secondary))] hover:opacity-90 text-primary-foreground"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Request to Add My Link
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Plus className="h-5 w-5" />
                      Request to Add My Link
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    <p className="text-sm text-gray-600">
                      Request to add your link to {profile.name || profile.username}'s referral section
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="ref-name">Your Name *</Label>
                        <Input
                          id="ref-name"
                          value={referralForm.name}
                          onChange={(e) => setReferralForm({...referralForm, name: e.target.value})}
                          placeholder="Enter your full name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="ref-email">Email *</Label>
                        <Input
                          id="ref-email"
                          type="email"
                          value={referralForm.email}
                          onChange={(e) => setReferralForm({...referralForm, email: e.target.value})}
                          placeholder="your@email.com"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="ref-phone">Phone</Label>
                        <Input
                          id="ref-phone"
                          value={referralForm.phone}
                          onChange={(e) => setReferralForm({...referralForm, phone: e.target.value})}
                          placeholder="Your phone number"
                        />
                      </div>
                      <div>
                        <Label htmlFor="ref-website">Website</Label>
                        <Input
                          id="ref-website"
                          value={referralForm.website}
                          onChange={(e) => setReferralForm({...referralForm, website: e.target.value})}
                          placeholder="https://yourwebsite.com"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="ref-field">Field of Work *</Label>
                      <Input
                        id="ref-field"
                        value={referralForm.fieldOfWork}
                        onChange={(e) => setReferralForm({...referralForm, fieldOfWork: e.target.value})}
                        placeholder="e.g., Web Development, Marketing, Design"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="ref-link-title">Link Title *</Label>
                        <Input
                          id="ref-link-title"
                          value={referralForm.linkTitle}
                          onChange={(e) => setReferralForm({...referralForm, linkTitle: e.target.value})}
                          placeholder="e.g., My Portfolio, My Service"
                        />
                      </div>
                      <div>
                        <Label htmlFor="ref-link-url">Link URL *</Label>
                        <Input
                          id="ref-link-url"
                          value={referralForm.linkUrl}
                          onChange={(e) => setReferralForm({...referralForm, linkUrl: e.target.value})}
                          placeholder="https://example.com"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="ref-description">Description</Label>
                      <Textarea
                        id="ref-description"
                        value={referralForm.description}
                        onChange={(e) => setReferralForm({...referralForm, description: e.target.value})}
                        placeholder="Tell us about your work and why you'd like to be referred..."
                        rows={3}
                      />
                    </div>

                    <Button
                      onClick={handleReferralSubmit}
                      className="w-full bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--secondary))] hover:opacity-90 text-primary-foreground"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Submit Request
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Connect & Collaborate */}
          <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-white/50 dark:border-gray-600/50 shadow-xl">
            <CardHeader className="rounded-t-lg card-header-themed">
              <CardTitle className="text-lg text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Connect & Collaborate
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="text-center">
                  <Avatar className="h-16 w-16 mx-auto mb-3 border-2 border-blue-200">
                    <AvatarImage src={profile.profileImage} alt={profile.name} />
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                      {profile.name?.charAt(0) || profile.username?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-sm text-gray-600 mb-4">
                    Interested in collaborating? Let's connect!
                  </p>
                </div>

                {/* Skills Button */}
                <div className="mb-4">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full hover:bg-blue-50 border-blue-200"
                      >
                        <Briefcase className="h-4 w-4 mr-2" />
                        My Skills
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Briefcase className="h-5 w-5" />
                          {profile.name || profile.username}'s Skills
                        </DialogTitle>
                      </DialogHeader>
                      {skills.length > 0 ? (
                        <div className="space-y-3 max-h-80 overflow-y-auto">
                          {skills.map((skill, idx) => {
                            const skillName =
                              typeof skill === "string"
                                ? skill
                                : skill.skill || skill.name;
                            const level =
                              typeof skill === "string" ? undefined : skill.level;
                            const description =
                              typeof skill === "string"
                                ? undefined
                                : skill.description;
                            const years =
                              typeof skill === "string"
                                ? undefined
                                : skill.yearsOfExperience;
                            return (
                              <div
                                key={skill.id || skillName || idx}
                                className="p-3 rounded-lg border bg-gray-50 border-gray-200"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <h5 className="font-medium">{skillName}</h5>
                                  {level && (
                                    <Badge variant="secondary" className="text-xs">
                                      Level {level}
                                    </Badge>
                                  )}
                                </div>
                                {description && (
                                  <p className="text-sm text-gray-600 mb-1">{description}</p>
                                )}
                                {years && (
                                  <p className="text-xs text-gray-500">{years} years experience</p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600">No skills added yet.</p>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Collaboration Request Button */}
                <Dialog open={showCollaborationDialog} onOpenChange={setShowCollaborationDialog}>
                  <DialogTrigger asChild>
                    <Button className="w-full bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--secondary))] hover:opacity-90 text-primary-foreground">
                      <Send className="h-4 w-4 mr-2" />
                      {currentUser ? 'Send Collaboration Request' : 'Login to Collaborate'}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5" />
                        Send Collaboration Request
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      {currentUser ? (
                        <>
                          <p className="text-sm text-gray-600 mb-4">
                            Send a collaboration request to {profile.name || profile.username} to connect and work together.
                          </p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="collaboration-name">Name *</Label>
                              <Input
                                id="collaboration-name"
                                placeholder="Your full name"
                                value={collaborationForm.name}
                                onChange={(e) => setCollaborationForm({ ...collaborationForm, name: e.target.value })}
                                className="mt-1"
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor="collaboration-email">Email *</Label>
                              <Input
                                id="collaboration-email"
                                type="email"
                                placeholder="your.email@example.com"
                                value={collaborationForm.email}
                                onChange={(e) => setCollaborationForm({ ...collaborationForm, email: e.target.value })}
                                className="mt-1"
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor="collaboration-phone">Phone (Optional)</Label>
                              <Input
                                id="collaboration-phone"
                                type="tel"
                                placeholder="+1 (555) 123-4567"
                                value={collaborationForm.phone}
                                onChange={(e) => setCollaborationForm({ ...collaborationForm, phone: e.target.value })}
                                className="mt-1"
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor="collaboration-field">Field of Work *</Label>
                              <Input
                                id="collaboration-field"
                                placeholder="e.g., Software Development"
                                value={collaborationForm.fieldOfWork}
                                onChange={(e) => setCollaborationForm({ ...collaborationForm, fieldOfWork: e.target.value })}
                                className="mt-1"
                              />
                            </div>
                          </div>
                          
                          <div className="mt-4">
                            <Label htmlFor="collaboration-message">Message *</Label>
                            <Textarea
                              id="collaboration-message"
                              placeholder="Hi! I'd love to collaborate on a project together. Let me know if you're interested..."
                              value={collaborationForm.message}
                              onChange={(e) => setCollaborationForm({ ...collaborationForm, message: e.target.value })}
                              className="mt-1"
                              rows={4}
                            />
                          </div>
                          
                          <div className="flex gap-3 pt-4">
                            <Button 
                              variant="outline" 
                              onClick={() => setShowCollaborationDialog(false)}
                              className="flex-1"
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handleSubmitCollaborationRequest}
                              className="flex-1 bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--secondary))] hover:opacity-90 text-primary-foreground"
                              disabled={!collaborationForm.name.trim() || !collaborationForm.email.trim() || !collaborationForm.fieldOfWork.trim() || !collaborationForm.message.trim()}
                            >
                              <Send className="h-4 w-4 mr-2" />
                              Send Request
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="text-sm text-gray-600">
                            You need to be logged in to send collaboration requests to {profile.name || profile.username}.
                          </p>
                          
                          <div className="flex gap-3 pt-4">
                            <Button 
                              variant="outline" 
                              onClick={() => setShowCollaborationDialog(false)}
                              className="flex-1"
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={() => {
                                setShowCollaborationDialog(false);
                                navigate('/auth');
                              }}
                              className="flex-1 bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--secondary))] hover:opacity-90 text-primary-foreground"
                            >
                              <User className="h-4 w-4 mr-2" />
                              Go to Login
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>

              </div>
            </CardContent>
          </Card>

          {/* Collaborative Spotlight */}
          <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-white/50 dark:border-gray-600/50 shadow-xl">
            <CardHeader className="rounded-t-lg card-header-themed">
              <CardTitle className="text-lg text-gray-800 dark:text-gray-200">Collaborative Spotlight</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {spotlightProjects.slice(0, 2).map((project) => (
                  <div key={project.id} className="group">
                    <div className="relative overflow-hidden rounded-lg mb-3">
                      {project.thumbnail ? (
                        <img 
                          src={project.thumbnail} 
                          alt={project.title}
                          className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-32 bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-white" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all duration-300" />
                      <div className="absolute bottom-2 left-2 right-2">
                        <h4 className="font-medium text-white text-sm">{project.title}</h4>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {Array.isArray(project.tags) && project.tags.slice(0, 2).map((tag, index) => (
                            <Badge key={index} variant="secondary" className="bg-white/90 dark:bg-gray-600/90 text-gray-800 dark:text-gray-200 text-xs">
                              {typeof tag === 'string' ? tag : (tag?.label || tag?.name || 'Tag')}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Project Actions */}
                    <div className="flex gap-2 mb-2">
                      <Button 
                        size="sm" 
                        className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                        onClick={() => window.open(project.url, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Visit
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="outline" className="px-3">
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-80">
                          <div className="p-4 space-y-3">
                            <div>
                              <h4 className="font-semibold text-base mb-2">{project.title}</h4>
                              {project.description && (
                                <p className="text-sm text-gray-600 mb-3">{project.description}</p>
                              )}
                            </div>

                            {/* All Tags */}
                            {Array.isArray(project.tags) && project.tags.length > 0 && (
                              <div>
                                <h5 className="font-medium text-sm mb-2">Tags:</h5>
                                <div className="flex flex-wrap gap-1">
                                  {project.tags.map((tag, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs">
                                      {typeof tag === 'string' ? tag : (tag?.label || tag?.name || 'Tag')}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Contributors */}
                            {Array.isArray(project.contributors) && project.contributors.length > 0 && (
                              <div>
                                <h5 className="font-medium text-sm mb-2">Contributors:</h5>
                                <div className="space-y-1">
                                  {project.contributors.map((contributor, index) => (
                                    <div key={index} className="text-xs text-gray-600 flex items-center gap-2">
                                      <User className="h-3 w-3" />
                                      <span>{contributor.name}</span>
                                      {contributor.role && (
                                        <Badge variant="outline" className="text-xs">
                                          {contributor.role}
                                        </Badge>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Stats */}
                            <div className="flex gap-4 text-xs text-gray-500 pt-2 border-t">
                              <div className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                <span>{project.viewCount || 0} views</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <ExternalLink className="h-3 w-3" />
                                <span>{project.clickCount || 0} clicks</span>
                              </div>
                            </div>
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}

                {/* Show more projects if there are more than 2 */}
                {spotlightProjects.length > 2 && (
                  <details className="group">
                    <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2">
                      <span>View {spotlightProjects.length - 2} more projects</span>
                      <ChevronDown className="h-4 w-4 group-open:rotate-180 transition-transform" />
                    </summary>
                    <div className="mt-3 space-y-4">
                      {spotlightProjects.slice(2).map((project) => (
                        <div key={project.id} className="group">
                          <div className="relative overflow-hidden rounded-lg mb-3">
                            {project.thumbnail ? (
                              <img 
                                src={project.thumbnail} 
                                alt={project.title}
                                className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-32 bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center">
                                <ImageIcon className="h-8 w-8 text-white" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all duration-300" />
                            <div className="absolute bottom-2 left-2 right-2">
                              <h4 className="font-medium text-white text-sm">{project.title}</h4>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {Array.isArray(project.tags) && project.tags.slice(0, 2).map((tag, index) => (
                                  <Badge key={index} variant="secondary" className="bg-white/90 dark:bg-gray-600/90 text-gray-800 dark:text-gray-200 text-xs">
                                    {typeof tag === 'string' ? tag : (tag?.label || tag?.name || 'Tag')}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Project Actions */}
                          <div className="flex gap-2 mb-2">
                            <Button 
                              size="sm" 
                              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                              onClick={() => window.open(project.url, '_blank')}
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Visit
                            </Button>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="outline" className="px-3">
                                  <MoreHorizontal className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="w-80">
                                <div className="p-4 space-y-3">
                                  <div>
                                    <h4 className="font-semibold text-base mb-2">{project.title}</h4>
                                    {project.description && (
                                      <p className="text-sm text-gray-600 mb-3">{project.description}</p>
                                    )}
                                  </div>

                                  {/* All Tags */}
                                  {Array.isArray(project.tags) && project.tags.length > 0 && (
                                    <div>
                                      <h5 className="font-medium text-sm mb-2">Tags:</h5>
                                      <div className="flex flex-wrap gap-1">
                                        {project.tags.map((tag, index) => (
                                          <Badge key={index} variant="secondary" className="text-xs">
                                            {typeof tag === 'string' ? tag : (tag?.label || tag?.name || 'Tag')}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Contributors */}
                                  {Array.isArray(project.contributors) && project.contributors.length > 0 && (
                                    <div>
                                      <h5 className="font-medium text-sm mb-2">Contributors:</h5>
                                      <div className="space-y-1">
                                        {project.contributors.map((contributor, index) => (
                                          <div key={index} className="text-xs text-gray-600 flex items-center gap-2">
                                            <User className="h-3 w-3" />
                                            <span>{contributor.name}</span>
                                            {contributor.role && (
                                              <Badge variant="outline" className="text-xs">
                                                {contributor.role}
                                              </Badge>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Stats */}
                                  <div className="flex gap-4 text-xs text-gray-500 pt-2 border-t">
                                    <div className="flex items-center gap-1">
                                      <Eye className="h-3 w-3" />
                                      <span>{project.viewCount || 0} views</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <ExternalLink className="h-3 w-3" />
                                      <span>{project.clickCount || 0} clicks</span>
                                    </div>
                                  </div>
                                </div>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Share Profile Dialog - Using proper ShareProfileDialog component */}
      <ShareProfileDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        username={username || ''}
      />

      {/* Phone Dialog */}
      <Dialog open={isPhoneDialogOpen} onOpenChange={setIsPhoneDialogOpen}>
        <DialogContent className="sm:max-w-[300px]">
          <DialogHeader>
            <DialogTitle>Phone Number</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center flex items-center justify-center gap-2">
            <a href={`tel:${phoneNumber}`} className="text-xl font-semibold">
              {phoneNumber}
            </a>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleCopyText(phoneNumber)}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setIsPhoneDialogOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Email Dialog */}
      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent className="sm:max-w-[300px]">
          <DialogHeader>
            <DialogTitle>Email Address</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center flex items-center justify-center gap-2">
            <a href={`mailto:${emailAddress}`} className="text-xl font-semibold">
              {emailAddress}
            </a>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleCopyText(emailAddress)}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setIsEmailDialogOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Social Score Dialog - Only show if user has enabled it */}
      {profile.showSocialScore && (
        <Dialog open={showSocialScoreDialog} onOpenChange={setShowSocialScoreDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Social Score</DialogTitle>
            </DialogHeader>
          <div className="p-4 space-y-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">
                {profile.socialScore || 0}
              </div>
              <p className="text-gray-600">Current Social Score</p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Profile Completeness</span>
                <span className="text-sm font-medium">85%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Link Engagement</span>
                <span className="text-sm font-medium">72%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Social Connections</span>
                <span className="text-sm font-medium">68%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Content Quality</span>
                <span className="text-sm font-medium">91%</span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
              <p className="text-sm text-gray-700">
                Social Score reflects overall profile engagement and quality. 
                Higher scores indicate better visibility and professional presence.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      )}

      {/* Welcome Message Dialog */}
      <Dialog open={showWelcomeMessageDialog} onOpenChange={setShowWelcomeMessageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Welcome Message</DialogTitle>
          </DialogHeader>
          <div className="p-4 space-y-4">
            {profile.welcomeMessage ? (
              <div className="space-y-3">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-gray-800 mb-2">Personal Welcome</h3>
                  <p className="text-gray-700 leading-relaxed">
                    {profile.welcomeMessage}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MessageCircle className="h-4 w-4" />
                  <span>This message appears to visitors on the profile</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">No Welcome Message</h3>
                <p className="text-gray-600">
                  This user hasn't set up a welcome message yet.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>



      {/* Report User Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-red-500" />
              Report User
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-800">Report Guidelines</span>
              </div>
              <p className="text-xs text-red-700">
                Only report profiles that violate our community guidelines. False reports may result in restrictions on your ability to report users.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="reporter-name">Your Name (Optional)</Label>
                <Input
                  id="reporter-name"
                  value={reportForm.reporterName}
                  onChange={(e) => setReportForm({...reportForm, reporterName: e.target.value})}
                  placeholder="Your name"
                />
              </div>
              <div>
                <Label htmlFor="reporter-email">Email (Optional)</Label>
                <Input
                  id="reporter-email"
                  type="email"
                  value={reportForm.reporterEmail}
                  onChange={(e) => setReportForm({...reportForm, reporterEmail: e.target.value})}
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="report-reason">Reason for Report *</Label>
              <Select value={reportForm.reason} onValueChange={(value) => setReportForm({...reportForm, reason: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="harassment">Harassment or Bullying</SelectItem>
                  <SelectItem value="inappropriate_content">Inappropriate Content</SelectItem>
                  <SelectItem value="spam">Spam or Fake Links</SelectItem>
                  <SelectItem value="fake_account">Fake Account</SelectItem>
                  <SelectItem value="copyright_violation">Copyright Violation</SelectItem>
                  <SelectItem value="impersonation">Impersonation</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="report-description">Description *</Label>
              <Textarea
                id="report-description"
                value={reportForm.description}
                onChange={(e) => setReportForm({...reportForm, description: e.target.value})}
                placeholder="Please provide specific details about the issue..."
                rows={4}
              />
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setShowReportDialog(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleReportSubmit}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                disabled={!reportForm.reason || !reportForm.description}
              >
                <Flag className="h-4 w-4 mr-2" />
                Submit Report
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Footer Menu */}
      <div className="mt-8 pt-6 border-t border-gray-200 bg-gray-50/50 rounded-lg">
        <div className="flex justify-center items-center gap-6 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowShareDialog(true)}
            className="text-gray-600 hover:text-blue-600 hover:bg-blue-50"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share Profile
          </Button>
          <div className="h-4 w-px bg-gray-300" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowReportDialog(true)}
            className="text-gray-600 hover:text-red-600 hover:bg-red-50"
          >
            <Flag className="h-4 w-4 mr-2" />
            Report
          </Button>
        </div>
        <div className="text-center pb-4">
          <p className="text-xs text-gray-500">
            © 2025 MyLinked. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}