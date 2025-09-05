import { useEffect, useState } from "react";
import useSWR, { mutate as mutateGlobal } from "swr";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { PermissionDef, CreateRolePayload, RoleSummary } from "@/types/roles";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

function toSlug(input: string) {
  return input.toLowerCase().trim().replace(/[^a-z0-9_]+/g, "_").replace(/^_+|_+$/g, "");
}

function machine(s: string) {
  return s?.trim() ? toSlug(s) : "";
}

function buildSafeSlug(
  rawName: string,
  displayName: string,
  existing: RoleSummary[] | undefined,
  reserved: Set<string>
) {
  const taken = new Set((existing ?? []).map(r => r.name.toLowerCase()));
  const base0 = machine(rawName) || machine(displayName) || "role";
  let base = base0 || "role";

  const isTaken = (n: string) => reserved.has(n) || taken.has(n);
  if (!isTaken(base)) return base;

  // try base_role, then base_role_2, base_role_3, ...
  let candidate = `${base}_role`;
  let i = 2;
  while (isTaken(candidate)) {
    candidate = `${base}_role_${i++}`;
  }
  return candidate;
}

export function CreateRoleDialog({ open, onClose, onCreated }: Props) {
  const [catalog, setCatalog] = useState<PermissionDef[]>([]);
  const [permMap, setPermMap] = useState<Record<string, boolean>>({});
  const [form, setForm] = useState({ name: "", displayName: "", description: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: perms, error: permsError, isLoading } = useSWR<PermissionDef[]>(
    open ? "/api/admin/permissions" : null,
    (url) => apiRequest("GET", url),
    {
      shouldRetryOnError: true,
      errorRetryCount: 3,
      errorRetryInterval: 1500,
    }
  );

  const { data: existingRoles } = useSWR<RoleSummary[]>(
    open ? "/api/admin/roles" : null,
    (url) => apiRequest("GET", url)
  );

  const RESERVED = new Set(["super_admin", "admin", "moderator", "employee", "developer"]);

  useEffect(() => {
    if (perms) {
      const withLabels = perms.map((p) => ({ ...p, label: p.description || p.key }));
      setCatalog(withLabels);
    }
  }, [perms]);

  const toggle = (key: string) => {
    setPermMap((m) => ({ ...m, [key]: !m[key] }));
  };

  const selectedKeys = Object.entries(permMap)
    .filter(([, v]) => v)
    .map(([k]) => k);

  const machineName = buildSafeSlug(form.name, form.displayName, existingRoles, RESERVED);

  const handleSubmit = async () => {
    setError(null);

    // sanity check: payload must be string[]
    if (selectedKeys.some((k) => typeof k !== "string")) {
      console.warn("Invalid permission payload:", selectedKeys);
      setError("Internal selection error. Please reopen the dialog and try again.");
      return;
    }

    // validate against catalog
    const known = new Set(catalog.map((p) => p.key));
    for (const k of selectedKeys) {
      if (!known.has(k)) {
        setError(`Unknown permission key: ${k}`);
        return;
      }
    }

    if (machineName.length < 3) {
      setError("Role name must be at least 3 characters");
      return;
    }

    const payload: CreateRolePayload = {
      name: machineName,
      displayName: form.displayName.trim() || form.name.trim() || "Role",
      description: form.description.trim() || undefined,
      permissions: selectedKeys, // string[]
    };

    try {
      setLoading(true);
      await apiRequest("POST", "/api/admin/roles", payload);
      mutateGlobal("/api/admin/roles");
      onCreated?.();
      onClose();
      setForm({ name: "", displayName: "", description: "" });
      setPermMap({});
    } catch (e: any) {
      setError(e?.message || "Failed to create role");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
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
            <div className="text-xs text-muted-foreground">
              Machine name: <code>{machineName}</code>
            </div>
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
            {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
            {permsError && (
              <div className="text-sm text-amber-600">
                Failed to load permissions.&nbsp;
                <Button size="sm" variant="outline" onClick={() => mutateGlobal("/api/admin/permissions")}>
                  Retry
                </Button>
              </div>
            )}
            {!isLoading && !permsError && (
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border p-2 rounded">
                {catalog.map((p) => (
                  <label key={p.key} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={!!permMap[p.key]}
                      onChange={() => toggle(p.key)}
                    />
                    <span>{p.label || p.key}</span>
                  </label>
                ))}
              </div>
            )}
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
