import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (limits: { maxLinks?: number | null; dailyClickQuota?: number | null }) => void;
  initial: { maxLinks?: number | null; dailyClickQuota?: number | null };
}

export function SetLimitsModal({ open, onOpenChange, onSave, initial }: Props) {
  const [maxLinks, setMaxLinks] = useState<number | ''>(initial.maxLinks ?? '');
  const [dailyClicks, setDailyClicks] = useState<number | ''>(initial.dailyClickQuota ?? '');
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set limits</DialogTitle>
          <DialogDescription>Leave blank to use plan default.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="maxLinks">Max links</Label>
            <Input id="maxLinks" type="number" value={maxLinks} onChange={e => setMaxLinks(e.target.value ? Number(e.target.value) : '')} />
          </div>
          <div>
            <Label htmlFor="dailyClicks">Daily click quota</Label>
            <Input id="dailyClicks" type="number" value={dailyClicks} onChange={e => setDailyClicks(e.target.value ? Number(e.target.value) : '')} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={() => { onSave({ maxLinks: maxLinks === '' ? null : maxLinks, dailyClickQuota: dailyClicks === '' ? null : dailyClicks }); onOpenChange(false); }}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
