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
import { Briefcase, Loader2, Presentation, Share2, Save } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type PitchModeProps = {
  profile?: User;
  className?: string;
};

const toBoolean = (value: any) => value === true || value === 'true';

export function PitchMode({ profile, className = '' }: PitchModeProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Get real-time user data to ensure synchronization
  const { data: currentUser } = useQuery({ queryKey: ["/api/user"] });
  const { data: currentProfile } = useQuery({ queryKey: ["/api/profile"] });
  
  // Use current user/profile data as source of truth
  const latestData = currentProfile || currentUser || profile;
  
  // Local state for form inputs
  const [enabled, setEnabled] = useState(toBoolean(latestData?.pitchMode));
  const [description, setDescription] = useState(latestData?.pitchDescription || '');
  const [pitchType, setPitchType] = useState(latestData?.pitchModeType || 'professional');
  
  // Update local state when real-time data changes
  useEffect(() => {
    if (latestData && 'pitchMode' in latestData) {
      setEnabled(toBoolean(latestData.pitchMode));
      setDescription(latestData.pitchDescription || '');
      setPitchType(latestData.pitchModeType || 'professional');
    }
  }, [latestData]);
  
  const updatePitchModeMutation = useMutation({
    mutationFn: async () => {
      console.log('Settings page saving pitch mode:', { enabled, type: pitchType, description });
      const updatedProfile = await apiRequest('PATCH', '/api/pitch-mode', {
        enabled,
        type: pitchType,
        description
      });
      return updatedProfile;
    },
    onSuccess: (updatedProfile) => {
      console.log('Settings page pitch mode saved successfully:', updatedProfile);
      // Update all related queries for real-time synchronization
      queryClient.setQueryData(['/api/profile'], updatedProfile);
      queryClient.setQueryData(['/api/user'], updatedProfile);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      
      toast({
        title: 'Pitch Mode Saved',
        description: enabled 
          ? 'Your profile is now in Pitch Mode, optimized for professional presentations.'
          : 'Your profile has returned to standard mode.',
      });
    },
    onError: (error: Error) => {
      console.error('Settings page pitch mode save error:', error);
      toast({
        title: 'Failed to update Pitch Mode',
        description: error.message || 'An error occurred updating Pitch Mode.',
        variant: 'destructive',
      });
    },
  });
  
  const handleSave = () => {
    console.log('Settings page save button clicked - current settings:', { enabled, pitchType, description });
    updatePitchModeMutation.mutate();
  };
  
  const getShareUrl = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/${profile?.username}?mode=pitch`;
  };
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(getShareUrl());
    toast({
      title: "Link copied",
      description: "Pitch Mode link copied to clipboard",
    });
  };
  
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
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="creative">Creative</SelectItem>
                <SelectItem value="startup">Startup</SelectItem>
                <SelectItem value="speaker">Speaker</SelectItem>
              </SelectContent>
            </Select>
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
          <p className="text-xs text-muted-foreground">
            This description will be prominently displayed when Pitch Mode is active
          </p>
        </div>
        
        {enabled && profile?.pitchMode && (
          <div className="bg-accent p-4 rounded-lg space-y-3">
            <div className="flex items-center">
              <Presentation className="h-5 w-5 mr-2 text-primary" />
              <h4 className="font-medium">Your Pitch Mode URL</h4>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="bg-background text-sm p-2 rounded flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                {getShareUrl()}
              </div>
              <Button size="sm" variant="outline" onClick={handleCopyLink}>
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="text-xs text-muted-foreground">
              Share this link when pitching to clients or during presentations
            </div>
          </div>
        )}
        
        <div className="bg-muted p-4 rounded-lg">
          <h4 className="font-medium mb-2 flex items-center text-foreground">
            <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2">?</span>
            What's Pitch Mode?
          </h4>
          <p className="text-sm text-muted-foreground mb-2">
            Pitch Mode transforms your profile into a streamlined, professional presentation:
          </p>
          <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
            <li>Optimized layout for presentations and meetings</li>
            <li>Prominent display of your most important links</li>
            <li>Clear call-to-action buttons</li>
            <li>Focus on professional achievements</li>
            <li>One-click contact options</li>
          </ul>
        </div>
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