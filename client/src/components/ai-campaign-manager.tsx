import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { 
  Send, 
  Users, 
  Mail, 
  Target, 
  BarChart3, 
  Calendar, 
  Clock, 
  Settings,
  Plus,
  Play,
  Pause,
  Edit,
  Trash2,
  Copy,
  Zap,
  Bot,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Eye,
  Square,
  X
} from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'completed' | 'draft';
  type: 'onboarding' | 'engagement' | 'reactivation' | 'newsletter' | 'promotion';
  recipients: number;
  openRate: number;
  clickRate: number;
  lastSent: string;
  nextSend: string;
  template: string;
}

interface Template {
  id: string;
  name: string;
  subject: string;
  type: 'welcome' | 'engagement' | 'newsletter' | 'promotion' | 'reactivation';
  variables: string[];
  lastUsed: string;
  performance: number;
}

interface ABTest {
  id: string;
  name: string;
  description: string;
  variantA: string;
  variantB: string;
  metricA: number | null;
  metricB: number | null;
  status: 'running' | 'completed' | 'scheduled';
}

const mockCampaigns: Campaign[] = [
  {
    id: '1',
    name: 'New User Onboarding',
    status: 'active',
    type: 'onboarding',
    recipients: 1250,
    openRate: 68.5,
    clickRate: 24.2,
    lastSent: '2 hours ago',
    nextSend: 'Continuous',
    template: 'welcome_onboarding'
  },
  {
    id: '2',
    name: 'Monthly Newsletter',
    status: 'active',
    type: 'newsletter',
    recipients: 5680,
    openRate: 45.3,
    clickRate: 12.7,
    lastSent: '3 days ago',
    nextSend: 'In 27 days',
    template: 'monthly_newsletter'
  },
  {
    id: '3',
    name: 'Engagement Boost',
    status: 'paused',
    type: 'engagement',
    recipients: 890,
    openRate: 52.1,
    clickRate: 18.4,
    lastSent: '1 week ago',
    nextSend: 'Paused',
    template: 'engagement_boost'
  }
];

const mockTemplates: Template[] = [
  {
    id: '1',
    name: 'Welcome & Onboarding',
    subject: 'Welcome to MyLinked! 🚀 Your Digital Identity Journey Starts Here',
    type: 'welcome',
    variables: ['name', 'dashboard_url', 'help_url'],
    lastUsed: '2 hours ago',
    performance: 94.2
  },
  {
    id: '2',
    name: 'Engagement Boost',
    subject: '📈 {{name}}, Your Profile Views Are Up! Here\'s How to Capitalize',
    type: 'engagement',
    variables: ['name', 'view_increase', 'click_increase', 'social_score'],
    lastUsed: '1 week ago',
    performance: 87.6
  },
  {
    id: '3',
    name: 'Monthly Newsletter',
    subject: '🌟 MyLinked Monthly: Platform Updates & Success Stories',
    type: 'newsletter',
    variables: ['name', 'month_year', 'feature_1', 'total_users'],
    lastUsed: '3 days ago',
    performance: 76.3
  }
];

const mockAbTests: ABTest[] = [
  {
    id: '1',
    name: 'Welcome Email Subject Test',
    description: 'Testing formal vs casual subject lines',
    variantA: 'Variant A',
    variantB: 'Variant B',
    metricA: 23.4,
    metricB: 31.8,
    status: 'running',
  },
  {
    id: '2',
    name: 'CTA Button Color Test',
    description: 'Blue vs Orange call-to-action buttons',
    variantA: 'Variant A',
    variantB: 'Variant B',
    metricA: 18.2,
    metricB: 17.9,
    status: 'completed',
  },
  {
    id: '3',
    name: 'Email Send Time Test',
    description: 'Morning 9 AM vs Evening 6 PM send times',
    variantA: 'Variant A',
    variantB: 'Variant B',
    metricA: null,
    metricB: null,
    status: 'scheduled',
  },
];

