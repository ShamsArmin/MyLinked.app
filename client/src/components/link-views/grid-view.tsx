import React from 'react';
import { Link } from '@shared/schema';
import { PlatformIcon } from '@/hooks/use-platform-icons';
import { ExternalLink, Eye, MousePointerClick } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LinkMenu from '@/components/link-menu';

interface GridViewProps {
  links: Link[];
  onEdit: (link: Link) => void;
  onDelete: (id: number) => void;
}

export function GridView({ links, onEdit, onDelete }: GridViewProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 overflow-y-auto max-h-[70vh] p-4">
      {links.map((link) => (
        <div 
          key={link.id} 
          className="bg-base-100 rounded-lg shadow hover:shadow-md transition-all p-4 border flex flex-col h-full"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2 mb-2">
              <PlatformIcon platform={link.platform} size={22} />
              <h3 className="font-medium">{link.title}</h3>
            </div>
            <LinkMenu 
              link={link} 
              onEdit={() => onEdit(link)} 
              onDelete={() => onDelete(link.id)} 
            />
          </div>
          
          <p className="text-xs text-base-content/70 mb-3 truncate">{link.url}</p>
          
          <div className="mt-auto pt-3 border-t flex justify-between items-center">
            <div className="flex gap-3 text-xs text-base-content/70">
              <div className="flex items-center gap-1">
                <Eye size={12} />
                <span>{link.views || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <MousePointerClick size={12} />
                <span>{link.clicks || 0}</span>
              </div>
            </div>
            
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-7 px-2"
              onClick={() => window.open(link.url, '_blank')}
            >
              <ExternalLink size={12} />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}