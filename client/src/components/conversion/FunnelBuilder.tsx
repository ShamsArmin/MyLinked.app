import { useEffect, useState } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { X } from "lucide-react";

export interface Step {
  event: string;
}

export interface FunnelForm {
  id?: string;
  name: string;
  description?: string;
  windowSeconds: number;
  steps: Step[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: FunnelForm | null;
  onSaved?: (funnel?: any) => void;
}

export function FunnelBuilder({ open, onOpenChange, initial, onSaved }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [windowSeconds, setWindowSeconds] = useState(86400);
  const [steps, setSteps] = useState<Step[]>([{ event: "" }, { event: "" }]);

  useEffect(() => {
    if (initial) {
      setName(initial.name);
      setDescription(initial.description || "");
      setWindowSeconds(initial.windowSeconds);
      setSteps(initial.steps.length > 0 ? initial.steps : [{ event: "" }, { event: "" }]);
    } else {
      setName("");
      setDescription("");
      setWindowSeconds(86400);
      setSteps([{ event: "" }, { event: "" }]);
    }
  }, [initial, open]);

  function updateStep(idx: number, value: string) {
    setSteps(prev => prev.map((s, i) => (i === idx ? { event: value } : s)));
  }

  function addStep() {
    setSteps(prev => [...prev, { event: "" }]);
  }

  const valid = name.trim().length > 0 && steps.length >= 2 && steps.every(s => s.event.trim());

  async function save() {
    if (!valid) return;
    const body = { name, description, windowSeconds, steps };
    let saved;
    if (initial?.id) {
      saved = await apiRequest("PATCH", `/api/admin/funnels/${initial.id}`, body);
    } else {
      saved = await apiRequest("POST", "/api/admin/funnels", body);
    }
    onSaved?.(saved);
    onOpenChange(false);
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="p-4 space-y-4">
        <DrawerHeader className="relative">
          <DrawerTitle>{initial ? "Edit Funnel" : "New Funnel"}</DrawerTitle>
          <DrawerClose className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DrawerClose>
        </DrawerHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input id="description" value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Window</Label>
            <Select value={String(windowSeconds)} onValueChange={v => setWindowSeconds(Number(v))}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3600">1h</SelectItem>
                <SelectItem value="86400">24h</SelectItem>
                <SelectItem value="604800">7d</SelectItem>
                <SelectItem value="2592000">30d</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Steps</Label>
            <div className="space-y-2">
              {steps.map((s, i) => (
                <Input
                  key={i}
                  placeholder={`Step ${i + 1} event key`}
                  value={s.event}
                  onChange={e => updateStep(i, e.target.value)}
                />
              ))}
              <Button variant="secondary" onClick={addStep}>
                Add Step
              </Button>
            </div>
          </div>
        </div>
        <DrawerFooter>
          <Button onClick={save} disabled={!valid}>
            Save
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

export default FunnelBuilder;

