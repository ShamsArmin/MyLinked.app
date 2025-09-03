import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { EllipsisVertical } from "lucide-react";

interface Props {
  onEdit: () => void;
  onPreview: () => void;
  onRefresh: () => void;
  onSnapshot: () => void;
  onBulkAction: (action: string) => void;
  onAttachAbTest: () => void;
  onDuplicate: () => void;
  onArchive: () => void;
  onDelete: () => void;
}

export function SegmentActionsMenu({
  onEdit,
  onPreview,
  onRefresh,
  onSnapshot,
  onBulkAction,
  onAttachAbTest,
  onDuplicate,
  onArchive,
  onDelete,
}: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" aria-label="Segment actions">
          <EllipsisVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={onEdit}>Edit segment…</DropdownMenuItem>
        <DropdownMenuItem onSelect={onPreview}>Preview members</DropdownMenuItem>
        <DropdownMenuItem onSelect={onRefresh}>Refresh now</DropdownMenuItem>
        <DropdownMenuItem onSelect={onSnapshot}>Create static snapshot</DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Bulk actions</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onSelect={() => onBulkAction('assign_role')}>Assign role</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onBulkAction('change_status')}>Change status</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onBulkAction('set_limits')}>Set limits</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onBulkAction('add_tags')}>Add tags</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onBulkAction('force_logout')}>Force logout</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onBulkAction('export_csv')}>Export CSV</DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuItem onSelect={onAttachAbTest}>Attach to A/B test…</DropdownMenuItem>
        <DropdownMenuItem onSelect={onDuplicate}>Duplicate</DropdownMenuItem>
        <DropdownMenuItem onSelect={onArchive}>Archive</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive" onSelect={onDelete}>Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
