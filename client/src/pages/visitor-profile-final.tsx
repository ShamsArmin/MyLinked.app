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
  Calendar,
  Users,
  Eye,
  Star,
  Award,
  MessageCircle,
  Play
} from "lucide-react";
import { useState } from "react";

export default function VisitorProfileFinal() {
  const { username } = useParams();
  const { getPlatformConfig } = usePlatformIcons();
  const [audioPlaying, setAudioPlaying] = useState<string | null>(null);

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

  const handleLinkClick = async (linkId: number, url: string) => {
    try {
      await fetch(`/api/links/${linkId}/click`, {
        method: 'POST',
        credentials: 'include',
      });
      window.open(url, '_blank');
    } catch (error) {
      console.error('Failed to record click:', error);
      window.open(url, '_blank');
    }
  };

  const handleAudioPlay = (audioId: string) => {
    setAudioPlaying(audioId);
  };

  const handleAudioEnd = () => {
    setAudioPlaying(null);
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

  // Apply theme colors based on user's selected theme
  const getThemeStyles = () => {
    switch (profile.theme) {
      case 'purple':
        return {
          gradient: 'from-purple-500 to-pink-500',
          primary: 'bg-purple-500',
          accent: 'text-purple-600',
          hover: 'hover:bg-purple-50',
          border: 'border-purple-200',
          bg: 'bg-purple-50'
        };
      case 'blue':
        return {
          gradient: 'from-blue-500 to-cyan-400',
          primary: 'bg-blue-500',
          accent: 'text-blue-600',
          hover: 'hover:bg-blue-50',
          border: 'border-blue-200',
          bg: 'bg-blue-50'
        };
      case 'orange':
        return {
          gradient: 'from-amber-500 to-orange-500',
          primary: 'bg-orange-500',
          accent: 'text-orange-600',
          hover: 'hover:bg-orange-50',
          border: 'border-orange-200',
          bg: 'bg-orange-50'
        };
      case 'green':
        return {
          gradient: 'from-emerald-500 to-lime-500',
          primary: 'bg-green-500',
          accent: 'text-green-600',
          hover: 'hover:bg-green-50',
          border: 'border-green-200',
          bg: 'bg-green-50'
        };
      default:
        return {
          gradient: 'from-indigo-500 to-purple-600',
          primary: 'bg-indigo-500',
          accent: 'text-indigo-600',
          hover: 'hover:bg-indigo-50',
          border: 'border-indigo-200',
          bg: 'bg-indigo-50'
        };
    }
  };

  const themeStyles = getThemeStyles();
  const isDark = profile.darkMode;
  const bgClass = isDark ? 'bg-gray-900 text-white' : 'bg-gray-50';
  const cardClass = isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white';

  return (
    <div className={`min-h-screen ${bgClass}`}>
      {/* Hero Section with Background Image */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        {/* Background Image or Gradient */}
        {profile.backgroundImage ? (
          <img 
            src={profile.backgroundImage} 
            alt="Profile Background" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-r ${themeStyles.gradient}`} />
        )}
        
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-40" />
        
        {/* Profile Info */}
        <div className="absolute bottom-6 left-4 right-4 sm:left-6 sm:right-6">
          <div className="flex items-end gap-3 sm:gap-4">
            <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-4 border-white flex-shrink-0">
              <AvatarImage src={profile.profileImage} alt={profile.name} />
              <AvatarFallback className="text-xl sm:text-2xl">
                {profile.name?.split(' ').map((n: string) => n[0]).join('') || profile.username?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="text-white flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold truncate">{profile.name || profile.username}</h1>
              <p className="text-white/90 truncate">@{profile.username}</p>
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
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Welcome Messages */}
            {(profile.welcomeMessage || profile.welcomeAudio || profile.welcomeVideo) && (
              <Card className={cardClass}>
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 ${themeStyles.accent}`}>
                    <MessageCircle className="h-5 w-5" />
                    Welcome Message
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {profile.welcomeMessage && (
                    <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : themeStyles.bg} border ${themeStyles.border}`}>
                      <p className="break-words">{profile.welcomeMessage}</p>
                    </div>
                  )}
                  
                  {profile.welcomeAudio && (
                    <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : themeStyles.bg} border ${themeStyles.border}`}>
                      <div className="flex items-center gap-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className={themeStyles.hover}
                          onClick={() => {
                            const audio = new Audio(profile.welcomeAudio);
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
                        </Button>
                        <span className="text-sm text-muted-foreground">Welcome Audio Message</span>
                      </div>
                    </div>
                  )}

                  {profile.welcomeVideo && (
                    <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : themeStyles.bg} border ${themeStyles.border}`}>
                      {profile.welcomeVideo.startsWith('data:video/') ? (
                        <video 
                          controls 
                          className="w-full max-w-md rounded-lg"
                          style={{ maxHeight: '200px' }}
                        >
                          <source src={profile.welcomeVideo} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      ) : (
                        <div className="flex items-center gap-3">
                          <Button
                            size="sm"
                            variant="outline"
                            className={themeStyles.hover}
                            onClick={() => {
                              const video = document.createElement('video');
                              video.src = profile.welcomeVideo;
                              video.controls = true;
                              video.style.maxWidth = '400px';
                              video.style.maxHeight = '200px';
                              video.className = 'rounded-lg';
                              
                              const modal = document.createElement('div');
                              modal.style.position = 'fixed';
                              modal.style.top = '0';
                              modal.style.left = '0';
                              modal.style.width = '100%';
                              modal.style.height = '100%';
                              modal.style.backgroundColor = 'rgba(0,0,0,0.8)';
                              modal.style.display = 'flex';
                              modal.style.alignItems = 'center';
                              modal.style.justifyContent = 'center';
                              modal.style.zIndex = '9999';
                              
                              modal.appendChild(video);
                              modal.onclick = () => document.body.removeChild(modal);
                              
                              document.body.appendChild(modal);
                              video.play();
                            }}
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Play Welcome Video
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Links */}
            {links.length > 0 && (
              <Card className={cardClass}>
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 ${themeStyles.accent}`}>
                    <ExternalLink className="h-5 w-5" />
                    Links
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {links.map((link: any) => {
                      const platformConfig = getPlatformConfig(link.platform);
                      const PlatformIcon = platformConfig.icon;
                      
                      return (
                        <Button
                          key={link.id}
                          variant="outline"
                          className={`w-full justify-between h-auto p-4 ${themeStyles.hover} ${isDark ? 'border-gray-600 hover:bg-gray-700' : `border ${themeStyles.border}`}`}
                          onClick={() => handleLinkClick(link.id, link.url)}
                        >
                          <div className="flex items-center gap-3 flex-1 text-left overflow-hidden">
                            <PlatformIcon className="h-5 w-5 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <div className="font-medium truncate">{link.title}</div>
                              {link.description && (
                                <div className="text-sm text-muted-foreground truncate">{link.description}</div>
                              )}
                            </div>
                          </div>
                          <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
                        </Button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Collaborative Spotlight */}
            {spotlightProjects.length > 0 && (
              <Card className={cardClass}>
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 ${themeStyles.accent}`}>
                    <Star className="h-5 w-5" />
                    Collaborative Spotlight
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {spotlightProjects.map((project: any) => (
                      <div key={project.id} className={`p-4 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : `${themeStyles.bg} ${themeStyles.border}`}`}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="min-w-0 flex-1">
                            <h4 className="font-semibold truncate">{project.title}</h4>
                            <p className="text-sm text-muted-foreground break-words">{project.description}</p>
                          </div>
                          {project.isPinned && (
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 flex-shrink-0 ml-2" />
                          )}
                        </div>
                        
                        {project.tags && project.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {project.tags.map((tag: any, index: number) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tag.name}
                              </Badge>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
                              onClick={() => window.open(project.url, '_blank')}
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              View
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
              <Card className={cardClass}>
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 ${themeStyles.accent}`}>
                    <MessageCircle className="h-5 w-5" />
                    Live Profile Feed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {socialPosts.map((post: any) => (
                      <div key={post.id} className={`p-4 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : `${themeStyles.bg} ${themeStyles.border}`}`}>
                        <p className="mb-2 break-words">{post.content}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(post.createdAt).toLocaleDateString()}
                          </span>
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
              <Card className={cardClass}>
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 ${themeStyles.accent}`}>
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
                        {profile.tags.map((skill: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs break-words">
                            {skill}
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
                          <Badge key={index} variant="outline" className="text-xs break-words">
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
              <Card className={cardClass}>
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 ${themeStyles.accent}`}>
                    <Star className="h-5 w-5" />
                    Referral Links
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {referralLinks.map((link: any) => (
                      <div key={link.id} className={`p-3 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : `${themeStyles.bg} ${themeStyles.border}`}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">{link.title}</h4>
                            {link.description && (
                              <p className="text-xs text-muted-foreground mt-1 break-words">{link.description}</p>
                            )}
                            {link.category && (
                              <Badge variant="outline" className="text-xs mt-2">
                                {link.category}
                              </Badge>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className={`flex-shrink-0 ml-2 ${themeStyles.hover}`}
                            onClick={() => window.open(link.url, '_blank')}
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

            {/* Profile Stats */}
            <Card className={cardClass}>
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${themeStyles.accent}`}>
                  <Eye className="h-5 w-5" />
                  Profile Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Links</span>
                    <span className="font-medium">{links.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Projects</span>
                    <span className="font-medium">{spotlightProjects.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Posts</span>
                    <span className="font-medium">{socialPosts.length}</span>
                  </div>
                  {profile.socialScore && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Social Score</span>
                      <span className="font-medium">{profile.socialScore}/10</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}