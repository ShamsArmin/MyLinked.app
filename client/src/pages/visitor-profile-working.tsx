import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

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
  ImageIcon
} from "lucide-react";
import { 
  FaInstagram, 
  FaLinkedin, 
  FaTwitter, 
  FaFacebook 
} from "react-icons/fa";
import { useState, useCallback } from "react";

export default function VisitorProfileWorking() {
  const { username } = useParams();
  const [audioPlaying, setAudioPlaying] = useState<string | null>(null);
  const [clickingLink, setClickingLink] = useState<string | null>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showReferralDialog, setShowReferralDialog] = useState(false);
  const [showCollaborationDialog, setShowCollaborationDialog] = useState(false);

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

  const [collaborationForm, setCollaborationForm] = useState({
    message: ''
  });

  const { toast } = useToast();

  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/profile", username],
    queryFn: async () => {
      const response = await fetch(`/api/profile/${username}`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Profile not found');
      }
      return response.json();
    },
    enabled: !!username,
  });



  const handleAudioPlay = (audioId: string) => {
    setAudioPlaying(audioId);
  };

  const handleAudioEnd = () => {
    setAudioPlaying(null);
  };

  // Social sharing functions
  const shareProfile = (platform: string) => {
    const url = window.location.href;
    const text = `Check out ${data?.profile.name}'s profile on MyLinked`;
    
    switch (platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`);
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`);
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        toast({
          title: "Link copied!",
          description: "Profile URL has been copied to clipboard.",
        });
        break;
    }
    setShowShareDialog(false);
  };

  // Form submission handlers
  const handleReferralSubmit = async () => {
    try {
      const response = await fetch('/api/referral-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...referralForm,
          profileUserId: parseInt(data?.profile.id, 10)
        }),
        credentials: 'include',
      });

      if (response.ok) {
        toast({
          title: "Request sent!",
          description: "Your referral link request has been sent to the profile owner.",
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
          linkUrl: ''
        });
      } else {
        throw new Error('Failed to send request');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send referral request. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Collaboration request submission function
  const handleSubmitCollaborationRequest = async () => {
    if (!collaborationForm.message.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message for your collaboration request.",
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
          message: collaborationForm.message
        }),
        credentials: 'include',
      });

      if (response.ok) {
        toast({
          title: "Success!",
          description: "Your collaboration request has been sent successfully.",
        });
        setShowCollaborationDialog(false);
        setCollaborationForm({ message: '' });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send request');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send collaboration request. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Check if user is authenticated
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Check authentication status
  const { data: authData } = useQuery({
    queryKey: ["/api/user"],
    queryFn: async () => {
      const response = await fetch('/api/user', {
        credentials: 'include',
      });
      if (response.ok) {
        const user = await response.json();
        setIsAuthenticated(true);
        setCurrentUser(user);
        return user;
      }
      setIsAuthenticated(false);
      setCurrentUser(null);
      return null;
    },
  });

  const getPlatformColor = (platform: string) => {
    const colors: { [key: string]: string } = {
      twitter: '#1da1f2',
      instagram: '#e4405f',
      linkedin: '#0077b5',
      facebook: '#1877f2',
      youtube: '#ff0000',
      tiktok: '#000000'
    };
    return colors[platform.toLowerCase()] || '#6b7280';
  };

  const getPlatformIcon = (platform: string) => {
    const platformLower = platform.toLowerCase();
    switch (platformLower) {
      case 'twitter':
        return <FaTwitter className="h-4 w-4" style={{ color: getPlatformColor(platform) }} />;
      case 'instagram':
        return <FaInstagram className="h-4 w-4" style={{ color: getPlatformColor(platform) }} />;
      case 'linkedin':
        return <FaLinkedin className="h-4 w-4" style={{ color: getPlatformColor(platform) }} />;
      case 'facebook':
        return <FaFacebook className="h-4 w-4" style={{ color: getPlatformColor(platform) }} />;
      default:
        return <Activity className="h-4 w-4" style={{ color: getPlatformColor(platform) }} />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !data?.profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Profile Not Found</h1>
          <p className="text-gray-600 mb-6">The profile you're looking for doesn't exist.</p>
          <Button onClick={() => window.location.href = '/'}>Go Home</Button>
        </div>
      </div>
    );
  }

  const { profile, links = [], spotlightProjects = [], referralLinks = [], skills = [] } = data;
  


  const getThemeStyles = () => {
    const theme = profile.theme || 'indigo';
    
    const themeMap = {
      purple: {
        gradient: 'bg-gradient-to-r from-purple-500 to-pink-500',
        primary: 'bg-purple-500',
        text: 'text-purple-600',
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        hover: 'hover:bg-purple-50'
      },
      blue: {
        gradient: 'bg-gradient-to-r from-blue-500 to-cyan-400',
        primary: 'bg-blue-500',
        text: 'text-blue-600',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        hover: 'hover:bg-blue-50'
      },
      green: {
        gradient: 'bg-gradient-to-r from-green-500 to-emerald-400',
        primary: 'bg-green-500',
        text: 'text-green-600',
        bg: 'bg-green-50',
        border: 'border-green-200',
        hover: 'hover:bg-green-50'
      },
      orange: {
        gradient: 'bg-gradient-to-r from-orange-500 to-amber-400',
        primary: 'bg-orange-500',
        text: 'text-orange-600',
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        hover: 'hover:bg-orange-50'
      },
      red: {
        gradient: 'bg-gradient-to-r from-red-500 to-rose-400',
        primary: 'bg-red-500',
        text: 'text-red-600',
        bg: 'bg-red-50',
        border: 'border-red-200',
        hover: 'hover:bg-red-50'
      },
      pink: {
        gradient: 'bg-gradient-to-r from-pink-500 to-rose-400',
        primary: 'bg-pink-500',
        text: 'text-pink-600',
        bg: 'bg-pink-50',
        border: 'border-pink-200',
        hover: 'hover:bg-pink-50'
      },
      indigo: {
        gradient: 'bg-gradient-to-r from-indigo-500 to-blue-500',
        primary: 'bg-indigo-500',
        text: 'text-indigo-600',
        bg: 'bg-indigo-50',
        border: 'border-indigo-200',
        hover: 'hover:bg-indigo-50'
      },
      teal: {
        gradient: 'bg-gradient-to-r from-teal-500 to-cyan-400',
        primary: 'bg-teal-500',
        text: 'text-teal-600',
        bg: 'bg-teal-50',
        border: 'border-teal-200',
        hover: 'hover:bg-teal-50'
      },
      yellow: {
        gradient: 'bg-gradient-to-r from-yellow-500 to-orange-400',
        primary: 'bg-yellow-500',
        text: 'text-yellow-600',
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        hover: 'hover:bg-yellow-50'
      },
      gray: {
        gradient: 'bg-gradient-to-r from-gray-500 to-slate-400',
        primary: 'bg-gray-500',
        text: 'text-gray-600',
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        hover: 'hover:bg-gray-50'
      }
    };

    return themeMap[theme as keyof typeof themeMap] || themeMap.indigo;
  };

  const themeStyles = getThemeStyles();
  const isDark = profile.darkMode;

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>
      {/* Hero Section */}
      <div className="relative h-80 overflow-hidden">
        {/* Background Layer */}
        <div className={`absolute inset-0 ${profile.profileBackground ? 'bg-cover bg-center' : themeStyles.gradient}`}
             style={profile.profileBackground ? { backgroundImage: `url(${profile.profileBackground})` } : {}}>
        </div>
        
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-40" />
        
        {/* Profile Content */}
        <div className="absolute bottom-6 left-4 right-4 sm:left-6 sm:right-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div className="flex items-end gap-3 sm:gap-4 min-w-0 flex-1">
              <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-4 border-white shadow-lg flex-shrink-0">
                <AvatarImage src={profile.profileImage} alt={profile.name} />
                <AvatarFallback className="text-xl sm:text-2xl bg-white text-gray-800">
                  {profile.name?.split(' ').map((n: string) => n[0]).join('') || profile.username?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="text-white flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <div className="min-w-0 flex-1">
                    <h1 className="text-2xl sm:text-3xl font-bold truncate">{profile.name || profile.username}</h1>
                    <p className="text-white/90 truncate">@{profile.username}</p>
                    {profile.profession && (
                      <div className="flex items-center gap-1 mt-1">
                        <Briefcase className="h-4 w-4 text-white/80 flex-shrink-0" />
                        <span className="text-white/80 text-sm truncate">{profile.profession}</span>
                      </div>
                    )}
                  </div>
                  {profile.socialScore && (
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/30 flex-shrink-0">
                      <div className="text-center">
                        <div className="text-xl sm:text-2xl font-bold text-white">{profile.socialScore}</div>
                        <div className="text-xs text-white/80 uppercase tracking-wide">Score</div>
                      </div>
                    </div>
                  )}
                </div>
                {profile.bio && (
                  <p className="text-white/80 mt-2 text-sm sm:text-base break-words leading-relaxed max-w-full overflow-hidden">
                    {profile.bio.length > 160 ? `${profile.bio.substring(0, 160)}...` : profile.bio}
                  </p>
                )}
                {profile.location && (
                  <div className="flex items-center gap-1 mt-2 text-white/80">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm truncate">{profile.location}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Share Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowShareDialog(true)}
              className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 flex-shrink-0"
            >
              <Share2 className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Share Profile</span>
              <span className="sm:hidden">Share</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Welcome Messages */}
            {profile.welcomeMessage && (
              <Card className={isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border'}>
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 ${themeStyles.text}`}>
                    <MessageCircle className="h-5 w-5" />
                    Welcome Message
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700 text-white' : `${themeStyles.bg} ${themeStyles.border}`} border`}>
                      <p className="whitespace-pre-wrap break-words">{profile.welcomeMessage}</p>
                    </div>
                  )}
                  
                    <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : `${themeStyles.bg} ${themeStyles.border}`} border`}>
                      <div className="flex items-center gap-3 mb-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className={themeStyles.hover}
                          onClick={() => {
                            const audio = new Audio(profile.welcomeMessage);
                            handleAudioPlay('welcome');
                            audio.play();
                            audio.onended = handleAudioEnd;
                          }}
                          disabled={audioPlaying === 'welcome'}
                        >
                          {audioPlaying === 'welcome' ? (
                            <MessageCircle className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                          <span className="ml-2">Welcome Audio</span>
                        </Button>
                      </div>
                    </div>
                  )}
                  
                    <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : `${themeStyles.bg} ${themeStyles.border}`} border`}>
                      <div className="mb-3">
                        <span className="text-sm font-medium">Welcome Video</span>
                      </div>
                      <div className="w-full max-w-lg">
                        <video 
                          controls 
                          className="w-full rounded-lg"
                          style={{ maxHeight: '300px' }}
                          preload="metadata"
                        >
                          <source src={profile.welcomeMessage} type="video/mp4" />
                          <source src={profile.welcomeMessage} type="video/webm" />
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Links */}
            {links.length > 0 && (
              <Card className={isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border'}>
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 ${themeStyles.text}`}>
                    <ExternalLink className="h-5 w-5" />
                    Links
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {links.map((link: any) => {
                      return (
                        <a
                          key={link.id}
                          href={(() => {
                            const url = link.url?.trim();
                            if (!url) return '#';
                            if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('mailto:')) {
                              return url;
                            }
                            return `https://${url}`;
                          })()}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`w-full p-4 border rounded-lg cursor-pointer transition-colors block no-underline ${themeStyles.hover} ${isDark ? 'border-gray-600 hover:bg-gray-700 text-white' : 'border hover:bg-gray-50'}`}
                          onClick={(e) => {
                            const url = link.url?.trim();
                            if (!url) {
                              e.preventDefault();
                              return;
                            }
                            // Record click for analytics
                            fetch(`/api/links/${link.id}/click`, {
                              method: 'POST',
                              credentials: 'include',
                            }).catch(console.error);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="w-5 h-5 flex items-center justify-center">
                                {getPlatformIcon(link.platform)}
                              </div>
                              <div className="min-w-0 flex-1 text-left">
                                <div className="font-medium truncate">{link.title}</div>
                                {link.description && (
                                  <div className="text-sm text-muted-foreground truncate">{link.description}</div>
                                )}
                              </div>
                            </div>
                            <ExternalLink className="h-4 w-4 flex-shrink-0 ml-2" />
                          </div>
                        </a>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Collaborative Spotlight */}
            {spotlightProjects.length > 0 && (
              <Card className={isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border'}>
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 ${themeStyles.text}`}>
                    <Star className="h-5 w-5" />
                    Collaborative Spotlight
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {spotlightProjects.map((project: any) => (
                      <Card key={project.id} className="h-full">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg">{project.title}</CardTitle>
                            <Badge variant="secondary" className="ml-2 whitespace-nowrap">
                              <Eye className="h-3 w-3 mr-1" />
                              {project.viewCount || 0}
                            </Badge>
                          </div>
                          <CardDescription className="line-clamp-2">
                            {project.description}
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
                                {project.tags.map((tag: any) => (
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
                                {project.contributors.slice(0, 3).map((contributor: any) => (
                                  <div key={contributor.id} className="flex items-center gap-2 bg-muted/30 p-2 rounded-md">
                                    <Avatar className="h-7 w-7 border border-primary/20">
                                      <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">
                                        {contributor.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'C'}
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
                              onClick={() => {
                                if (project.url) {
                                  // Record click for analytics
                                  fetch(`/api/spotlight/projects/${project.id}/click`, {
                                    method: 'POST',
                                    credentials: 'include',
                                  }).catch(console.error);
                                  window.open(project.url, '_blank');
                                }
                              }}
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Visit
                            </Button>
                            
                            {project.isPinned && (
                              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                                <Star className="h-3 w-3 mr-1 fill-current" />
                                Pinned
                              </Badge>
                            )}
                          </div>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}


          </div>

          {/* Sidebar */}
          <div className="space-y-6">




            {/* Collaboration Request */}
            <Card className={isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border'}>
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${themeStyles.text}`}>
                  <UserPlus className="h-5 w-5" />
                  Connect & Collaborate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Interested in working together? Send a collaboration request to {profile.name || profile.username}.
                </p>
                
                {/* Skills Dropdown */}
                {skills && skills.length > 0 && (
                  <div className="mb-4">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full mb-3">
                          <Briefcase className="h-4 w-4 mr-2" />
                          Visit My Skills
                        </Button>
                      </DialogTrigger>
                      <DialogContent className={`max-w-lg ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white'}`}>
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Briefcase className="h-5 w-5" />
                            {profile.name || profile.username}'s Skills
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3 max-h-80 overflow-y-auto">
                          {skills.map((skill: any) => (
                            <div key={skill.id} className={`p-3 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="font-medium">{skill.skill || skill.name}</h5>
                                <Badge variant="secondary" className="text-xs">
                                  Level {skill.level}
                                </Badge>
                              </div>
                              {skill.description && (
                                <p className="text-sm text-muted-foreground mb-1">{skill.description}</p>
                              )}
                              {skill.yearsOfExperience && (
                                <p className="text-xs text-muted-foreground">
                                  {skill.yearsOfExperience} years experience
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
                
                {/* Collaboration Request Button */}
                {isAuthenticated && currentUser?.id !== profile.id ? (
                  <Dialog open={showCollaborationDialog} onOpenChange={setShowCollaborationDialog}>
                    <DialogTrigger asChild>
                      <Button className={`w-full ${themeStyles.primary} text-white hover:opacity-90`}>
                        <Send className="h-4 w-4 mr-2" />
                        Send Collaboration Request
                      </Button>
                    </DialogTrigger>
                    <DialogContent className={`max-w-lg ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white'}`}>
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <UserPlus className="h-5 w-5" />
                          Send Collaboration Request
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Send a collaboration request to {profile.name || profile.username} to connect and work together.
                        </p>
                        
                        <div>
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
                            className={`flex-1 ${themeStyles.primary} text-white hover:opacity-90`}
                            disabled={!collaborationForm.message.trim()}
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Send Request
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                ) : !isAuthenticated ? (
                  <Button 
                    onClick={() => window.location.href = '/login'}
                    className={`w-full ${themeStyles.primary} text-white hover:opacity-90`}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Login to Send Request
                  </Button>
                ) : null}

              </CardContent>
            </Card>

            {/* Profile Info */}
            {(profile.industry || profile.tags?.length > 0 || profile.interests?.length > 0) && (
              <Card className={isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border'}>
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 ${themeStyles.text}`}>
                    <Award className="h-5 w-5" />
                    Profile Info
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {profile.industry && (
                    <div className="mb-4">
                      <h4 className="font-medium mb-2">Industry</h4>
                      <Badge variant="secondary" className="break-words">{profile.industry}</Badge>
                    </div>
                  )}
                  {profile.tags && profile.tags.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-medium mb-2">Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {profile.tags.map((tag: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {profile.interests && profile.interests.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Interests</h4>
                      <div className="flex flex-wrap gap-2">
                        {profile.interests.map((interest: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Referral Links */}
            <Card className={isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border'}>
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${themeStyles.text}`}>
                  <LinkIcon className="h-5 w-5" />
                  Referral Links
                </CardTitle>
              </CardHeader>
              <CardContent>
                {referralLinks && referralLinks.length > 0 ? (
                  <div className="space-y-3 mb-4">
                    {referralLinks.map((link: any) => (
                      <div key={link.id} className={`p-3 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : `${themeStyles.bg} ${themeStyles.border}`}`}>
                        <div className="flex justify-between items-center">
                          <div className="min-w-0 flex-1">
                            <h4 className="font-medium text-sm truncate">{link.title}</h4>
                            {link.description && (
                              <p className="text-xs text-muted-foreground mt-1 break-words">{link.description}</p>
                            )}
                            {link.referenceCompany && (
                              <Badge variant="outline" className="text-xs mt-2">
                                {link.referenceCompany}
                              </Badge>
                            )}
                            {link.linkType && (
                              <Badge variant="secondary" className="text-xs mt-2 ml-1">
                                {link.linkType}
                              </Badge>
                            )}
                          </div>
                          <a
                            href={(() => {
                              const url = link.url?.trim();
                              if (!url) return '#';
                              if (url.startsWith('http://') || url.startsWith('https://')) {
                                return url;
                              }
                              return `https://${url}`;
                            })()}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex-shrink-0 ml-2 p-1 rounded cursor-pointer transition-colors no-underline ${themeStyles.hover}`}
                            onClick={(e) => {
                              const url = link.url?.trim();
                              if (!url) {
                                e.preventDefault();
                                return;
                              }
                              // Record click for analytics
                              fetch(`/api/referral-links/${link.id}/click`, {
                                method: 'POST',
                                credentials: 'include',
                              }).catch(console.error);
                            }}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mb-4">No referral links available yet.</p>
                )}
                
                <Button
                  onClick={() => setShowReferralDialog(true)}
                  className={`w-full ${themeStyles.primary} hover:opacity-90`}
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Request to Add My Link
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Social Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className={isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white'}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Share Profile
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Share {profile.name || profile.username}'s profile with others
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => shareProfile('twitter')}
                className="flex items-center gap-2"
              >
                <FaTwitter className="h-4 w-4" />
                Twitter
              </Button>
              <Button
                variant="outline"
                onClick={() => shareProfile('facebook')}
                className="flex items-center gap-2"
              >
                <FaFacebook className="h-4 w-4" />
                Facebook
              </Button>
              <Button
                variant="outline"
                onClick={() => shareProfile('linkedin')}
                className="flex items-center gap-2"
              >
                <FaLinkedin className="h-4 w-4" />
                LinkedIn
              </Button>
              <Button
                variant="outline"
                onClick={() => shareProfile('copy')}
                className="flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                Copy Link
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Referral Request Dialog */}
      <Dialog open={showReferralDialog} onOpenChange={setShowReferralDialog}>
        <DialogContent className={`max-w-2xl ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white'}`}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Request to Add My Link
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            <p className="text-sm text-muted-foreground">
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
                  className={isDark ? 'bg-gray-700 border-gray-600' : ''}
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
                  className={isDark ? 'bg-gray-700 border-gray-600' : ''}
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
                  className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                />
              </div>
              <div>
                <Label htmlFor="ref-website">Website</Label>
                <Input
                  id="ref-website"
                  value={referralForm.website}
                  onChange={(e) => setReferralForm({...referralForm, website: e.target.value})}
                  placeholder="https://yourwebsite.com"
                  className={isDark ? 'bg-gray-700 border-gray-600' : ''}
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
                className={isDark ? 'bg-gray-700 border-gray-600' : ''}
              />
            </div>

            <div>
              <Label htmlFor="ref-description">Description *</Label>
              <Textarea
                id="ref-description"
                value={referralForm.description}
                onChange={(e) => setReferralForm({...referralForm, description: e.target.value})}
                placeholder="Describe your services and why you'd like to be featured..."
                className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ref-link-title">Link Title *</Label>
                <Input
                  id="ref-link-title"
                  value={referralForm.linkTitle}
                  onChange={(e) => setReferralForm({...referralForm, linkTitle: e.target.value})}
                  placeholder="e.g., Visit My Portfolio"
                  className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                />
              </div>
              <div>
                <Label htmlFor="ref-link-url">Link URL *</Label>
                <Input
                  id="ref-link-url"
                  value={referralForm.linkUrl}
                  onChange={(e) => setReferralForm({...referralForm, linkUrl: e.target.value})}
                  placeholder="https://yourlink.com"
                  className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleReferralSubmit}
                className={`flex-1 ${themeStyles.primary} hover:opacity-90`}
                disabled={!referralForm.name || !referralForm.email || !referralForm.fieldOfWork || !referralForm.description || !referralForm.linkTitle || !referralForm.linkUrl}
              >
                <Send className="h-4 w-4 mr-2" />
                Send Request
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowReferralDialog(false)}
                className="px-6"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>


    </div>
  );
}