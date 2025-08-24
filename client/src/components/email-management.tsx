import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { 
  Mail, Send, Edit, Trash2, Eye, Plus, Settings, 
  Users, BarChart3, CheckCircle, XCircle, Clock,
  Target, TrendingUp, MessageSquare, Filter, Calendar,
  AlertCircle, User, EyeOff
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface EmailTemplate {
  id: number;
  name: string;
  type: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface EmailLog {
  id: number;
  templateId: number;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  status: string;
  sentAt: string;
  errorMessage?: string;
  template?: EmailTemplate;
}

interface EmailCampaign {
  id: number;
  name: string;
  type: string;
  subject: string;
  content: string;
  status: string;
  scheduledAt?: string;
  sentAt?: string;
  recipientCount?: number;
  sentCount?: number;
  openCount?: number;
  clickCount?: number;
  createdAt: string;
}

interface SupportMessage {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  priority: string;
  status: string;
  isRead: boolean;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  adminNotes?: string;
}

export function EmailManagement() {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isCampaignDialogOpen, setIsCampaignDialogOpen] = useState(false);
  const [isTestEmailDialogOpen, setIsTestEmailDialogOpen] = useState(false);
  const [selectedSupportMessage, setSelectedSupportMessage] = useState<SupportMessage | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [templateFormData, setTemplateFormData] = useState({
    name: '',
    type: '',
    subject: '',
    htmlContent: '',
    textContent: '',
    isActive: true
  });
  const [testEmailData, setTestEmailData] = useState({
    templateType: '',
    email: '',
    name: '',
    variables: '{}'
  });

  // Fetch email templates
  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['/api/email/templates'],
    queryFn: () => apiRequest('/api/email/templates')
  });

  // Fetch email logs
  const { data: logs = [], isLoading: logsLoading } = useQuery({
    queryKey: ['/api/email/logs'],
    queryFn: () => apiRequest('/api/email/logs')
  });

  // Fetch email campaigns
  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery({
    queryKey: ['/api/email/campaigns'],
    queryFn: () => apiRequest('/api/email/campaigns')
  });

  // Fetch support messages
  const { data: supportMessages = [], isLoading: supportMessagesLoading, error: supportMessagesError } = useQuery({
    queryKey: ['/api/support/messages'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/support/messages', {});
        return await response.json();
      } catch (error) {
        console.error('Failed to fetch support messages:', error);
        return [];
      }
    }
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/email/templates', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email/templates'] });
      setIsTemplateDialogOpen(false);
      setTemplateFormData({
        name: '',
        type: '',
        subject: '',
        htmlContent: '',
        textContent: '',
        isActive: true
      });
      toast({
        title: "Template created",
        description: "Email template has been created successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create email template.",
        variant: "destructive"
      });
    }
  });

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest(`/api/email/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email/templates'] });
      setIsTemplateDialogOpen(false);
      setIsEditMode(false);
      toast({
        title: "Template updated",
        description: "Email template has been updated successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update email template.",
        variant: "destructive"
      });
    }
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/email/templates/${id}`, {
      method: 'DELETE'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email/templates'] });
      toast({
        title: "Template deleted",
        description: "Email template has been deleted successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete email template.",
        variant: "destructive"
      });
    }
  });

  // Send test email mutation
  const sendTestEmailMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/email/test', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      setIsTestEmailDialogOpen(false);
      toast({
        title: "Test email sent",
        description: "Test email has been sent successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send test email.",
        variant: "destructive"
      });
    }
  });

  const handleEditTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setTemplateFormData({
      name: template.name,
      type: template.type,
      subject: template.subject,
      htmlContent: template.htmlContent,
      textContent: template.textContent,
      isActive: template.isActive
    });
    setIsEditMode(true);
    setIsTemplateDialogOpen(true);
  };

  const handleSubmitTemplate = () => {
    if (isEditMode && selectedTemplate) {
      updateTemplateMutation.mutate({
        id: selectedTemplate.id,
        ...templateFormData
      });
    } else {
      createTemplateMutation.mutate(templateFormData);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge variant="default" className="bg-green-100 text-green-800">Sent</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTemplateTypeBadge = (type: string) => {
    switch (type) {
      case 'welcome':
        return <Badge className="bg-blue-100 text-blue-800">Welcome</Badge>;
      case 'password_reset':
        return <Badge className="bg-orange-100 text-orange-800">Password Reset</Badge>;
      case 'password_changed':
        return <Badge className="bg-green-100 text-green-800">Password Changed</Badge>;
      case 'marketing':
        return <Badge className="bg-purple-100 text-purple-800">Marketing</Badge>;
      case 'newsletter':
        return <Badge className="bg-indigo-100 text-indigo-800">Newsletter</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Email Management</h2>
          <p className="text-slate-600">Manage email templates, campaigns, and monitor delivery</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isTestEmailDialogOpen} onOpenChange={setIsTestEmailDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Send className="h-4 w-4 mr-2" />
                Test Email
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Send Test Email</DialogTitle>
                <DialogDescription>
                  Send a test email to verify template functionality
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="templateType">Template Type</Label>
                  <Select value={testEmailData.templateType} onValueChange={(value) => setTestEmailData({ ...testEmailData, templateType: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select template type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="welcome">Welcome</SelectItem>
                      <SelectItem value="password_reset">Password Reset</SelectItem>
                      <SelectItem value="password_changed">Password Changed</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="newsletter">Newsletter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="testEmail">Email Address</Label>
                  <Input 
                    id="testEmail"
                    type="email"
                    placeholder="test@example.com"
                    value={testEmailData.email}
                    onChange={(e) => setTestEmailData({ ...testEmailData, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="testName">Name</Label>
                  <Input 
                    id="testName"
                    placeholder="Test User"
                    value={testEmailData.name}
                    onChange={(e) => setTestEmailData({ ...testEmailData, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="testVariables">Variables (JSON)</Label>
                  <Textarea 
                    id="testVariables"
                    placeholder='{"resetUrl": "https://example.com/reset"}'
                    value={testEmailData.variables}
                    onChange={(e) => setTestEmailData({ ...testEmailData, variables: e.target.value })}
                  />
                </div>
                <Button 
                  onClick={() => sendTestEmailMutation.mutate(testEmailData)}
                  disabled={sendTestEmailMutation.isPending}
                  className="w-full"
                >
                  {sendTestEmailMutation.isPending ? 'Sending...' : 'Send Test Email'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="templates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="templates">
            <Mail className="h-4 w-4 mr-2" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="logs">
            <BarChart3 className="h-4 w-4 mr-2" />
            Logs
          </TabsTrigger>
          <TabsTrigger value="campaigns">
            <Target className="h-4 w-4 mr-2" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="support">
            <MessageSquare className="h-4 w-4 mr-2" />
            Support
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Email Templates</h3>
            <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setIsEditMode(false);
                  setTemplateFormData({
                    name: '',
                    type: '',
                    subject: '',
                    htmlContent: '',
                    textContent: '',
                    isActive: true
                  });
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{isEditMode ? 'Edit Template' : 'Create New Template'}</DialogTitle>
                  <DialogDescription>
                    {isEditMode ? 'Update the email template' : 'Create a new email template'}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="templateName">Template Name</Label>
                      <Input 
                        id="templateName"
                        placeholder="Welcome Email"
                        value={templateFormData.name}
                        onChange={(e) => setTemplateFormData({ ...templateFormData, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="templateType">Type</Label>
                      <Select value={templateFormData.type} onValueChange={(value) => setTemplateFormData({ ...templateFormData, type: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="welcome">Welcome</SelectItem>
                          <SelectItem value="password_reset">Password Reset</SelectItem>
                          <SelectItem value="password_changed">Password Changed</SelectItem>
                          <SelectItem value="marketing">Marketing</SelectItem>
                          <SelectItem value="newsletter">Newsletter</SelectItem>
                          <SelectItem value="role_invitation">Role Invitation</SelectItem>
                          <SelectItem value="role_update">Role Update</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="templateSubject">Subject</Label>
                      <Input 
                        id="templateSubject"
                        placeholder="Welcome to MyLinked!"
                        value={templateFormData.subject}
                        onChange={(e) => setTemplateFormData({ ...templateFormData, subject: e.target.value })}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="templateActive"
                        checked={templateFormData.isActive}
                        onCheckedChange={(checked) => setTemplateFormData({ ...templateFormData, isActive: checked })}
                      />
                      <Label htmlFor="templateActive">Active</Label>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="templateHtml">HTML Content</Label>
                      <Textarea 
                        id="templateHtml"
                        placeholder="<h1>Welcome {{name}}!</h1>"
                        value={templateFormData.htmlContent}
                        onChange={(e) => setTemplateFormData({ ...templateFormData, htmlContent: e.target.value })}
                        className="min-h-[200px]"
                      />
                    </div>
                    <div>
                      <Label htmlFor="templateText">Text Content</Label>
                      <Textarea 
                        id="templateText"
                        placeholder="Welcome {{name}}!"
                        value={templateFormData.textContent}
                        onChange={(e) => setTemplateFormData({ ...templateFormData, textContent: e.target.value })}
                        className="min-h-[100px]"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={handleSubmitTemplate}
                    disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}
                    className="flex-1"
                  >
                    {isEditMode ? 'Update Template' : 'Create Template'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsTemplateDialogOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template: EmailTemplate) => (
              <Card key={template.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <div className="flex gap-1">
                      {getTemplateTypeBadge(template.type)}
                      {template.isActive ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </div>
                  <CardDescription>{template.subject}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditTemplate(template)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => deleteTemplateMutation.mutate(template.id)}
                      disabled={deleteTemplateMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Delivery Logs</CardTitle>
              <CardDescription>Track email delivery status and performance</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Template</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log: EmailLog) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{log.recipientName}</p>
                          <p className="text-sm text-slate-500">{log.recipientEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>{log.subject}</TableCell>
                      <TableCell>
                        {log.template ? getTemplateTypeBadge(log.template.type) : 'N/A'}
                      </TableCell>
                      <TableCell>{getStatusBadge(log.status)}</TableCell>
                      <TableCell>
                        {new Date(log.sentAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Email Campaigns</h3>
            <Dialog open={isCampaignDialogOpen} onOpenChange={setIsCampaignDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Campaign
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Email Campaign</DialogTitle>
                  <DialogDescription>
                    Create a new email campaign to send to your users
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="campaignName">Campaign Name</Label>
                    <Input 
                      id="campaignName"
                      placeholder="Monthly Newsletter"
                    />
                  </div>
                  <div>
                    <Label htmlFor="campaignSubject">Subject</Label>
                    <Input 
                      id="campaignSubject"
                      placeholder="This Month's Updates"
                    />
                  </div>
                  <div>
                    <Label htmlFor="campaignContent">Content</Label>
                    <Textarea 
                      id="campaignContent"
                      placeholder="Email content..."
                      className="min-h-[150px]"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button className="flex-1">Create Campaign</Button>
                    <Button variant="outline" onClick={() => setIsCampaignDialogOpen(false)} className="flex-1">
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaigns.map((campaign: EmailCampaign) => (
              <Card key={campaign.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{campaign.name}</CardTitle>
                    {getStatusBadge(campaign.status)}
                  </div>
                  <CardDescription>{campaign.subject}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Recipients:</span>
                      <span>{campaign.recipientCount || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Sent:</span>
                      <span>{campaign.sentCount || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Opens:</span>
                      <span>{campaign.openCount || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Clicks:</span>
                      <span>{campaign.clickCount || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="support" className="space-y-4">
          {supportMessagesLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <p>Loading support messages...</p>
              </div>
            </div>
          ) : supportMessagesError ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500 opacity-50" />
              <p className="text-red-600">Failed to load support messages</p>
              <Button 
                variant="outline" 
                className="mt-2"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/support/messages'] })}
              >
                Retry
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Overview Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-2xl font-bold">{supportMessages.length}</p>
                      <p className="text-sm text-base-content/70">Total Messages</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="text-2xl font-bold">
                        {supportMessages.filter((m: SupportMessage) => m.status === 'open').length}
                      </p>
                      <p className="text-sm text-base-content/70">Open</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="h-5 w-5 text-red-500" />
                    <div>
                      <p className="text-2xl font-bold">
                        {supportMessages.filter((m: SupportMessage) => !m.isRead).length}
                      </p>
                      <p className="text-sm text-base-content/70">Unread</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-2xl font-bold">
                        {supportMessages.filter((m: SupportMessage) => m.status === 'resolved').length}
                      </p>
                      <p className="text-sm text-base-content/70">Resolved</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Messages List */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Support Messages</h3>
              {supportMessages.map((message: SupportMessage) => (
                <Card key={message.id} className={`${!message.isRead ? 'border-blue-200 bg-blue-50/50' : ''}`}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-base-content/70" />
                          <span className="font-medium">{message.name}</span>
                          <Badge variant="outline">{message.email}</Badge>
                          <Badge variant={message.priority === 'urgent' ? 'destructive' : 'secondary'}>
                            {message.priority.toUpperCase()}
                          </Badge>
                          <Badge variant={message.status === 'resolved' ? 'default' : 'secondary'}>
                            {message.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                        
                        <div>
                          <h4 className="font-medium">{message.subject}</h4>
                          <p className="text-sm text-base-content/70 line-clamp-2 mt-1">
                            {message.message}
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-2 text-xs text-base-content/70">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(message.createdAt).toLocaleString()}</span>
                          {message.resolvedAt && (
                            <>
                              <span>•</span>
                              <span>Resolved: {new Date(message.resolvedAt).toLocaleString()}</span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            try {
                              const updates = { isRead: !message.isRead };
                              const response = await apiRequest('PATCH', `/api/support/messages/${message.id}`, updates);
                              if (!response.ok) {
                                throw new Error('Failed to update read status');
                              }
                              queryClient.invalidateQueries({ queryKey: ['/api/support/messages'] });
                              toast({
                                title: "Message updated",
                                description: `Message marked as ${message.isRead ? 'unread' : 'read'}`,
                              });
                            } catch (error) {
                              toast({
                                title: "Error",
                                description: "Failed to update message. Please try again.",
                                variant: "destructive",
                              });
                            }
                          }}
                        >
                          {message.isRead ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        
                        <Select
                          value={message.status}
                          onValueChange={async (status) => {
                            try {
                              const updates: any = { status };
                              if (status === 'resolved') {
                                updates.resolvedAt = new Date().toISOString();
                                updates.resolvedBy = 'Admin';
                              }
                              const response = await apiRequest('PATCH', `/api/support/messages/${message.id}`, updates);
                              if (!response.ok) {
                                throw new Error('Failed to update message status');
                              }
                              queryClient.invalidateQueries({ queryKey: ['/api/support/messages'] });
                              toast({
                                title: "Message updated",
                                description: "Support message status updated successfully.",
                              });
                            } catch (error) {
                              toast({
                                title: "Error",
                                description: "Failed to update message status. Please try again.",
                                variant: "destructive",
                              });
                            }
                          }}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedSupportMessage(message);
                                setAdminNotes(message.adminNotes || "");
                              }}
                            >
                              Notes
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Admin Notes - {message.subject}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm font-medium">From: {message.name} ({message.email})</p>
                                <p className="text-sm text-base-content/70 mt-2">{message.message}</p>
                              </div>
                              <div>
                                <Label>Admin Notes:</Label>
                                <Textarea
                                  value={adminNotes}
                                  onChange={(e) => setAdminNotes(e.target.value)}
                                  placeholder="Add admin notes..."
                                  rows={4}
                                  className="mt-1"
                                />
                              </div>
                              <div className="flex justify-end space-x-2">
                                <Button variant="outline" onClick={() => setSelectedSupportMessage(null)}>
                                  Cancel
                                </Button>
                                <Button onClick={async () => {
                                  if (selectedSupportMessage) {
                                    try {
                                      const response = await apiRequest('PATCH', `/api/support/messages/${selectedSupportMessage.id}`, { adminNotes });
                                      if (!response.ok) {
                                        throw new Error('Failed to save admin notes');
                                      }
                                      queryClient.invalidateQueries({ queryKey: ['/api/support/messages'] });
                                      setSelectedSupportMessage(null);
                                      setAdminNotes("");
                                      toast({
                                        title: "Notes saved",
                                        description: "Admin notes saved successfully.",
                                      });
                                    } catch (error) {
                                      toast({
                                        title: "Error",
                                        description: "Failed to save admin notes. Please try again.",
                                        variant: "destructive",
                                      });
                                    }
                                  }
                                }}>
                                  Save Notes
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            if (confirm('Are you sure you want to delete this support message?')) {
                              try {
                                const response = await apiRequest('DELETE', `/api/support/messages/${message.id}`, {});
                                if (!response.ok) {
                                  throw new Error('Failed to delete message');
                                }
                                queryClient.invalidateQueries({ queryKey: ['/api/support/messages'] });
                                toast({
                                  title: "Message deleted",
                                  description: "Support message has been deleted.",
                                });
                              } catch (error) {
                                toast({
                                  title: "Error",
                                  description: "Failed to delete message. Please try again.",
                                  variant: "destructive",
                                });
                              }
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {supportMessages.length === 0 && (
                <div className="text-center py-8 text-base-content/70">
                  <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No support messages found</p>
                </div>
                )}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}