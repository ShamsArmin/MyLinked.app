import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

export function useSmartLinkAI() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  
  // Mutation to prioritize links using AI
  const mutation = useMutation({
    mutationFn: async () => {
      // apiRequest returns the parsed JSON response
      return await apiRequest('POST', '/api/links/ai-prioritize', {});
    },
    onSuccess: (data) => {
      // Invalidate links query to refetch with new order
      queryClient.invalidateQueries({ queryKey: ['/api/links'] });
      
      // Set AI insights if available
      if (data.insights) {
        setAiInsights(data.insights);
      }
      
      toast({
        title: 'Links optimized with AI',
        description: 'Your links have been intelligently reordered based on engagement patterns.',
      });
    },
    onError: (error: Error) => {
      // Check if error is an API key issue
      const message = error.message || '';
      if (message.includes('API key') || message.includes('unauthorized')) {
        toast({
          title: 'API Key Required',
          description: 'This feature requires a valid OpenAI API key to function.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Optimization failed',
          description: error.message || 'An error occurred when prioritizing your links.',
          variant: 'destructive',
        });
      }
    },
  });
  
  // Clear AI insights
  const clearInsights = () => setAiInsights(null);
  
  return {
    prioritizeLinks: mutation.mutate,
    isPrioritizing: mutation.isPending,
    error: mutation.error,
    aiInsights,
    clearInsights,
  };
}