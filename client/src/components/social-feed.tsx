import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useSocialPosts } from '@/hooks/use-social-posts';
import { Loader2, Instagram, Youtube, ExternalLink, Plus, RefreshCw } from 'lucide-react';
// Custom icons for platforms that aren't in lucide-react
import { SiTiktok, SiX } from 'react-icons/si';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InsertSocialPost } from '@shared/schema';
import { formatDistanceToNow } from 'date-fns';

type SocialFeedProps = {
  className?: string;
  username?: string;
  limit?: number;
};

export function SocialFeed({ className = '', username = '', limit = 6 }: SocialFeedProps) {
  const { posts, isLoading, addPost, isAdding } = useSocialPosts();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('instagram');
  const [postUrl, setPostUrl] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [caption, setCaption] = useState('');
  const { toast } = useToast();
  
  // Filter posts by platform
  const instagramPosts = posts.filter(post => post.platform === 'instagram').slice(0, limit);
  const tiktokPosts = posts.filter(post => post.platform === 'tiktok').slice(0, limit);
  const youtubePosts = posts.filter(post => post.platform === 'youtube').slice(0, limit);
  const xPosts = posts.filter(post => post.platform === 'x' || post.platform === 'twitter').slice(0, limit);

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return <Instagram className="h-5 w-5" />;
      case 'tiktok':
        return <SiTiktok className="h-5 w-5" />;
      case 'youtube':
        return <Youtube className="h-5 w-5" />;
      case 'twitter':
      case 'x':
        return <SiX className="h-5 w-5" />;
      default:
        return <ExternalLink className="h-5 w-5" />;
    }
  };
  
  const handleAddPost = () => {
    if (!postUrl || !selectedPlatform) {
      toast({
        title: "Error",
        description: "Post URL and platform are required",
        variant: "destructive"
      });
      return;
    }
    
    const newPost: InsertSocialPost = {
      platform: selectedPlatform,
      postUrl,
      thumbnailUrl: thumbnail || null,
      caption: caption || null,
      postedAt: new Date(), // In a real app, this would be parsed from the post
    };
    
    addPost(newPost, {
      onSuccess: () => {
        setAddDialogOpen(false);
        resetForm();
      }
    });
  };
  
  const resetForm = () => {
    setSelectedPlatform('instagram');
    setPostUrl('');
    setThumbnail('');
    setCaption('');
  };
  
  const renderPostCard = (post: typeof posts[0]) => {
    return (
      <Card key={post.id} className="overflow-hidden">
        <CardContent className="p-0">
          <div className="relative">
            <AspectRatio ratio={1}>
              <div className="bg-gray-100 w-full h-full flex items-center justify-center">
                {post.thumbnailUrl ? (
                  <img 
                    src={post.thumbnailUrl} 
                    alt={post.caption || 'Social post'} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    {getPlatformIcon(post.platform)}
                    <span className="text-xs mt-2">No Preview</span>
                  </div>
                )}
              </div>
            </AspectRatio>
            <div className="absolute top-2 right-2 bg-black/70 p-1 rounded-md">
              {getPlatformIcon(post.platform)}
            </div>
          </div>
          <div className="p-3">
            <div className="text-sm font-medium line-clamp-2 h-10">
              {post.caption || 'No caption'}
            </div>
            <div className="text-xs text-base-content/70 mt-1">
              {formatDistanceToNow(new Date(post.postedAt), { addSuffix: true })}
            </div>
          </div>
        </CardContent>
        <CardFooter className="p-2">
          <Button variant="outline" size="sm" className="w-full" asChild>
            <a href={post.postUrl} target="_blank" rel="noopener noreferrer">
              View Post <ExternalLink className="ml-2 h-3 w-3" />
            </a>
          </Button>
        </CardFooter>
      </Card>
    );
  };
  
  const renderEmptyState = (platform: string) => {
    return (
      <div className="flex flex-col items-center justify-center h-60 text-center">
        <div className="bg-base-200 p-3 rounded-full mb-3">
          {getPlatformIcon(platform)}
        </div>
        <h3 className="text-lg font-medium">No {platform} posts yet</h3>
        <p className="text-sm text-base-content/70 mb-4">
          Add your {platform} posts to showcase them on your profile
        </p>
        <Button size="sm" onClick={() => setAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add {platform} Post
        </Button>
      </div>
    );
  };
  
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle>Social Feed</CardTitle>
          <Button variant="ghost" size="icon" title="Add Post" onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-5 w-5" />
          </Button>
        </div>
        <CardDescription>
          Show your latest posts from social networks
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="instagram">
          <TabsList className="mb-4 w-full grid grid-cols-4">
            <TabsTrigger value="instagram" className="flex items-center justify-center">
              <Instagram className="h-4 w-4 mr-1" /> Instagram
            </TabsTrigger>
            <TabsTrigger value="tiktok" className="flex items-center justify-center">
              <SiTiktok className="h-4 w-4 mr-1" /> TikTok
            </TabsTrigger>
            <TabsTrigger value="youtube" className="flex items-center justify-center">
              <Youtube className="h-4 w-4 mr-1" /> YouTube
            </TabsTrigger>
            <TabsTrigger value="twitter" className="flex items-center justify-center">
              <SiX className="h-4 w-4 mr-1" /> X
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="instagram">
            {isLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : instagramPosts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {instagramPosts.map(renderPostCard)}
              </div>
            ) : (
              renderEmptyState("Instagram")
            )}
          </TabsContent>
          
          <TabsContent value="tiktok">
            {isLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : tiktokPosts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {tiktokPosts.map(renderPostCard)}
              </div>
            ) : (
              renderEmptyState("TikTok")
            )}
          </TabsContent>
          
          <TabsContent value="youtube">
            {isLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : youtubePosts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {youtubePosts.map(renderPostCard)}
              </div>
            ) : (
              renderEmptyState("YouTube")
            )}
          </TabsContent>
          
          <TabsContent value="twitter">
            {isLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : xPosts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {xPosts.map(renderPostCard)}
              </div>
            ) : (
              renderEmptyState("X")
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      
      {/* Add Post Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Social Post</DialogTitle>
            <DialogDescription>
              Add a post from your social media to display on your profile
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Platform</label>
              <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                <SelectTrigger>
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="x">X</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Post URL</label>
              <Input
                placeholder="https://instagram.com/p/..."
                value={postUrl}
                onChange={(e) => setPostUrl(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Thumbnail URL (optional)</label>
              <Input
                placeholder="https://example.com/image.jpg"
                value={thumbnail}
                onChange={(e) => setThumbnail(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Caption (optional)</label>
              <Input
                placeholder="Caption for your post"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddPost} disabled={isAdding || !postUrl || !selectedPlatform}>
              {isAdding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}