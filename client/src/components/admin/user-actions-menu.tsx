import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuRadioGroup, DropdownMenuRadioItem } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { EllipsisVertical, Check } from "lucide-react";
import { SetLimitsModal } from "./set-limits-modal";
import { useState } from "react";

interface Props {
  user: any;
  onAssignRole: () => void;
  onChangeStatus: (status: 'active' | 'suspended') => void;
  onSetLimits: (limits: { maxLinks?: number | null; dailyClickQuota?: number | null }) => void;
  onForceLogout: () => void;
  onResetPassword: () => void;
  onDelete: () => void;
}

export function UserActionsMenu({ user, onAssignRole, onChangeStatus, onSetLimits, onForceLogout, onResetPassword, onDelete }: Props) {
  const [limitsOpen, setLimitsOpen] = useState(false);
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" aria-label="User actions">
            <EllipsisVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={onAssignRole}>Assign role…</DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              Change status
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup value={user.status} onValueChange={(v) => onChangeStatus(v as any)}>
                <DropdownMenuRadioItem value="active">
                  Active {user.status === 'active' && <Check className="ml-2 h-3 w-3" />}
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="suspended">
                  Suspended {user.status === 'suspended' && <Check className="ml-2 h-3 w-3" />}
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuItem onSelect={() => setLimitsOpen(true)}>Set limits…</DropdownMenuItem>
          <DropdownMenuItem onSelect={onForceLogout}>Force logout</DropdownMenuItem>
          <DropdownMenuItem onSelect={onResetPassword}>Reset password email</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive" onSelect={onDelete}>Delete user…</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <SetLimitsModal
        open={limitsOpen}
        onOpenChange={setLimitsOpen}
        onSave={onSetLimits}
        initial={{ maxLinks: user.maxLinks, dailyClickQuota: user.dailyClickQuota }}
      />
    </>
  );
}
