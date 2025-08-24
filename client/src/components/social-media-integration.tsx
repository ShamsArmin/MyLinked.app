import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Instagram, 
  Facebook, 
  Linkedin, 
  Twitter,
  ExternalLink,
  RefreshCw,
  Unlink,
  CheckCircle,
  AlertCircle,
  Video
} from "lucide-react";

interface SocialConnection {
  platform: string;
  platformUsername: string;
  connectedAt: string;
  lastSyncAt: string | null;
}

const PLATFORMS = [
  {
    id: 'instagram',
    name: 'Instagram',
    icon: Instagram,
    color: 'bg-gradient-to-r from-purple-500 to-pink-500',
    description: 'Share your photos and stories'
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: Facebook,
    color: 'bg-blue-600',
    description: 'Connect with your network'
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: Linkedin,
    color: 'bg-blue-700',
    description: 'Professional networking'
  },
  {
    id: 'twitter',
    name: 'Twitter',
    icon: Twitter,
    color: 'bg-blue-400',
    description: 'Share your thoughts'
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: Video,
    color: 'bg-black',
    description: 'Share your creative videos'
  }
];

export default function SocialMediaIntegration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  const [syncingPlatform, setSyncingPlatform] = useState<string | null>(null);

  // Fetch connected accounts
  const { data: connections = [], isLoading } = useQuery<SocialConnection[]>({
    queryKey: ["/api/social/connections"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Connect to social media platform
  const connectMutation = useMutation({
    mutationFn: async (platform: string) => {
      const response = await apiRequest("GET", `/api/social/connect/${platform}`);
      return response.json();
    },
    onSuccess: (data, platform) => {
      // Open OAuth authorization URL in a new window
      window.open(data.authUrl, "_blank", "width=600,height=700");
      setConnectingPlatform(platform);
      
      // Poll for connection status
      const pollInterval = setInterval(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/social/connections"] });
      }, 2000);

      // Stop polling after 5 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        setConnectingPlatform(null);
      }, 300000);
    },
    onError: (error: Error) => {
      setConnectingPlatform(null);
      toast({
        title: "Connection Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Disconnect from social media platform
  const disconnectMutation = useMutation({
    mutationFn: async (platform: string) => {
      await apiRequest("DELETE", `/api/social/disconnect/${platform}`);
    },
    onSuccess: (_, platform) => {
      queryClient.invalidateQueries({ queryKey: ["/api/social/connections"] });
      toast({
        title: "Disconnected",
        description: `Successfully disconnected from ${platform}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Disconnect Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Manually sync posts from connected platform
  const syncMutation = useMutation({
    mutationFn: async (platform: string) => {
      await apiRequest("POST", `/api/social/sync/${platform}`);
    },
    onSuccess: (_, platform) => {
      queryClient.invalidateQueries({ queryKey: ["/api/feed"] });
      toast({
        title: "Sync Complete",
        description: `Successfully synced posts from ${platform}`,
      });
      setSyncingPlatform(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Sync Failed",
        description: error.message,
        variant: "destructive",
      });
      setSyncingPlatform(null);
    },
  });

  const handleConnect = (platformId: string) => {
    connectMutation.mutate(platformId);
  };

  const handleDisconnect = (platformId: string) => {
    disconnectMutation.mutate(platformId);
  };

  const handleSync = (platformId: string) => {
    setSyncingPlatform(platformId);
    syncMutation.mutate(platformId);
  };

  const isConnected = (platformId: string) => {
    return connections.some(conn => conn.platform === platformId);
  };

  const getConnection = (platformId: string) => {
    return connections.find(conn => conn.platform === platformId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Social Media Integration</CardTitle>
          <CardDescription>Loading connections...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ExternalLink className="h-5 w-5" />
          Social Media Integration
        </CardTitle>
        <CardDescription>
          Connect your social media accounts to enable Instagram Content Preview and other social features
        </CardDescription>
        
        {/* OAuth Test Section */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-sm text-blue-900 mb-2">OAuth Test (Debug Mode)</h4>
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1"
              onClick={async () => {
                try {
                  const response = await fetch('/api/social/connect/facebook');
                  const data = await response.json();
                  if (data.authUrl) {
                    window.location.href = data.authUrl;
                  }
                } catch (error) {
                  console.error('Facebook OAuth error:', error);
                }
              }}
            >
              Test Facebook
            </Button>
            <Button
              size="sm"
              className="bg-pink-500 hover:bg-pink-600 text-white text-xs px-3 py-1"
              onClick={async () => {
                try {
                  const response = await fetch('/api/social/connect/instagram');
                  const data = await response.json();
                  if (data.authUrl) {
                    window.location.href = data.authUrl;
                  }
                } catch (error) {
                  console.error('Instagram OAuth error:', error);
                }
              }}
            >
              Test Instagram
            </Button>
            <Button
              size="sm"
              className="bg-black hover:bg-gray-800 text-white text-xs px-3 py-1"
              onClick={async () => {
                try {
                  const response = await fetch('/api/social/connect/tiktok');
                  const data = await response.json();
                  if (data.authUrl) {
                    window.location.href = data.authUrl;
                  }
                } catch (error) {
                  console.error('TikTok OAuth error:', error);
                }
              }}
            >
              Test TikTok
            </Button>
          </div>
          <p className="text-xs text-blue-700 mt-2">
            These buttons will take you through OAuth authorization and show debug data
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {PLATFORMS.map((platform) => {
          const Icon = platform.icon;
          const connected = isConnected(platform.id);
          const connection = getConnection(platform.id);
          const isConnecting = connectingPlatform === platform.id;
          const isSyncing = syncingPlatform === platform.id;

          return (
            <div key={platform.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${platform.color} text-white`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{platform.name}</h3>
                    {connected && (
                      <Badge variant="secondary" className="text-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Connected
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-base-content/70">
                    {connected && connection ? (
                      <>@{connection.platformUsername} • Connected {formatDate(connection.connectedAt)}</>
                    ) : (
                      platform.description
                    )}
                  </p>
                  {connected && connection?.lastSyncAt && (
                    <p className="text-xs text-base-content/70">
                      Last sync: {formatDate(connection.lastSyncAt)}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {connected ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSync(platform.id)}
                      disabled={isSyncing || syncMutation.isPending}
                    >
                      {isSyncing ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                      Sync
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDisconnect(platform.id)}
                      disabled={disconnectMutation.isPending}
                    >
                      <Unlink className="h-4 w-4" />
                      Disconnect
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleConnect(platform.id)}
                    disabled={isConnecting || connectMutation.isPending}
                    className={platform.color}
                  >
                    {isConnecting ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <ExternalLink className="h-4 w-4 mr-2" />
                    )}
                    Connect
                  </Button>
                )}
              </div>
            </div>
          );
        })}

        <Separator />

        <div className="space-y-2">
          <h4 className="font-medium text-sm">Integration Status</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-base-content/70">Connected accounts:</span>
              <span className="ml-2 font-medium">{connections.length}/4</span>
            </div>
            <div>
              <span className="text-base-content/70">Auto-sync:</span>
              <span className="ml-2 font-medium">Every 30 minutes</span>
            </div>
          </div>
          
          {connections.length === 0 && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <p className="text-sm text-yellow-800">
                Connect at least one social media account to enable Content Preview features
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}