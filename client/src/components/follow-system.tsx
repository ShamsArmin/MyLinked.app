import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { User } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { Search, UserPlus, Users, UserMinus, Loader2, RefreshCw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

type FollowSystemProps = {
  className?: string;
};

export function FollowSystem({ className = '' }: FollowSystemProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Fetch followers
  const { 
    data: followers = [], 
    isLoading: isLoadingFollowers,
    refetch: refetchFollowers
  } = useQuery<User[]>({
    queryKey: ['/api/followers'],
    retry: 1,
  });
  
  // Fetch following
  const { 
    data: following = [], 
    isLoading: isLoadingFollowing,
    refetch: refetchFollowing
  } = useQuery<User[]>({
    queryKey: ['/api/following'],
    retry: 1,
  });
  
  // Follow user mutation
  const followMutation = useMutation({
    mutationFn: async (username: string) => {
      const res = await apiRequest('POST', `/api/follow/${username}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/following'] });
      queryClient.invalidateQueries({ queryKey: ['/api/followers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      
      toast({
        title: 'Success',
        description: 'You are now following this user',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to follow user',
        description: error.message || 'An error occurred when trying to follow this user.',
        variant: 'destructive',
      });
    },
  });
  
  // Unfollow user mutation
  const unfollowMutation = useMutation({
    mutationFn: async (username: string) => {
      const res = await apiRequest('DELETE', `/api/follow/${username}`);
      return res.status === 204; // No content
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/following'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      
      toast({
        title: 'Success',
        description: 'You have unfollowed this user',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to unfollow user',
        description: error.message || 'An error occurred when trying to unfollow this user.',
        variant: 'destructive',
      });
    },
  });
  
  const handleFollow = (username: string) => {
    followMutation.mutate(username);
  };
  
  const handleUnfollow = (username: string) => {
    unfollowMutation.mutate(username);
  };
  
  // Search functionality (simplified for this demo)
  const filteredFollowers = followers.filter(user => 
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.name && user.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  const filteredFollowing = following.filter(user => 
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.name && user.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  const getUserInitials = (user: User) => {
    if (!user.name) return user.username.substring(0, 2).toUpperCase();
    
    const nameParts = user.name.split(' ').filter(Boolean);
    if (nameParts.length === 1) return nameParts[0].substring(0, 2).toUpperCase();
    return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
  };
  
  const renderUserItem = (user: User, isFollowing: boolean) => {
    return (
      <div key={user.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-accent">
        <div className="flex items-center">
          <Avatar className="h-10 w-10 mr-3">
            <AvatarImage src={user.profileImage || undefined} alt={user.name || user.username} />
            <AvatarFallback>{getUserInitials(user)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{user.name || user.username}</div>
            {user.name && (
              <div className="text-xs text-base-content/70">@{user.username}</div>
            )}
          </div>
        </div>
        
        {isFollowing ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleUnfollow(user.username)}
            disabled={unfollowMutation.isPending}
            className="hover:bg-red-100 hover:text-red-600"
          >
            {unfollowMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <UserMinus className="h-4 w-4 mr-1" />
                Unfollow
              </>
            )}
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleFollow(user.username)}
            disabled={followMutation.isPending}
          >
            {followMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-1" />
                Follow
              </>
            )}
          </Button>
        )}
      </div>
    );
  };
  
  const renderEmptyState = (type: 'followers' | 'following') => {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="bg-base-200 p-3 rounded-full mb-3">
          <Users className="h-6 w-6 text-base-content/70" />
        </div>
        <h3 className="font-medium mb-1">No {type === 'followers' ? 'followers' : 'following'} yet</h3>
        <p className="text-sm text-base-content/70 max-w-[240px] mb-4">
          {type === 'followers' 
            ? "When people follow you, they'll appear here."
            : "When you follow people, they'll appear here."}
        </p>
        {type === 'following' && (
          <Button variant="outline" size="sm">
            <UserPlus className="h-4 w-4 mr-2" />
            Find People to Follow
          </Button>
        )}
      </div>
    );
  };
  
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2 text-primary" />
            Network
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8" 
              title="Refresh"
              onClick={() => {
                refetchFollowers();
                refetchFollowing();
              }}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardDescription>
          Connect with others and grow your network
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="px-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-base-content/70" />
            <Input
              placeholder="Search connections..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <Tabs defaultValue="following" className="px-4">
          <TabsList className="w-full grid grid-cols-2 mb-4">
            <TabsTrigger value="following">
              <UserPlus className="h-4 w-4 mr-1" />
              Following ({following.length})
            </TabsTrigger>
            <TabsTrigger value="followers">
              <Users className="h-4 w-4 mr-1" />
              Followers ({followers.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="following">
            {isLoadingFollowing ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredFollowing.length > 0 ? (
              <ScrollArea className="h-[340px] pr-4">
                <div className="space-y-2">
                  {filteredFollowing.map(user => renderUserItem(user, true))}
                </div>
              </ScrollArea>
            ) : following.length > 0 && searchQuery ? (
              <div className="py-8 text-center">
                <p className="text-base-content/70">No results for "{searchQuery}"</p>
              </div>
            ) : (
              renderEmptyState('following')
            )}
          </TabsContent>
          
          <TabsContent value="followers">
            {isLoadingFollowers ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredFollowers.length > 0 ? (
              <ScrollArea className="h-[340px] pr-4">
                <div className="space-y-2">
                  {filteredFollowers.map(user => {
                    // Check if we're already following this user
                    const alreadyFollowing = following.some(f => f.id === user.id);
                    return renderUserItem(user, alreadyFollowing);
                  })}
                </div>
              </ScrollArea>
            ) : followers.length > 0 && searchQuery ? (
              <div className="py-8 text-center">
                <p className="text-base-content/70">No results for "{searchQuery}"</p>
              </div>
            ) : (
              renderEmptyState('followers')
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-center border-t p-4 text-xs text-base-content/70">
        Following {following.length} · {followers.length} Followers
      </CardFooter>
    </Card>
  );
}