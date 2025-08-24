import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSmartLinkAI } from '@/hooks/use-smart-link-ai';
import { Link } from '@shared/schema';
import { BrainCircuit, Lightbulb, Zap, ArrowUp, ArrowDown, Loader2, BarChart, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

type SmartLinkAIProps = {
  links?: Link[];
  className?: string;
};

export function SmartLinkAI({ links = [], className = '' }: SmartLinkAIProps) {
  const { prioritizeLinks, isPrioritizing, error, aiInsights, clearInsights } = useSmartLinkAI();
  const [showInfoDialog, setShowInfoDialog] = useState(false);
  const [showInsightsDialog, setShowInsightsDialog] = useState(false);
  
  const handlePrioritize = () => {
    prioritizeLinks();
    // When optimizing, automatically show insights when they become available
    setShowInsightsDialog(true);
  };
  
  const hasEnoughData = links.length >= 3 && links.some(link => link.clicks && link.clicks > 0);
  
  return (
    <>
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BrainCircuit className="h-5 w-5 text-primary" />
              <CardTitle>Smart Link AI</CardTitle>
              {aiInsights && (
                <Badge 
                  variant="outline" 
                  className="bg-primary/10 hover:bg-primary/20 cursor-pointer"
                  onClick={() => setShowInsightsDialog(true)}
                >
                  New Insights
                </Badge>
              )}
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowInfoDialog(true)}
              title="About Smart Link AI"
            >
              <Lightbulb className="h-5 w-5" />
            </Button>
          </div>
          <CardDescription>
            Let AI optimize your link order based on visitor engagement
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!hasEnoughData ? (
            <Alert>
              <AlertTitle className="flex items-center text-amber-500">
                <Lightbulb className="h-4 w-4 mr-2" />
                Not enough data yet
              </AlertTitle>
              <AlertDescription className="text-sm text-base-content/70">
                Add at least 3 links and get some clicks on them for AI to analyze engagement patterns.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center p-3 bg-primary/10 rounded-lg">
                <div className="flex-shrink-0 mr-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-sm">AI Ready</h4>
                  <p className="text-xs text-base-content/70">
                    {links.length} links and {links.reduce((sum, link) => sum + (link.clicks || 0), 0)} clicks detected
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-sm">How it works:</h4>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-base-200 rounded-lg">
                    <div className="flex justify-center mb-2">
                      <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                        <BarChart className="h-4 w-4 text-green-500" />
                      </div>
                    </div>
                    <p className="text-xs">Analyzes engagement</p>
                  </div>
                  <div className="p-2 bg-base-200 rounded-lg">
                    <div className="flex justify-center mb-2">
                      <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                        <BrainCircuit className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                    <p className="text-xs">AI optimizes order</p>
                  </div>
                  <div className="p-2 bg-base-200 rounded-lg">
                    <div className="flex justify-center mb-2">
                      <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                        <ArrowUp className="h-4 w-4 text-amber-500" />
                      </div>
                    </div>
                    <p className="text-xs">Boosts traffic</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button 
            className="w-full"
            onClick={handlePrioritize}
            disabled={isPrioritizing || !hasEnoughData}
          >
            {isPrioritizing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPrioritizing ? 'Analyzing Your Profile...' : 'Optimize with AI'}
          </Button>
          
          {aiInsights && (
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full text-xs"
              onClick={() => setShowInsightsDialog(true)}
            >
              <Lightbulb className="h-3.5 w-3.5 mr-1.5" />
              View AI Recommendations
            </Button>
          )}
        </CardFooter>
      </Card>
      
      {/* Information Dialog - About Smart Link AI */}
      <Dialog open={showInfoDialog} onOpenChange={setShowInfoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <BrainCircuit className="h-5 w-5 mr-2 text-primary" />
              About Smart Link AI
            </DialogTitle>
            <DialogDescription>
              How our AI helps optimize your profile for maximum engagement
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm">
              Smart Link AI analyzes your visitors' behaviors and preferences to automatically optimize the order of your links for maximum engagement.
            </p>
            
            <div className="space-y-2">
              <h4 className="font-medium">What Smart Link AI considers:</h4>
              <ul className="text-sm space-y-1.5">
                <li className="flex items-start">
                  <ArrowUp className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Click-through rates for each link</span>
                </li>
                <li className="flex items-start">
                  <ArrowUp className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Time-based engagement patterns</span>
                </li>
                <li className="flex items-start">
                  <ArrowUp className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Platform popularity and relevance</span>
                </li>
                <li className="flex items-start">
                  <ArrowUp className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Link title clarity and appeal</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-base-200 p-3 rounded-lg">
              <h4 className="font-medium mb-1">Best Practices:</h4>
              <p className="text-sm text-base-content/70">
                For optimal results, run AI optimization after collecting at least a week of visitor data. You can always revert to manual ordering if preferred.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setShowInfoDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* AI Insights Dialog */}
      <Dialog open={showInsightsDialog} onOpenChange={(open) => {
        setShowInsightsDialog(open);
        if (!open) clearInsights();
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Lightbulb className="h-5 w-5 mr-2 text-amber-500" />
              AI Link Insights
            </DialogTitle>
            <DialogDescription>
              Personalized recommendations for your profile
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {isPrioritizing ? (
              <div className="py-8 flex flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-sm text-center">AI is analyzing your profile and generating personalized insights...</p>
              </div>
            ) : aiInsights ? (
              <>
                <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                  <h4 className="font-medium mb-2 flex items-center text-primary">
                    <Zap className="h-4 w-4 mr-2" />
                    AI Recommendations
                  </h4>
                  <p className="text-sm whitespace-pre-line">{aiInsights}</p>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-medium mb-2">Changes Applied:</h4>
                  <ul className="text-sm space-y-1.5">
                    <li className="flex items-start">
                      <ArrowUp className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Your links have been reordered for optimal visibility</span>
                    </li>
                    <li className="flex items-start">
                      <ArrowUp className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Most engaging content prioritized at the top</span>
                    </li>
                    <li className="flex items-start">
                      <ArrowUp className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Seasonal and trending links highlighted</span>
                    </li>
                  </ul>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <X className="h-8 w-8 mx-auto mb-2 text-base-content/70" />
                <p>No insights available yet. Run the AI optimization to generate personalized recommendations.</p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button onClick={() => setShowInsightsDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}