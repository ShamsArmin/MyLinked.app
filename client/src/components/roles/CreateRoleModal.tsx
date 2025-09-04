import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { PermissionDef, CreateRolePayload } from '@/types/roles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';

function validatePermissions(out: unknown, allowed: string[]) {
  if (!Array.isArray(out)) throw new Error('permissions must be an array');
  const set = new Set(allowed);
  (out as unknown[]).forEach((k, i) => {
    if (typeof k !== 'string') throw new Error(`permissions[${i}] not a string`);
    if (/^\d+$/.test(k)) throw new Error(`permissions[${i}] looks numeric: ${k}`);
    if (!set.has(k)) throw new Error(`Unknown permission key (client): ${k}`);
  });
}

export default function CreateRoleModal() {
  const [open, setOpen] = useState(false);
  const [roleName, setRoleName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [catalog, setCatalog] = useState<PermissionDef[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    api.get<PermissionDef[]>("/api/admin/permissions")
      .then(res => setCatalog(res.data ?? []))
      .catch(() => setCatalog([]));
  }, []);

  const toggle = (key: string) =>
    setSelected(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const onSubmit = async () => {
    const payload: CreateRolePayload = {
      name: roleName.trim(),
      displayName: displayName.trim(),
      description: description.trim(),
      permissions: Array.from(selected),
    };
    validatePermissions(payload.permissions, catalog.map(c => c.key));
    await api.post('/api/admin/roles', payload, { headers: { 'Content-Type': 'application/json' } });
    setOpen(false);
    setRoleName('');
    setDisplayName('');
    setDescription('');
    setSelected(new Set());
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          Create Role
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Role</DialogTitle>
          <DialogDescription>
            Define a new role with specific permissions
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="roleName">Role Name</Label>
            <Input id="roleName" value={roleName} onChange={e => setRoleName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="displayName">Display Name</Label>
            <Input id="displayName" value={displayName} onChange={e => setDisplayName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Input id="description" value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div>
            <Label>Permissions</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {catalog.map(p => (
                <label key={p.key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    data-key={p.key}
                    checked={selected.has(p.key)}
                    onChange={e => toggle(e.currentTarget.dataset.key!)}
                  />
                  <span>{p.key}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={onSubmit} disabled={!roleName.trim() || !displayName.trim()}>
              Create Role
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

api.interceptors.request.use(cfg => {
  if (cfg.url?.includes('/api/admin/roles') && cfg.method === 'post') {
    console.log('CreateRole payload →', cfg.data);
  }
});
