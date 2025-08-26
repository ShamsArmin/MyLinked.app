import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '../lib/queryClient';
import { Loader2, Sparkles, RefreshCw, CopyCheck, ExternalLink, PenTool, Palette, Lightbulb, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type BrandingSuggestionsProps = {
  className?: string;
  userId?: number;
  username?: string;
};

type SocialAccount = {
  platform: string;
  handle: string;
};

type BrandingSuggestion = {
  brandPosition: string;
  suggestedBio: string;
  colorPalette: { name: string; hex: string }[];
  contentIdeas: string[];
  improvementTips: string[];
};

export function BrandingSuggester({ className = '', userId, username }: BrandingSuggestionsProps) {
  const { toast } = useToast();
  const [interests, setInterests] = useState<string[]>([]);
  const [interestInput, setInterestInput] = useState('');
  const [profession, setProfession] = useState('');
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
  const [socialPlatform, setSocialPlatform] = useState('');
  const [socialHandle, setSocialHandle] = useState('');
  const [showCopied, setShowCopied] = useState<string | null>(null);

  // Fetch user data if needed
  const { data: userData } = useQuery({
    queryKey: ['/api/profile'],
    enabled: !username, // Only fetch if not a public view
  });

  // Handle generating branding suggestions
  const brandingMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/branding/suggest', {
        profession,
        interests,
        socialAccounts,
      });
    },
    onSuccess: () => {
      toast({
        title: 'Branding suggestions generated!',
        description: 'AI has analyzed your profile and provided personalized branding recommendations.',
        variant: 'default',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Could not generate suggestions',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const suggestions: BrandingSuggestion | undefined = brandingMutation.data?.suggestions;

  // Handle adding interests
  const addInterest = () => {
    if (interestInput.trim() && !interests.includes(interestInput.trim())) {
      setInterests([...interests, interestInput.trim()]);
      setInterestInput('');
    }
  };

  // Handle removing interests
  const removeInterest = (interest: string) => {
    setInterests(interests.filter(i => i !== interest));
  };

  // Handle adding social accounts
  const addSocialAccount = () => {
    if (socialPlatform.trim() && socialHandle.trim()) {
      setSocialAccounts([
        ...socialAccounts,
        { platform: socialPlatform.trim(), handle: socialHandle.trim() },
      ]);
      setSocialPlatform('');
      setSocialHandle('');
    }
  };

  // Handle removing social accounts
  const removeSocialAccount = (index: number) => {
    setSocialAccounts(socialAccounts.filter((_, i) => i !== index));
  };

  // Copy text to clipboard
  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setShowCopied(type);
        setTimeout(() => setShowCopied(null), 2000);
      },
      () => {
        toast({
          title: 'Copy failed',
          description: 'Could not copy to clipboard',
          variant: 'destructive',
        });
      }
    );
  };

  return (
    <div className={`border rounded-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-yellow-500" />
          AI Branding Suggester
        </h2>
        {brandingMutation.isPending && <Loader2 className="h-5 w-5 animate-spin" />}
      </div>

      {!brandingMutation.data ? (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1">Your Profession</label>
            <input
              type="text"
              value={profession}
              onChange={(e) => setProfession(e.target.value)}
              placeholder="e.g., Software Engineer, Digital Marketer, Designer"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Your Interests</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={interestInput}
                onChange={(e) => setInterestInput(e.target.value)}
                placeholder="e.g., AI, Marketing, Design"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                onKeyPress={(e) => e.key === 'Enter' && addInterest()}
              />
              <button
                onClick={addInterest}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {interests.map((interest, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center"
                >
                  {interest}
                  <button
                    onClick={() => removeInterest(interest)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Your Social Accounts</label>
            <div className="flex flex-col sm:flex-row gap-2 mb-2">
              <input
                type="text"
                value={socialPlatform}
                onChange={(e) => setSocialPlatform(e.target.value)}
                placeholder="Platform (e.g., Twitter, LinkedIn)"
                className="w-full sm:flex-1 px-3 py-2 border border-gray-300 rounded-md"
              />
              <input
                type="text"
                value={socialHandle}
                onChange={(e) => setSocialHandle(e.target.value)}
                placeholder="Handle/Username"
                className="w-full sm:flex-1 px-3 py-2 border border-gray-300 rounded-md"
                onKeyPress={(e) => e.key === 'Enter' && addSocialAccount()}
              />
              <button
                onClick={addSocialAccount}
                className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add
              </button>
            </div>
            <div className="mt-2 space-y-2">
              {socialAccounts.map((account, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                  <span>
                    <strong>{account.platform}:</strong> {account.handle}
                  </span>
                  <button
                    onClick={() => removeSocialAccount(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => brandingMutation.mutate()}
            disabled={brandingMutation.isPending}
            className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-md hover:from-blue-600 hover:to-indigo-700 flex items-center justify-center gap-2"
          >
            {brandingMutation.isPending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Generating suggestions...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Generate Branding Suggestions
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="flex justify-end">
            <button
              onClick={() => brandingMutation.reset()}
              className="flex items-center gap-1 text-gray-500 hover:text-gray-700"
            >
              <RefreshCw className="h-4 w-4" />
              Start Over
            </button>
          </div>

          {/* Brand Position Statement */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100 relative">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-5 w-5 text-blue-600" />
              <h3 className="font-bold text-blue-800">Brand Position</h3>
            </div>
            <p className="text-gray-800">{suggestions?.brandPosition}</p>
            <button
              onClick={() => copyToClipboard(suggestions?.brandPosition || '', 'position')}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              title="Copy to clipboard"
            >
              {showCopied === 'position' ? (
                <CopyCheck className="h-5 w-5 text-green-500" />
              ) : (
                <PenTool className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Suggested Bio */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-100 relative">
            <div className="flex items-center gap-2 mb-2">
              <PenTool className="h-5 w-5 text-purple-600" />
              <h3 className="font-bold text-purple-800">Suggested Bio</h3>
            </div>
            <p className="text-gray-800">{suggestions?.suggestedBio}</p>
            <button
              onClick={() => copyToClipboard(suggestions?.suggestedBio || '', 'bio')}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              title="Copy to clipboard"
            >
              {showCopied === 'bio' ? (
                <CopyCheck className="h-5 w-5 text-green-500" />
              ) : (
                <PenTool className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Color Palette */}
          <div className="p-4 rounded-lg border border-gray-200 relative">
            <div className="flex items-center gap-2 mb-4">
              <Palette className="h-5 w-5 text-gray-600" />
              <h3 className="font-bold">Color Palette</h3>
            </div>
            <div className="flex flex-wrap gap-4">
              {suggestions?.colorPalette.map((color, index) => (
                <div key={index} className="text-center">
                  <div
                    className="w-16 h-16 rounded-md mb-2 cursor-pointer"
                    style={{ backgroundColor: color.hex }}
                    onClick={() => copyToClipboard(color.hex, `color-${index}`)}
                    title={`Copy ${color.hex}`}
                  >
                    {showCopied === `color-${index}` && (
                      <div className="flex items-center justify-center h-full bg-black bg-opacity-20 rounded-md">
                        <CopyCheck className="h-6 w-6 text-white" />
                      </div>
                    )}
                  </div>
                  <p className="text-sm">{color.name}</p>
                  <p className="text-xs text-gray-500">{color.hex}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Content Ideas */}
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-4 rounded-lg border border-amber-100">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="h-5 w-5 text-amber-600" />
              <h3 className="font-bold text-amber-800">Content Ideas</h3>
            </div>
            <ul className="space-y-2">
              {suggestions?.contentIdeas.map((idea, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="bg-amber-200 text-amber-800 rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  <span>{idea}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Improvement Tips */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-100">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-5 w-5 text-green-600" />
              <h3 className="font-bold text-green-800">Improvement Tips</h3>
            </div>
            <ul className="space-y-2">
              {suggestions?.improvementTips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="bg-green-200 text-green-800 rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}