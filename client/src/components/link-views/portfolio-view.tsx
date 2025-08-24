import React from 'react';
import { Link } from '@shared/schema';
import { PlatformIcon } from '@/hooks/use-platform-icons';
import { ExternalLink, Eye, MousePointerClick } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LinkMenu from '@/components/link-menu';

interface PortfolioViewProps {
  links: Link[];
  onEdit: (link: Link) => void;
  onDelete: (id: number) => void;
}

export function PortfolioView({ links, onEdit, onDelete }: PortfolioViewProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 overflow-y-auto max-h-[70vh] p-4">
      {links.map((link) => (
        <div 
          key={link.id} 
          className="bg-base-100 rounded-xl shadow-md hover:shadow-lg transition-all p-6 border-2 border-muted"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="flex gap-3 items-center">
              <div className="p-2 bg-primary/5 rounded-lg">
                <PlatformIcon platform={link.platform} size={28} />
              </div>
              <div>
                <h3 className="font-medium text-base">{link.title}</h3>
                <p className="text-base-content/70 text-sm">{link.url}</p>
              </div>
            </div>
            <LinkMenu 
              link={link} 
              onEdit={() => onEdit(link)} 
              onDelete={() => onDelete(link.id)} 
            />
          </div>
          
          <div className="border-t pt-4 flex items-center justify-between text-sm">
            <div className="flex gap-4">
              <div className="flex items-center gap-1">
                <Eye size={14} className="text-base-content/70" />
                <span className="text-base-content/70">{link.views || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <MousePointerClick size={14} className="text-base-content/70" />
                <span className="text-base-content/70">{link.clicks || 0}</span>
              </div>
            </div>
            <Button 
              size="sm" 
              variant="secondary"
              onClick={() => window.open(link.url, '_blank')}
              className="h-8"
            >
              <ExternalLink size={14} className="mr-1" />
              Visit
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}