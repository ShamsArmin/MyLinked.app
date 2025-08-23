import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePlatformIcons } from "@/hooks/use-platform-icons";
import { InstagramPreview } from "@/components/instagram-preview";
const compactLogoPath = "/assets/logo-compact.png";

// Feature flags
const FEATURE_CONTENT_PREVIEW = false; // Set to true to re-enable Content Preview feature

import { 
  Globe, 
  MessageCircle, 
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
  TrendingUp,
  PlayCircle,
  Heart,
  Share2,
  MessageCircle
} from "lucide-react";
import { useState } from "react";

export default function VisitorProfile() {
  const { username } = useParams();
  const { getPlatformConfig } = usePlatformIcons();

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
      case 'purple':
        return {
          gradient: 'from-purple-500 to-pink-500',
          primary: 'bg-purple-500',
          accent: 'text-purple-600'
        };
      case 'blue':
        return {
          gradient: 'from-blue-500 to-cyan-400',
          primary: 'bg-blue-500',
          accent: 'text-blue-600'
        };
      case 'orange':
        return {
          gradient: 'from-amber-500 to-orange-500',
          primary: 'bg-orange-500',
          accent: 'text-orange-600'
        };
      case 'green':
        return {
          gradient: 'from-emerald-500 to-lime-500',
          primary: 'bg-green-500',
          accent: 'text-green-600'
        };
      default:
        return {
          gradient: 'from-indigo-500 to-purple-600',
          primary: 'bg-indigo-500',
          accent: 'text-indigo-600'
        };
    }
  };

  const themeStyles = getThemeStyles();

  return (
    <div className={`min-h-screen ${profile.darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Hero Section */}
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
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-end gap-6">
              {/* Profile Avatar */}
              <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-white">
                <AvatarImage src={profile.profileImage || undefined} />
                <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                  {profile.name?.charAt(0) || profile.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              {/* Profile Info */}
              <div className="text-white flex-1 min-w-0">
                <h1 className="text-2xl md:text-4xl font-bold mb-2">{profile.name}</h1>
                <p className="text-gray-200 text-sm md:text-base mb-2">{profile.bio}</p>
                <div className="flex flex-wrap gap-4 text-sm">
                  {profile.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{profile.location}</span>
                    </div>
                  )}
                  {profile.profession && (
                    <div className="flex items-center gap-1">
                      <Briefcase className="h-4 w-4" />
                      <span>{profile.profession}</span>
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
              
              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button variant="secondary" size="sm">
                  <Heart className="h-4 w-4 mr-2" />
                  Follow
                </Button>
                <Button variant="secondary" size="sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-6xl mx-auto p-6 -mt-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Welcome Message */}
            {profile.welcomeMessage && (
              <Card className={profile.darkMode ? 'bg-gray-800 border-gray-700' : ''}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Welcome Message
                  </CardTitle>
                </CardHeader>
                <CardContent>
                    <video 
                      controls 
                      className="w-full rounded border"
                      src={profile.welcomeMessage}
                    >
                      Your browser does not support the video element.
                    </video>
                    <div className="space-y-3">
                      <audio 
                        controls 
                        className="w-full rounded"
                        src={profile.welcomeMessage}
                      >
                        Your browser does not support the audio element.
                      </audio>
                    </div>
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
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Links
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`grid gap-3 ${profile.viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                    {links.map((link: any) => {
                      const platform = getPlatformConfig(link.platform);
                      const Icon = platform.icon;
                      
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
                              <Icon className="h-5 w-5" />
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

            {/* Instagram Content Preview */}
            {FEATURE_CONTENT_PREVIEW && (
              <InstagramPreview userId={profile.id} isOwner={false} />
            )}

            {/* Collaborative Spotlight */}
            {spotlightProjects && spotlightProjects.length > 0 && (
              <Card className={profile.darkMode ? 'bg-gray-800 border-gray-700' : ''}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GitBranch className="h-5 w-5" />
                    Collaborative Spotlight
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {spotlightProjects.map((project: any) => (
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
                                {project.tags && project.tags.map((tag: string) => (
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
            <Card className={profile.darkMode ? 'bg-gray-800 border-gray-700' : ''}>
              <CardHeader>
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
                {profile.tags && profile.tags.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {profile.tags.map((skill: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
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
                        <Badge key={index} variant="outline" className="text-xs">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Referral Links */}
            {referralLinks && referralLinks.length > 0 && (
              <Card className={profile.darkMode ? 'bg-gray-800 border-gray-700' : ''}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Referral Links
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {referralLinks.map((link: any) => (
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
                              {link.linkType}
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

            {/* Profile Stats */}
            <Card className={profile.darkMode ? 'bg-gray-800 border-gray-700' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Profile Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Links</span>
                    <span className="font-medium">{links?.length || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Clicks</span>
                    <span className="font-medium">
                      {links?.reduce((total: number, link: any) => total + link.clicks, 0) || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Views</span>
                    <span className="font-medium">
                      {links?.reduce((total: number, link: any) => total + link.views, 0) || 0}
                    </span>
                  </div>
                  {profile.socialScore && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Social Score</span>
                      <span className="font-medium">{profile.socialScore}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Footer with compact logo */}
        <footer className="border-t mt-8 py-6">
          <div className="container mx-auto px-4 text-center">
            <div className="flex justify-center mb-2">
              <img 
                src={compactLogoPath} 
                alt="MyLinked" 
                className="h-8 w-8"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Powered by MyLinked
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}