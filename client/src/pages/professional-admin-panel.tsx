import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { 
  Users, 
  BarChart3, 
  Settings, 
  Globe, 
  Activity, 
  FileText,
  Shield,
  UserCheck,
  UserX,
  Download,
  Trash2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Crown,
  RefreshCw,
  Database,
  Server,
  Eye,
  Mail,
  Phone,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Zap,
  Lock,
  Unlock,
  UserPlus,
  MessageSquare,
  Bell,
  Search,
  Filter,
  ChevronDown,
  PieChart,
  LineChart,
  BarChart,
  Edit,
  Save,
  X,
  Plus,
  Minus,
  Home,
  LogOut
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Redirect, Link } from "wouter";
import { Loader2 } from "lucide-react";
import { DirectSupportManager } from "@/components/direct-support-manager";
import { EmailManagement } from "@/components/email-management";

// Enhanced interfaces for comprehensive admin panel
interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  isAdmin: boolean;
  isActive: boolean;
  role: 'admin' | 'moderator' | 'developer' | 'user';
  permissions: string[];
  lastLoginAt: string;
  createdAt: string;
  profileImage?: string;
  bio?: string;
  socialScore: number;
  totalLinks: number;
  totalClicks: number;
  totalViews: number;
}

interface AnalyticsData {
  totalUsers: number;
  newUsersThisWeek: number;
  activeUsers: number;
  totalProfileVisits: number;
  totalLinkClicks: number;
  avgSessionDuration: number;
  topPerformingLinks: Array<{
    id: number;
    title: string;
    clicks: number;
    platform: string;
  }>;
  userGrowthData: Array<{
    date: string;
    users: number;
    active: number;
  }>;
  platformStats: Array<{
    platform: string;
    users: number;
    engagement: number;
  }>;
}

interface SystemMetrics {
  serverUptime: number;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  databaseConnections: number;
  apiResponseTime: number;
  errorRate: number;
  requestsPerMinute: number;
}

interface FeatureToggle {
  id: number;
  featureName: string;
  enabled: boolean;
  description: string;
  rolloutPercentage: number;
  targetUsers: string[];
}

interface AuditLog {
  id: number;
  userId: number;
  userName: string;
  action: string;
  resource: string;
  details: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
}

interface RolePermission {
  id: number;
  name: string;
  displayName: string;
  description: string | null;
  permissions: string[];
  members: number;
  isSystem: boolean;
}

