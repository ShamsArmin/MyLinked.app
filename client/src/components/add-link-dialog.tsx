import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePlatformIcons } from "@/hooks/use-platform-icons";
import { InsertLink } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  createLink,
  invalidateLinks,
} from "@/lib/links-api";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

type AddLinkDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingLink?: {
    id: number;
    platform: string;
    title: string;
    url: string;
    featured: boolean | null;
    clicks?: number | null;
    order?: number | null;
    userId?: number;
    createdAt?: Date | null;
  };
};

const AddLinkDialog: React.FC<AddLinkDialogProps> = ({ 
  open, 
  onOpenChange,
  existingLink 
}) => {
  const { platformOptions } = usePlatformIcons();
  const { toast } = useToast();
  
  const [platform, setPlatform] = useState(existingLink?.platform || "");
  const [title, setTitle] = useState(existingLink?.title || "");
  const [url, setUrl] = useState(existingLink?.url || "");
  const [featured, setFeatured] = useState(existingLink?.featured === true);
  const [isPhone, setIsPhone] = useState(existingLink?.platform === "phone");
  
  const isEditing = !!existingLink;
  
  // Reset form when dialog opens/closes
  React.useEffect(() => {
    if (open) {
      setPlatform(existingLink?.platform || "");
      setTitle(existingLink?.title || "");
      setUrl(existingLink?.url || "");
      setFeatured(existingLink?.featured === true);
      setIsPhone(existingLink?.platform === "phone");
    }
  }, [open, existingLink]);
  
  // Update isPhone when platform changes
  React.useEffect(() => {
    setIsPhone(platform === "phone");
    
    // For phone platform, we can preset the URL format
    if (platform === "phone" && (!url || !url.includes("tel:"))) {
      setUrl("tel:");
    }
  }, [platform]);
  
  const addLinkMutation = useMutation({
    mutationFn: (linkData: InsertLink) => createLink(linkData),
    onSuccess: () => {
      invalidateLinks();
      onOpenChange(false);
      toast({
        title: "Link added",
        description: "Your link has been added successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Add failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const updateLinkMutation = useMutation({
    mutationFn: async (data: { id: number; updates: Partial<InsertLink> }) => {
      return await apiRequest("PATCH", `/api/links/${data.id}`, data.updates);
    },
    onSuccess: () => {
      invalidateLinks();
      onOpenChange(false);
      toast({
        title: "Link updated",
        description: "Your link has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate the form
    if (!platform || !title || !url) {
      toast({
        title: "Validation error",
        description: "Please fill out all required fields.",
        variant: "destructive",
      });
      return;
    }
    
    // Format URL based on platform type
    let formattedUrl = url;
    
    if (isPhone) {
      // Ensure phone numbers are properly formatted with tel: protocol
      if (!url.startsWith('tel:')) {
        formattedUrl = `tel:${url}`;
      }
      // Clean up the phone number (remove any non-numeric characters except the tel: prefix)
      formattedUrl = 'tel:' + formattedUrl.replace('tel:', '').replace(/[^\d+]/g, '');
    } else if (!/^https?:\/\//i.test(url)) {
      // Add https:// to non-phone URLs if they don't have a protocol
      formattedUrl = `https://${url}`;
    }
    
    const linkData = {
      platform,
      title,
      url: formattedUrl,
      featured,
    };
    
    if (isEditing && existingLink) {
      console.log('Updating link:', existingLink.id, linkData);
      updateLinkMutation.mutate({
        id: existingLink.id,
        updates: linkData,
      });
    } else {
      console.log('Adding new link:', linkData);
      addLinkMutation.mutate(linkData);
    }
  };
  
  const isPending = addLinkMutation.isPending || updateLinkMutation.isPending;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Link" : "Add New Link"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="platformSelect">Platform</Label>
            <Select
              value={platform}
              onValueChange={setPlatform}
              disabled={isPending}
            >
              <SelectTrigger id="platformSelect">
                <SelectValue placeholder="Select a platform" />
              </SelectTrigger>
              <SelectContent>
                {platformOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="linkTitle">Link Title</Label>
            <Input
              id="linkTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. My Instagram Profile"
              disabled={isPending}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="linkUrl">{isPhone ? "Phone Number" : "URL"}</Label>
            {isPhone ? (
              <div className="flex items-center space-x-1">
                <div className="bg-gray-100 px-3 py-2 rounded-l-md border border-r-0 border-input text-muted-foreground">
                  tel:
                </div>
                <Input
                  id="linkUrl"
                  type="tel"
                  value={url.replace("tel:", "")}
                  onChange={(e) => setUrl(`tel:${e.target.value}`)}
                  placeholder="Enter phone number"
                  className="rounded-l-none"
                  disabled={isPending}
                />
              </div>
            ) : (
              <Input
                id="linkUrl"
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://instagram.com/yourusername"
                disabled={isPending}
              />
            )}
          </div>
          
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="featureLink"
              checked={featured}
              onCheckedChange={(checked) => setFeatured(checked as boolean)}
              disabled={isPending}
            />
            <Label htmlFor="featureLink" className="text-sm text-gray-700">
              Feature this link (highlight at the top)
            </Label>
          </div>
          
          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? "Updating..." : "Adding..."}
                </>
              ) : (
                isEditing ? "Update Link" : "Add Link"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddLinkDialog;
