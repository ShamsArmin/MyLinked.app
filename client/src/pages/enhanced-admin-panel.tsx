import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { 
  Crown, Users, Activity, Settings, Shield, AlertTriangle, 
  TrendingUp, Database, Globe, Link, Eye, BarChart, 
  PieChart, Calendar, Download, Upload, Server, 
  Wifi, HardDrive, Cpu, Monitor, Flag
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function EnhancedAdminPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [userFilter, setUserFilter] = useState("all");
  const [timeRange, setTimeRange] = useState("7d");

  // Advanced queries
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/enhanced/users"],
    enabled: user?.role === 'admin',
  });

  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ["/api/admin/enhanced/analytics", timeRange],
    enabled: user?.role === 'admin',
  });

  const { data: systemMetrics, isLoading: systemLoading } = useQuery({
    queryKey: ["/api/admin/system/metrics"],
    enabled: user?.role === 'admin',
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: userActivity, isLoading: activityLoading } = useQuery({
    queryKey: ["/api/admin/user-activity", timeRange],
    enabled: user?.role === 'admin',
  });

  const { data: linkAnalytics, isLoading: linkLoading } = useQuery({
    queryKey: ["/api/admin/link-analytics"],
    enabled: user?.role === 'admin',
  });

  const { data: platformStats, isLoading: platformLoading } = useQuery({
    queryKey: ["/api/admin/platform-stats"],
    enabled: user?.role === 'admin',
  });

  const { data: auditLogs, isLoading: auditLoading } = useQuery({
    queryKey: ["/api/admin/audit-logs"],
    enabled: user?.role === 'admin',
  });

  const { data: userReports, isLoading: reportsLoading } = useQuery({
    queryKey: ["/api/admin/user-reports"],
    enabled: user?.role === 'admin',
  });

  // Mutations for advanced operations
  const bulkUserMutation = useMutation({
    mutationFn: async ({ userIds, action }: { userIds: number[], action: string }) => {
      const response = await apiRequest("POST", "/api/admin/bulk-users", { userIds, action });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/enhanced/users"] });
      toast({ title: "Success", description: "Bulk operation completed" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const exportDataMutation = useMutation({
    mutationFn: async (dataType: string) => {
      const response = await apiRequest("POST", `/api/admin/export/${dataType}`);
      return response.blob();
    },
    onSuccess: (blob, dataType) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${dataType}-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({ title: "Success", description: "Data exported successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const systemMaintenanceMutation = useMutation({
    mutationFn: async (action: string) => {
      const response = await apiRequest("POST", "/api/admin/maintenance", { action });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/system/metrics"] });
      toast({ title: "Success", description: "Maintenance task completed" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateReportMutation = useMutation({
    mutationFn: async ({ reportId, status, notes }: { reportId: number, status: string, notes?: string }) => {
      const response = await apiRequest("PUT", `/api/admin/user-reports/${reportId}`, { 
        status, 
        adminNotes: notes 
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/user-reports"] });
      toast({ title: "Success", description: "Report status updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 mx-auto text-red-500" />
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Administrator privileges required</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const users = Array.isArray(usersData) ? usersData : (usersData?.users || []);
  const analytics = analyticsData || {
    totalUsers: 0,
    newUsersThisWeek: 0,
    totalViews: 0,
    totalClicks: 0,
    avgCTR: 0,
    dailyActiveUsers: 0,
    weeklyActiveUsers: 0,
    monthlyActiveUsers: 0,
    conversionRate: 0,
    growthRate: 0,
    totalProfileViews: 0,
    totalLinkClicks: 0
  };
  const metrics = systemMetrics || {
    health: 'Healthy',
    uptime: 99,
    cpuUsage: 15,
    memoryUsage: 45,
    dbConnections: 5,
    dbUsage: 25
  };
  const activity = userActivity || [];
  const links = linkAnalytics || {
    totalLinks: 0,
    totalClicks: 0,
    averageClicks: 0,
    topPerforming: []
  };
  const platform = platformStats || {
    distribution: []
  };
  const logs = Array.isArray(auditLogs) ? auditLogs : [];

  const filteredUsers = users.filter((u: any) => {
    const matchesSearch = u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = userFilter === "all" || 
                         (userFilter === "admin" && u.role === 'admin') ||
                         (userFilter === "active" && u.isActive !== false) ||
                         (userFilter === "inactive" && u.isActive === false);
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-black dark:via-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Enhanced Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <Crown className="h-8 w-8 text-amber-500" />
              Advanced Administration
            </h1>
            <p className="text-slate-600 mt-1">Comprehensive system management and analytics</p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d">Last 24h</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="outline" className="text-amber-600 border-amber-200">
              Super Administrator
            </Badge>
          </div>
        </div>

        {/* System Health Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Server className="h-4 w-4" />
                System Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {metrics.health || "Healthy"}
              </div>
              <Progress value={metrics.uptime || 99} className="mt-2" />
              <p className="text-xs text-slate-500 mt-1">
                {metrics.uptime || 99}% uptime
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Database className="h-4 w-4" />
                Database
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {metrics.dbConnections || 0}
              </div>
              <p className="text-xs text-slate-500">Active connections</p>
              <Progress value={metrics.dbUsage || 25} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Cpu className="h-4 w-4" />
                CPU Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {metrics.cpuUsage || 15}%
              </div>
              <Progress value={metrics.cpuUsage || 15} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                Memory
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {metrics.memoryUsage || 45}%
              </div>
              <Progress value={metrics.memoryUsage || 45} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <Flag className="h-4 w-4" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="links" className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              Links
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              System
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Logs
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    User Growth
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total Users:</span>
                      <span className="font-semibold">{analytics.totalUsers || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>New This Week:</span>
                      <span className="font-semibold text-green-600">{analytics.newUsersThisWeek || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Growth Rate:</span>
                      <span className="font-semibold text-blue-600">{analytics.growthRate || 0}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Platform Engagement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total Views:</span>
                      <span className="font-semibold">{analytics.totalViews || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Clicks:</span>
                      <span className="font-semibold">{analytics.totalClicks || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg CTR:</span>
                      <span className="font-semibold">{analytics.avgCTR || 0}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Platform Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {platform.distribution?.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between">
                        <span>{item.platform}:</span>
                        <span className="font-semibold">{item.count}</span>
                      </div>
                    )) || <p className="text-slate-500">No data available</p>}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Enhanced Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Advanced User Management</CardTitle>
                    <CardDescription>Comprehensive user administration and analytics</CardDescription>
                  </div>
                  <div className="flex gap-4">
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-64"
                    />
                    <Select value={userFilter} onValueChange={setUserFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        <SelectItem value="admin">Admins</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportDataMutation.mutate("users")}
                      disabled={exportDataMutation.isPending}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="text-center py-8">Loading users...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Links</TableHead>
                          <TableHead>Views</TableHead>
                          <TableHead>Score</TableHead>
                          <TableHead>Joined</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((user: any) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                {user.profileImage ? (
                                  <img
                                    src={user.profileImage}
                                    alt={user.name}
                                    className="h-8 w-8 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center">
                                    <Users className="h-4 w-4 text-slate-500" />
                                  </div>
                                )}
                                <div>
                                  <div className="font-medium">{user.name}</div>
                                  <div className="text-sm text-slate-500">@{user.username}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <Badge variant={user.role === 'admin' ? "default" : "secondary"}>
                                {user.role === 'admin' && <Crown className="h-3 w-3 mr-1" />}
                                {user.role === 'admin' ? "Admin" : "User"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="default" className="bg-green-100 text-green-800">
                                Active
                              </Badge>
                            </TableCell>
                            <TableCell>{user.linkCount || 0}</TableCell>
                            <TableCell>{user.totalViews || 0}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Progress value={user.socialScore || 0} className="w-16" />
                                <span className="text-sm">{user.socialScore || 0}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm">
                                  View
                                </Button>
                                <Button variant="outline" size="sm">
                                  Edit
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Reports Tab */}
          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flag className="h-5 w-5" />
                  User Reports Management
                </CardTitle>
                <CardDescription>Review and manage user reports submitted by the community</CardDescription>
              </CardHeader>
              <CardContent>
                {reportsLoading ? (
                  <div className="text-center py-8">Loading reports...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Reporter</TableHead>
                          <TableHead>Reported User</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Array.isArray(userReports) && userReports.length > 0 ? userReports.map((report: any) => (
                          <TableRow key={report.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{report.reporterName}</div>
                                <div className="text-sm text-slate-500">{report.reporterEmail}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">User ID: {report.reportedUserId}</div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {report.reason}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={
                                  report.status === 'pending' ? 'secondary' :
                                  report.status === 'resolved' ? 'default' :
                                  report.status === 'dismissed' ? 'outline' : 'destructive'
                                }
                              >
                                {report.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {report.createdAt ? new Date(report.createdAt).toLocaleDateString() : 'N/A'}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => updateReportMutation.mutate({ 
                                    reportId: report.id, 
                                    status: 'resolved' 
                                  })}
                                  disabled={updateReportMutation.isPending || report.status === 'resolved'}
                                >
                                  Resolve
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => updateReportMutation.mutate({ 
                                    reportId: report.id, 
                                    status: 'dismissed' 
                                  })}
                                  disabled={updateReportMutation.isPending || report.status === 'dismissed'}
                                >
                                  Dismiss
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )) : (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8">
                              No user reports available
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Enhanced Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>User Activity Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Daily Active Users</span>
                      <span className="font-semibold">{analytics.dailyActiveUsers || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Weekly Active Users</span>
                      <span className="font-semibold">{analytics.weeklyActiveUsers || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Monthly Active Users</span>
                      <span className="font-semibold">{analytics.monthlyActiveUsers || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Platform Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Total Profile Views</span>
                      <span className="font-semibold">{analytics.totalProfileViews || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Total Link Clicks</span>
                      <span className="font-semibold">{analytics.totalLinkClicks || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Conversion Rate</span>
                      <span className="font-semibold">{analytics.conversionRate || 0}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* System Management Tab */}
          <TabsContent value="system" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Maintenance</CardTitle>
                  <CardDescription>Perform system maintenance tasks</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button
                      onClick={() => systemMaintenanceMutation.mutate("clear-cache")}
                      disabled={systemMaintenanceMutation.isPending}
                      className="w-full"
                    >
                      Clear System Cache
                    </Button>
                    <Button
                      onClick={() => systemMaintenanceMutation.mutate("optimize-db")}
                      disabled={systemMaintenanceMutation.isPending}
                      className="w-full"
                    >
                      Optimize Database
                    </Button>
                    <Button
                      onClick={() => systemMaintenanceMutation.mutate("cleanup-logs")}
                      disabled={systemMaintenanceMutation.isPending}
                      className="w-full"
                    >
                      Cleanup Old Logs
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Data Export</CardTitle>
                  <CardDescription>Export platform data for analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button
                      onClick={() => exportDataMutation.mutate("users")}
                      disabled={exportDataMutation.isPending}
                      className="w-full"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Users Data
                    </Button>
                    <Button
                      onClick={() => exportDataMutation.mutate("analytics")}
                      disabled={exportDataMutation.isPending}
                      className="w-full"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Analytics Data
                    </Button>
                    <Button
                      onClick={() => exportDataMutation.mutate("links")}
                      disabled={exportDataMutation.isPending}
                      className="w-full"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Links Data
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Audit Logs Tab */}
          <TabsContent value="logs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Audit Logs</CardTitle>
                <CardDescription>Monitor system activities and administrative actions</CardDescription>
              </CardHeader>
              <CardContent>
                {auditLoading ? (
                  <div className="text-center py-8">Loading audit logs...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Timestamp</TableHead>
                          <TableHead>Action</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Resource</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {logs.length > 0 ? logs.map((log: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell>
                              {new Date(log.timestamp).toLocaleString()}
                            </TableCell>
                            <TableCell>{log.action}</TableCell>
                            <TableCell>{log.user || 'System'}</TableCell>
                            <TableCell>{log.resource}</TableCell>
                            <TableCell>
                              <Badge variant={log.status === 'success' ? 'default' : 'destructive'}>
                                {log.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        )) : (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8">
                              No audit logs available
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
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