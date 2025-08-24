import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { User, SocialPost } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Plus, 
  ExternalLink, 
  Calendar,
  Users,
  TrendingUp,
  Filter,
  Search
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function LiveFeedPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [selectedFilter, setSelectedFilter] = useState<"all" | "following">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddPostOpen, setIsAddPostOpen] = useState(false);
  const [newPost, setNewPost] = useState({
    platform: "",
    postUrl: "",
    caption: "",
  });

  // Fetch feed posts
  const { data: feedPosts, isLoading: isLoadingFeed } = useQuery<(SocialPost & { user: User })[]>({
    queryKey: ["/api/feed", selectedFilter],
    enabled: !!user,
  });

  // Fetch following users
  const { data: followingUsers } = useQuery<User[]>({
    queryKey: ["/api/following"],
    enabled: !!user,
  });

  // Fetch suggested users
  const { data: suggestedUsers } = useQuery<User[]>({
    queryKey: ["/api/suggested-users"],
    enabled: !!user,
  });

  // Add social post mutation
  const addPostMutation = useMutation({
    mutationFn: async (postData: typeof newPost) => {
      const response = await apiRequest("POST", "/api/social-posts", postData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/feed"] });
      setIsAddPostOpen(false);
      setNewPost({ platform: "", postUrl: "", caption: "" });
      toast({
        title: "Post added successfully",
        description: "Your social media post has been added to the feed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to add post",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Follow user mutation
  const followMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest("POST", "/api/follow", { followingId: userId });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/following"] });
      queryClient.invalidateQueries({ queryKey: ["/api/suggested-users"] });
      toast({
        title: "User followed",
        description: "You are now following this user.",
      });
    },
  });

  const filteredPosts = feedPosts?.filter(post => {
    const matchesSearch = post.caption?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.user.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  }) || [];

  const platformIcons: { [key: string]: string } = {
    instagram: "🟣",
    tiktok: "⚫",
    youtube: "🔴",
    linkedin: "🔵",
    twitter: "🐦",
    facebook: "🔵",
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please log in to view the live feed</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 text-base-content">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Feed */}
          <div className="flex-1 space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">Live Feed</h1>
              <Dialog open={isAddPostOpen} onOpenChange={setIsAddPostOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Post
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Social Media Post</DialogTitle>
                    <DialogDescription>
                      Share your latest social media content with your network
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="platform">Platform</Label>
                      <Select value={newPost.platform} onValueChange={(value) => setNewPost(prev => ({ ...prev, platform: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select platform" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="instagram">Instagram</SelectItem>
                          <SelectItem value="tiktok">TikTok</SelectItem>
                          <SelectItem value="youtube">YouTube</SelectItem>
                          <SelectItem value="linkedin">LinkedIn</SelectItem>
                          <SelectItem value="twitter">Twitter</SelectItem>
                          <SelectItem value="facebook">Facebook</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="postUrl">Post URL</Label>
                      <Input
                        id="postUrl"
                        value={newPost.postUrl}
                        onChange={(e) => setNewPost(prev => ({ ...prev, postUrl: e.target.value }))}
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="caption">Caption</Label>
                      <Textarea
                        id="caption"
                        value={newPost.caption}
                        onChange={(e) => setNewPost(prev => ({ ...prev, caption: e.target.value }))}
                        placeholder="Write a caption for your post..."
                        rows={3}
                      />
                    </div>
                    <Button 
                      onClick={() => addPostMutation.mutate(newPost)}
                      disabled={!newPost.platform || !newPost.postUrl || addPostMutation.isPending}
                      className="w-full"
                    >
                      {addPostMutation.isPending ? "Adding..." : "Add Post"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Feed Filters */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex gap-2">
                <Button
                  variant={selectedFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedFilter("all")}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  All Posts
                </Button>
                <Button
                  variant={selectedFilter === "following" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedFilter("following")}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Following
                </Button>
              </div>
              <div className="flex-1 max-w-sm">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-base-content/70" />
                  <Input
                    placeholder="Search posts or users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            {/* Feed Posts */}
            <div className="space-y-6">
              {isLoadingFeed ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardHeader>
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-base-200 rounded-full"></div>
                          <div className="space-y-2">
                            <div className="h-4 bg-base-200 rounded w-32"></div>
                            <div className="h-3 bg-base-200 rounded w-24"></div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="h-4 bg-base-200 rounded w-full mb-2"></div>
                        <div className="h-4 bg-base-200 rounded w-3/4"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredPosts.length > 0 ? (
                filteredPosts.map((post) => (
                  <Card key={post.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Avatar>
                            <AvatarImage src={post.user.profileImage || undefined} />
                            <AvatarFallback>
                              {post.user.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{post.user.name}</h3>
                              <Badge variant="secondary" className="text-xs">
                                {platformIcons[post.platform]} {post.platform}
                              </Badge>
                            </div>
                            <p className="text-sm text-base-content/70">
                              {post.user.profession || 'Professional'}
                            </p>
                          </div>
                        </div>
                        <div className="text-sm text-base-content/70">
                          <Calendar className="h-4 w-4 inline mr-1" />
                          {formatDistanceToNow(new Date(post.postedAt), { addSuffix: true })}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {post.caption && (
                        <p className="mb-4 text-base-content">{post.caption}</p>
                      )}
                      
                      {post.thumbnailUrl && (
                        <div className="mb-4">
                          <img
                            src={post.thumbnailUrl}
                            alt="Post thumbnail"
                            className="rounded-lg max-w-full h-auto max-h-96 object-cover"
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="flex items-center space-x-4">
                          <Button variant="ghost" size="sm">
                            <Heart className="h-4 w-4 mr-2" />
                            Like
                          </Button>
                          <Button variant="ghost" size="sm">
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Comment
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Share2 className="h-4 w-4 mr-2" />
                            Share
                          </Button>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <a href={post.postUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Original
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <div className="text-base-content/70">
                      <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
                      <p>Follow some users or add your own social media posts to see content here.</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-80 space-y-6">
            {/* Following */}
            {followingUsers && followingUsers.length > 0 && (
              <Card>
                <CardHeader>
                  <h3 className="font-semibold flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Following ({followingUsers.length})
                  </h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {followingUsers.slice(0, 5).map((user) => (
                      <div key={user.id} className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.profileImage || undefined} />
                          <AvatarFallback className="text-xs">
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{user.name}</p>
                          <p className="text-xs text-base-content/70 truncate">
                            {user.profession || 'Professional'}
                          </p>
                        </div>
                      </div>
                    ))}
                    {followingUsers.length > 5 && (
                      <p className="text-xs text-base-content/70 text-center pt-2">
                        +{followingUsers.length - 5} more
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Suggested Users */}
            {suggestedUsers && suggestedUsers.length > 0 && (
              <Card>
                <CardHeader>
                  <h3 className="font-semibold">Suggested for you</h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {suggestedUsers.slice(0, 3).map((user) => (
                      <div key={user.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.profileImage || undefined} />
                            <AvatarFallback>
                              {user.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{user.name}</p>
                            <p className="text-xs text-base-content/70">
                              {user.profession || 'Professional'}
                            </p>
                            {user.socialScore && (
                              <Badge variant="outline" className="text-xs mt-1">
                                Score: {user.socialScore}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => followMutation.mutate(user.id)}
                          disabled={followMutation.isPending}
                        >
                          Follow
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Feed Stats */}
            <Card>
              <CardHeader>
                <h3 className="font-semibold">Feed Activity</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-base-content/70">Total Posts</span>
                    <span className="text-sm font-medium">{filteredPosts.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-base-content/70">Following</span>
                    <span className="text-sm font-medium">{followingUsers?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-base-content/70">Your Score</span>
                    <span className="text-sm font-medium">{user.socialScore || 50}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}