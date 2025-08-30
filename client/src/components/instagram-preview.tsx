import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Instagram, ExternalLink, RefreshCw, Settings, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface InstagramPreview {
  id: number;
  userId: number;
  postId: string;
  imageUrl: string;
  thumbnailUrl: string | null;
  postUrl: string;
  caption: string | null;
  isEnabled: boolean;
  postedAt: string;
  fetchedAt: string;
  updatedAt: string;
}

interface InstagramPreviewProps {
  isOwner?: boolean;
  userId?: number;
}

export function InstagramPreview({ isOwner = false, userId }: InstagramPreviewProps) {
  const { toast } = useToast();
  const [showSettings, setShowSettings] = useState(false);

  // Fetch Instagram preview
  const { data: preview, isLoading } = useQuery<InstagramPreview | null>({
    queryKey: ["/api/instagram/preview", userId].filter(Boolean),
    enabled: !!userId,
    retry: 0,
    suspense: false,
    useErrorBoundary: false,
    onError: () => {},
  });

  // Sync Instagram content
  const syncMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/instagram/sync");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/instagram/preview"] });
      toast({
        title: "Instagram Synced",
        description: "Successfully updated your latest Instagram post preview",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Sync Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Toggle preview visibility
  const toggleMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      await apiRequest("PATCH", "/api/instagram/preview/toggle", { enabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/instagram/preview"] });
      toast({
        title: "Settings Updated",
        description: "Instagram preview visibility updated",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete preview
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", "/api/instagram/preview");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/instagram/preview"] });
      toast({
        title: "Preview Deleted",
        description: "Instagram preview has been removed",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleToggleVisibility = () => {
    if (preview) {
      toggleMutation.mutate(!preview.isEnabled);
    }
  };

  const handleSync = () => {
    syncMutation.mutate();
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to remove the Instagram preview?")) {
      deleteMutation.mutate();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Don't show if no preview and not owner
  if (!preview && !isOwner) {
    return null;
  }

  // Don't show if preview exists but is disabled and user is not owner
  if (preview && !preview.isEnabled && !isOwner) {
    return null;
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Instagram className="h-5 w-5 text-pink-500" />
            Instagram Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="bg-gray-200 aspect-square rounded-lg mb-3"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2">
          <Instagram className="h-5 w-5 text-pink-500" />
          Instagram Preview
        </CardTitle>
        
        {isOwner && (
          <div className="flex items-center gap-2">
            {preview && (
              <>
                <Badge variant={preview.isEnabled ? "default" : "secondary"}>
                  {preview.isEnabled ? <Eye className="h-3 w-3 mr-1" /> : <EyeOff className="h-3 w-3 mr-1" />}
                  {preview.isEnabled ? "Visible" : "Hidden"}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettings(!showSettings)}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Settings Panel for Owner */}
        {isOwner && showSettings && (
          <div className="p-4 bg-gray-50 rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="instagram-visibility">Show on Profile</Label>
              <Switch
                id="instagram-visibility"
                checked={preview?.isEnabled ?? false}
                onCheckedChange={handleToggleVisibility}
                disabled={toggleMutation.isPending}
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleSync}
                disabled={syncMutation.isPending}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                Sync Latest Post
              </Button>
              
              {preview && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                >
                  Remove Preview
                </Button>
              )}
            </div>
            
            <p className="text-xs text-gray-600">
              Connect your Instagram account in Social Media Integration to enable this feature.
            </p>
          </div>
        )}

        {/* Preview Content */}
        {preview ? (
          <div className="space-y-3">
            <div 
              className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer group"
              onClick={() => window.open(preview.postUrl, '_blank')}
            >
              <img
                src={preview.thumbnailUrl || preview.imageUrl}
                alt="Latest Instagram post"
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                <ExternalLink className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            
            {preview.caption && (
              <p className="text-sm text-gray-700 line-clamp-3">
                {preview.caption}
              </p>
            )}
            
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Posted {formatDate(preview.postedAt)}</span>
              {isOwner && (
                <span>Synced {formatDate(preview.fetchedAt)}</span>
              )}
            </div>
          </div>
        ) : isOwner ? (
          <div className="text-center py-8 space-y-4">
            <Instagram className="h-12 w-12 text-gray-300 mx-auto" />
            <div>
              <h3 className="font-medium text-gray-900 mb-1">No Instagram Preview</h3>
              <p className="text-sm text-gray-600 mb-4">
                Connect your Instagram account to show your latest post preview on your profile.
              </p>
              <Button
                onClick={handleSync}
                disabled={syncMutation.isPending}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                Sync Instagram
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}