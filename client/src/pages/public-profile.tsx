import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePlatformIcons } from "@/hooks/use-platform-icons";
import { 
  User, 
  Globe, 
  MessageCircle, 
  PlayCircle, 
  Users, 
  GitBranch, 
  Star, 
  ExternalLink,
  Eye,
  MousePointer,
  Calendar,
  MapPin,
  Briefcase,
  Award,
  TrendingUp
} from "lucide-react";
import { useState } from "react";

const logoPath = "/assets/logo-compact.png";

interface PublicProfileData {
  profile: {
    id: number;
    username: string;
    name: string;
    email: string;
    bio: string;
    profileImage?: string;
    profileBackground?: string;
    welcomeMessage?: string;
    theme?: string;
    viewMode?: string;
    darkMode?: boolean;
    industry?: string;
    skills?: string[];
    location?: string;
    socialScore?: number;
  };
  links: Array<{
    id: number;
    userId: number;
    platform: string;
    title: string;
    url: string;
    clicks: number;
    views: number;
    featured: boolean;
    order: number;
    aiScore?: number;
  }>;
  spotlightProjects?: Array<{
    id: number;
    title: string;
    description: string;
    imageUrl?: string;
    projectUrl?: string;
    tags: string[];
    featured: boolean;
    clicks: number;
    views: number;
  }>;
  referralLinks?: Array<{
    id: number;
    title: string;
    url: string;
    description?: string;
    category: string;
    clicks: number;
  }>;
  socialPosts?: Array<{
    id: number;
    content: string;
    imageUrl?: string;
    createdAt: string;
  }>;
}

