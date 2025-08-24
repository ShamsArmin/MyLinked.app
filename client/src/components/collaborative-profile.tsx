import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { User } from '@shared/schema';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Search, Users, UserMinus, Loader2, AlertCircle, UserPlus } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type CollaborativeProfileProps = {
  className?: string;
};

export function CollaborativeProfile({ className = '' }: CollaborativeProfileProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCollabEnabled, setIsCollabEnabled] = useState(user?.isCollaborative || false);
  const [usernameToAdd, setUsernameToAdd] = useState('');
  const [confirmationDialog, setConfirmationDialog] = useState<{
    open: boolean;
    username: string;
    action: 'add' | 'remove';
  }>({
    open: false,
    username: '',
    action: 'add'
  });
  
  // Fetch collaborators
  const { 
    data: collaborators = [], 
    isLoading: isLoadingCollaborators,
    refetch: refetchCollaborators
  } = useQuery<User[]>({
    queryKey: ['/api/collaborators'],
    retry: 1,
  });
  
  // Toggle collaborative mode
  const toggleCollabModeMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const res = await apiRequest('PATCH', '/api/profile', { isCollaborative: enabled });
      return await res.json();
    },
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(['/api/profile'], updatedProfile);
      toast({
        title: isCollabEnabled ? 'Collaboration Enabled' : 'Collaboration Disabled',
        description: isCollabEnabled 
          ? 'Your profile is now collaborative. Add team members to collaborate.'
          : 'Collaboration mode has been disabled.',
      });
    },
    onError: (error: Error) => {
      // Revert UI state
      setIsCollabEnabled(!isCollabEnabled);
      toast({
        title: 'Failed to update collaboration mode',
        description: error.message || 'An error occurred updating collaboration mode.',
        variant: 'destructive',
      });
    },
  });
  
  // Add collaborator mutation
  const addCollaboratorMutation = useMutation({
    mutationFn: async (username: string) => {
      const res = await apiRequest('POST', `/api/collaborators/${username}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/collaborators'] });
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      
      toast({
        title: 'Collaborator Added',
        description: `${confirmationDialog.username} can now collaborate on your profile.`,
      });
      
      setUsernameToAdd('');
      setConfirmationDialog({ ...confirmationDialog, open: false });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to add collaborator',
        description: error.message || 'An error occurred when trying to add this collaborator.',
        variant: 'destructive',
      });
    },
  });
  
  // Remove collaborator mutation
  const removeCollaboratorMutation = useMutation({
    mutationFn: async (username: string) => {
      const res = await apiRequest('DELETE', `/api/collaborators/${username}`);
      return res.status === 204; // No content
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/collaborators'] });
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      
      toast({
        title: 'Collaborator Removed',
        description: `${confirmationDialog.username} has been removed from your collaborators.`,
      });
      
      setConfirmationDialog({ ...confirmationDialog, open: false });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to remove collaborator',
        description: error.message || 'An error occurred when trying to remove this collaborator.',
        variant: 'destructive',
      });
    },
  });
  
  const handleToggleCollabMode = (checked: boolean) => {
    setIsCollabEnabled(checked);
    toggleCollabModeMutation.mutate(checked);
  };
  
  const openAddCollaboratorDialog = () => {
    if (!usernameToAdd.trim()) {
      toast({
        title: 'Username required',
        description: 'Please enter a valid username to add as a collaborator.',
        variant: 'destructive',
      });
      return;
    }
    
    setConfirmationDialog({
      open: true,
      username: usernameToAdd,
      action: 'add'
    });
  };
  
  const openRemoveCollaboratorDialog = (username: string) => {
    setConfirmationDialog({
      open: true,
      username,
      action: 'remove'
    });
  };
  
  const handleConfirmAction = () => {
    if (confirmationDialog.action === 'add') {
      addCollaboratorMutation.mutate(confirmationDialog.username);
    } else {
      removeCollaboratorMutation.mutate(confirmationDialog.username);
    }
  };
  
  const getUserInitials = (user: User) => {
    if (!user.name) return user.username.substring(0, 2).toUpperCase();
    
    const nameParts = user.name.split(' ').filter(Boolean);
    if (nameParts.length === 1) return nameParts[0].substring(0, 2).toUpperCase();
    return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
  };
  
  // Search functionality
  const filteredCollaborators = collaborators.filter(collab => 
    collab.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (collab.name && collab.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  return (
    <>
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2 text-primary" />
              Collaborative Profile
            </CardTitle>
            <div className="flex items-center gap-2">
              <Label htmlFor="collab-mode-toggle" className="text-sm">
                {isCollabEnabled ? 'Enabled' : 'Disabled'}
              </Label>
              <Switch 
                id="collab-mode-toggle"
                checked={isCollabEnabled} 
                onCheckedChange={handleToggleCollabMode}
              />
            </div>
          </div>
          <CardDescription>
            Allow team members to collaborate on your profile
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isCollabEnabled ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Collaboration is disabled</AlertTitle>
              <AlertDescription>
                Enable collaboration to allow team members to help manage your profile
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter username to add"
                  value={usernameToAdd}
                  onChange={(e) => setUsernameToAdd(e.target.value)}
                  disabled={!isCollabEnabled}
                />
                <Button
                  onClick={openAddCollaboratorDialog}
                  disabled={!isCollabEnabled || !usernameToAdd.trim()}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-medium">Collaborators ({collaborators.length})</h4>
                  <div className="relative w-[180px]">
                    <Search className="absolute left-2 top-2.5 h-3 w-3 text-base-content/70" />
                    <Input
                      placeholder="Search..."
                      className="h-8 pl-7"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                
                {isLoadingCollaborators ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredCollaborators.length > 0 ? (
                  <ScrollArea className="h-[220px]">
                    <div className="space-y-2">
                      {filteredCollaborators.map(collaborator => (
                        <div key={collaborator.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-accent">
                          <div className="flex items-center">
                            <Avatar className="h-8 w-8 mr-2">
                              <AvatarImage src={collaborator.profileImage || undefined} alt={collaborator.name || collaborator.username} />
                              <AvatarFallback>{getUserInitials(collaborator)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-sm">{collaborator.name || collaborator.username}</div>
                              {collaborator.name && (
                                <div className="text-xs text-base-content/70">@{collaborator.username}</div>
                              )}
                            </div>
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openRemoveCollaboratorDialog(collaborator.username)}
                            className="h-8 hover:bg-red-100 hover:text-red-600"
                          >
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : collaborators.length > 0 && searchQuery ? (
                  <div className="py-8 text-center">
                    <p className="text-base-content/70">No results for "{searchQuery}"</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="bg-base-200 p-3 rounded-full mb-3">
                      <Users className="h-5 w-5 text-base-content/70" />
                    </div>
                    <h3 className="font-medium mb-1">No collaborators yet</h3>
                    <p className="text-sm text-base-content/70 max-w-[270px] mb-4">
                      Add team members to work together on your profile
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
          
          <div className="bg-base-200 p-3 rounded-lg text-sm">
            <h4 className="font-medium mb-1">About Collaboration</h4>
            <p className="text-base-content/70 text-xs mb-3">
              Collaborators can help manage your profile by:
            </p>
            <ul className="text-xs text-base-content/70 space-y-1 list-disc list-inside">
              <li>Adding and updating links</li>
              <li>Editing profile information</li>
              <li>Managing social posts</li>
              <li>Responding to messages</li>
            </ul>
          </div>
        </CardContent>
      </Card>
      
      {/* Confirmation Dialog */}
      <Dialog open={confirmationDialog.open} onOpenChange={(open) => setConfirmationDialog({ ...confirmationDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmationDialog.action === 'add' ? 'Add Collaborator' : 'Remove Collaborator'}
            </DialogTitle>
            <DialogDescription>
              {confirmationDialog.action === 'add'
                ? `Are you sure you want to add @${confirmationDialog.username} as a collaborator? They will be able to edit your profile.`
                : `Are you sure you want to remove @${confirmationDialog.username} as a collaborator? They will no longer be able to edit your profile.`}
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmationDialog({ ...confirmationDialog, open: false })}
            >
              Cancel
            </Button>
            <Button
              variant={confirmationDialog.action === 'add' ? 'default' : 'destructive'}
              onClick={handleConfirmAction}
              disabled={addCollaboratorMutation.isPending || removeCollaboratorMutation.isPending}
            >
              {(addCollaboratorMutation.isPending || removeCollaboratorMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {confirmationDialog.action === 'add' ? 'Add Collaborator' : 'Remove Collaborator'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}