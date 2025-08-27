import React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";

export const DEFAULT_MAX_VISIBLE_TILES = 11;

export type LinkItem = {
  id: string;
  label: string;
  url: string;
  icon: React.ReactNode;
  platform?: string;
};

export type MyLinksProps = {
  links: LinkItem[];
  maxVisibleTiles?: number;
  onLinkClick?: (link: LinkItem) => void;
};

export function splitLinks(links: LinkItem[], limit: number) {
  return {
    visible: links.slice(0, limit),
    overflow: links.slice(limit),
  };
}

export function MyLinks({
  links,
  maxVisibleTiles = DEFAULT_MAX_VISIBLE_TILES,
  onLinkClick,
}: MyLinksProps) {
  const { visible, overflow } = splitLinks(links, maxVisibleTiles);

  const handleClick = (link: LinkItem) => {
    if (onLinkClick) {
      onLinkClick(link);
    } else if (link.url) {
      const newWindow = window.open(link.url, "_blank");
      if (!newWindow) {
        window.location.href = link.url;
      }
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {visible.map((link) => (
        <Button
          key={link.id}
          variant="outline"
          className="h-20 w-20 flex flex-col items-center justify-center gap-1 hover:scale-105 transition-transform duration-200 border-2 hover:border-blue-300 hover:bg-blue-50"
          onClick={() => handleClick(link)}
        >
          {link.icon}
          <span className="text-xs font-medium text-gray-700 text-center">
            {link.label}
          </span>
        </Button>
      ))}

      {overflow.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="h-20 w-20 flex flex-col items-center justify-center gap-1 hover:scale-105 transition-transform duration-200 border-2 hover:border-blue-300 hover:bg-blue-50"
              aria-haspopup="menu"
            >
              <MoreHorizontal className="h-6 w-6 text-gray-600" />
              <span className="text-xs font-medium text-gray-700">
                +{overflow.length}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {overflow.map((link) => (
              <DropdownMenuItem
                key={link.id}
                onClick={() => handleClick(link)}
                className="flex items-center gap-2 cursor-pointer hover:bg-blue-50"
              >
                {link.icon}
                <span className="text-sm">{link.label}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

export default MyLinks;

