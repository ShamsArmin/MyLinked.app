import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { EllipsisVertical } from "lucide-react";

interface Props {
  onView: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onCompare: () => void;
  onExport: () => void;
  onAnnotate: () => void;
  onArchive: () => void;
  onDelete: () => void;
}

export function FunnelActionsMenu({
  onView,
  onEdit,
  onDuplicate,
  onCompare,
  onExport,
  onAnnotate,
  onArchive,
  onDelete,
}: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" aria-label="Funnel actions">
          <EllipsisVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={onView}>View results</DropdownMenuItem>
        <DropdownMenuItem onSelect={onEdit}>Edit funnel…</DropdownMenuItem>
        <DropdownMenuItem onSelect={onDuplicate}>Duplicate</DropdownMenuItem>
        <DropdownMenuItem onSelect={onCompare}>Compare…</DropdownMenuItem>
        <DropdownMenuItem onSelect={onExport}>Export CSV</DropdownMenuItem>
        <DropdownMenuItem onSelect={onAnnotate}>Add annotation…</DropdownMenuItem>
        <DropdownMenuItem onSelect={onArchive}>Archive</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive" onSelect={onDelete}>Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