export default function ProfessionalAdminPanel() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [isEditingUser, setIsEditingUser] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<User>>({});

  // Redirect if not admin
  if (!authLoading && (!user || (user.role !== 'admin' && user.role !== 'super_admin'))) {
    return <Redirect to="/" />;
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Fetch comprehensive admin data
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ["/api/admin/analytics"],
    enabled: user && (user.role === 'admin' || user.role === 'super_admin')
  });

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    enabled: user && (user.role === 'admin' || user.role === 'super_admin')
  });

  const { data: systemMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["/api/admin/system-metrics"],
    enabled: user && (user.role === 'admin' || user.role === 'super_admin')
  });

  const { data: featuresData, isLoading: featuresLoading } = useQuery({
    queryKey: ["/api/admin/features"],
    enabled: user && (user.role === 'admin' || user.role === 'super_admin')
  });

  const { data: auditLogs, isLoading: logsLoading } = useQuery({
    queryKey: ["/api/admin/audit-logs"],
    enabled: user && (user.role === 'admin' || user.role === 'super_admin')
  });

  const { data: rolesData, isLoading: rolesLoading } = useQuery({
    queryKey: ["/api/admin/roles"],
    enabled: user && (user.role === 'admin' || user.role === 'super_admin')
  });

  // Mutations for user management
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, updates }: { userId: number; updates: Partial<User> }) => {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to update user');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User updated successfully" });
      setIsEditingUser(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error updating user", description: error.message, variant: "destructive" });
    }
  });

  const bulkUserActionMutation = useMutation({
    mutationFn: async ({ userIds, action }: { userIds: number[]; action: string }) => {
      const response = await fetch('/api/admin/users/bulk-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds, action }),
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to perform bulk action');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Bulk action completed successfully" });
      setSelectedUsers([]);
    },
    onError: (error: Error) => {
      toast({ title: "Error performing bulk action", description: error.message, variant: "destructive" });
    }
  });

  const toggleFeatureMutation = useMutation({
    mutationFn: async ({ featureId, enabled }: { featureId: number; enabled: boolean }) => {
      const response = await fetch(`/api/admin/features/${featureId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to toggle feature');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/features"] });
      toast({ title: "Feature updated successfully" });
    }
  });

  // Process data with fallbacks
  const users: User[] = (usersData as any)?.users || [];
  const analytics: AnalyticsData = (analyticsData as any) || {
    totalUsers: 0,
    newUsersThisWeek: 0,
    activeUsers: 0,
    totalProfileVisits: 0,
    totalLinkClicks: 0,
    avgSessionDuration: 0,
    topPerformingLinks: [],
    userGrowthData: [],
    platformStats: []
  };
  const metrics: SystemMetrics = (systemMetrics as any) || {
    serverUptime: 0,
    cpuUsage: 0,
    memoryUsage: 0,
    diskUsage: 0,
    databaseConnections: 0,
    apiResponseTime: 0,
    errorRate: 0,
    requestsPerMinute: 0
  };
  const features: FeatureToggle[] = (featuresData as any) || [];
  const logs: AuditLog[] = (auditLogs as any)?.logs || [];
  const roles: RolePermission[] = (rolesData as any) || [];

  // Filter and search users
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const userRole = u.role || (u.isAdmin ? 'admin' : 'user');
    const matchesRole = filterRole === "all" || userRole === filterRole;
    return matchesSearch && matchesRole;
  });

  // Helper functions
  const handleUserEdit = (userId: number) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setEditFormData(user);
      setIsEditingUser(userId);
    }
  };

  const handleUserSave = () => {
    if (isEditingUser && editFormData) {
      updateUserMutation.mutate({ userId: isEditingUser, updates: editFormData });
    }
  };

  const handleBulkAction = (action: string) => {
    if (selectedUsers.length === 0) {
      toast({ title: "No users selected", variant: "destructive" });
      return;
    }
    bulkUserActionMutation.mutate({ userIds: selectedUsers, action });
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${mins}m`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
                  <p className="text-sm text-slate-600">Professional Management Console</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Activity className="h-3 w-3 mr-1" />
                System Healthy
              </Badge>
              <Link href="/">
                <Button variant="outline" size="sm">
                  <Home className="h-4 w-4 mr-2" />
                  Back to App
                </Button>
              </Link>
              <Button variant="outline" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-10 bg-white border border-slate-200">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              System
            </TabsTrigger>
            <TabsTrigger value="features" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Features
            </TabsTrigger>
            <TabsTrigger value="roles" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Roles
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Audit Logs
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="support" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Support
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-blue-700">Total Users</CardTitle>
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-900">{analytics.totalUsers.toLocaleString()}</div>
                  <p className="text-xs text-blue-600 mt-1">
                    <TrendingUp className="inline h-3 w-3 mr-1" />
                    +{analytics.newUsersThisWeek} this week
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-green-700">Active Users</CardTitle>
                    <Activity className="h-4 w-4 text-green-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-900">{analytics.activeUsers.toLocaleString()}</div>
                  <p className="text-xs text-green-600 mt-1">
                    <Target className="inline h-3 w-3 mr-1" />
                    {((analytics.activeUsers / analytics.totalUsers) * 100).toFixed(1)}% engagement
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-purple-700">Profile Views</CardTitle>
                    <Eye className="h-4 w-4 text-purple-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-900">{analytics.totalProfileVisits.toLocaleString()}</div>
                  <p className="text-xs text-purple-600 mt-1">
                    <TrendingUp className="inline h-3 w-3 mr-1" />
                    Avg {Math.round(analytics.totalProfileVisits / analytics.totalUsers)} per user
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-orange-700">Link Clicks</CardTitle>
                    <Target className="h-4 w-4 text-orange-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-900">{analytics.totalLinkClicks.toLocaleString()}</div>
                  <p className="text-xs text-orange-600 mt-1">
                    <TrendingUp className="inline h-3 w-3 mr-1" />
                    {((analytics.totalLinkClicks / analytics.totalProfileVisits) * 100).toFixed(1)}% CTR
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* System Health */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">CPU Usage</span>
                      <span className="text-sm text-slate-600">{metrics.cpuUsage}%</span>
                    </div>
                    <Progress value={metrics.cpuUsage} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Memory</span>
                      <span className="text-sm text-slate-600">{metrics.memoryUsage}%</span>
                    </div>
                    <Progress value={metrics.memoryUsage} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Disk Space</span>
                      <span className="text-sm text-slate-600">{metrics.diskUsage}%</span>
                    </div>
                    <Progress value={metrics.diskUsage} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Error Rate</span>
                      <span className="text-sm text-slate-600">{metrics.errorRate}%</span>
                    </div>
                    <Progress value={metrics.errorRate} className="h-2" />
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{formatUptime(metrics.serverUptime)}</div>
                    <div className="text-sm text-slate-600">Uptime</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{metrics.apiResponseTime}ms</div>
                    <div className="text-sm text-slate-600">Response Time</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">{metrics.databaseConnections}</div>
                    <div className="text-sm text-slate-600">DB Connections</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">{metrics.requestsPerMinute}</div>
                    <div className="text-sm text-slate-600">Requests/min</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {logs.slice(0, 5).map((log) => (
                    <div key={log.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div>
                          <p className="text-sm font-medium">{log.action}</p>
                          <p className="text-xs text-slate-600">{log.userName} • {log.resource}</p>
                        </div>
                      </div>
                      <div className="text-xs text-slate-500">
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Management Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      User Management
                    </CardTitle>
                    <CardDescription>Manage user accounts, roles, and permissions</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    {selectedUsers.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">{selectedUsers.length} selected</Badge>
                        <Button variant="outline" size="sm" onClick={() => handleBulkAction('deactivate')}>
                          <UserX className="h-4 w-4 mr-1" />
                          Deactivate
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleBulkAction('activate')}>
                          <UserCheck className="h-4 w-4 mr-1" />
                          Activate
                        </Button>
                      </div>
                    )}
                    <Button>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add User
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Search and Filter */}
                <div className="flex items-center space-x-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={filterRole} onValueChange={setFilterRole}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="moderator">Moderator</SelectItem>
                      <SelectItem value="developer">Developer</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Users Table */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <input
                          type="checkbox"
                          checked={filteredUsers.length > 0 && selectedUsers.length === filteredUsers.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers(filteredUsers.map(u => u.id));
                            } else {
                              setSelectedUsers([]);
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Stats</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedUsers([...selectedUsers, user.id]);
                              } else {
                                setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                              <span className="text-white text-sm font-medium">
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium">{user.name}</div>
                              <div className="text-sm text-slate-600">@{user.username}</div>
                              <div className="text-xs text-slate-500">{user.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={(user.role === 'admin' || user.role === 'super_admin' || user.isAdmin) ? 'default' : 'secondary'}>
                            {(user.isAdmin || user.role === 'admin' || user.role === 'super_admin') && <Crown className="h-3 w-3 mr-1" />}
                            {(user.role || (user.isAdmin ? 'admin' : 'user')).charAt(0).toUpperCase() + (user.role || (user.isAdmin ? 'admin' : 'user')).slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.isActive ? 'default' : 'destructive'}>
                            {user.isActive ? (
                              <>
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Active
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3 w-3 mr-1" />
                                Inactive
                              </>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm space-y-1">
                            <div>Score: {user.socialScore}</div>
                            <div className="text-slate-600">{user.totalClicks} clicks</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-slate-600">
                            {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm" onClick={() => handleUserEdit(user.id)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete User</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete {user.name}? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction className="bg-red-600 hover:bg-red-700">
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LineChart className="h-5 w-5" />
                    User Growth
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <BarChart3 className="h-16 w-16 mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-600">User growth chart would be displayed here</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Platform Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.platformStats.map((platform, index) => (
                      <div key={platform.platform} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full bg-${['blue', 'green', 'purple', 'orange'][index % 4]}-500`}></div>
                          <span className="font-medium">{platform.platform}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{platform.users}</div>
                          <div className="text-sm text-slate-600">{platform.engagement}% engagement</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Top Performing Links
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Link Title</TableHead>
                      <TableHead>Platform</TableHead>
                      <TableHead>Clicks</TableHead>
                      <TableHead>Performance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics.topPerformingLinks.map((link, index) => (
                      <TableRow key={link.id}>
                        <TableCell className="font-medium">{link.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{link.platform}</Badge>
                        </TableCell>
                        <TableCell>{link.clicks.toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Progress value={Math.min((link.clicks / Math.max(...analytics.topPerformingLinks.map(l => l.clicks))) * 100, 100)} className="h-2 flex-1" />
                            <span className="text-sm text-slate-600">{index + 1}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Tab */}
          <TabsContent value="system" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="h-5 w-5" />
                    Server Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>CPU Usage</span>
                      <span>{metrics.cpuUsage}%</span>
                    </div>
                    <Progress value={metrics.cpuUsage} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Memory Usage</span>
                      <span>{metrics.memoryUsage}%</span>
                    </div>
                    <Progress value={metrics.memoryUsage} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Disk Usage</span>
                      <span>{metrics.diskUsage}%</span>
                    </div>
                    <Progress value={metrics.diskUsage} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Database Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Active Connections</span>
                      <Badge variant="outline">{metrics.databaseConnections}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Query Response Time</span>
                      <Badge variant="outline">{metrics.apiResponseTime}ms</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Error Rate</span>
                      <Badge variant={metrics.errorRate < 1 ? "secondary" : "destructive"}>
                        {metrics.errorRate}%
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Features Tab */}
          <TabsContent value="features" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Feature Toggles
                </CardTitle>
                <CardDescription>Enable or disable application features</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {features.map((feature) => (
                    <div key={feature.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                      <div className="space-y-1">
                        <h4 className="font-medium">{feature.featureName.replace('FEATURE_', '').replace(/_/g, ' ')}</h4>
                        <p className="text-sm text-slate-600">{feature.description}</p>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">
                            Rollout: {feature.rolloutPercentage}%
                          </Badge>
                          <Badge variant="outline">
                            Users: {feature.targetUsers.length}
                          </Badge>
                        </div>
                      </div>
                      <Switch
                        checked={feature.enabled}
                        onCheckedChange={(enabled) => toggleFeatureMutation.mutate({ featureId: feature.id, enabled })}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Roles Tab */}
          <TabsContent value="roles" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Role Management
                    </CardTitle>
                    <CardDescription>Configure user roles and permissions</CardDescription>
                  </div>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Role
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {roles.map((role) => (
                    <Card key={role.id} className="border-2 hover:border-blue-200 transition-colors">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg capitalize">{role.displayName}</CardTitle>
                          <Badge variant="outline">{role.members} users</Badge>
                        </div>
                        <CardDescription>{role.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <h5 className="font-medium text-sm">Permissions:</h5>
                          <div className="space-y-1">
                            {role.permissions.map((permission) => (
                              <div key={permission} className="flex items-center space-x-2">
                                <CheckCircle className="h-3 w-3 text-green-500" />
                                <span className="text-sm">{permission}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="mt-4 flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button variant="outline" size="sm">
                            <Users className="h-4 w-4 mr-1" />
                            Users
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Logs Tab */}
          <TabsContent value="logs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Audit Logs
                </CardTitle>
                <CardDescription>System activity and security logs</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Resource</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm">
                          {new Date(log.timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.userName}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={log.action.includes('DELETE') ? 'destructive' : 'default'}>
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell>{log.resource}</TableCell>
                        <TableCell className="font-mono text-sm">{log.ipAddress}</TableCell>
                        <TableCell className="max-w-xs truncate">{log.details}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  System Settings
                </CardTitle>
                <CardDescription>Configure application settings and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="maintenance">Maintenance Mode</Label>
                      <div className="flex items-center space-x-2 mt-2">
                        <Switch id="maintenance" />
                        <span className="text-sm text-slate-600">Enable maintenance mode</span>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="registrations">User Registrations</Label>
                      <div className="flex items-center space-x-2 mt-2">
                        <Switch id="registrations" defaultChecked />
                        <span className="text-sm text-slate-600">Allow new user registrations</span>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="analytics">Analytics Collection</Label>
                      <div className="flex items-center space-x-2 mt-2">
                        <Switch id="analytics" defaultChecked />
                        <span className="text-sm text-slate-600">Collect usage analytics</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="maxUsers">Max Users Per Account</Label>
                      <Input id="maxUsers" type="number" defaultValue="1000" className="mt-2" />
                    </div>
                    <div>
                      <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                      <Input id="sessionTimeout" type="number" defaultValue="60" className="mt-2" />
                    </div>
                    <div>
                      <Label htmlFor="backupFreq">Backup Frequency</Label>
                      <Select defaultValue="daily">
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hourly">Hourly</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button variant="outline">Reset to Defaults</Button>
                  <Button>Save Changes</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Support Tab */}
          <TabsContent value="support" className="space-y-6">
            <DirectSupportManager />
          </TabsContent>

          {/* Email Tab */}
          <TabsContent value="email" className="space-y-6">
            <EmailManagement />
          </TabsContent>

        </Tabs>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={isEditingUser !== null} onOpenChange={() => setIsEditingUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information and permissions</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editName">Name</Label>
              <Input
                id="editName"
                value={editFormData.name || ''}
                onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editEmail">Email</Label>
              <Input
                id="editEmail"
                type="email"
                value={editFormData.email || ''}
                onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editRole">Role</Label>
              <Select
                value={editFormData.role || 'user'}
                onValueChange={(role: any) => setEditFormData({...editFormData, role})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                  <SelectItem value="developer">Developer</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={editFormData.isActive || false}
                onCheckedChange={(isActive) => setEditFormData({...editFormData, isActive})}
              />
              <Label>Active Account</Label>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsEditingUser(null)}>Cancel</Button>
            <Button onClick={handleUserSave} disabled={updateUserMutation.isPending}>
              {updateUserMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}