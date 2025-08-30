import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { SocialPost, InsertSocialPost } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

export function useSocialPosts() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Fetch all social posts
  const {
    data: posts,
    isLoading,
    isError,
    error
  } = useQuery<SocialPost[]>({
    queryKey: ['/api/social-posts'],
    retry: 0,
    suspense: false,
    useErrorBoundary: false,
    onError: () => {},
  });
  
  // Add a new social post
  const addPostMutation = useMutation({
    mutationFn: async (postData: InsertSocialPost) => {
      const res = await apiRequest('POST', '/api/social-posts', postData);
      return await res.json();
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['/api/social-posts'] });
      
      toast({
        title: 'Social post added',
        description: 'Your social post has been added to your profile.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to add social post',
        description: error.message || 'An error occurred when adding the social post.',
        variant: 'destructive',
      });
    },
  });
  
  return {
    posts: posts || [],
    isLoading,
    isError,
    error,
    addPost: addPostMutation.mutate,
    isAdding: addPostMutation.isPending,
  };
}