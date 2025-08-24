import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Copy, Share2, QrCode, Facebook, Twitter, Linkedin, Mail, Check } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import QRCode from 'qrcode';

type ShareProfileDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username: string;
};

export function ShareProfileDialog({ open, onOpenChange, username }: ShareProfileDialogProps) {
  const { toast } = useToast();
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copyStatus, setCopyStatus] = useState<Record<string, boolean>>({
    url: false,
    professional: false,
    creative: false,
    startup: false,
    speaker: false,
  });
  
  // Fetch user profile to check enabled pitch modes
  const { data: profileData } = useQuery({ 
    queryKey: [`/api/profile/${username}`],
    enabled: !!username && open
  });
  
  const profile = profileData?.profile;
  
  // Generate profile links with short format for display
  const profileUrl = `mylinked.app/${username}`;
  const fullProfileUrl = `${window.location.origin}/${username}`; // Keep full URL for QR code
  
  // Generate pitch mode URLs
  const pitchModeUrls = {
    professional: `mylinked.app/${username}/Professional`,
    creative: `mylinked.app/${username}/Creative`, 
    startup: `mylinked.app/${username}/Startup`,
    speaker: `mylinked.app/${username}/Speaker`
  };
  
  const fullPitchModeUrls = {
    professional: `${window.location.origin}/${username}/Professional`,
    creative: `${window.location.origin}/${username}/Creative`,
    startup: `${window.location.origin}/${username}/Startup`, 
    speaker: `${window.location.origin}/${username}/Speaker`
  };
  
  // Generate QR code when dialog opens
  useEffect(() => {
    if (open) {
      generateQrCode();
    }
  }, [open, username]);
  
  const generateQrCode = async () => {
    try {
      // Use full URL for QR code so it works when scanned
      const dataUrl = await QRCode.toDataURL(fullProfileUrl, {
        width: 240,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      setQrCodeDataUrl(dataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast({
        title: 'QR Code Generation Failed',
        description: 'Could not generate QR code for your profile.',
        variant: 'destructive',
      });
    }
  };
  
  const handleCopy = (text: string, type: 'url' | 'professional' | 'creative' | 'startup' | 'speaker') => {
    navigator.clipboard.writeText(text).then(
      () => {
        // Set the copy status to true for this specific type
        setCopyStatus((prev) => ({ ...prev, [type]: true }));
        
        // Reset the copy status after 2 seconds
        setTimeout(() => {
          setCopyStatus((prev) => ({ ...prev, [type]: false }));
        }, 2000);
        
        toast({
          title: 'Copied to clipboard',
          description: 'Link has been copied to your clipboard.',
        });
      },
      (err) => {
        console.error('Could not copy text: ', err);
        toast({
          title: 'Copy failed',
          description: 'Failed to copy to clipboard.',
          variant: 'destructive',
        });
      }
    );
  };
  
  const handleShare = async (platform: string) => {
    const shareTitle = `Check out my profile: ${username}`;
    const shareText = `Check out my links and content on my profile page!`;
    
    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullProfileUrl)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(fullProfileUrl)}`, '_blank');
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(fullProfileUrl)}&title=${encodeURIComponent(shareTitle)}`, '_blank');
        break;
      case 'email':
        window.open(`mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(`${shareText}\n\n${profileUrl}`)}`, '_blank');
        break;
      case 'native':
        if (typeof navigator !== 'undefined' && 'share' in navigator) {
          try {
            await navigator.share({
              title: shareTitle,
              text: shareText,
              url: fullProfileUrl,
            });
          } catch (error) {
            console.error('Error sharing:', error);
          }
        } else {
          toast({
            title: 'Share not supported',
            description: 'Native sharing is not supported on this browser.',
            variant: 'destructive',
          });
        }
        break;
    }
  };
  
  const downloadQrCode = () => {
    if (!qrCodeDataUrl) {
      toast({
        title: 'QR Code not ready',
        description: 'QR Code is still generating. Please wait.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      // Create a temporary link element
      const a = document.createElement('a');
      a.href = qrCodeDataUrl;
      a.download = `${username}-profile-qr.png`;
      
      // This is needed for Firefox
      a.style.display = 'none';
      document.body.appendChild(a);
      
      // Trigger click event
      a.click();
      
      // Clean up after download starts
      setTimeout(() => {
        document.body.removeChild(a);
        toast({
          title: 'QR Code Downloaded',
          description: 'Your profile QR code has been saved to your device.',
        });
      }, 100);
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: 'Download Failed',
        description: 'Could not download the QR code. Please try again later.',
        variant: 'destructive',
      });
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Share2 className="h-5 w-5 mr-2" />
            Share Your Profile
          </DialogTitle>
          <DialogDescription>
            Share your profile via link, social media, or QR code
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="link" className="mt-2">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="link">Link</TabsTrigger>
            <TabsTrigger value="social">Social</TabsTrigger>
            <TabsTrigger value="qr">QR Code</TabsTrigger>
          </TabsList>
          
          <TabsContent value="link" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="profile-url">Profile Link</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="profile-url"
                  value={profileUrl}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleCopy(profileUrl, 'url')}
                  className="flex-shrink-0"
                >
                  {copyStatus.url ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            {/* Pitch Mode Links - Show all available pitch mode types if pitch mode is enabled */}
            {profile?.pitchMode && (
              <div className="space-y-4">
                <Label className="text-sm font-medium">Pitch Mode Links</Label>
                
                {/* Show all pitch mode types - user can access any format */}
                <div className="space-y-2">
                  <Label htmlFor="professional-url" className="text-sm text-base-content/70">Professional</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="professional-url"
                      value={pitchModeUrls.professional}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleCopy(pitchModeUrls.professional, 'professional')}
                      className="flex-shrink-0"
                    >
                      {copyStatus.professional ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="creative-url" className="text-sm text-base-content/70">Creative</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="creative-url"
                      value={pitchModeUrls.creative}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleCopy(pitchModeUrls.creative, 'creative')}
                      className="flex-shrink-0"
                    >
                      {copyStatus.creative ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startup-url" className="text-sm text-base-content/70">Startup</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="startup-url"
                      value={pitchModeUrls.startup}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleCopy(pitchModeUrls.startup, 'startup')}
                      className="flex-shrink-0"
                    >
                      {copyStatus.startup ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="speaker-url" className="text-sm text-base-content/70">Speaker</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="speaker-url"
                      value={pitchModeUrls.speaker}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleCopy(pitchModeUrls.speaker, 'speaker')}
                      className="flex-shrink-0"
                    >
                      {copyStatus.speaker ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                
                <p className="text-xs text-base-content/70">
                  These links will open your profile in different Pitch Mode formats, perfect for various professional contexts.
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="social" className="py-4">
            <div className="grid grid-cols-2 gap-3">
              <Button
                className="flex items-center justify-center py-6 bg-blue-600 hover:bg-blue-700"
                onClick={() => handleShare('facebook')}
              >
                <Facebook className="h-5 w-5 mr-2" />
                Facebook
              </Button>
              <Button
                className="flex items-center justify-center py-6 bg-sky-500 hover:bg-sky-600"
                onClick={() => handleShare('twitter')}
              >
                <Twitter className="h-5 w-5 mr-2" />
                Twitter
              </Button>
              <Button
                className="flex items-center justify-center py-6 bg-blue-700 hover:bg-blue-800"
                onClick={() => handleShare('linkedin')}
              >
                <Linkedin className="h-5 w-5 mr-2" />
                LinkedIn
              </Button>
              <Button
                className="flex items-center justify-center py-6"
                onClick={() => handleShare('email')}
              >
                <Mail className="h-5 w-5 mr-2" />
                Email
              </Button>
            </div>
            
            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <Button
                className="w-full mt-4"
                onClick={() => handleShare('native')}
              >
                <Share2 className="h-5 w-5 mr-2" />
                Share with Native Dialog
              </Button>
            )}
          </TabsContent>
          
          <TabsContent value="qr" className="py-4">
            <div className="flex flex-col items-center justify-center space-y-4">
              {qrCodeDataUrl ? (
                <div className="border-2 border-muted p-3 rounded-lg">
                  <img src={qrCodeDataUrl} alt="Profile QR Code" className="w-full h-auto" />
                </div>
              ) : (
                <div className="border-2 border-muted rounded-lg w-full h-64 flex items-center justify-center">
                  <div className="animate-pulse text-base-content/70">Generating QR Code...</div>
                </div>
              )}
              
              <p className="text-sm text-center text-base-content/70">
                Scan this QR code with a smartphone camera to access your profile
              </p>
              
              <Button onClick={downloadQrCode} disabled={!qrCodeDataUrl}>
                <QrCode className="h-5 w-5 mr-2" />
                Download QR Code
              </Button>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}