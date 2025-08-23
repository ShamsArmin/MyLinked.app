import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePlatformIcons } from "@/hooks/use-platform-icons";
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
  Heart
} from "lucide-react";
import { 
  FaInstagram, 
  FaLinkedin, 
  FaTwitter, 
  FaFacebook 
} from "react-icons/fa";
import { useState, useCallback } from "react";

export default function VisitorProfileComplete() {
  const { username } = useParams();
  const { getPlatformConfig } = usePlatformIcons();
  const [audioPlaying, setAudioPlaying] = useState<string | null>(null);
  const [clickingLink, setClickingLink] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/profile", username],
    queryFn: async () => {
      const response = await fetch(`/api/profile/${username}`);
      if (!response.ok) {
        throw new Error('Profile not found');
      }
      return response.json();
    },
    enabled: !!username,
  });

  // Platform-specific helper functions
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

  const { profile, links = [], spotlightProjects = [], referralLinks = [], socialPosts = [] } = data;

  // Get theme-specific styles based on user's selected theme
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
      orange: {
        gradient: 'bg-gradient-to-r from-amber-500 to-orange-500',
        primary: 'bg-orange-500',
        text: 'text-orange-600',
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        hover: 'hover:bg-orange-50'
      },
      green: {
        gradient: 'bg-gradient-to-r from-emerald-500 to-lime-500',
        primary: 'bg-green-500',
        text: 'text-green-600',
        bg: 'bg-green-50',
        border: 'border-green-200',
        hover: 'hover:bg-green-50'
      },
      indigo: {
        gradient: 'bg-gradient-to-r from-indigo-500 to-purple-600',
        primary: 'bg-indigo-500',
        text: 'text-indigo-600',
        bg: 'bg-indigo-50',
        border: 'border-indigo-200',
        hover: 'hover:bg-indigo-50'
      }
    };

    return themeMap[theme as keyof typeof themeMap] || themeMap.indigo;
  };

  const themeStyles = getThemeStyles();
  const isDark = profile.darkMode;
  
  const handleLinkClick = useCallback(async (linkId: number, url: string) => {
    const clickKey = `link-${linkId}`;
    
    // Prevent multiple rapid clicks
    if (clickingLink === clickKey) return;
    setClickingLink(clickKey);
    
    // Ensure URL has proper protocol
    let finalUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('mailto:')) {
      finalUrl = 'https://' + url;
    }
    
    // Open the link immediately
    window.open(finalUrl, '_blank', 'noopener,noreferrer');
    
    // Record the click for analytics (don't await this)
    try {
      fetch(`/api/links/${linkId}/click`, { method: 'POST' });
    } catch (error) {
      console.error('Failed to record click:', error);
    }
    
    // Reset click guard after a short delay
    setTimeout(() => setClickingLink(null), 1000);
  }, [clickingLink]);

  const handleAudioPlay = (audioId: string) => {
    setAudioPlaying(audioId);
  };

  const handleAudioEnd = () => {
    setAudioPlaying(null);
  };

  const handleReferralLinkClick = useCallback(async (linkId: number, url: string) => {
    const clickKey = `referral-${linkId}`;
    
    // Prevent multiple rapid clicks
    if (clickingLink === clickKey) return;
    setClickingLink(clickKey);
    
    // Ensure URL has proper protocol
    let finalUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      finalUrl = 'https://' + url;
    }
    
    // Open the referral link immediately
    window.open(finalUrl, '_blank', 'noopener,noreferrer');
    
    // Record the referral click for analytics (don't await this)
    try {
      fetch(`/api/referral-links/${linkId}/click`, { method: 'POST' });
    } catch (error) {
      console.error('Failed to record referral click:', error);
    }
    
    // Reset click guard after a short delay
    setTimeout(() => setClickingLink(null), 1000);
  }, [clickingLink]);

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>
      {/* Hero Section with Proper Background Handling */}
      <div className="relative h-80 overflow-hidden">
        {/* Background Layer */}
        <div className="absolute inset-0">
          {profile.profileBackground ? (
            <>
              <img 
                src={profile.profileBackground}
                alt="Profile Background"
                className="w-full h-full object-cover"
                style={{ objectFit: 'cover' }}
                onLoad={() => console.log('Background image loaded successfully')}
                onError={(e) => {
                  console.log('Background image failed to load, using theme fallback');
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div className={`w-full h-full ${themeStyles.gradient} absolute inset-0`} style={{ zIndex: -1 }} />
            </>
          ) : (
            <div className={`w-full h-full ${themeStyles.gradient}`} />
          )}
        </div>
        
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-40" />
        
        {/* Profile Content */}
        <div className="absolute bottom-6 left-6 right-6">
          <div className="flex items-end gap-4">
            <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
              <AvatarImage src={profile.profileImage} alt={profile.name} />
              <AvatarFallback className="text-2xl bg-white text-gray-800">
                {profile.name?.split(' ').map((n: string) => n[0]).join('') || profile.username?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="text-white flex-1">
              <div className="flex items-center gap-4">
                <div>
                  <h1 className="text-3xl font-bold">{profile.name || profile.username}</h1>
                  <p className="text-white/90">@{profile.username}</p>
                </div>
                {profile.socialScore && (
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/30">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">{profile.socialScore}</div>
                      <div className="text-xs text-white/80 uppercase tracking-wide">Score</div>
                    </div>
                  </div>
                )}
              </div>
              {profile.bio && <p className="text-white/80 mt-2 max-w-2xl">{profile.bio}</p>}
              {profile.location && (
                <div className="flex items-center gap-1 mt-2 text-white/80">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">{profile.location}</span>
                </div>
              )}
            </div>
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
                      <audio controls className="w-full">
                        <source src={profile.welcomeMessage} type="audio/mpeg" />
                        Your browser does not support the audio element.
                      </audio>
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
                      const platformConfig = getPlatformConfig(link.platform);
                      const Icon = platformConfig.icon;
                      
                      return (
                        <Button
                          key={link.id}
                          variant="outline"
                          className={`w-full justify-between h-auto p-4 text-left ${themeStyles.hover} ${isDark ? 'border-gray-600 hover:bg-gray-700 text-white' : 'border hover:bg-gray-50'}`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleLinkClick(link.id, link.url);
                          }}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <Icon className="h-5 w-5 flex-shrink-0" />
                            <div className="min-w-0 flex-1 text-left">
                              <div className="font-medium truncate">{link.title}</div>
                              {link.description && (
                                <div className="text-sm text-muted-foreground truncate">{link.description}</div>
                              )}
                            </div>
                          </div>
                          <ExternalLink className="h-4 w-4 flex-shrink-0 ml-2" />
                        </Button>
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
                  <div className="space-y-4">
                    {spotlightProjects.map((project: any) => (
                      <div key={project.id} className={`p-4 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : `${themeStyles.bg} ${themeStyles.border}`}`}>
                        <div className="flex justify-between items-start mb-3">
                          <div className="min-w-0 flex-1">
                            <h4 className="font-semibold truncate">{project.title}</h4>
                            <p className="text-sm text-muted-foreground break-words mt-1">{project.description}</p>
                          </div>
                          {project.isPinned && (
                            <Star className="h-4 w-4 text-yellow-500 fill-current flex-shrink-0 ml-2" />
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {project.views || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {project.contributors?.length || 0}
                            </span>
                          </div>
                          {project.url && (
                            <Button
                              size="sm"
                              variant="outline"
                              className={themeStyles.hover}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const clickKey = `project-${project.id}`;
                                if (clickingLink === clickKey) return;
                                setClickingLink(clickKey);
                                window.open(project.url, '_blank', 'noopener,noreferrer');
                                setTimeout(() => setClickingLink(null), 1000);
                              }}
                            >
                              View Project
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}



            {/* Live Profile Feed */}
            {socialPosts.length > 0 && (
              <Card className={isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border'}>
                <CardHeader className="pb-2">
                  <CardTitle className={`flex items-center text-sm font-medium ${themeStyles.text}`}>
                    <Activity className="h-4 w-4 mr-2 text-orange-500" />
                    Live Profile Feed
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    Latest activity from social accounts
                  </p>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {socialPosts.map((post: any) => (
                      <div 
                        key={post.id} 
                        className={`border rounded-md p-3 cursor-pointer hover:bg-secondary/10 transition-colors ${isDark ? 'border-gray-600 hover:bg-gray-700/50' : 'border-gray-200 hover:bg-gray-50'}`}
                        onClick={() => post.postUrl && window.open(post.postUrl, '_blank', 'noopener,noreferrer')}
                      >
                        <div className="flex items-center mb-2">
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center mr-2"
                            style={{ backgroundColor: `${getPlatformColor(post.platform)}20` }}
                          >
                            {getPlatformIcon(post.platform)}
                          </div>
                          <div>
                            <div className="font-medium text-sm">
                              {post.platform === 'twitter' ? 'X Post' : 
                               post.platform === 'instagram' ? 'Instagram' : 
                               post.platform.charAt(0).toUpperCase() + post.platform.slice(1)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(post.postedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        
                        {post.caption && (
                          <p className="text-sm mb-2 break-words">{post.caption}</p>
                        )}
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center">
                              <Heart className="h-3 w-3 mr-1" />
                              <span>{Math.floor(Math.random() * 100) + 10}</span>
                            </div>
                            <div className="flex items-center">
                              <MessageCircle className="h-3 w-3 mr-1" />
                              <span>{Math.floor(Math.random() * 30) + 1}</span>
                            </div>
                          </div>
                          {post.postUrl && (
                            <div className="text-primary text-xs">
                              Open in {post.platform === 'twitter' ? 'X' : post.platform.charAt(0).toUpperCase() + post.platform.slice(1)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Skills & Industry */}
            {(profile.industry || (profile.tags && profile.tags.length > 0) || (profile.interests && profile.interests.length > 0)) && (
              <Card className={isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border'}>
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 ${themeStyles.text}`}>
                    <Award className="h-5 w-5" />
                    Skills & Industry
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
            {referralLinks.length > 0 && (
              <Card className={isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border'}>
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 ${themeStyles.text}`}>
                    <Star className="h-5 w-5" />
                    Referral Links
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
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
                          <Button
                            size="sm"
                            variant="ghost"
                            className={`flex-shrink-0 ml-2 ${themeStyles.hover}`}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleReferralLinkClick(link.id, link.url);
                            }}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}


          </div>
        </div>
      </div>
    </div>
  );
}