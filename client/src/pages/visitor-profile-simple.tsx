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

export default function VisitorProfileSimple() {
  const { username } = useParams();
  const { getPlatformConfig } = usePlatformIcons();

  console.log("VisitorProfile: Rendering with username:", username);

  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/profile", username],
    queryFn: async () => {
      console.log("VisitorProfile: Fetching data for", username);
      const response = await fetch(`/api/profile/${username}`);
      if (!response.ok) {
        throw new Error('Profile not found');
      }
      const result = await response.json();
      console.log("VisitorProfile: Received data:", result);
      return result;
    },
    enabled: !!username,
  });

  console.log("VisitorProfile: Current state:", { isLoading, error, data });

  if (isLoading) {
    console.log("VisitorProfile: Showing loading state");
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    console.log("VisitorProfile: Showing error state:", error);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Profile Not Found</h1>
          <p className="text-gray-600 mb-6">The profile you're looking for doesn't exist.</p>
          <p className="text-sm text-red-500 mb-4">Error: {error.message}</p>
          <Button onClick={() => window.location.href = '/'}>Go Home</Button>
        </div>
      </div>
    );
  }

  if (!data) {
    console.log("VisitorProfile: No data received");
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No Data</h1>
          <p className="text-gray-600 mb-6">No profile data was received.</p>
          <Button onClick={() => window.location.href = '/'}>Go Home</Button>
        </div>
      </div>
    );
  }

  if (!data.profile) {
    console.log("VisitorProfile: No profile in data:", data);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Profile Not Available</h1>
          <p className="text-gray-600 mb-6">Profile data is not available.</p>
          <pre className="text-xs bg-gray-100 p-2 rounded mb-4 text-left">
            {JSON.stringify(data, null, 2)}
          </pre>
          <Button onClick={() => window.location.href = '/'}>Go Home</Button>
        </div>
      </div>
    );
  }

  console.log("VisitorProfile: Rendering profile for:", data.profile.username);

  const { profile, links = [], spotlightProjects = [], referralLinks = [], socialPosts = [] } = data;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple Header */}
      <div className="bg-indigo-600 text-white p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={profile.profileImage} alt={profile.name} />
              <AvatarFallback>
                {profile.name?.split(' ').map((n: string) => n[0]).join('') || profile.username?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">{profile.name || profile.username}</h1>
              <p className="opacity-90">@{profile.username}</p>
              {profile.bio && <p className="opacity-80 mt-1">{profile.bio}</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Links */}
            {links.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ExternalLink className="h-5 w-5" />
                    Links ({links.length})
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
                          className="w-full justify-between h-auto p-4"
                          onClick={() => window.open(link.url, '_blank')}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="h-5 w-5" />
                            <div className="text-left">
                              <div className="font-medium">{link.title}</div>
                              {link.description && (
                                <div className="text-sm text-muted-foreground">{link.description}</div>
                              )}
                            </div>
                          </div>
                          <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Debug Info */}
            <Card>
              <CardHeader>
                <CardTitle>Debug Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p><strong>Username from URL:</strong> {username}</p>
                  <p><strong>Profile loaded:</strong> {profile.username}</p>
                  <p><strong>Links count:</strong> {links.length}</p>
                  <p><strong>Projects count:</strong> {spotlightProjects.length}</p>
                  <p><strong>Referral links count:</strong> {referralLinks.length}</p>
                  <p><strong>Social posts count:</strong> {socialPosts.length}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Links</span>
                    <span>{links.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Projects</span>
                    <span>{spotlightProjects.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Posts</span>
                    <span>{socialPosts.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}