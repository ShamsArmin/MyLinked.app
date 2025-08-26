import { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, TrendingUp, TrendingDown, Minus, Award, Shield, Star } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { apiRequest } from '@/lib/queryClient';

export type SocialScoreTier = 'starter' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

// Helper function to determine tier based on score
export function getTierFromScore(score: number): SocialScoreTier {
  if (score >= 95) return 'diamond';
  if (score >= 85) return 'platinum';
  if (score >= 75) return 'gold';
  if (score >= 60) return 'silver';
  if (score >= 40) return 'bronze';
  return 'starter';
}

// Helper function to get tier color
export function getTierColor(tier: SocialScoreTier): string {
  switch (tier) {
    case 'diamond': return 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500';
    case 'platinum': return 'bg-gradient-to-r from-gray-300 to-gray-400';
    case 'gold': return 'bg-gradient-to-r from-yellow-300 to-amber-500';
    case 'silver': return 'bg-gradient-to-r from-gray-200 to-gray-300';
    case 'bronze': return 'bg-gradient-to-r from-amber-600 to-amber-700';
    case 'starter': return 'bg-gradient-to-r from-gray-500 to-gray-600';
    default: return 'bg-gradient-to-r from-gray-500 to-gray-600';
  }
}

// Helper function to get tier display name
export function getTierDisplayName(tier: SocialScoreTier): string {
  switch (tier) {
    case 'diamond': return 'Diamond';
    case 'platinum': return 'Platinum';
    case 'gold': return 'Gold';
    case 'silver': return 'Silver';
    case 'bronze': return 'Bronze';
    case 'starter': return 'Starter';
    default: return 'Starter';
  }
}

// Helper function to get tier icon
export function getTierIcon(tier: SocialScoreTier) {
  switch (tier) {
    case 'diamond': return <Star className="h-5 w-5 text-indigo-500" />;
    case 'platinum': return <Award className="h-5 w-5 text-gray-400" />;
    case 'gold': return <Award className="h-5 w-5 text-yellow-500" />;
    case 'silver': return <Shield className="h-5 w-5 text-gray-400" />;
    case 'bronze': return <Shield className="h-5 w-5 text-amber-700" />;
    case 'starter': return <Shield className="h-5 w-5 text-gray-600" />;
    default: return <Shield className="h-5 w-5 text-gray-600" />;
  }
}

// Helper function to get next tier
export function getNextTier(tier: SocialScoreTier): SocialScoreTier | null {
  switch (tier) {
    case 'starter': return 'bronze';
    case 'bronze': return 'silver';
    case 'silver': return 'gold';
    case 'gold': return 'platinum';
    case 'platinum': return 'diamond';
    case 'diamond': return null;
    default: return null;
  }
}

// Helper function to get score needed for next tier
export function getScoreForTier(tier: SocialScoreTier): number {
  switch (tier) {
    case 'bronze': return 40;
    case 'silver': return 60;
    case 'gold': return 75;
    case 'platinum': return 85;
    case 'diamond': return 95;
    default: return 0;
  }
}

type SocialScoreIndicatorProps = {
  className?: string;
  showDetails?: boolean;
  showRefresh?: boolean;
}

export function SocialScoreIndicator({ className = '', showDetails = true, showRefresh = true }: SocialScoreIndicatorProps) {
  const { data: socialScore, isLoading } = useQuery<{
    currentScore: number;
    previousScore?: number;
    change?: number;
    stats: { views: number; clicks: number; ctr: number };
    historicalData?: any[];
    compareData?: any[];
    followers?: number;
    following?: number;
    insights?: string;
  }>({
    queryKey: ['/api/social-score'],
    refetchOnWindowFocus: false,
  });

  const queryClient = useQueryClient();
  
  const calculateMutation = useMutation({
    mutationFn: async () => {
      // apiRequest already returns parsed JSON
      return await apiRequest('POST', '/api/social-score/calculate');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social-score'] });
    }
  });

  // Default values in case data is still loading
  const score = socialScore?.currentScore || 0;
  const tier = getTierFromScore(score);
  const tierColor = getTierColor(tier);
  const tierName = getTierDisplayName(tier);
  
  // Change since last calculation (would come from API in real implementation)
  const change = socialScore?.change || 0;

  // Stats from the API
  const stats = socialScore?.stats || { views: 0, clicks: 0, ctr: 0 };
  
  // Get next tier information (if available)
  const nextTier = getNextTier(tier);
  const nextTierName = nextTier ? getTierDisplayName(nextTier) : null;
  const pointsToNextTier = nextTier ? getScoreForTier(nextTier) - score : 0;

  if (isLoading) {
    return (
      <Card className={`w-full ${className}`}>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center space-y-4 animate-pulse">
            <div className="h-6 w-32 bg-gray-200 rounded"></div>
            <div className="h-24 w-24 rounded-full bg-gray-200"></div>
            <div className="h-4 w-48 bg-gray-200 rounded"></div>
            <div className="h-2 w-full bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl flex items-center">
              Social Score
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span><Info className="h-4 w-4 ml-1 text-gray-400 cursor-help" /></span>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-md">
                    <p>Your Social Score reflects the effectiveness and optimization of your profile. Higher scores lead to better visibility and engagement.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
            <CardDescription>Tracks your profile's performance and optimization</CardDescription>
          </div>
          
          {showRefresh && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => calculateMutation.mutate()}
              disabled={calculateMutation.isPending}
            >
              {calculateMutation.isPending ? 'Calculating...' : 'Recalculate'}
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-2">
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-4">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center ${tierColor} text-white`}>
              <span className="text-3xl font-bold">{score}</span>
            </div>
            
            {/* Change indicator */}
            {change !== 0 && (
              <div className="absolute -top-1 -right-1 rounded-full p-1 bg-white shadow">
                <Badge variant={change > 0 ? "outline" : "destructive"} className={`flex items-center gap-0.5 ${change > 0 ? "bg-green-100 text-green-800" : ""}`}>
                  {change > 0 ? <TrendingUp className="h-3 w-3" /> : change < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                  {Math.abs(change)}
                </Badge>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-1 mb-2">
            {getTierIcon(tier)}
            <span className="font-semibold">{tierName} Tier</span>
          </div>
          
          {nextTier && (
            <div className="text-sm text-gray-500 mb-3">
              {pointsToNextTier} points to reach {nextTierName}
            </div>
          )}
          
          <Progress value={score} className="w-full h-2 mb-4" />
          
          {showDetails && (
            <div className="grid grid-cols-3 w-full gap-4 mt-2">
              <div className="flex flex-col items-center">
                <span className="text-2xl font-semibold">{stats.views}</span>
                <span className="text-xs text-gray-500">Views</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl font-semibold">{stats.clicks}</span>
                <span className="text-xs text-gray-500">Clicks</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl font-semibold">{stats.ctr.toFixed(1)}%</span>
                <span className="text-xs text-gray-500">CTR</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      
      {showDetails && (
        <CardFooter className="pt-0 flex justify-center">
          <Link href="/social-score">
            <a>
              <Button variant="outline" size="sm">View Details</Button>
            </a>
          </Link>
        </CardFooter>
      )}
    </Card>
  );
}