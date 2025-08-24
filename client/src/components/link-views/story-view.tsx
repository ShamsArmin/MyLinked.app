import React from 'react';
import { Link } from '@shared/schema';
import { PlatformIcon } from '@/components/platform-icon';
import { ExternalLink, Eye, MousePointerClick } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LinkMenu from '@/components/link-menu';

interface StoryViewProps {
  links: Link[];
  onEdit: (link: Link) => void;
  onDelete: (id: number) => void;
}

export function StoryView({ links, onEdit, onDelete }: StoryViewProps) {
  return (
    <div className="flex flex-col space-y-6 overflow-y-auto max-h-[70vh] p-4">
      {links.map((link) => (
        <div 
          key={link.id} 
          className="bg-base-100 rounded-xl shadow-md border p-6 min-h-[200px] flex flex-col justify-between"
        >
          <div className="flex justify-between items-start">
            <div className="flex gap-4 items-center">
              <div className="p-3 bg-primary/10 rounded-full">
                <PlatformIcon platform={link.platform} size={32} />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{link.title}</h3>
                <p className="text-base-content/70 text-sm truncate max-w-[200px]">
                  {link.url}
                </p>
              </div>
            </div>
            <LinkMenu 
              link={link} 
              onEdit={() => onEdit(link)} 
              onDelete={() => onDelete(link.id)} 
            />
          </div>
          <div className="mt-6 pt-4 border-t flex justify-between items-center">
            <div className="flex gap-4 text-sm text-base-content/70">
              <div className="flex items-center gap-1">
                <Eye size={16} />
                <span>{link.views || 0} views</span>
              </div>
              <div className="flex items-center gap-1">
                <MousePointerClick size={16} />
                <span>{link.clicks || 0} clicks</span>
              </div>
            </div>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => window.open(link.url, '_blank')}
            >
              Visit
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}