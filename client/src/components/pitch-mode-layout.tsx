import { User, Link, SpotlightProject, ReferralLink } from '@shared/schema';
import { usePlatformIcons } from '@/hooks/use-platform-icons';
import { 
  Briefcase, Mail, Phone, ExternalLink, User as UserIcon, 
  Award, Lightbulb, Mic, Users, Trophy, Rocket, Palette,
  Presentation, Building2, Target, Globe, Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { apiRequest } from '@/lib/queryClient';

type PitchModeLayoutProps = {
  profile: User;
  links: Link[];
  spotlightProjects?: SpotlightProject[];
  referralLinks?: ReferralLink[];
  className?: string;
};

export function PitchModeLayout({ 
  profile, 
  links, 
  spotlightProjects = [], 
  referralLinks = [],
  className = '' 
}: PitchModeLayoutProps) {
  const { getPlatformConfig } = usePlatformIcons();

  // Record link click
  const handleLinkClick = async (linkId: number, url: string) => {
    try {
      await apiRequest("POST", `/api/links/${linkId}/click`, null);

      // Ensure URL has proper protocol
      let finalUrl = url;
      if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('mailto:')) {
        finalUrl = 'https://' + url;
      }

      window.open(finalUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error("Failed to record link click:", error);

      // Still open the link even if tracking fails
      let finalUrl = url;
      if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('mailto:')) {
        finalUrl = 'https://' + url;
      }
      window.open(finalUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Get theme styles
  const getThemeStyles = () => {
    const theme = profile.theme || "default";
    const isDarkMode = profile.darkMode || false;

    let gradientColors = "from-primary-500 to-secondary-500";
    let textColor = isDarkMode ? "text-white" : "text-gray-900";
    let bgColor = isDarkMode ? "bg-gray-900" : "bg-white";

    switch (theme) {
      case "purple":
        gradientColors = "from-purple-500 to-pink-500";
        break;
      case "blue":
        gradientColors = "from-blue-500 to-cyan-400";
        break;
      case "orange":
        gradientColors = "from-amber-500 to-orange-500";
        break;
      case "green":
        gradientColors = "from-emerald-500 to-lime-500";
        break;
      default:
        break;
    }

    return {
      gradientColors,
      textColor,
      bgColor,
      isDarkMode
    };
  };

  const { gradientColors, textColor, bgColor, isDarkMode } = getThemeStyles();

  // Filter and sort links based on pitch mode
  const getPitchModeLinks = () => {
    const pitchType = profile.pitchModeType || "professional";

    switch (pitchType) {
      case "professional":
        return links.filter(link => 
          ['linkedin', 'portfolio', 'resume', 'website', 'github'].includes(link.platform?.toLowerCase() || '')
        ).slice(0, 6);

      case "creative":
        return links.filter(link => 
          ['instagram', 'dribbble', 'behance', 'portfolio', 'youtube', 'tiktok'].includes(link.platform?.toLowerCase() || '')
        ).slice(0, 6);

      case "startup":
        return links.filter(link => 
          ['website', 'linkedin', 'twitter', 'github', 'product_hunt'].includes(link.platform?.toLowerCase() || '')
        ).slice(0, 6);

      case "speaker":
        return links.filter(link => 
          ['youtube', 'linkedin', 'twitter', 'website', 'podcast'].includes(link.platform?.toLowerCase() || '')
        ).slice(0, 6);

      default:
        return links.slice(0, 6);
    }
  };

  const pitchModeLinks = getPitchModeLinks();
  const pitchType = profile.pitchModeType || "professional";

  // Get pitch mode specific icon and styling
  const getPitchModeConfig = () => {
    switch (pitchType) {
      case "professional":
        return {
          icon: Briefcase,
          title: "Professional Profile",
          description: "Showcasing professional experience and expertise",
          accentColor: "blue",
          focusAreas: ["Experience", "Skills", "Achievements"]
        };
      case "creative":
        return {
          icon: Palette,
          title: "Creative Portfolio",
          description: "Highlighting creative work and artistic vision", 
          accentColor: "purple",
          focusAreas: ["Portfolio", "Creative Work", "Art & Design"]
        };
      case "startup":
        return {
          icon: Rocket,
          title: "Startup Founder",
          description: "Presenting entrepreneurial ventures and innovations",
          accentColor: "green", 
          focusAreas: ["Startup Ideas", "Business Plan", "Team"]
        };
      case "speaker":
        return {
          icon: Presentation,
          title: "Speaker & Expert",
          description: "Featuring speaking engagements and thought leadership",
          accentColor: "orange",
          focusAreas: ["Speaking Topics", "Events", "Expertise"]
        };
      default:
        return {
          icon: Briefcase,
          title: "Professional Profile",
          description: "Showcasing professional experience and expertise",
          accentColor: "blue",
          focusAreas: ["Experience", "Skills", "Achievements"]
        };
    }
  };

  const pitchConfig = getPitchModeConfig();
  const PitchIcon = pitchConfig.icon;

  return (
    <div className={`min-h-screen ${bgColor} ${className}`}>
      {/* Pitch Mode Banner */}
      <div className={`h-20 bg-gradient-to-r ${gradientColors} relative`}>
        <div className="absolute top-6 left-6">
          <div className="flex items-center gap-3">
            <div className="text-white">
              <PitchIcon className="h-8 w-8" />
            </div>
            <div className="text-white">
              <div className="font-semibold text-lg">{pitchConfig.title}</div>
              <div className="text-white/80 text-sm">{pitchConfig.description}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Profile Header */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Profile Info */}
          <div className="lg:col-span-2">
            <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
              <CardContent className="p-6">
                <div className="flex items-start gap-6">
                  <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                    <AvatarImage src={profile.profileImage || undefined} alt={profile.name || profile.username} />
                    <AvatarFallback className="text-2xl">
                      {profile.name?.split(' ').map((n: string) => n[0]).join('') || profile.username?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h1 className={`text-3xl font-bold ${textColor} mb-2`}>
                      {profile.name || profile.username}
                    </h1>
                    <p className="text-base-content/70 text-lg mb-1">@{profile.username}</p>
                    {profile.profession && (
                      <div className="flex items-center gap-2 mb-3">
                        <Briefcase className="h-4 w-4 text-base-content/70" />
                        <span className="text-base-content/70">{profile.profession}</span>
                      </div>
                    )}
                    {profile.bio && (
                      <p className={`${textColor} leading-relaxed mb-4`}>{profile.bio}</p>
                    )}
                    {profile.pitchDescription && (
                      <div className={`p-4 rounded-lg bg-${pitchConfig.accentColor}-50 border border-${pitchConfig.accentColor}-200`}>
                        <p className={`text-${pitchConfig.accentColor}-800 font-medium`}>
                          {profile.pitchDescription}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Focus Areas */}
          <div>
            <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Focus Areas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {pitchConfig.focusAreas.map((area, index) => (
                    <Badge 
                      key={index} 
                      variant="outline"
                      className={`w-full justify-start p-2 border-${pitchConfig.accentColor}-200 text-${pitchConfig.accentColor}-700`}
                    >
                      <Star className="h-3 w-3 mr-2" />
                      {area}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Key Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {pitchModeLinks.map((link) => {
            const platformConfig = getPlatformConfig(link.platform);
            const PlatformIcon = platformConfig.icon;
            return (
              <Card 
                key={link.id}
                className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} hover:shadow-lg transition-shadow cursor-pointer`}
                onClick={() => handleLinkClick(link.id, link.url)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full bg-${pitchConfig.accentColor}-100 flex items-center justify-center`}>
                      <PlatformIcon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-semibold ${textColor} truncate`}>
                        {link.title}
                      </h3>
                      <p className="text-sm text-base-content/70 capitalize">
                        {platformConfig.name}
                      </p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-base-content/70">
                        <span>{link.clicks || 0} clicks</span>
                        <span>{link.views || 0} views</span>
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-base-content/70" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Additional Sections Based on Pitch Mode */}
        {pitchType === "startup" && spotlightProjects.length > 0 && (
          <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} mb-8`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Startup Projects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {spotlightProjects.slice(0, 4).map((project) => (
                  <div key={project.id} className="p-4 rounded-lg border">
                    <h4 className={`font-semibold ${textColor} mb-2`}>{project.title}</h4>
                    <p className="text-sm text-base-content/70 mb-3">{project.description}</p>
                    {project.url && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => window.open(project.url, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View Project
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Welcome Message */}
        {profile.welcomeMessage && (
          <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="h-5 w-5" />
                Welcome Message
              </CardTitle>
            </CardHeader>
            <CardContent>
              {profile.welcomeMessage && (profile.welcomeMessage.endsWith('.mp4') || profile.welcomeMessage.endsWith('.webm') || profile.welcomeMessage.endsWith('.ogg')) ? (
                <video controls className="w-full max-w-md">
                  <source src={profile.welcomeMessage} type="video/mp4" />
                  Your browser does not support the video element.
                </video>
              ) : profile.welcomeMessage && (profile.welcomeMessage.endsWith('.mp3') || profile.welcomeMessage.endsWith('.wav') || profile.welcomeMessage.endsWith('.m4a')) ? (
                <audio controls className="w-full">
                  <source src={profile.welcomeMessage} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              ) : (
                <p className={`${textColor} leading-relaxed`}>{profile.welcomeMessage}</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}