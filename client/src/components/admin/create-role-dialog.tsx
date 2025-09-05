import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { PermissionDef, CreateRolePayload } from "@/types/roles";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

function toSlug(input: string) {
  return input.toLowerCase().trim().replace(/[^a-z0-9_]+/g, "_").replace(/^_+|_+$/g, "");
}

export function CreateRoleDialog({ open, onClose, onCreated }: Props) {
  const [catalog, setCatalog] = useState<PermissionDef[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [form, setForm] = useState({ name: "", displayName: "", description: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    (async () => {
      try {
        const perms: PermissionDef[] = await apiRequest("GET", "/api/admin/permissions");
        if (!mounted) return;
        const withLabels = perms.map((p) => ({ ...p, label: p.description || p.key }));
        setCatalog(withLabels);
      } catch {
        setError("Failed to load permissions");
      }
    })();
    return () => {
      mounted = false;
    };
  }, [open]);

  const toggle = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleSubmit = async () => {
    setError(null);
    if (Array.from(selected).some((k) => typeof k !== "string")) {
      console.warn("Invalid permission payload:", Array.from(selected));
      setError("Internal selection error. Please reopen the dialog and try again.");
      return;
    }
    const known = new Set(catalog.map((p) => p.key));
    for (const k of selected) {
      if (!known.has(k)) {
        setError(`Unknown permission key: ${k}`);
        return;
      }
    }
    const payload: CreateRolePayload = {
      name: toSlug(form.name),
      displayName: form.displayName.trim(),
      description: form.description.trim() || undefined,
      permissions: Array.from(selected),
    };
    try {
      setLoading(true);
      await apiRequest("POST", "/api/admin/roles", payload);
      onCreated?.();
      onClose();
      setForm({ name: "", displayName: "", description: "" });
      setSelected(new Set());
    } catch (e: any) {
      setError(e?.message || "Failed to create role");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Role</DialogTitle>
          <DialogDescription>Define role details and assign permissions</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="role-name">Name</Label>
            <Input
              id="role-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. content_manager"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="display-name">Display Name</Label>
            <Input
              id="display-name"
              value={form.displayName}
              onChange={(e) => setForm({ ...form, displayName: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Permissions</Label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border p-2 rounded">
              {catalog.map((p) => (
                <label key={p.key} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    value={p.key}
                    checked={selected.has(p.key)}
                    onChange={() => toggle(p.key)}
                  />
                  <span>{p.label || p.key}</span>
                </label>
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Creating..." : "Create Role"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
