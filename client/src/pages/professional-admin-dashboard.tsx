import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Crown, Users, Activity, Settings, Shield, AlertTriangle,
  TrendingUp, Database, Globe, Link, Eye, BarChart, 
  PieChart, Calendar, Download, Upload, Server, 
  Wifi, HardDrive, Cpu, Monitor, UserPlus, Edit, Trash2,
  Building, Briefcase, DollarSign, Award, Clock,
  Filter, Search, Plus, X, ChevronDown, Mail, Loader2,
  Target, Zap, TrendingDown, MousePointer, Share2, 
  MessageSquare, Star, ThumbsUp, Megaphone, Users2,
  FileText, Layers, TestTube, BarChart3, LineChart,
  Percent, Gift, Bell, Hash, Tag, Rocket, Send
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { EmailManagement } from "@/components/email-management";
import { AICampaignManager } from "@/components/ai-campaign-manager";
import { UserActionsMenu } from "@/components/admin/user-actions-menu";
import { SegmentActionsMenu } from "@/components/admin/segment-actions-menu";
import AdminFunnelsPage from "./admin/conversion/funnels";

// Role and Permission types
interface Role {
  id: number;
  name: string;
  displayName: string;
  description: string;
  permissions: string[];
  isSystem: boolean;
}

interface Permission {
  id: number;
  name: string;
  displayName: string;
  description: string;
  category: string;
}

interface Employee {
  id: number;
  user: any;
  employeeId: string;
  department: string;
  position: string;
  salary: number;
  hireDate: string;
  manager: any;
  workLocation: string;
  workType: string;
  status: string;
  performanceRating: number;
}

interface AbTest {
  id: string;
  name: string;
  description: string;
  status: 'running' | 'completed';
  confidence?: string;
  visitors?: string;
  conversion?: string;
  details?: string;
}

interface Segment {
  id: string;
  name: string;
  description: string | null;
  type: 'dynamic' | 'static';
  memberCount?: number | null;
  lastRefreshedAt?: string | null;
  ownerName?: string | null;
  tags?: string[] | null;
}