export function AICampaignManager() {
  const { toast } = useToast();
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [editCampaign, setEditCampaign] = useState<Campaign | null>(null);
  const [editTemplate, setEditTemplate] = useState<Template | null>(null);
  const [analyticsViewCampaign, setAnalyticsViewCampaign] = useState<Campaign | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [newCampaignDialog, setNewCampaignDialog] = useState(false);
  const [newTemplateDialog, setNewTemplateDialog] = useState(false);
  const [newTestDialog, setNewTestDialog] = useState(false);
  const [campaigns, setCampaigns] = useState(mockCampaigns);
  const [templates, setTemplates] = useState(mockTemplates);
  const [abTests, setAbTests] = useState(mockAbTests);
  const [newTestName, setNewTestName] = useState('');
  const [newVariantA, setNewVariantA] = useState('');
  const [newVariantB, setNewVariantB] = useState('');

  const [newCampaignName, setNewCampaignName] = useState('');
  const [newCampaignType, setNewCampaignType] = useState<Campaign['type'] | ''>('');
  const [newCampaignTemplate, setNewCampaignTemplate] = useState('');
  const [newCampaignAudience, setNewCampaignAudience] = useState('');
  const [newCampaignAutoSend, setNewCampaignAutoSend] = useState(false);

  const [templatePurpose, setTemplatePurpose] = useState('');
  const [templateTone, setTemplateTone] = useState('');
  const [templateIndustry, setTemplateIndustry] = useState('');
  const [templateCta, setTemplateCta] = useState('');

  const [automationToggles, setAutomationToggles] = useState({
    newUserWelcome: true,
    engagementBoost: true,
    winBackCampaign: false,
  });

  const [scheduledToggles, setScheduledToggles] = useState({
    monthlyNewsletter: true,
    weeklyTips: false,
    featureUpdates: true,
  });

  useEffect(() => {
    const savedAutomation = localStorage.getItem('automationToggles');
    const savedScheduled = localStorage.getItem('scheduledToggles');
    if (savedAutomation) {
      try {
        setAutomationToggles(JSON.parse(savedAutomation));
      } catch (_) {
        // ignore parse error
      }
    }
    if (savedScheduled) {
      try {
        setScheduledToggles(JSON.parse(savedScheduled));
      } catch (_) {
        // ignore parse error
      }
    }
  }, []);

  const updateAutomationToggle = (key: keyof typeof automationToggles, value: boolean) => {
    setAutomationToggles(prev => {
      const updated = { ...prev, [key]: value };
      localStorage.setItem('automationToggles', JSON.stringify(updated));
      return updated;
    });
  };

  const updateScheduledToggle = (key: keyof typeof scheduledToggles, value: boolean) => {
    setScheduledToggles(prev => {
      const updated = { ...prev, [key]: value };
      localStorage.setItem('scheduledToggles', JSON.stringify(updated));
      return updated;
    });
  };

  const toggleCampaignStatus = (campaignId: string) => {
    setCampaigns(prev => prev.map(campaign => {
      if (campaign.id === campaignId) {
        const newStatus = campaign.status === 'active' ? 'paused' : 'active';
        const action = newStatus === 'active' ? 'resumed' : 'paused';
        
        toast({
          title: `Campaign ${action}`,
          description: `"${campaign.name}" has been ${action} successfully.`,
          duration: 3000,
        });
        
        return { ...campaign, status: newStatus };
      }
      return campaign;
    }));
  };

  const copyTemplate = (template: Template) => {
    // Copy template subject to clipboard
    navigator.clipboard.writeText(template.subject).then(() => {
      toast({
        title: "Template copied",
        description: `"${template.name}" subject line copied to clipboard.`,
        duration: 3000,
      });
    }).catch(() => {
      toast({
        title: "Copy failed",
        description: "Unable to copy template to clipboard.",
        variant: "destructive",
        duration: 3000,
      });
    });
  };

  const handleCreateCampaign = () => {
    const newCampaign: Campaign = {
      id: Date.now().toString(),
      name: newCampaignName || 'Untitled Campaign',
      status: newCampaignAutoSend ? 'active' : 'draft',
      type: (newCampaignType as Campaign['type']) || 'promotion',
      recipients: 0,
      openRate: 0,
      clickRate: 0,
      lastSent: 'Not sent',
      nextSend: newCampaignAutoSend ? 'Scheduled' : 'Not scheduled',
      template: newCampaignTemplate || (templates[0]?.id || ''),
    };
    setCampaigns(prev => [...prev, newCampaign]);
    toast({
      title: "Campaign created",
      description: "Your campaign has been created successfully.",
      duration: 3000,
    });
    setNewCampaignDialog(false);
    setNewCampaignName('');
    setNewCampaignType('');
    setNewCampaignTemplate('');
    setNewCampaignAudience('');
    setNewCampaignAutoSend(false);
  };

  const handleGenerateTemplate = () => {
    const newTemplate: Template = {
      id: Date.now().toString(),
      name: templatePurpose || 'AI Template',
      subject: templateCta || 'AI Generated Template',
      type: 'welcome',
      variables: ['name'],
      lastUsed: 'Just now',
      performance: 0,
    };
    setTemplates(prev => [...prev, newTemplate]);
    toast({
      title: "Template generated",
      description: "AI template generated successfully.",
      duration: 3000,
    });
    setNewTemplateDialog(false);
    setTemplatePurpose('');
    setTemplateTone('');
    setTemplateIndustry('');
    setTemplateCta('');
  };

  const handleUpdateCampaign = () => {
    if (editCampaign) {
      setCampaigns(prev => prev.map(c => c.id === editCampaign.id ? editCampaign : c));
      toast({
        title: "Campaign updated",
        description: `"${editCampaign.name}" has been updated.`,
        duration: 3000,
      });
    }
    setSelectedCampaign(null);
    setEditCampaign(null);
  };

  const handleUpdateTemplate = () => {
    if (editTemplate) {
      setTemplates(prev => prev.map(t => t.id === editTemplate.id ? editTemplate : t));
      toast({
        title: "Template updated",
        description: `"${editTemplate.name}" has been updated.`,
        duration: 3000,
      });
    }
    setSelectedTemplate(null);
    setEditTemplate(null);
  };

  const handleCreateTest = () => {
    const newTest: ABTest = {
      id: Date.now().toString(),
      name: newTestName || 'Untitled Test',
      description: 'Custom A/B test',
      variantA: newVariantA,
      variantB: newVariantB,
      metricA: null,
      metricB: null,
      status: 'scheduled',
    };
    setAbTests(prev => [...prev, newTest]);
    toast({
      title: 'A/B Test Created',
      description: 'Your test has been scheduled and will start within 24 hours.',
      duration: 3000,
    });
    setNewTestDialog(false);
    setNewTestName('');
    setNewVariantA('');
    setNewVariantB('');
  };

  const handleViewTest = (test: ABTest) => {
    toast({
      title: 'Viewing Test',
      description: `${test.name} details coming soon.`,
      duration: 3000,
    });
  };

  const handleAnalyzeTest = (test: ABTest) => {
    toast({
      title: 'Analyzing Results',
      description: `${test.name} performance analysis coming soon.`,
      duration: 3000,
    });
  };

  const handleStopTest = (id: string) => {
    setAbTests(prev => prev.map(t => t.id === id ? { ...t, status: 'completed' } : t));
    toast({
      title: 'Test stopped',
      description: 'The test has been stopped.',
      duration: 3000,
    });
  };

  const handleImplementWinner = (id: string) => {
    toast({
      title: 'Winner implemented',
      description: 'The winning variant has been applied.',
      duration: 3000,
    });
  };

  const handleEditTest = (test: ABTest) => {
    toast({
      title: 'Edit test',
      description: `${test.name} editing not implemented.`,
      duration: 3000,
    });
  };

  const handleCancelTest = (id: string) => {
    setAbTests(prev => prev.filter(t => t.id !== id));
    toast({
      title: 'Test cancelled',
      description: 'The test has been cancelled.',
      duration: 3000,
    });
  };

  const getTestStatusColor = (status: ABTest['status']) => {
    switch (status) {
      case 'running':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'scheduled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTestIconClasses = (status: ABTest['status']) => {
    switch (status) {
      case 'running':
        return { bg: 'bg-green-100', text: 'text-green-600' };
      case 'completed':
        return { bg: 'bg-blue-100', text: 'text-blue-600' };
      case 'scheduled':
        return { bg: 'bg-orange-100', text: 'text-orange-600' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-600' };
    }
  };

  const getStatusColor = (status: Campaign['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: Campaign['type']) => {
    switch (type) {
      case 'onboarding': return <Users className="w-4 h-4" />;
      case 'engagement': return <TrendingUp className="w-4 h-4" />;
      case 'reactivation': return <Target className="w-4 h-4" />;
      case 'newsletter': return <Mail className="w-4 h-4" />;
      case 'promotion': return <Zap className="w-4 h-4" />;
      default: return <Mail className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            AI Campaign Manager
          </h1>
          <p className="text-gray-600">Manage automated email campaigns and templates</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={newCampaignDialog} onOpenChange={setNewCampaignDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-500 to-purple-500">
                <Plus className="w-4 h-4 mr-2" />
                New Campaign
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Campaign</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="campaign-name">Campaign Name</Label>
                    <Input
                      id="campaign-name"
                      placeholder="e.g., Summer Promotion"
                      value={newCampaignName}
                      onChange={(e) => setNewCampaignName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="campaign-type">Campaign Type</Label>
                    <Select value={newCampaignType} onValueChange={(value) => setNewCampaignType(value as Campaign['type'])}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="onboarding">Onboarding</SelectItem>
                        <SelectItem value="engagement">Engagement</SelectItem>
                        <SelectItem value="reactivation">Reactivation</SelectItem>
                        <SelectItem value="newsletter">Newsletter</SelectItem>
                        <SelectItem value="promotion">Promotion</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="campaign-template">Email Template</Label>
                  <Select
                    value={newCampaignTemplate}
                    onValueChange={(value) => setNewCampaignTemplate(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map(template => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="campaign-audience">Target Audience</Label>
                  <Select
                    value={newCampaignAudience}
                    onValueChange={(value) => setNewCampaignAudience(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select audience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="new">New Users (Last 30 days)</SelectItem>
                      <SelectItem value="active">Active Users</SelectItem>
                      <SelectItem value="inactive">Inactive Users</SelectItem>
                      <SelectItem value="premium">Premium Users</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="auto-send" checked={newCampaignAutoSend} onCheckedChange={setNewCampaignAutoSend} />
                  <Label htmlFor="auto-send">Enable automatic sending</Label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setNewCampaignDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateCampaign}>Create Campaign</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={newTemplateDialog} onOpenChange={setNewTemplateDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Bot className="w-4 h-4 mr-2" />
                AI Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Generate AI Template</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="template-purpose">Template Purpose</Label>
                  <Input
                    id="template-purpose"
                    placeholder="e.g., Welcome new users and guide setup"
                    value={templatePurpose}
                    onChange={(e) => setTemplatePurpose(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="template-tone">Tone & Style</Label>
                  <Select value={templateTone} onValueChange={(value) => setTemplateTone(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="template-industry">Industry Focus</Label>
                  <Select value={templateIndustry} onValueChange={(value) => setTemplateIndustry(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="general">General Professional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="template-cta">Call-to-Action</Label>
                  <Input
                    id="template-cta"
                    placeholder="e.g., Complete your profile, Upgrade to premium"
                    value={templateCta}
                    onChange={(e) => setTemplateCta(e.target.value)}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setNewTemplateDialog(false)}>
                    Cancel
                  </Button>
                  <Button className="bg-gradient-to-r from-purple-500 to-pink-500" onClick={handleGenerateTemplate}>
                    <Bot className="w-4 h-4 mr-2" />
                    Generate Template
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Campaigns</p>
                <p className="text-2xl font-bold">12</p>
              </div>
              <div className="bg-blue-100 p-2 rounded-full">
                <Play className="w-4 h-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Emails Sent Today</p>
                <p className="text-2xl font-bold">2,547</p>
              </div>
              <div className="bg-green-100 p-2 rounded-full">
                <Send className="w-4 h-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg. Open Rate</p>
                <p className="text-2xl font-bold">58.2%</p>
              </div>
              <div className="bg-purple-100 p-2 rounded-full">
                <Eye className="w-4 h-4 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Click Rate</p>
                <p className="text-2xl font-bold">18.7%</p>
              </div>
              <div className="bg-orange-100 p-2 rounded-full">
                <Target className="w-4 h-4 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="campaigns" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="abtests">A/B Tests</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
        </TabsList>
        
        <TabsContent value="campaigns" className="space-y-4">
          <div className="grid gap-4">
            {campaigns.map(campaign => (
              <Card key={campaign.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-100 p-2 rounded-full">
                        {getTypeIcon(campaign.type)}
                      </div>
                      <div>
                        <h3 className="font-semibold">{campaign.name}</h3>
                        <p className="text-sm text-gray-600">{campaign.recipients} recipients</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <p className="text-sm font-medium">{campaign.openRate}%</p>
                        <p className="text-xs text-gray-500">Open Rate</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium">{campaign.clickRate}%</p>
                        <p className="text-xs text-gray-500">Click Rate</p>
                      </div>
                      <Badge className={getStatusColor(campaign.status)}>
                        {campaign.status}
                      </Badge>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedCampaign(campaign);
                            setEditCampaign({ ...campaign });
                          }}
                          title="Edit Campaign"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => setAnalyticsViewCampaign(campaign)}
                          title="View Analytics"
                        >
                          <BarChart3 className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className={`min-w-[36px] ${campaign.status === 'active' ? 'hover:bg-red-50 hover:border-red-200' : 'hover:bg-green-50 hover:border-green-200'}`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleCampaignStatus(campaign.id);
                          }}
                          title={campaign.status === 'active' ? 'Pause Campaign' : 'Resume Campaign'}
                        >
                          {campaign.status === 'active' ? 
                            <Pause className="w-4 h-4 text-red-600" /> : 
                            <Play className="w-4 h-4 text-green-600" />
                          }
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="templates" className="space-y-4">
          <div className="grid gap-4">
            {templates.map(template => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-purple-100 p-2 rounded-full">
                        <Mail className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{template.name}</h3>
                        <p className="text-sm text-gray-600">{template.subject}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <p className="text-sm font-medium">{template.performance}%</p>
                        <p className="text-xs text-gray-500">Performance</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium">{template.variables.length}</p>
                        <p className="text-xs text-gray-500">Variables</p>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => setPreviewTemplate(template)}
                          title="Preview Template"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedTemplate(template);
                            setEditTemplate({ ...template });
                          }}
                          title="Edit Template"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => copyTemplate(template)}
                          title="Copy Template"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="abtests" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-semibold">A/B Test Management</h3>
              <p className="text-sm text-gray-600">Compare email variations to optimize performance</p>
            </div>
            <Dialog open={newTestDialog} onOpenChange={setNewTestDialog}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-green-500 to-blue-500">
                  <Plus className="w-4 h-4 mr-2" />
                  New Test
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Create A/B Test</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="test-name">Test Name</Label>
                      <Input
                        id="test-name"
                        placeholder="e.g., Subject Line Optimization"
                        value={newTestName}
                        onChange={(e) => setNewTestName(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="test-type">Test Type</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select test type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="subject">Subject Line</SelectItem>
                          <SelectItem value="content">Email Content</SelectItem>
                          <SelectItem value="sender">Sender Name</SelectItem>
                          <SelectItem value="cta">Call-to-Action</SelectItem>
                          <SelectItem value="timing">Send Time</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="test-audience">Target Audience</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select audience" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        <SelectItem value="new">New Users</SelectItem>
                        <SelectItem value="active">Active Users</SelectItem>
                        <SelectItem value="premium">Premium Users</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="variant-a">Variant A (Control)</Label>
                      <Textarea
                        id="variant-a"
                        placeholder="Enter your control version..."
                        rows={4}
                        value={newVariantA}
                        onChange={(e) => setNewVariantA(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="variant-b">Variant B (Test)</Label>
                      <Textarea
                        id="variant-b"
                        placeholder="Enter your test version..."
                        rows={4}
                        value={newVariantB}
                        onChange={(e) => setNewVariantB(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="test-split">Traffic Split (%)</Label>
                      <Input 
                        id="test-split" 
                        type="number" 
                        defaultValue="50" 
                        min="10" 
                        max="90" 
                      />
                    </div>
                    <div>
                      <Label htmlFor="test-duration">Duration (days)</Label>
                      <Input 
                        id="test-duration" 
                        type="number" 
                        defaultValue="7" 
                        min="1" 
                        max="30" 
                      />
                    </div>
                    <div>
                      <Label htmlFor="test-confidence">Confidence Level</Label>
                      <Select defaultValue="95">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="90">90%</SelectItem>
                          <SelectItem value="95">95%</SelectItem>
                          <SelectItem value="99">99%</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="test-metric">Primary Metric</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select success metric" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open_rate">Open Rate</SelectItem>
                        <SelectItem value="click_rate">Click-through Rate</SelectItem>
                        <SelectItem value="conversion_rate">Conversion Rate</SelectItem>
                        <SelectItem value="unsubscribe_rate">Unsubscribe Rate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setNewTestDialog(false)}>
                      Cancel
                    </Button>
                    <Button
                      className="bg-gradient-to-r from-green-500 to-blue-500"
                      onClick={handleCreateTest}
                    >
                      <Target className="w-4 h-4 mr-2" />
                      Create Test
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="grid gap-4">
            {abTests.map(test => {
              const iconClasses = getTestIconClasses(test.status);
              return (
                <Card key={test.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`${iconClasses.bg} p-2 rounded-full`}>
                          <Target className={`w-4 h-4 ${iconClasses.text}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold">{test.name}</h3>
                          <p className="text-sm text-gray-600">{test.description}</p>
                        </div>
                      </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <p className="text-sm font-medium">{test.metricA !== null ? `${test.metricA}%` : '-'}</p>
                        <p className="text-xs text-gray-500">Variant A</p>
                      </div>
                      <div className="text-center">
                        <p className={`text-sm font-medium ${test.metricB !== null ? '' : ''}`}>{test.metricB !== null ? `${test.metricB}%` : '-'}</p>
                        <p className="text-xs text-gray-500">Variant B</p>
                      </div>
                      <Badge className={getTestStatusColor(test.status)}>{test.status.charAt(0).toUpperCase() + test.status.slice(1)}</Badge>
                      <div className="flex space-x-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          title="View Test"
                          onClick={() => handleViewTest(test)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          title="Analyze Results"
                          onClick={() => handleAnalyzeTest(test)}
                        >
                          <BarChart3 className="w-4 h-4" />
                        </Button>
                        {test.status === 'running' && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            title="Stop Test"
                            onClick={() => handleStopTest(test.id)}
                          >
                            <Square className="w-4 h-4" />
                          </Button>
                        )}
                        {test.status === 'completed' && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            title="Implement Winner"
                            onClick={() => handleImplementWinner(test.id)}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}
                        {test.status === 'scheduled' && (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              title="Edit Test"
                              onClick={() => handleEditTest(test)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              title="Cancel Test"
                              onClick={() => handleCancelTest(test.id)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              );
            })}
          </div>
        </TabsContent>
        
        <TabsContent value="automation" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bot className="w-5 h-5" />
                  <span>Trigger-Based Automation</span>
                </CardTitle>
                <CardDescription>
                  Automatically send emails based on user behavior
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">New User Welcome</p>
                    <p className="text-sm text-gray-600">Triggered on registration</p>
                  </div>
                  <Switch
                    checked={automationToggles.newUserWelcome}
                    onCheckedChange={(checked) => updateAutomationToggle('newUserWelcome', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Engagement Boost</p>
                    <p className="text-sm text-gray-600">Triggered on high activity</p>
                  </div>
                  <Switch
                    checked={automationToggles.engagementBoost}
                    onCheckedChange={(checked) => updateAutomationToggle('engagementBoost', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Win-Back Campaign</p>
                    <p className="text-sm text-gray-600">Triggered after 30 days inactive</p>
                  </div>
                  <Switch
                    checked={automationToggles.winBackCampaign}
                    onCheckedChange={(checked) => updateAutomationToggle('winBackCampaign', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <span>Scheduled Campaigns</span>
                </CardTitle>
                <CardDescription>
                  Regular campaigns sent on schedule
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Monthly Newsletter</p>
                    <p className="text-sm text-gray-600">1st of every month</p>
                  </div>
                  <Switch
                    checked={scheduledToggles.monthlyNewsletter}
                    onCheckedChange={(checked) => updateScheduledToggle('monthlyNewsletter', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Weekly Tips</p>
                    <p className="text-sm text-gray-600">Every Monday</p>
                  </div>
                  <Switch
                    checked={scheduledToggles.weeklyTips}
                    onCheckedChange={(checked) => updateScheduledToggle('weeklyTips', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Feature Updates</p>
                    <p className="text-sm text-gray-600">Bi-weekly</p>
                  </div>
                  <Switch
                    checked={scheduledToggles.featureUpdates}
                    onCheckedChange={(checked) => updateScheduledToggle('featureUpdates', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Campaign Dialog */}
      <Dialog open={!!selectedCampaign} onOpenChange={(open) => {
        if (!open) {
          setSelectedCampaign(null);
          setEditCampaign(null);
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Campaign: {editCampaign?.name}</DialogTitle>
          </DialogHeader>
          {editCampaign && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-campaign-name">Campaign Name</Label>
                  <Input
                    id="edit-campaign-name"
                    value={editCampaign.name}
                    onChange={(e) => setEditCampaign(prev => prev ? { ...prev, name: e.target.value } : prev)}
                    placeholder="e.g., Summer Promotion"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-campaign-status">Status</Label>
                  <Select
                    value={editCampaign.status}
                    onValueChange={(value) => setEditCampaign(prev => prev ? { ...prev, status: value as Campaign['status'] } : prev)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-campaign-type">Campaign Type</Label>
                  <Select
                    value={editCampaign.type}
                    onValueChange={(value) => setEditCampaign(prev => prev ? { ...prev, type: value as Campaign['type'] } : prev)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="onboarding">Onboarding</SelectItem>
                      <SelectItem value="engagement">Engagement</SelectItem>
                      <SelectItem value="reactivation">Reactivation</SelectItem>
                      <SelectItem value="newsletter">Newsletter</SelectItem>
                      <SelectItem value="promotion">Promotion</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-campaign-recipients">Recipients</Label>
                  <Input
                    id="edit-campaign-recipients"
                    type="number"
                    value={editCampaign.recipients}
                    onChange={(e) => setEditCampaign(prev => prev ? { ...prev, recipients: Number(e.target.value) } : prev)}
                    placeholder="Number of recipients"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-campaign-template">Email Template</Label>
                <Select
                  value={editCampaign.template}
                  onValueChange={(value) => setEditCampaign(prev => prev ? { ...prev, template: value } : prev)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="welcome_onboarding">Welcome & Onboarding</SelectItem>
                    <SelectItem value="engagement_boost">Engagement Boost</SelectItem>
                    <SelectItem value="monthly_newsletter">Monthly Newsletter</SelectItem>
                    <SelectItem value="premium_upgrade">Premium Upgrade</SelectItem>
                    <SelectItem value="user_reactivation">User Reactivation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedCampaign(null);
                    setEditCampaign(null);
                  }}
                >
                  Cancel
                </Button>
                <Button className="bg-gradient-to-r from-blue-500 to-purple-500" onClick={handleUpdateCampaign}>
                  <Edit className="w-4 h-4 mr-2" />
                  Update Campaign
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Template Dialog */}
      <Dialog open={!!selectedTemplate} onOpenChange={(open) => {
        if (!open) {
          setSelectedTemplate(null);
          setEditTemplate(null);
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Template: {editTemplate?.name}</DialogTitle>
          </DialogHeader>
          {editTemplate && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-template-name">Template Name</Label>
                  <Input
                    id="edit-template-name"
                    value={editTemplate.name}
                    onChange={(e) => setEditTemplate(prev => prev ? { ...prev, name: e.target.value } : prev)}
                    placeholder="e.g., Welcome Email"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-template-type">Template Type</Label>
                  <Select
                    value={editTemplate.type}
                    onValueChange={(value) => setEditTemplate(prev => prev ? { ...prev, type: value as Template['type'] } : prev)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="welcome">Welcome</SelectItem>
                      <SelectItem value="engagement">Engagement</SelectItem>
                      <SelectItem value="newsletter">Newsletter</SelectItem>
                      <SelectItem value="promotion">Promotion</SelectItem>
                      <SelectItem value="reactivation">Reactivation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="edit-template-subject">Subject Line</Label>
                <Input
                  id="edit-template-subject"
                  value={editTemplate.subject}
                  onChange={(e) => setEditTemplate(prev => prev ? { ...prev, subject: e.target.value } : prev)}
                  placeholder="Enter email subject"
                />
              </div>
              <div>
                <Label htmlFor="edit-template-content">Email Content</Label>
                <Textarea
                  id="edit-template-content"
                  placeholder="Enter your email content here..."
                  rows={8}
                  defaultValue="Welcome to MyLinked! We're excited to have you on board..."
                />
              </div>
              <div>
                <Label>Template Variables</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {editTemplate.variables.map((variable, index) => (
                    <Badge key={index} variant="secondary">
                      {`{${variable}}`}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedTemplate(null);
                    setEditTemplate(null);
                  }}
                >
                  Cancel
                </Button>
                <Button className="bg-gradient-to-r from-purple-500 to-pink-500" onClick={handleUpdateTemplate}>
                  <Edit className="w-4 h-4 mr-2" />
                  Update Template
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Analytics View Dialog */}
      <Dialog open={!!analyticsViewCampaign} onOpenChange={(open) => !open && setAnalyticsViewCampaign(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Campaign Analytics: {analyticsViewCampaign?.name}</DialogTitle>
          </DialogHeader>
          {analyticsViewCampaign && (
            <div className="space-y-6">
              {/* Key Metrics Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{analyticsViewCampaign.recipients}</p>
                      <p className="text-sm text-gray-600">Total Recipients</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{analyticsViewCampaign.openRate}%</p>
                      <p className="text-sm text-gray-600">Open Rate</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">{analyticsViewCampaign.clickRate}%</p>
                      <p className="text-sm text-gray-600">Click Rate</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">{Math.round(analyticsViewCampaign.recipients * analyticsViewCampaign.openRate / 100)}</p>
                      <p className="text-sm text-gray-600">Total Opens</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Campaign Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Campaign Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Campaign Type:</span>
                      <Badge variant="secondary">{analyticsViewCampaign.type}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Status:</span>
                      <Badge className={getStatusColor(analyticsViewCampaign.status)}>
                        {analyticsViewCampaign.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Last Sent:</span>
                      <span className="text-sm">{analyticsViewCampaign.lastSent}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Next Send:</span>
                      <span className="text-sm">{analyticsViewCampaign.nextSend}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Performance Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Open Rate</span>
                        <span>{analyticsViewCampaign.openRate}%</span>
                      </div>
                      <Progress value={analyticsViewCampaign.openRate} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Click Rate</span>
                        <span>{analyticsViewCampaign.clickRate}%</span>
                      </div>
                      <Progress value={analyticsViewCampaign.clickRate} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Engagement Score</span>
                        <span>{Math.round((analyticsViewCampaign.openRate + analyticsViewCampaign.clickRate * 2) / 3)}%</span>
                      </div>
                      <Progress value={Math.round((analyticsViewCampaign.openRate + analyticsViewCampaign.clickRate * 2) / 3)} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Action Button */}
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setAnalyticsViewCampaign(null)}>
                  Close Analytics
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Template Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={(open) => !open && setPreviewTemplate(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Template Preview: {previewTemplate?.name}</DialogTitle>
          </DialogHeader>
          {previewTemplate && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Template Type</Label>
                  <p className="text-sm mt-1 capitalize">{previewTemplate.type}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Performance</Label>
                  <p className="text-sm mt-1 font-medium text-green-600">{previewTemplate.performance}%</p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-600">Subject Line</Label>
                <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                  <p className="text-sm font-medium">{previewTemplate.subject}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-600">Template Variables ({previewTemplate.variables.length})</Label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {previewTemplate.variables.map((variable, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {variable}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-600">Usage Statistics</Label>
                <div className="mt-1 text-sm text-gray-600">
                  Last used: {previewTemplate.lastUsed}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => copyTemplate(previewTemplate)}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Subject
                </Button>
                <Button
                  onClick={() => {
                    if (previewTemplate) {
                      setSelectedTemplate(previewTemplate);
                      setEditTemplate({ ...previewTemplate });
                    }
                    setPreviewTemplate(null);
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Template
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