export default function PublicProfile() {
  const { username } = useParams();
  const { getPlatformConfig } = usePlatformIcons();
  const [audioPlaying, setAudioPlaying] = useState(false);

  const { data, isLoading, error } = useQuery<PublicProfileData>({
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

  const handleLinkClick = async (linkId: number, url: string) => {
    try {
      await fetch(`/api/links/${linkId}/click`, { method: 'POST' });
      window.open(url, '_blank');
    } catch (error) {
      console.error('Failed to record click:', error);
      window.open(url, '_blank');
    }
  };

  const playWelcomeMessage = () => {
      const audio = new Audio(data.profile.welcomeMessage);
      setAudioPlaying(true);
      audio.onended = () => setAudioPlaying(false);
      audio.play();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Profile Not Found</h1>
          <p className="text-muted-foreground mb-6">The profile you're looking for doesn't exist.</p>
          <Button onClick={() => window.location.href = '/'}>Go Home</Button>
        </div>
      </div>
    );
  }

  const { profile, links, spotlightProjects, referralLinks, socialPosts } = data;

  const getThemeStyles = () => {
    switch (profile.theme) {
      case 'sunset':
      case 'orange':
        return {
          gradient: 'from-orange-500 to-yellow-400',
          primary: 'bg-orange-500',
          accent: 'text-orange-600'
        };
      case 'forest':
      case 'green':
        return {
          gradient: 'from-emerald-500 to-green-400',
          primary: 'bg-green-500',
          accent: 'text-green-600'
        };
      case 'midnight':
        return {
          gradient: 'from-indigo-700 to-violet-500',
          primary: 'bg-indigo-600',
          accent: 'text-indigo-300'
        };
      case 'royal':
      case 'purple':
        return {
          gradient: 'from-purple-600 to-fuchsia-500',
          primary: 'bg-purple-600',
          accent: 'text-purple-600'
        };
      case 'passion':
        return {
          gradient: 'from-red-600 to-rose-500',
          primary: 'bg-red-600',
          accent: 'text-red-600'
        };
      case 'default':
      case 'blue':
      default:
        return {
          gradient: 'from-blue-500 to-cyan-400',
          primary: 'bg-blue-500',
          accent: 'text-blue-600'
        };
    }
  };

  const themeStyles = getThemeStyles();

  return (
    <div className={`min-h-screen ${profile.darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Top Navigation */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4">
        <div className="flex justify-between items-center">
          <img 
            src="/assets/logo-compact.png" 
            alt="MyLinked" 
            className="h-8 w-auto opacity-90"
            style={{ imageRendering: 'crisp-edges' }}
          />
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20"
            onClick={() => window.location.href = '/'}
          >
            Create Your Profile
          </Button>
        </div>
      </div>
      
      {/* Hero Section with Background */}
      <div className="relative h-64 md:h-80">
        {profile.profileBackground ? (
          <img 
            src={profile.profileBackground} 
            alt="Profile background" 
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-r ${themeStyles.gradient}`}></div>
        )}
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        
        {/* Profile Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-end gap-3 sm:gap-6">
              {/* Profile Avatar */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full border-4 border-white bg-white overflow-hidden flex-shrink-0">
                {profile.profileImage ? (
                  <img 
                    src={profile.profileImage} 
                    alt={profile.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className={`w-full h-full ${themeStyles.primary} flex items-center justify-center text-white font-bold text-xl sm:text-2xl`}>
                    {profile.name?.charAt(0) || profile.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              
              {/* Profile Info */}
              <div className="text-white flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl md:text-4xl font-bold mb-2 truncate">{profile.name}</h1>
                <p className="text-gray-200 text-sm md:text-base mb-2 break-words leading-relaxed max-w-full overflow-hidden">
                  {profile.bio && profile.bio.length > 160 ? `${profile.bio.substring(0, 160)}...` : profile.bio}
                </p>
                <div className="flex flex-wrap gap-2 sm:gap-4 text-sm">
                  {profile.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{profile.location}</span>
                    </div>
                  )}
                  {profile.industry && (
                    <div className="flex items-center gap-1">
                      <Briefcase className="h-4 w-4" />
                      <span>{profile.industry}</span>
                    </div>
                  )}
                  {profile.socialScore && (
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      <span>Score: {profile.socialScore}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-4xl mx-auto p-6 -mt-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Welcome Message */}
            {profile.welcomeMessage && (
              <Card className={profile.darkMode ? 'bg-gray-800 border-gray-700' : ''}>
                <CardHeader className={`${themeStyles.primary} text-white`}>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Welcome Message
                  </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                      <audio 
                        controls 
                        className="w-full rounded"
                        src={profile.welcomeMessage}
                      >
                        Your browser does not support the audio element.
                      </audio>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={playWelcomeMessage}
                        disabled={audioPlaying}
                        className="flex items-center gap-2"
                      >
                        <PlayCircle className="h-4 w-4" />
                        {audioPlaying ? 'Playing...' : 'Play Message'}
                      </Button>
                    </div>
                    <video 
                      controls 
                      className="w-full rounded border"
                      src={profile.welcomeMessage}
                    >
                      Your browser does not support the video element.
                    </video>
                  ) : (
                    <p className={`${profile.darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {profile.welcomeMessage}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Links Section */}
            {links && links.length > 0 && (
              <Card className={profile.darkMode ? 'bg-gray-800 border-gray-700' : ''}>
                <CardHeader className={`${themeStyles.primary} text-white`}>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    My Links
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`grid gap-3 ${profile.viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                    {links.map(link => {
                      const platform = getPlatformConfig(link.platform);
                      const IconComponent = platform.icon;
                      
                      return (
                        <Button
                          key={link.id}
                          variant="outline"
                          className={`justify-start p-4 h-auto hover:scale-105 transition-all ${
                            profile.darkMode ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : 'bg-white hover:bg-gray-50'
                          }`}
                          onClick={() => handleLinkClick(link.id, link.url)}
                        >
                          <div className="flex items-center gap-3 w-full">
                            <div 
                              className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                              style={{ backgroundColor: platform.color }}
                            >
                              <IconComponent className="h-5 w-5" />
                            </div>
                            <div className="flex-1 text-left">
                              <div className="font-medium">{link.title}</div>
                              <div className="text-sm text-muted-foreground flex items-center gap-2">
                                <Eye className="h-3 w-3" />
                                {link.views} views
                                <MousePointer className="h-3 w-3 ml-2" />
                                {link.clicks} clicks
                              </div>
                            </div>
                            <ExternalLink className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </Button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Collaborative Spotlight */}
            {spotlightProjects && spotlightProjects.length > 0 && (
              <Card className={profile.darkMode ? 'bg-gray-800 border-gray-700' : ''}>
                <CardHeader className={`${themeStyles.primary} text-white`}>
                  <CardTitle className="flex items-center gap-2">
                    <GitBranch className="h-5 w-5" />
                    Collaborative Spotlight
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {spotlightProjects.map(project => (
                      <div key={project.id} className={`p-4 rounded-lg border ${profile.darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex items-start gap-4">
                          {project.imageUrl && (
                            <img 
                              src={project.imageUrl} 
                              alt={project.title}
                              className="w-16 h-16 rounded-lg object-cover"
                            />
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">{project.title}</h3>
                              {project.featured && (
                                <Badge variant="secondary" className="text-xs">
                                  <Star className="h-3 w-3 mr-1" />
                                  Featured
                                </Badge>
                              )}
                            </div>
                            <p className={`text-sm mb-3 ${profile.darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                              {project.description}
                            </p>
                            <div className="flex items-center justify-between">
                              <div className="flex flex-wrap gap-1">
                                {project.tags.map(tag => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                              {project.projectUrl && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(project.projectUrl, '_blank')}
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
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
            {(profile.skills?.length || profile.industry) && (
              <Card className={profile.darkMode ? 'bg-gray-800 border-gray-700' : ''}>
                <CardHeader className={`${themeStyles.primary} text-white`}>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Skills & Industry
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {profile.industry && (
                    <div className="mb-4">
                      <h4 className="font-medium mb-2">Industry</h4>
                      <Badge variant="secondary">{profile.industry}</Badge>
                    </div>
                  )}
                  {profile.skills && profile.skills.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {profile.skills.map(skill => (
                          <Badge key={skill} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Referral Links */}
            {referralLinks && referralLinks.length > 0 && (
              <Card className={profile.darkMode ? 'bg-gray-800 border-gray-700' : ''}>
                <CardHeader className={`${themeStyles.primary} text-white`}>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Recommended Links
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {referralLinks.map(link => (
                      <div key={link.id} className={`p-3 rounded-lg border ${profile.darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{link.title}</h4>
                            {link.description && (
                              <p className={`text-xs mt-1 ${profile.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {link.description}
                              </p>
                            )}
                            <Badge variant="outline" className="text-xs mt-2">
                              {link.category}
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(link.url, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
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