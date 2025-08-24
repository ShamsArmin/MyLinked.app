
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { User } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { Briefcase, Loader2, Presentation, Share2, Save, Palette, Rocket, Target, Check, Copy, Facebook, Twitter, MessageSquare, Mail, Link, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

type PitchModeSyncProps = {
  variant?: 'settings' | 'dashboard';
  className?: string;
};

export function PitchModeSync({ variant = 'settings', className = '' }: PitchModeSyncProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Get the most current user data
  const { data: currentUser, isLoading: userLoading, error: userError } = useQuery({ 
    queryKey: ["/api/user"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  const { data: currentProfile, isLoading: profileLoading, error: profileError } = useQuery({ 
    queryKey: ["/api/profile"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Use the most recent data available - prioritize profile data over user data
  const userData = currentProfile || currentUser;
  const isLoading = userLoading || profileLoading;
  const hasError = userError || profileError;
  
  // Local state for form inputs with real-time synchronization
  const [enabled, setEnabled] = useState(false);
  const [description, setDescription] = useState('');
  const [pitchType, setPitchType] = useState<string>('professional');
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  
  // Sync local state with server data whenever it updates
  useEffect(() => {
    if (userData && typeof userData === 'object' && 'pitchMode' in userData) {
      console.log(`${variant} - Syncing local state with server data:`, userData);
      const user = userData as User;
      setEnabled(Boolean(user.pitchMode));
      setDescription(user.pitchDescription || '');
      setPitchType(user.pitchModeType || 'professional');
      setFocusAreas(user.pitchFocusAreas || []);
    }
  }, [userData, variant]);
  
  const pitchOptions = [
    {
      id: "professional",
      name: "Professional",
      description: "Highlight work experience and professional skills",
      icon: <Briefcase className="h-4 w-4" />
    },
    {
      id: "creative",
      name: "Creative",
      description: "Showcase creative work and accomplishments",
      icon: <Palette className="h-4 w-4" />
    },
    {
      id: "startup",
      name: "Startup",
      description: "Present business ideas and entrepreneurial ventures",
      icon: <Rocket className="h-4 w-4" />
    },
    {
      id: "speaker",
      name: "Speaker",
      description: "Feature speaking engagements and expertise",
      icon: <Presentation className="h-4 w-4" />
    }
  ];

  // Focus areas based on pitch mode type
  const getFocusAreasForType = (type: string) => {
    switch (type) {
      case "professional":
        return ["Experience", "Skills", "Achievements", "Leadership", "Certifications", "Education"];
      case "creative":
        return ["Portfolio", "Creative Work", "Art & Design", "Projects", "Exhibitions", "Awards"];
      case "startup":
        return ["Startup Ideas", "Business Plan", "Team", "Funding", "Innovation", "Growth"];
      case "speaker":
        return ["Speaking Topics", "Events", "Expertise", "Publications", "Thought Leadership", "Workshops"];
      default:
        return ["Experience", "Skills", "Achievements"];
    }
  };

  const availableFocusAreas = getFocusAreasForType(pitchType);

  const handleFocusAreaToggle = (area: string) => {
    setFocusAreas(prev => 
      prev.includes(area) 
        ? prev.filter(a => a !== area)
        : [...prev, area]
    );
  };
  
  // Comprehensive mutation for pitch mode updates with real-time sync
  const updatePitchModeMutation = useMutation({
    mutationFn: async () => {
      console.log(`${variant} - Saving pitch mode:`, { enabled, type: pitchType, description, focusAreas });
      const res = await apiRequest('PATCH', '/api/pitch-mode', { 
        enabled, 
        type: pitchType, 
        description,
        focusAreas
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to save pitch mode');
      }
      return await res.json();
    },
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/user'] });
      await queryClient.cancelQueries({ queryKey: ['/api/profile'] });
      
      // Snapshot the previous values
      const previousUser = queryClient.getQueryData(['/api/user']);
      const previousProfile = queryClient.getQueryData(['/api/profile']);
      
      // Optimistic update
      const optimisticData = {
        ...(userData as User || {}),
        pitchMode: enabled,
        pitchModeType: pitchType,
        pitchDescription: description,
        pitchFocusAreas: focusAreas
      };
      
      // Update both caches optimistically
      queryClient.setQueryData(['/api/user'], optimisticData);
      queryClient.setQueryData(['/api/profile'], optimisticData);
      
      return { previousUser, previousProfile };
    },
    onSuccess: async (updatedUser) => {
      console.log(`${variant} - Pitch mode saved successfully:`, updatedUser);
      
      // Update all related queries for comprehensive real-time synchronization
      queryClient.setQueryData(['/api/profile'], updatedUser);
      queryClient.setQueryData(['/api/user'], updatedUser);
      
      // Force invalidation to ensure all components sync
      await queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      
      toast({
        title: 'Pitch Mode Saved',
        description: enabled 
          ? 'Your profile is now optimized for professional presentations.'
          : 'Your profile has returned to standard mode.',
      });
    },
    onError: (error: Error, variables, context) => {
      console.error(`${variant} - Pitch mode save error:`, error);
      
      // Rollback optimistic update
      if (context?.previousUser) {
        queryClient.setQueryData(['/api/user'], context.previousUser);
      }
      if (context?.previousProfile) {
        queryClient.setQueryData(['/api/profile'], context.previousProfile);
      }
      
      toast({
        title: 'Failed to save Pitch Mode',
        description: error.message || 'An error occurred while saving.',
        variant: 'destructive',
      });
    },
  });
  
  const handleSave = () => {
    console.log(`${variant} - Save button clicked - current settings:`, { enabled, pitchType, description });
    updatePitchModeMutation.mutate();
  };
  
  const getShareUrl = () => {
    if (!userData || typeof userData !== 'object' || !('username' in userData)) return '';
    const user = userData as User;
    const baseUrl = window.location.origin;
    return `${baseUrl}/${user.username}?mode=pitch`;
  };
  
  const handleCopyLink = () => {
    const shareUrl = getShareUrl();
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copied",
        description: "Pitch Mode link copied to clipboard",
      });
    }
  };

  const handleShareToPlatform = (platform: string) => {
    const shareUrl = getShareUrl();
    if (!shareUrl) return;

    const shareText = `Check out my professional profile on MyLinked`;
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedText = encodeURIComponent(shareText);

    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, '_blank', 'width=600,height=400');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`, '_blank', 'width=600,height=400');
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`, '_blank', 'width=600,height=400');
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodedText} ${encodedUrl}`, '_blank');
        break;
      case 'email':
        window.open(`mailto:?subject=${encodeURIComponent('Check out my MyLinked profile')}&body=${encodedText} ${encodedUrl}`, '_blank');
        break;
    }

    toast({
      title: "Shared successfully",
      description: `Link shared to ${platform}`,
    });
  };
  
  if (hasError) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Briefcase className="h-5 w-5 mr-2 text-red-500" />
            Error Loading Pitch Mode
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-base-content/70">Failed to load pitch mode settings. Please try again.</p>
        </CardContent>
      </Card>
    );
  }
  
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Briefcase className="h-5 w-5 mr-2 text-primary" />
            Loading Pitch Mode...
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }
  
  // Dashboard variant - compact design
  if (variant === 'dashboard') {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Presentation className="h-5 w-5 mr-2 text-blue-500" />
              <CardTitle className="text-sm font-medium">One-Click Pitch Mode</CardTitle>
            </div>
            <Switch
              checked={enabled}
              onCheckedChange={setEnabled}
              disabled={updatePitchModeMutation.isPending}
            />
          </div>
          <CardDescription>
            Transform your profile for different audiences
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-1">
          {enabled ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {pitchOptions.map(option => (
                  <div 
                    key={option.id} 
                    className={`border rounded-md p-2 cursor-pointer transition-colors ${
                      pitchType === option.id 
                        ? 'bg-primary/10 border-primary/20' 
                        : 'hover:bg-base-200/50'
                    }`}
                    onClick={() => setPitchType(option.id)}
                  >
                    <div className="flex items-center mb-1">
                      <div className="w-6 h-6 rounded-full bg-base-200 flex items-center justify-center mr-2">
                        {option.icon}
                      </div>
                      <span className="text-sm font-medium">{option.name}</span>
                    </div>
                    <p className="text-xs text-base-content/70">
                      {option.description}
                    </p>
                  </div>
                ))}
              </div>
              
              <Button 
                onClick={handleSave}
                disabled={updatePitchModeMutation.isPending}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                {updatePitchModeMutation.isPending ? 'Saving...' : 'Save Pitch Mode'}
              </Button>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-base-content/70 mb-3">
                Enable pitch mode to customize your profile
              </p>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setEnabled(true)}
                disabled={updatePitchModeMutation.isPending}
              >
                Enable Pitch Mode
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
  
  // Settings variant - full design
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Briefcase className="h-5 w-5 mr-2 text-primary" />
            <CardTitle>One-Click Pitch Mode</CardTitle>
          </div>
          <Switch 
            checked={enabled} 
            onCheckedChange={setEnabled}
            id="pitch-mode-switch"
            disabled={updatePitchModeMutation.isPending}
          />
        </div>
        <CardDescription>
          Optimize your profile for professional pitches and presentations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {enabled && (
          <div className="space-y-2">
            <Label htmlFor="pitch-type">Pitch Type</Label>
            <Select value={pitchType} onValueChange={setPitchType}>
              <SelectTrigger id="pitch-type">
                <SelectValue placeholder="Select pitch type" />
              </SelectTrigger>
              <SelectContent>
                {pitchOptions.map(option => (
                  <SelectItem key={option.id} value={option.id}>
                    <div className="flex items-center">
                      <span className="mr-2">{option.icon}</span>
                      {option.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        {enabled && (
          <div className="space-y-2">
            <Label htmlFor="focus-areas">Focus Areas</Label>
            <div className="grid grid-cols-2 gap-2">
              {availableFocusAreas.map(area => (
                <div key={area} className="flex items-center space-x-2">
                  <Checkbox
                    id={`focus-${area}`}
                    checked={focusAreas.includes(area)}
                    onCheckedChange={() => handleFocusAreaToggle(area)}
                  />
                  <Label 
                    htmlFor={`focus-${area}`} 
                    className="text-sm font-normal cursor-pointer"
                  >
                    {area}
                  </Label>
                </div>
              ))}
            </div>
            <p className="text-xs text-base-content/70">
              Selected areas will be highlighted on your pitch mode profile
            </p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="pitch-description">Pitch Description</Label>
          <Textarea
            id="pitch-description"
            placeholder="Describe your work, services, or what you're looking for..."
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={!enabled}
            className={!enabled ? "opacity-50" : ""}
          />
          <p className="text-xs text-base-content/70">
            This description will be prominently displayed when Pitch Mode is active
          </p>
        </div>
        
        {enabled && userData && typeof userData === 'object' && 'pitchMode' in userData && (userData as User).pitchMode ? (
          <div className="bg-accent p-4 rounded-lg space-y-3">
            <div className="flex items-center">
              <Presentation className="h-5 w-5 mr-2 text-primary" />
              <h4 className="font-medium">Your Pitch Mode URL</h4>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="bg-base-100 text-sm p-2 rounded flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                {getShareUrl()}
              </div>
              <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Share Your Pitch Mode</DialogTitle>
                    <DialogDescription>
                      Share your professional profile with potential clients and collaborators
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    {/* Copy Link Section */}
                    <div className="flex items-center space-x-2">
                      <div className="grid flex-1 gap-2">
                        <Label htmlFor="link" className="sr-only">
                          Link
                        </Label>
                        <input
                          id="link"
                          defaultValue={getShareUrl()}
                          readOnly
                          className="flex h-9 w-full rounded-md border border-base-300 bg-base-100 px-3 py-1 text-sm text-base-content/70"
                        />
                      </div>
                      <Button size="sm" className="px-3" onClick={handleCopyLink}>
                        <span className="sr-only">Copy</span>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {/* Social Platforms */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Share on social platforms</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleShareToPlatform('facebook')}
                          className="justify-start"
                        >
                          <Facebook className="h-4 w-4 mr-2 text-blue-600" />
                          Facebook
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleShareToPlatform('twitter')}
                          className="justify-start"
                        >
                          <X className="h-4 w-4 mr-2 text-gray-800" />
                          X (Twitter)
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleShareToPlatform('linkedin')}
                          className="justify-start"
                        >
                          <Link className="h-4 w-4 mr-2 text-blue-700" />
                          LinkedIn
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleShareToPlatform('whatsapp')}
                          className="justify-start"
                        >
                          <MessageSquare className="h-4 w-4 mr-2 text-green-600" />
                          WhatsApp
                        </Button>
                      </div>
                      
                      {/* Email Option */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleShareToPlatform('email')}
                        className="w-full justify-start"
                      >
                        <Mail className="h-4 w-4 mr-2 text-gray-600" />
                        Share via Email
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            <div className="text-xs text-base-content/70">
              Share this link when pitching to clients or during presentations
            </div>
          </div>
        ) : null}
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          disabled={updatePitchModeMutation.isPending}
          onClick={handleSave}
        >
          <Save className="mr-2 h-4 w-4" />
          {updatePitchModeMutation.isPending ? 'Saving...' : 'Save Pitch Mode Settings'}
        </Button>
      </CardFooter>
    </Card>
  );
}
