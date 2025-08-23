import React from "react";
import { Link } from "@shared/schema";
import { usePlatformIcons } from "@/hooks/use-platform-icons";
import { useMutation } from "@tanstack/react-query";
import {
  deleteLink,
  removeLinkOptimistic,
  invalidateLinks,
} from "@/lib/links-api";
import { useToast } from "@/hooks/use-toast";

type LinkItemProps = {
  link: Link;
  onEdit: (link: Link) => void;
};

const LinkItem: React.FC<LinkItemProps> = ({ link, onEdit }) => {
  const { getPlatformConfig } = usePlatformIcons();
  const { toast } = useToast();
  
  const platform = getPlatformConfig(link.platform);
  const Icon = platform.icon;
  
  const deleteLinkMutation = useMutation({
    mutationFn: (id: number) => deleteLink(id),
    onMutate: () => {
      removeLinkOptimistic(link.id);
    },
    onSuccess: () => {
      invalidateLinks();
      toast({
        title: "Link deleted",
        description: "Your link has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
      invalidateLinks();
    },
  });
  
  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this link?")) {
      deleteLinkMutation.mutate(link.id);
    }
  };
  
  return (
    <div 
      className={`link-card ${link.featured ? 'gradient-border' : ''} bg-white border rounded-xl p-4 flex items-center shadow-sm cursor-move hover:shadow`}
    >
      <div className="mr-3 flex-shrink-0">
        <div className={`w-10 h-10 rounded-full ${link.featured ? 'bg-purple-500 text-white' : `${platform.bgColor} ${platform.color}`} flex items-center justify-center`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center">
          <h4 className="text-gray-900 font-medium truncate">{link.title}</h4>
          {link.featured && (
            <span className="ml-2 text-xs text-white bg-primary-500 px-2 py-0.5 rounded-full">Featured</span>
          )}
        </div>
        <p className="text-gray-500 text-sm truncate">{link.url.replace(/^(https?:\/\/)?(www\.)?/i, '')}</p>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md">{link.clicks ?? 0} clicks</span>
        <button 
          className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
          onClick={() => onEdit(link)}
          aria-label="Edit link"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
            <path d="m15 5 4 4"/>
          </svg>
        </button>
        <button 
          className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
          onClick={handleDelete}
          aria-label="Delete link"
          disabled={deleteLinkMutation.isPending}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18"/>
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
            <line x1="10" y1="11" x2="10" y2="17"/>
            <line x1="14" y1="11" x2="14" y2="17"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default LinkItem;