export default function ProfessionalAdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [userFilter, setUserFilter] = useState("all");
  const [timeRange, setTimeRange] = useState("7d");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [roleToAssign, setRoleToAssign] = useState<number | null>(null);
  const [noRolesDialogOpen, setNoRolesDialogOpen] = useState(false);
  const [isEmployeeDialogOpen, setIsEmployeeDialogOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [isEditRoleDialogOpen, setIsEditRoleDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [expandedRoles, setExpandedRoles] = useState<Set<number>>(new Set());
  const [inviteFormData, setInviteFormData] = useState({
    email: "",
    recipientName: "",
    roleId: "",
  });
  const [roleFormData, setRoleFormData] = useState({
    name: "",
    displayName: "",
    description: "",
    permissions: [] as string[],
  });
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    department: "",
    isActive: true,
  });
  const [employeeFormData, setEmployeeFormData] = useState({
    userId: "",
    employeeId: "",
    department: "",
    position: "",
    salary: "",
    hireDate: "",
    workLocation: "",
    workType: "",
    manager: "",
    performanceRating: "",
  });

  const [segmentDialogOpen, setSegmentDialogOpen] = useState(false);
  const [newSegment, setNewSegment] = useState({ name: "", description: "" });
  const [editingSegment, setEditingSegment] = useState<Segment | null>(null);
  const [editSegmentData, setEditSegmentData] = useState({ name: "", description: "" });
  const [segmentSearch, setSegmentSearch] = useState("");
  const [segmentTypeFilter, setSegmentTypeFilter] = useState<"all" | "dynamic" | "static">("all");
  const { data: segments = [] } = useQuery<Segment[]>({
    queryKey: ["/api/admin/segments"],
    queryFn: async () => {
      const json = await apiRequest("GET", "/api/admin/segments");
      return (json?.segments ?? []) as Segment[];
    },
  });
  const filteredSegments = segments.filter(
    (segment) =>
      segment.name.toLowerCase().includes(segmentSearch.toLowerCase()) &&
      (segmentTypeFilter === "all" || segment.type === segmentTypeFilter)
  );

  const [abTests, setAbTests] = useState<AbTest[]>([
    {
      id: '1',
      name: 'Homepage CTA Button',
      description: 'Blue vs Green button color',
      status: 'running',
      confidence: '85% confidence',
      visitors: '2,340 visitors',
    },
    {
      id: '2',
      name: 'Signup Form Fields',
      description: '5 fields vs 3 fields',
      status: 'completed',
      conversion: '+24% conversion',
      details: 'Winner: 3 fields',
    },
  ]);
  const [newAbTestName, setNewAbTestName] = useState('');
  const [abTestDialogOpen, setAbTestDialogOpen] = useState(false);
  const [viewAbTest, setViewAbTest] = useState<AbTest | null>(null);
  const [analyzeAbTest, setAnalyzeAbTest] = useState<AbTest | null>(null);

  useEffect(() => {
    const savedAbTests = localStorage.getItem('adminAbTests');
    if (savedAbTests) {
      try {
        setAbTests(JSON.parse(savedAbTests));
      } catch (_) {
        // ignore parse error
      }
    }
  }, []);

  const persistAbTests = (updater: (prev: AbTest[]) => AbTest[]) => {
    setAbTests(prev => {
      const updated = updater(prev);
      localStorage.setItem('adminAbTests', JSON.stringify(updated));
      return updated;
    });
  };

  const handleAddSegment = async () => {
    try {
      await apiRequest('POST', '/api/admin/segments', newSegment);
      setNewSegment({ name: '', description: '' });
      setSegmentDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/segments'] });
      toast({ title: 'Segment created' });
    } catch {
      toast({ title: 'Failed to create segment', variant: 'destructive' });
    }
  };

  const handleUpdateSegment = async () => {
    if (!editingSegment) return;
    try {
      await apiRequest('PATCH', `/api/admin/segments/${editingSegment.id}`, editSegmentData);
      setEditingSegment(null);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/segments'] });
      toast({ title: 'Segment updated' });
    } catch {
      toast({ title: 'Failed to update segment', variant: 'destructive' });
    }
  };

  const handlePreviewMembers = (segment: Segment) => {
    toast({ title: `Previewing ${segment.name}`, description: 'Preview not implemented' });
  };

  const handleRefreshSegment = async (segment: Segment) => {
    try {
      await apiRequest('POST', `/api/admin/segments/${segment.id}/refresh`);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/segments'] });
      toast({ title: 'Segment refreshed' });
    } catch {
      toast({ title: 'Failed to refresh segment', variant: 'destructive' });
    }
  };

  const handleSnapshotSegment = async (segment: Segment) => {
    try {
      await apiRequest('POST', `/api/admin/segments/${segment.id}/snapshot`);
      toast({ title: 'Snapshot created' });
    } catch {
      toast({ title: 'Failed to create snapshot', variant: 'destructive' });
    }
  };


  const handleBulkAction = (segment: Segment, action: string) => {
    toast({ title: `Bulk action: ${action}`, description: 'Not implemented' });
  };

  const handleAttachAbTest = (segment: Segment) => {
    toast({ title: 'Attach to A/B test', description: 'Not implemented' });
  };

  const handleDuplicateSegment = (segment: Segment) => {
    toast({ title: 'Duplicate segment', description: 'Not implemented' });
  };

  const handleArchiveSegment = (segment: Segment) => {
    toast({ title: 'Archive segment', description: 'Not implemented' });
  };

  const handleDeleteSegment = async (segment: Segment) => {
    const confirmed = window.confirm(`Delete segment "${segment.name}"?`);
    if (!confirmed) return;
    try {
      await apiRequest('DELETE', `/api/admin/segments/${segment.id}`);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/segments'] });
      toast({ title: 'Segment deleted' });
    } catch {
      toast({ title: 'Failed to delete segment', variant: 'destructive' });
    }
  };

  const handleCreateAbTest = () => {
    const newTest: AbTest = {
      id: Date.now().toString(),
      name: newAbTestName || 'Untitled Test',
      description: 'Custom A/B test',
      status: 'running',
      confidence: '0% confidence',
      visitors: '0 visitors',
    };
    persistAbTests(prev => [...prev, newTest]);
    toast({
      title: 'A/B Test Created',
      description: `"${newTest.name}" has been added to the dashboard.`,
      duration: 3000,
    });
    setNewAbTestName('');
    setAbTestDialogOpen(false);
  };

  useEffect(() => {
    if (selectedUser) {
      setEditFormData({
        name: selectedUser.name || "",
        email: selectedUser.email || "",
        department: selectedUser.department || "",
        isActive: selectedUser.isActive !== false,
      });
    }
  }, [selectedUser]);

  // Enhanced queries with role management
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users-with-roles"],
    enabled: user && (user.role === 'admin' || user.role === 'super_admin'),
  });

  const { data: rolesData, isLoading: rolesLoading } = useQuery({
    queryKey: ["/api/admin/roles"],
    enabled: user && (user.role === 'admin' || user.role === 'super_admin'),
  });

  const { data: permissionsData, isLoading: permissionsLoading } = useQuery({
    queryKey: ["/api/admin/permissions"],
    enabled: user && (user.role === 'admin' || user.role === 'super_admin'),
  });

  const { data: employeesData, isLoading: employeesLoading } = useQuery({
    queryKey: ["/api/admin/employees"],
    enabled: user && (user.role === 'admin' || user.role === 'super_admin'),
  });

  const { data: invitationsData, isLoading: invitationsLoading } = useQuery({
    queryKey: ["/api/admin/invitations"],
    enabled: user && (user.role === 'admin' || user.role === 'super_admin'),
  });

  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ["/api/admin/professional/analytics", timeRange],
    enabled: user && (user.role === 'admin' || user.role === 'super_admin'),
  });

  const { data: systemMetrics, isLoading: systemLoading } = useQuery({
    queryKey: ["/api/admin/system/metrics"],
    enabled: user && (user.role === 'admin' || user.role === 'super_admin'),
    refetchInterval: 30000,
  });

  // Role management mutations
  const assignRoleMutation = useMutation({
    mutationFn: async ({ userId, roleId }: { userId: string; roleId: number }) => {
      return apiRequest("PATCH", `/api/admin/users/${userId}/role`, { roleId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users-with-roles"] });
      toast({ title: "Success", description: "Role assigned successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const createRoleMutation = useMutation({
    mutationFn: async (roleData: Partial<Role>) => {
      return apiRequest("POST", "/api/admin/roles", roleData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/roles"] });
      toast({ title: "Success", description: "Role created successfully" });
      setIsRoleDialogOpen(false);
      setRoleFormData({ name: "", displayName: "", description: "", permissions: [] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, ...roleData }: any) => {
      return apiRequest("PUT", `/api/admin/roles/${id}`, roleData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/roles"] });
      toast({ title: "Success", description: "Role updated successfully" });
      setIsEditRoleDialogOpen(false);
      setSelectedRole(null);
      setRoleFormData({ name: "", displayName: "", description: "", permissions: [] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: async (roleId: number) => {
      return apiRequest("DELETE", `/api/admin/roles/${roleId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/roles"] });
      toast({ title: "Success", description: "Role deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleAssignRole = async (user: any) => {
    try {
      const roles = await apiRequest("GET", "/api/admin/roles");
      if (!Array.isArray(roles) || roles.length === 0) {
        setNoRolesDialogOpen(true);
        return;
      }
      setAvailableRoles(roles);
      setSelectedUser(user);
      const current = roles.find((r: any) => r.name === user.role);
      setRoleToAssign(current ? current.id : null);
      setIsRoleDialogOpen(true);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleChangeStatus = async (user: any, status: 'active' | 'suspended') => {
    try {
      await apiRequest("PATCH", `/api/admin/users/${user.id}/status`, { status });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users-with-roles"] });
      toast({ title: "Success", description: "Status updated" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleSetLimits = async (user: any, limits: { maxLinks?: number | null; dailyClickQuota?: number | null }) => {
    try {
      await apiRequest("PATCH", `/api/admin/users/${user.id}/limits`, limits);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users-with-roles"] });
      toast({ title: "Success", description: "Limits updated" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleForceLogout = async (user: any) => {
    try {
      await apiRequest("POST", `/api/admin/users/${user.id}/force-logout`);
      toast({ title: "Success", description: "User logged out" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleResetPassword = async (user: any) => {
    try {
      await apiRequest("POST", `/api/admin/users/${user.id}/reset-password`);
      toast({ title: "Success", description: "Password reset email sent" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (user: any) => {
    const confirmation = window.prompt(`Type ${user.email} to confirm deletion`);
    if (confirmation !== user.email) return;
    try {
      await apiRequest("DELETE", `/api/admin/users/${user.id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users-with-roles"] });
      toast({ title: "Deleted", description: "User removed" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/admin/logout", {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Logout failed");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Logged out successfully" });
      // Force a page reload to clear auth state
      window.location.href = "/admin/login";
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const createEmployeeMutation = useMutation({
    mutationFn: async (employeeData: any) => {
      return apiRequest("POST", "/api/admin/employees", employeeData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/employees"] });
      toast({ title: "Success", description: "Employee profile created successfully" });
      setIsEmployeeDialogOpen(false);
      setEmployeeFormData({
        userId: "",
        employeeId: "",
        department: "",
        position: "",
        salary: "",
        hireDate: "",
        workLocation: "",
        workType: "",
        manager: "",
        performanceRating: "",
      });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Invite user mutation
  const inviteUserMutation = useMutation({
    mutationFn: async (data: { email: string; roleId: number; recipientName?: string }) => {
      return apiRequest("POST", "/api/admin/invite-user", data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Invitation sent successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/invitations"] });
      setIsInviteDialogOpen(false);
      setInviteFormData({ email: "", recipientName: "", roleId: "" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      return apiRequest("PUT", `/api/admin/users/${id}`, updates);
    },
    onSuccess: (updatedUser: any) => {
      queryClient.setQueryData(["/api/admin/users-with-roles"], (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map((u: any) => (u.id === updatedUser.id ? { ...u, ...updatedUser } : u));
      });
      toast({ title: "Success", description: "User updated successfully" });
      setIsEditUserDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Cancel invitation mutation
  const cancelInvitationMutation = useMutation({
    mutationFn: async (invitationId: number) => {
      return apiRequest("DELETE", `/api/admin/invitations/${invitationId}`);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Invitation cancelled" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/invitations"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  if (user?.role !== 'admin' && user?.role !== 'super_admin') {
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

  const users = Array.isArray(usersData) ? usersData : [];
  const roles = Array.isArray(rolesData) ? rolesData : [];
  const permissions = Array.isArray(permissionsData) ? permissionsData : [];
  const employees = Array.isArray(employeesData) ? employeesData : [];
  const invitations = Array.isArray(invitationsData) ? invitationsData : [];
  const analytics = analyticsData || {};
  const metrics = systemMetrics || {};

  // Apply search and role filters
  const filteredUsers = users.filter((u: any) => {
    const matchesSearch =
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const role = u.role || (u.isAdmin ? "admin" : "user");
    const matchesFilter = userFilter === "all" || role === userFilter;

    return matchesSearch && matchesFilter;
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-red-100 text-red-800';
      case 'admin': return 'bg-amber-100 text-amber-800';
      case 'developer': return 'bg-blue-100 text-blue-800';
      case 'employee': return 'bg-green-100 text-green-800';
      case 'moderator': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Enhanced Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <Crown className="h-8 w-8 text-amber-500" />
              Professional Administration
            </h1>
            <p className="text-slate-600 mt-1">Advanced role management, employee profiles, and system analytics</p>
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
            <Badge variant="outline" className="text-red-600 border-red-200">
              Super Administrator
            </Badge>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              className="flex items-center gap-2"
            >
              {logoutMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Shield className="h-4 w-4" />
              )}
              Logout
            </Button>
          </div>
        </div>

        {/* System Health Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Server className="h-4 w-4" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Online</div>
              <Progress value={99.8} className="mt-2" />
              <p className="text-xs text-slate-500 mt-1">99.8% uptime</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Active Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{analytics.activeUsers || 0}</div>
              <p className="text-xs text-slate-500">Currently online</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Building className="h-4 w-4" />
                Employees
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{employees.length}</div>
              <p className="text-xs text-slate-500">Total staff</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Roles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{roles.length}</div>
              <p className="text-xs text-slate-500">Defined roles</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Award className="h-4 w-4" />
                Permissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-cyan-600">{permissions.length}</div>
              <p className="text-xs text-slate-500">Available permissions</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Administration Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="flex flex-wrap w-full h-auto gap-2 mb-4 relative">
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="campaigns">
              <Rocket className="h-4 w-4 mr-2" />
              AI Campaigns
            </TabsTrigger>
            <TabsTrigger value="ab-testing">
              <TestTube className="h-4 w-4 mr-2" />
              A/B Testing
            </TabsTrigger>
            <TabsTrigger value="segmentation">
              <Users2 className="h-4 w-4 mr-2" />
              Segments
            </TabsTrigger>
            <TabsTrigger value="conversion">
              <Target className="h-4 w-4 mr-2" />
              Conversion
            </TabsTrigger>
            <TabsTrigger value="business">
              <DollarSign className="h-4 w-4 mr-2" />
              Business
            </TabsTrigger>
            <TabsTrigger value="roles">
              <Shield className="h-4 w-4 mr-2" />
              Roles
            </TabsTrigger>
            <TabsTrigger value="invitations">
              <Mail className="h-4 w-4 mr-2" />
              Invitations
            </TabsTrigger>
            <TabsTrigger value="employees">
              <Building className="h-4 w-4 mr-2" />
              Employees
            </TabsTrigger>
            <TabsTrigger value="platforms">
              <Wifi className="h-4 w-4 mr-2" />
              Platforms
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="system">
              <Settings className="h-4 w-4 mr-2" />
              System
            </TabsTrigger>
            <TabsTrigger value="email">
              <Send className="h-4 w-4 mr-2" />
              Email
            </TabsTrigger>
          </TabsList>

          {/* Enhanced Users Management */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>Manage users, roles, and permissions</CardDescription>
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
                        <SelectItem value="developer">Developers</SelectItem>
                        <SelectItem value="employee">Employees</SelectItem>
                        <SelectItem value="user">Regular Users</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Last Login</TableHead>
                        <TableHead>Status</TableHead>
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
                                <div className="text-sm text-slate-500">{user.email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getRoleBadgeColor(user.role || 'user')}>
                              {user.role || 'user'}
                            </Badge>
                          </TableCell>
                          <TableCell>{user.department || 'N/A'}</TableCell>
                          <TableCell>
                            {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.status === 'active' ? "default" : "secondary"}>
                              {user.status === 'active' ? "Active" : "Suspended"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setIsEditUserDialogOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <UserActionsMenu
                                user={user}
                                onAssignRole={() => handleAssignRole(user)}
                                onChangeStatus={(status) => handleChangeStatus(user, status)}
                                onSetLimits={(limits) => handleSetLimits(user, limits)}
                                onForceLogout={() => handleForceLogout(user)}
                                onResetPassword={() => handleResetPassword(user)}
                                onDelete={() => handleDelete(user)}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Edit User Dialog rendered once */}
          <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit User</DialogTitle>
                <DialogDescription>
                  Update user information for {selectedUser?.name}
                </DialogDescription>
              </DialogHeader>
              {selectedUser && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="editName">Name</Label>
                    <Input
                      id="editName"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      placeholder="User name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="editEmail">Email</Label>
                    <Input
                      id="editEmail"
                      type="email"
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      placeholder="user@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="editDepartment">Department</Label>
                    <Input
                      id="editDepartment"
                      value={editFormData.department}
                      onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                      placeholder="Department"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="editActive"
                      checked={editFormData.isActive}
                      onCheckedChange={(checked) =>
                        setEditFormData({ ...editFormData, isActive: !!checked })
                      }
                    />
                    <Label htmlFor="editActive">Active User</Label>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsEditUserDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={() => updateUserMutation.mutate({ id: selectedUser.id, ...editFormData })}
                      disabled={updateUserMutation.isPending}
                    >
                      {updateUserMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Update User"
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign Role</DialogTitle>
                <DialogDescription>Select a role to assign to {selectedUser?.name}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {availableRoles.map((role) => (
                  <Button
                    key={role.id}
                    variant={roleToAssign === role.id ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => setRoleToAssign(role.id)}
                  >
                    {role.displayName}
                  </Button>
                ))}
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>Cancel</Button>
                  <Button
                    disabled={roleToAssign === null || roleToAssign === availableRoles.find(r => r.name === selectedUser?.role)?.id}
                    onClick={() => {
                      if (roleToAssign !== null && selectedUser) {
                        assignRoleMutation.mutate({ userId: selectedUser.id, roleId: roleToAssign });
                      }
                      setIsRoleDialogOpen(false);
                    }}
                  >
                    Save
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={noRolesDialogOpen} onOpenChange={setNoRolesDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>No roles yet</DialogTitle>
                <DialogDescription>Create a role before assigning.</DialogDescription>
              </DialogHeader>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setNoRolesDialogOpen(false)}>Cancel</Button>
                <Button onClick={() => { setNoRolesDialogOpen(false); setLocation("/admin/roles"); }}>Go to Roles</Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* AI Campaign Manager */}
          <TabsContent value="campaigns" className="space-y-4">
            <AICampaignManager />
          </TabsContent>

          {/* A/B Testing Management */}
          <TabsContent value="ab-testing" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Active Tests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">8</div>
                  <p className="text-xs text-muted-foreground">+2 from last week</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Completed Tests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">34</div>
                  <p className="text-xs text-muted-foreground">+5 from last month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Avg. Improvement</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">+18%</div>
                  <p className="text-xs text-muted-foreground">Conversion rate lift</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>A/B Test Management</CardTitle>
                    <CardDescription>Create and analyze A/B tests</CardDescription>
                  </div>
                  <Dialog open={abTestDialogOpen} onOpenChange={setAbTestDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <TestTube className="h-4 w-4 mr-2" />
                        New Test
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create A/B Test</DialogTitle>
                        <DialogDescription>Define variants to start testing.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="ab-test-name">Test Name</Label>
                          <Input
                            id="ab-test-name"
                            placeholder="Homepage CTA Button"
                            value={newAbTestName}
                            onChange={(e) => setNewAbTestName(e.target.value)}
                          />
                        </div>
                        <Button onClick={handleCreateAbTest}>Create Test</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {abTests.map((test) => (
                    <div key={test.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            test.status === 'running' ? 'bg-green-100' : 'bg-yellow-100'
                          }`}
                        >
                          <TestTube
                            className={`h-5 w-5 ${
                              test.status === 'running' ? 'text-green-600' : 'text-yellow-600'
                            }`}
                          />
                        </div>
                        <div>
                          <h4 className="font-medium">{test.name}</h4>
                          <p className="text-sm text-muted-foreground">{test.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {test.status === 'running' ? (
                          <>
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                              Running
                            </Badge>
                            <div className="text-sm">
                              <div className="font-medium">{test.confidence}</div>
                              <div className="text-muted-foreground">{test.visitors}</div>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => setAnalyzeAbTest(test)}>
                              <BarChart3 className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Badge variant="secondary" className="bg-green-100 text-green-700">
                              Completed
                            </Badge>
                            <div className="text-sm">
                              <div className="font-medium">{test.conversion}</div>
                              <div className="text-muted-foreground">{test.details}</div>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => setViewAbTest(test)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Dialog open={!!viewAbTest} onOpenChange={(open) => !open && setViewAbTest(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{viewAbTest?.name}</DialogTitle>
                </DialogHeader>
                {viewAbTest && (
                  <div className="space-y-2">
                    <p className="text-sm">{viewAbTest.conversion}</p>
                    <p className="text-sm">{viewAbTest.details}</p>
                  </div>
                )}
                <div className="mt-4 flex justify-end">
                  <Button variant="outline" onClick={() => setViewAbTest(null)}>Close</Button>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={!!analyzeAbTest} onOpenChange={(open) => !open && setAnalyzeAbTest(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Results: {analyzeAbTest?.name}</DialogTitle>
                </DialogHeader>
                {analyzeAbTest && (
                  <div className="space-y-1 text-sm">
                    <p>{analyzeAbTest.confidence}</p>
                    <p>{analyzeAbTest.visitors}</p>
                  </div>
                )}
                <div className="mt-4 flex justify-end">
                  <Button variant="outline" onClick={() => setAnalyzeAbTest(null)}>Close</Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* User Segmentation */}
          <TabsContent value="segmentation" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Active Segments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">15</div>
                  <p className="text-xs text-muted-foreground">+3 from last week</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">High Value Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1,234</div>
                  <p className="text-xs text-muted-foreground">+5% from last month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Churned Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">89</div>
                  <p className="text-xs text-muted-foreground">-12% from last month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">76%</div>
                  <p className="text-xs text-muted-foreground">+3% from last week</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle>User Segmentation</CardTitle>
                    <CardDescription>Create and manage user segments</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Search segments..."
                      value={segmentSearch}
                      onChange={(e) => setSegmentSearch(e.target.value)}
                      className="w-48"
                    />
                    <Select value={segmentTypeFilter} onValueChange={(v) => setSegmentTypeFilter(v as any)}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="dynamic">Dynamic</SelectItem>
                        <SelectItem value="static">Static</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={() => setSegmentDialogOpen(true)}>
                      <Users2 className="h-4 w-4 mr-2" />
                      New Segment
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Members</TableHead>
                      <TableHead>Last refresh</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Tags</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSegments.map(segment => (
                      <TableRow key={segment.id}>
                        <TableCell className="font-medium">{segment.name}</TableCell>
                        <TableCell className="capitalize">{segment.type}</TableCell>
                        <TableCell>{segment.memberCount ?? 0}</TableCell>
                        <TableCell>{segment.lastRefreshedAt ? new Date(segment.lastRefreshedAt).toLocaleDateString() : '-'}</TableCell>
                        <TableCell>{segment.ownerName || '-'}</TableCell>
                        <TableCell>{segment.tags && segment.tags.length ? segment.tags.join(', ') : '-'}</TableCell>
                        <TableCell className="text-right">
                          <SegmentActionsMenu
                            onEdit={() => {
                              setEditingSegment(segment);
                              setEditSegmentData({ name: segment.name, description: segment.description || '' });
                            }}
                            onPreview={() => handlePreviewMembers(segment)}
                            onRefresh={() => handleRefreshSegment(segment)}
                            onSnapshot={() => handleSnapshotSegment(segment)}
                            onBulkAction={(action) => handleBulkAction(segment, action)}
                            onAttachAbTest={() => handleAttachAbTest(segment)}
                            onDuplicate={() => handleDuplicateSegment(segment)}
                            onArchive={() => handleArchiveSegment(segment)}
                            onDelete={() => handleDeleteSegment(segment)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <Dialog open={segmentDialogOpen} onOpenChange={setSegmentDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New Segment</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input value={newSegment.name} onChange={(e) => setNewSegment({ ...newSegment, name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea value={newSegment.description} onChange={(e) => setNewSegment({ ...newSegment, description: e.target.value })} />
                  </div>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setSegmentDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleAddSegment}>Save</Button>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={!!editingSegment} onOpenChange={(open) => !open && setEditingSegment(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Segment</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input value={editSegmentData.name} onChange={(e) => setEditSegmentData({ ...editSegmentData, name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea value={editSegmentData.description} onChange={(e) => setEditSegmentData({ ...editSegmentData, description: e.target.value })} />
                  </div>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setEditingSegment(null)}>Cancel</Button>
                  <Button onClick={handleUpdateSegment}>Save</Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Conversion Tracking */}
          <TabsContent value="conversion" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">4.2%</div>
                  <p className="text-xs text-muted-foreground">+0.8% from last week</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$45,890</div>
                  <p className="text-xs text-muted-foreground">+12% from last month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$89.50</div>
                  <p className="text-xs text-muted-foreground">+$5.20 from last month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Customer LTV</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$234</div>
                  <p className="text-xs text-muted-foreground">+$18 from last month</p>
                </CardContent>
              </Card>
            </div>

            <AdminFunnelsPage />
          </TabsContent>

          {/* Business Analytics */}
          <TabsContent value="business" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$125,890</div>
                  <p className="text-xs text-muted-foreground">+23% from last month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Customer Acquisition Cost</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$42</div>
                  <p className="text-xs text-muted-foreground">-$8 from last month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">2.1%</div>
                  <p className="text-xs text-muted-foreground">-0.5% from last month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Monthly Recurring Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$89,400</div>
                  <p className="text-xs text-muted-foreground">+15% from last month</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Breakdown</CardTitle>
                  <CardDescription>Revenue by subscription tier</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-sm">Free Tier</span>
                      </div>
                      <div className="text-sm font-medium">$0 (45%)</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm">Basic Plan</span>
                      </div>
                      <div className="text-sm font-medium">$34,560 (35%)</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        <span className="text-sm">Pro Plan</span>
                      </div>
                      <div className="text-sm font-medium">$54,840 (20%)</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Growth Metrics</CardTitle>
                  <CardDescription>Key business growth indicators</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Monthly Active Users</span>
                      <div className="text-sm font-medium">13,450 (+8%)</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Daily Active Users</span>
                      <div className="text-sm font-medium">4,890 (+12%)</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">User Retention (30d)</span>
                      <div className="text-sm font-medium">68% (+3%)</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Feature Adoption</span>
                      <div className="text-sm font-medium">78% (+5%)</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Roles Management */}
          <TabsContent value="roles" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Role Management</CardTitle>
                    <CardDescription>Create and manage system roles</CardDescription>
                  </div>
                  <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Role
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Create New Role</DialogTitle>
                        <DialogDescription>
                          Define a new role with specific permissions
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="roleName">Role Name</Label>
                          <Input 
                            id="roleName" 
                            placeholder="e.g., content_manager" 
                            value={roleFormData.name}
                            onChange={(e) => setRoleFormData({ ...roleFormData, name: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="displayName">Display Name</Label>
                          <Input 
                            id="displayName" 
                            placeholder="e.g., Content Manager" 
                            value={roleFormData.displayName}
                            onChange={(e) => setRoleFormData({ ...roleFormData, displayName: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="description">Description</Label>
                          <Input 
                            id="description" 
                            placeholder="Role description" 
                            value={roleFormData.description}
                            onChange={(e) => setRoleFormData({ ...roleFormData, description: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Permissions</Label>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {permissions.map((permission: Permission) => (
                              <div key={permission.id} className="flex items-center space-x-2">
                                <Checkbox 
                                  id={`perm-${permission.id}`}
                                  checked={roleFormData.permissions.includes(permission.name)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setRoleFormData({
                                        ...roleFormData,
                                        permissions: [...roleFormData.permissions, permission.name]
                                      });
                                    } else {
                                      setRoleFormData({
                                        ...roleFormData,
                                        permissions: roleFormData.permissions.filter(p => p !== permission.name)
                                      });
                                    }
                                  }}
                                />
                                <Label htmlFor={`perm-${permission.id}`} className="text-sm">
                                  {permission.displayName}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => {
                            setIsRoleDialogOpen(false);
                            setRoleFormData({ name: "", displayName: "", description: "", permissions: [] });
                          }}>
                            Cancel
                          </Button>
                          <Button 
                            onClick={() => {
                              if (roleFormData.name && roleFormData.displayName) {
                                createRoleMutation.mutate({
                                  name: roleFormData.name,
                                  displayName: roleFormData.displayName,
                                  description: roleFormData.description,
                                  permissions: roleFormData.permissions,
                                });
                              }
                            }}
                            disabled={!roleFormData.name || !roleFormData.displayName || createRoleMutation.isPending}
                          >
                            {createRoleMutation.isPending ? "Creating..." : "Create Role"}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {roles.map((role: Role) => (
                    <Card key={role.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{role.displayName}</CardTitle>
                            <CardDescription>{role.description}</CardDescription>
                          </div>
                          {role.isSystem && (
                            <Badge variant="secondary">System</Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm font-medium">Permissions:</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {(expandedRoles.has(role.id) ? role.permissions : role.permissions.slice(0, 3)).map((perm, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {perm}
                                </Badge>
                              ))}
                              {role.permissions.length > 3 && (
                                <Badge 
                                  variant="outline" 
                                  className="text-xs cursor-pointer hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                  onClick={() => {
                                    const newExpanded = new Set(expandedRoles);
                                    if (expandedRoles.has(role.id)) {
                                      newExpanded.delete(role.id);
                                    } else {
                                      newExpanded.add(role.id);
                                    }
                                    setExpandedRoles(newExpanded);
                                  }}
                                >
                                  {expandedRoles.has(role.id) 
                                    ? "Show less" 
                                    : `+${role.permissions.length - 3} more`
                                  }
                                </Badge>
                              )}
                            </div>
                          </div>
                          {!role.isSystem && (
                            <div className="flex gap-2 pt-2 border-t">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedRole(role);
                                  setRoleFormData({
                                    name: role.name,
                                    displayName: role.displayName,
                                    description: role.description,
                                    permissions: role.permissions || []
                                  });
                                  setIsEditRoleDialogOpen(true);
                                }}
                                className="flex-1"
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete the role "${role.displayName}"?`)) {
                                    deleteRoleMutation.mutate(role.id);
                                  }
                                }}
                                className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <X className="h-3 w-3 mr-1" />
                                Delete
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invitations Management */}
          <TabsContent value="invitations" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Role Invitations</CardTitle>
                    <CardDescription>Send email invitations to assign roles to new users</CardDescription>
                  </div>
                  <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Mail className="h-4 w-4 mr-2" />
                        Invite User
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Invite New User</DialogTitle>
                        <DialogDescription>
                          Send an email invitation to assign a role to a new user
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="inviteEmail">Email Address</Label>
                          <Input
                            id="inviteEmail"
                            type="email"
                            placeholder="user@example.com"
                            value={inviteFormData.email}
                            onChange={(e) => setInviteFormData({ ...inviteFormData, email: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="recipientName">Recipient Name (Optional)</Label>
                          <Input
                            id="recipientName"
                            placeholder="John Doe"
                            value={inviteFormData.recipientName}
                            onChange={(e) => setInviteFormData({ ...inviteFormData, recipientName: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="inviteRole">Role</Label>
                          <Select
                            value={inviteFormData.roleId}
                            onValueChange={(value) => setInviteFormData({ ...inviteFormData, roleId: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            <SelectContent>
                              {roles.map((role: Role) => (
                                <SelectItem key={role.id} value={role.id.toString()}>
                                  {role.displayName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button 
                            onClick={() => {
                              if (inviteFormData.email && inviteFormData.roleId) {
                                inviteUserMutation.mutate({
                                  email: inviteFormData.email,
                                  roleId: parseInt(inviteFormData.roleId),
                                  recipientName: inviteFormData.recipientName || undefined,
                                });
                              }
                            }}
                            disabled={!inviteFormData.email || !inviteFormData.roleId || inviteUserMutation.isPending}
                          >
                            {inviteUserMutation.isPending ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Sending...
                              </>
                            ) : (
                              'Send Invitation'
                            )}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Invited By</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Sent Date</TableHead>
                        <TableHead>Expires</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invitations.map((invitation: any) => (
                        <TableRow key={invitation.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-slate-500" />
                              {invitation.email}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{invitation.role_name}</Badge>
                          </TableCell>
                          <TableCell>{invitation.invited_by_name}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                invitation.status === 'pending' ? 'default' :
                                invitation.status === 'accepted' ? 'secondary' :
                                'destructive'
                              }
                            >
                              {invitation.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(invitation.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <span className={new Date(invitation.expires_at) < new Date() ? 'text-red-500' : ''}>
                              {new Date(invitation.expires_at).toLocaleDateString()}
                            </span>
                          </TableCell>
                          <TableCell>
                            {invitation.status === 'pending' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => cancelInvitationMutation.mutate(invitation.id)}
                                disabled={cancelInvitationMutation.isPending}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!invitations || invitations.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                            No invitations found. Click "Invite User" to send your first invitation.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Employee Management */}
          <TabsContent value="employees" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Employee Management</CardTitle>
                    <CardDescription>Manage employee profiles and information</CardDescription>
                  </div>
                  <Dialog open={isEmployeeDialogOpen} onOpenChange={setIsEmployeeDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Employee
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Create Employee Profile</DialogTitle>
                        <DialogDescription>
                          Add a new employee to the system
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="employeeUserId">User ID</Label>
                          <Input 
                            id="employeeUserId" 
                            placeholder="User ID to link employee profile"
                            value={employeeFormData.userId}
                            onChange={(e) => setEmployeeFormData({ ...employeeFormData, userId: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="employeeId">Employee ID</Label>
                          <Input 
                            id="employeeId" 
                            placeholder="EMP001"
                            value={employeeFormData.employeeId}
                            onChange={(e) => setEmployeeFormData({ ...employeeFormData, employeeId: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="department">Department</Label>
                          <Select value={employeeFormData.department} onValueChange={(value) => setEmployeeFormData({ ...employeeFormData, department: value })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="engineering">Engineering</SelectItem>
                              <SelectItem value="marketing">Marketing</SelectItem>
                              <SelectItem value="sales">Sales</SelectItem>
                              <SelectItem value="hr">Human Resources</SelectItem>
                              <SelectItem value="finance">Finance</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="position">Position</Label>
                          <Input 
                            id="position" 
                            placeholder="Software Engineer"
                            value={employeeFormData.position}
                            onChange={(e) => setEmployeeFormData({ ...employeeFormData, position: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="salary">Salary</Label>
                          <Input 
                            id="salary" 
                            type="number" 
                            placeholder="50000"
                            value={employeeFormData.salary}
                            onChange={(e) => setEmployeeFormData({ ...employeeFormData, salary: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="hireDate">Hire Date</Label>
                          <Input 
                            id="hireDate" 
                            type="date"
                            value={employeeFormData.hireDate}
                            onChange={(e) => setEmployeeFormData({ ...employeeFormData, hireDate: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="workLocation">Work Location</Label>
                          <Input 
                            id="workLocation" 
                            placeholder="Main Office"
                            value={employeeFormData.workLocation}
                            onChange={(e) => setEmployeeFormData({ ...employeeFormData, workLocation: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="workType">Work Type</Label>
                          <Select value={employeeFormData.workType} onValueChange={(value) => setEmployeeFormData({ ...employeeFormData, workType: value })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select work type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="full-time">Full Time</SelectItem>
                              <SelectItem value="part-time">Part Time</SelectItem>
                              <SelectItem value="contract">Contract</SelectItem>
                              <SelectItem value="intern">Intern</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2 flex justify-end gap-2">
                          <Button variant="outline" onClick={() => {
                            setIsEmployeeDialogOpen(false);
                            setEmployeeFormData({
                              userId: "",
                              employeeId: "",
                              department: "",
                              position: "",
                              salary: "",
                              hireDate: "",
                              workLocation: "",
                              workType: "",
                              manager: "",
                              performanceRating: "",
                            });
                          }}>
                            Cancel
                          </Button>
                          <Button 
                            onClick={() => {
                              if (employeeFormData.userId && employeeFormData.employeeId) {
                                createEmployeeMutation.mutate({
                                  userId: parseInt(employeeFormData.userId),
                                  employeeId: employeeFormData.employeeId,
                                  department: employeeFormData.department,
                                  position: employeeFormData.position,
                                  salary: employeeFormData.salary ? parseFloat(employeeFormData.salary) : undefined,
                                  hireDate: employeeFormData.hireDate,
                                  workLocation: employeeFormData.workLocation,
                                  workType: employeeFormData.workType,
                                  performanceRating: employeeFormData.performanceRating ? parseFloat(employeeFormData.performanceRating) : undefined,
                                });
                              }
                            }}
                            disabled={!employeeFormData.userId || !employeeFormData.employeeId || createEmployeeMutation.isPending}
                          >
                            {createEmployeeMutation.isPending ? "Creating..." : "Create Employee Profile"}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead>Work Type</TableHead>
                        <TableHead>Hire Date</TableHead>
                        <TableHead>Performance</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employees.map((employee: Employee) => (
                        <TableRow key={employee.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center">
                                <Building className="h-4 w-4 text-slate-500" />
                              </div>
                              <div>
                                <div className="font-medium">{employee.user?.name}</div>
                                <div className="text-sm text-slate-500">{employee.employeeId}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{employee.department}</TableCell>
                          <TableCell>{employee.position}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{employee.workType}</Badge>
                          </TableCell>
                          <TableCell>
                            {employee.hireDate ? new Date(employee.hireDate).toLocaleDateString() : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={(employee.performanceRating || 0) * 20} className="w-16" />
                              <span className="text-sm">{employee.performanceRating || 0}/5</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={employee.status === 'active' ? "default" : "secondary"}>
                              {employee.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics with Charts */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>User Growth Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-lg">
                    <div className="text-center">
                      <BarChart className="h-12 w-12 mx-auto text-slate-400 mb-2" />
                      <p className="text-slate-500">User growth chart would display here</p>
                      <p className="text-xs text-slate-400">Real-time data visualization</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Role Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-lg">
                    <div className="text-center">
                      <PieChart className="h-12 w-12 mx-auto text-slate-400 mb-2" />
                      <p className="text-slate-500">Role distribution pie chart</p>
                      <p className="text-xs text-slate-400">Shows user role breakdown</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Department Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {['Engineering', 'Marketing', 'Sales', 'HR', 'Finance'].map((dept) => (
                      <div key={dept} className="flex items-center justify-between">
                        <span className="font-medium">{dept}</span>
                        <div className="flex items-center gap-2">
                          <Progress value={Math.random() * 100} className="w-24" />
                          <span className="text-sm text-slate-500">{Math.floor(Math.random() * 20) + 1}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>CPU Usage</span>
                      <span className="font-semibold">15%</span>
                    </div>
                    <Progress value={15} />
                    
                    <div className="flex justify-between items-center">
                      <span>Memory Usage</span>
                      <span className="font-semibold">45%</span>
                    </div>
                    <Progress value={45} />
                    
                    <div className="flex justify-between items-center">
                      <span>Database Load</span>
                      <span className="font-semibold">25%</span>
                    </div>
                    <Progress value={25} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Platform Integration Status */}
          <TabsContent value="platforms" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Social Platform Integration Status</CardTitle>
                <CardDescription>Monitor and test social media platform connections</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Instagram */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                          <span className="text-white text-sm font-bold">IG</span>
                        </div>
                        Instagram
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Connection Status</span>
                          <Badge variant="secondary" className="bg-green-100 text-green-700">
                            Connected
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Token Validity</span>
                          <Badge variant="outline" className="text-green-600">
                            Valid
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Connected Users</span>
                          <span className="text-sm font-medium">1</span>
                        </div>
                        <Button variant="outline" size="sm" className="w-full">
                          <Wifi className="h-4 w-4 mr-2" />
                          Test Connection
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Facebook */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                          <span className="text-white text-sm font-bold">FB</span>
                        </div>
                        Facebook
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Connection Status</span>
                          <Badge variant="destructive">
                            Disconnected
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Token Validity</span>
                          <Badge variant="outline" className="text-gray-500">
                            N/A
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Connected Users</span>
                          <span className="text-sm font-medium">0</span>
                        </div>
                        <Button variant="outline" size="sm" className="w-full" disabled>
                          <Wifi className="h-4 w-4 mr-2" />
                          Test Connection
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Twitter/X */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                          <span className="text-white text-sm font-bold">X</span>
                        </div>
                        Twitter/X
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Connection Status</span>
                          <Badge variant="secondary" className="bg-green-100 text-green-700">
                            Connected
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Token Validity</span>
                          <Badge variant="outline" className="text-yellow-600">
                            Limited Access
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Connected Users</span>
                          <span className="text-sm font-medium">1</span>
                        </div>
                        <Button variant="outline" size="sm" className="w-full">
                          <Wifi className="h-4 w-4 mr-2" />
                          Test Connection
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* TikTok */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                          <span className="text-white text-sm font-bold">TT</span>
                        </div>
                        TikTok
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Connection Status</span>
                          <Badge variant="destructive">
                            Disconnected
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Token Validity</span>
                          <Badge variant="outline" className="text-gray-500">
                            N/A
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Connected Users</span>
                          <span className="text-sm font-medium">0</span>
                        </div>
                        <Button variant="outline" size="sm" className="w-full" disabled>
                          <Wifi className="h-4 w-4 mr-2" />
                          Test Connection
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Platform Integration Summary */}
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Integration Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">2</div>
                        <p className="text-sm text-slate-600">Active Connections</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">2</div>
                        <p className="text-sm text-slate-600">Inactive Connections</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">2</div>
                        <p className="text-sm text-slate-600">Total Connected Users</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">50%</div>
                        <p className="text-sm text-slate-600">Success Rate</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Permissions Management */}
          <TabsContent value="permissions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Permission Categories</CardTitle>
                <CardDescription>Manage system permissions by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {['User Management', 'System Administration', 'Content Moderation', 'Analytics', 'Employee Management'].map((category) => (
                    <Card key={category}>
                      <CardHeader>
                        <CardTitle className="text-lg">{category}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {['Read', 'Write', 'Delete', 'Admin'].map((perm) => (
                            <div key={perm} className="flex items-center justify-between">
                              <span className="text-sm">{perm}</span>
                              <Switch defaultChecked={Math.random() > 0.5} />
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Management */}
          <TabsContent value="system" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Server Status</span>
                      <Badge className="bg-green-100 text-green-800">Online</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Database</span>
                      <Badge className="bg-green-100 text-green-800">Connected</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Redis Cache</span>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Background Jobs</span>
                      <Badge className="bg-green-100 text-green-800">Running</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Feature Toggles</CardTitle>
                  <CardDescription>Control major application features</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">Content Preview Block</Label>
                        <p className="text-xs text-slate-500">Allow users to preview social media content</p>
                      </div>
                      <Switch defaultChecked={false} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">New Features Beta Access</Label>
                        <p className="text-xs text-slate-500">Enable beta features for selected users</p>
                      </div>
                      <Switch defaultChecked={true} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">User Registration</Label>
                        <p className="text-xs text-slate-500">Allow new user signups</p>
                      </div>
                      <Switch defaultChecked={true} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">Maintenance Mode</Label>
                        <p className="text-xs text-slate-500">Put application in maintenance mode</p>
                      </div>
                      <Switch defaultChecked={false} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start">
                      <Download className="h-4 w-4 mr-2" />
                      Export User Data
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Upload className="h-4 w-4 mr-2" />
                      Import Users
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Database className="h-4 w-4 mr-2" />
                      Backup Database
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Activity className="h-4 w-4 mr-2" />
                      System Logs
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Email Management */}
          <TabsContent value="email" className="space-y-4">
            <EmailManagement />
          </TabsContent>
        </Tabs>

        {/* Edit Role Dialog */}
        <Dialog open={isEditRoleDialogOpen} onOpenChange={setIsEditRoleDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Role</DialogTitle>
              <DialogDescription>
                Modify role details and permissions
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="editRoleName">Role Name</Label>
                <Input 
                  id="editRoleName" 
                  placeholder="e.g., content_manager" 
                  value={roleFormData.name}
                  onChange={(e) => setRoleFormData({ ...roleFormData, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="editDisplayName">Display Name</Label>
                <Input 
                  id="editDisplayName" 
                  placeholder="e.g., Content Manager" 
                  value={roleFormData.displayName}
                  onChange={(e) => setRoleFormData({ ...roleFormData, displayName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="editDescription">Description</Label>
                <Input 
                  id="editDescription" 
                  placeholder="Role description" 
                  value={roleFormData.description}
                  onChange={(e) => setRoleFormData({ ...roleFormData, description: e.target.value })}
                />
              </div>
              <div>
                <Label>Permissions</Label>
                <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto">
                  {permissions.map((permission: Permission) => (
                    <div key={permission.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`edit-perm-${permission.id}`}
                        checked={roleFormData.permissions.includes(permission.name)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setRoleFormData({
                              ...roleFormData,
                              permissions: [...roleFormData.permissions, permission.name]
                            });
                          } else {
                            setRoleFormData({
                              ...roleFormData,
                              permissions: roleFormData.permissions.filter(p => p !== permission.name)
                            });
                          }
                        }}
                      />
                      <Label htmlFor={`edit-perm-${permission.id}`} className="text-sm">
                        {permission.displayName}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={() => {
                    if (selectedRole) {
                      updateRoleMutation.mutate({
                        id: selectedRole.id,
                        ...roleFormData
                      });
                    }
                  }}
                  disabled={updateRoleMutation.isPending}
                  className="flex-1"
                >
                  {updateRoleMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Update Role
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditRoleDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}