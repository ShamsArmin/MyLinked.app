import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Loader2, Users, BarChart3, Settings, Wifi, FileText, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Redirect } from "wouter";

interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  bio: string;
  location: string;
  isAdmin: boolean;
  isActive: boolean;
  lastLoginAt: string;
  createdAt: string;
  isCollaborative: boolean;
  connectionsCount: number;
  linksCount: number;
}

interface AnalyticsData {
  totalUsers: number;
  newUsersThisWeek: number;
  activeUsers: number;
  totalProfileVisits: number;
  totalLinkClicks: number;
}

interface FeatureToggle {
  id: number;
  featureName: string;
  isEnabled: boolean;
  description: string;
  updatedBy: number;
  updatedAt: string;
}

interface SocialPlatform {
  name: string;
  status: string;
  connectedUsers: number;
  lastChecked: string;
}

interface SystemLog {
  id: number;
  level: string;
  message: string;
  source: string;
  userId: number;
  metadata: any;
  createdAt: string;
}

export default function AdminPanel() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Redirect if not admin
  if (!authLoading && (!user || !user.isAdmin)) {
    return <Redirect to="/" />;
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Users data
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    enabled: !!user?.isAdmin
  });

  // Analytics data
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ["/api/admin/analytics"],
    enabled: !!user?.isAdmin
  });

  // Feature toggles
  const { data: featuresData, isLoading: featuresLoading } = useQuery({
    queryKey: ["/api/admin/features"],
    enabled: !!user?.isAdmin
  });

  // Social status
  const { data: socialData, isLoading: socialLoading } = useQuery({
    queryKey: ["/api/admin/social-status"],
    enabled: !!user?.isAdmin
  });

  // System logs
  const { data: logsData, isLoading: logsLoading } = useQuery({
    queryKey: ["/api/admin/logs"],
    enabled: !!user?.isAdmin
  });

  // Feature toggle mutation
  const toggleFeatureMutation = useMutation({
    mutationFn: async ({ featureName, isEnabled }: { featureName: string; isEnabled: boolean }) => {
      await apiRequest("PATCH", `/api/admin/features/${featureName}`, { isEnabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/features"] });
      toast({
        title: "Feature updated",
        description: "Feature toggle has been updated successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update feature toggle",
        variant: "destructive"
      });
    }
  });

  // Deactivate user mutation
  const deactivateUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      await apiRequest("PATCH", `/api/admin/users/${userId}/deactivate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User deactivated",
        description: "User has been deactivated successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to deactivate user",
        variant: "destructive"
      });
    }
  });

  // Reactivate user mutation
  const reactivateUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      await apiRequest("PATCH", `/api/admin/users/${userId}/reactivate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User reactivated",
        description: "User has been reactivated successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reactivate user",
        variant: "destructive"
      });
    }
  });

  // Promote user mutation
  const promoteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      await apiRequest("PATCH", `/api/admin/users/${userId}/promote`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User promoted",
        description: "User has been promoted to admin successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to promote user",
        variant: "destructive"
      });
    }
  });

  // System maintenance mutation
  const maintenanceMutation = useMutation({
    mutationFn: async (action: string) => {
      await apiRequest("POST", "/api/admin/maintenance", { action });
    },
    onSuccess: (_, action) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/logs"] });
      toast({
        title: "Maintenance completed",
        description: `${action.replace('_', ' ')} completed successfully`
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to perform maintenance",
        variant: "destructive"
      });
    }
  });

  const users: User[] = (usersData as any)?.users || [];
  const analytics: AnalyticsData = (analyticsData as any) || {
    totalUsers: 0,
    newUsersThisWeek: 0,
    activeUsers: 0,
    totalProfileVisits: 0,
    totalLinkClicks: 0
  };
  const features: FeatureToggle[] = (featuresData as any) || [];
  const platforms: SocialPlatform[] = (socialData as any)?.platforms || [];
  const logs: SystemLog[] = (logsData as any)?.logs || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Admin Panel</h1>
            <p className="text-slate-600 mt-1">System management and analytics dashboard</p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              Admin Access
            </Badge>
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Users</span>
            </TabsTrigger>
            <TabsTrigger value="features" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Features</span>
            </TabsTrigger>
            <TabsTrigger value="social" className="flex items-center space-x-2">
              <Wifi className="h-4 w-4" />
              <span>Social APIs</span>
            </TabsTrigger>
            <TabsTrigger value="maintenance" className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4" />
              <span>Maintenance</span>
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>System Logs</span>
            </TabsTrigger>
          </TabsList>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-base-content/70" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analyticsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : analytics.totalUsers || 0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">New This Week</CardTitle>
                  <Users className="h-4 w-4 text-base-content/70" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analyticsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : analytics.newUsersThisWeek || 0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                  <Users className="h-4 w-4 text-base-content/70" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analyticsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : analytics.activeUsers || 0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Profile Visits</CardTitle>
                  <BarChart3 className="h-4 w-4 text-base-content/70" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analyticsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : analytics.totalProfileVisits || 0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Link Clicks</CardTitle>
                  <BarChart3 className="h-4 w-4 text-base-content/70" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analyticsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : analytics.totalLinkClicks || 0}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>View and manage all platform users</CardDescription>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {users.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium">{user.name || user.username}</h3>
                            {user.isAdmin && (
                              <Badge variant="secondary" className="bg-blue-50 text-blue-700">Admin</Badge>
                            )}
                            {!user.isActive && (
                              <Badge variant="destructive">Inactive</Badge>
                            )}
                            {user.isCollaborative && (
                              <Badge variant="outline">Collaborative</Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-600">@{user.username}</p>
                          <p className="text-sm text-slate-500">{user.email}</p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500">
                            <span>{user.connectionsCount} connections</span>
                            <span>{user.linksCount} links</span>
                            <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {!user.isActive && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => reactivateUserMutation.mutate(user.id)}
                              disabled={reactivateUserMutation.isPending}
                              className="text-green-600 border-green-300 hover:bg-green-50"
                            >
                              {reactivateUserMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Reactivate"
                              )}
                            </Button>
                          )}
                          {user.isActive && !user.isAdmin && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deactivateUserMutation.mutate(user.id)}
                              disabled={deactivateUserMutation.isPending}
                              className="text-red-600 border-red-300 hover:bg-red-50"
                            >
                              {deactivateUserMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Deactivate"
                              )}
                            </Button>
                          )}
                          {!user.isAdmin && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => promoteUserMutation.mutate(user.id)}
                              disabled={promoteUserMutation.isPending}
                              className="text-blue-600 border-blue-300 hover:bg-blue-50"
                            >
                              {promoteUserMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Promote to Admin"
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Features Tab */}
          <TabsContent value="features">
            <Card>
              <CardHeader>
                <CardTitle>Feature Toggles</CardTitle>
                <CardDescription>Enable or disable platform features</CardDescription>
              </CardHeader>
              <CardContent>
                {featuresLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {features.map((feature) => (
                      <div key={feature.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h3 className="font-medium">{feature.featureName.replace('FEATURE_', '').replace(/_/g, ' ')}</h3>
                          <p className="text-sm text-slate-600">{feature.description}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            Last updated: {new Date(feature.updatedAt).toLocaleString()}
                          </p>
                        </div>
                        <Switch
                          checked={feature.isEnabled}
                          onCheckedChange={(checked) => 
                            toggleFeatureMutation.mutate({ 
                              featureName: feature.featureName, 
                              isEnabled: checked 
                            })
                          }
                          disabled={toggleFeatureMutation.isPending}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Social APIs Tab */}
          <TabsContent value="social">
            <Card>
              <CardHeader>
                <CardTitle>Social Media APIs</CardTitle>
                <CardDescription>Monitor social platform connection status</CardDescription>
              </CardHeader>
              <CardContent>
                {socialLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {platforms.map((platform) => (
                      <div key={platform.name} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            platform.status === 'connected' ? 'bg-green-500' : 'bg-red-500'
                          }`} />
                          <div>
                            <h3 className="font-medium">{platform.name}</h3>
                            <p className="text-sm text-slate-600">
                              {platform.connectedUsers} connected users
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {platform.status === 'connected' ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Maintenance Tab */}
          <TabsContent value="maintenance">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Maintenance</CardTitle>
                  <CardDescription>Perform system cleanup and maintenance tasks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h3 className="font-medium">Clear Old Logs</h3>
                        <p className="text-sm text-slate-600">Remove system logs older than 30 days</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => maintenanceMutation.mutate('clear_old_logs')}
                        disabled={maintenanceMutation.isPending}
                      >
                        {maintenanceMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Clear Logs"
                        )}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h3 className="font-medium">Cleanup Sessions</h3>
                        <p className="text-sm text-slate-600">Remove inactive user sessions</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => maintenanceMutation.mutate('cleanup_inactive_sessions')}
                        disabled={maintenanceMutation.isPending}
                      >
                        {maintenanceMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Cleanup Sessions"
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Administrative shortcuts and utilities</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => {
                        queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
                        queryClient.invalidateQueries({ queryKey: ["/api/admin/analytics"] });
                        queryClient.invalidateQueries({ queryKey: ["/api/admin/social-status"] });
                        toast({
                          title: "Data refreshed",
                          description: "All admin data has been refreshed"
                        });
                      }}
                    >
                      Refresh All Data
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => {
                        const currentTime = new Date().toLocaleString();
                        navigator.clipboard.writeText(`Admin Panel Report - ${currentTime}\n\nTotal Users: ${analytics.totalUsers}\nActive Users: ${analytics.activeUsers}\nTotal Clicks: ${analytics.totalLinkClicks}\nProfile Visits: ${analytics.totalProfileVisits}`);
                        toast({
                          title: "Report copied",
                          description: "System report copied to clipboard"
                        });
                      }}
                    >
                      Copy System Report
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* System Logs Tab */}
          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle>System Logs</CardTitle>
                <CardDescription>Recent system events and activities</CardDescription>
              </CardHeader>
              <CardContent>
                {logsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {logs.map((log) => (
                      <div key={log.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          log.level === 'error' ? 'bg-red-500' :
                          log.level === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                        }`} />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">
                              {log.level.toUpperCase()}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {log.source}
                            </Badge>
                            <span className="text-xs text-slate-500">
                              {new Date(log.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm mt-1">{log.message}</p>
                          {log.metadata && (
                            <pre className="text-xs text-slate-600 mt-1 bg-slate-50 p-2 rounded overflow-x-auto">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}