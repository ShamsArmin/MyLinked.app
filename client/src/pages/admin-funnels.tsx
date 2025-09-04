import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { FunnelActionsMenu } from "@/components/admin/funnel-actions-menu";

interface Funnel {
  id: string;
  name: string;
  windowSeconds: number;
}

export default function AdminFunnelsPage() {
  const { data } = useQuery<{ funnels: Funnel[] }>({
    queryKey: ["funnels"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/funnels");
      return res.json();
    },
  });
  const funnels = data?.funnels ?? [];
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  async function handleCreate() {
    await apiRequest("POST", "/api/admin/funnels", {
      name,
      windowSeconds: 86400,
      steps: [],
    });
    queryClient.invalidateQueries(["funnels"]);
    setOpen(false);
    setName("");
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Funnels</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>New Funnel</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Funnel</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 py-2">
              <Input
                placeholder="Name"
                value={name}
                onChange={e => setName(e.target.value)}
              />
              <Button onClick={handleCreate} disabled={!name}>
                Save
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Window (s)</TableHead>
            <TableHead className="w-0">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {funnels.map(f => (
            <TableRow key={f.id}>
              <TableCell>{f.name}</TableCell>
              <TableCell>{f.windowSeconds}</TableCell>
              <TableCell>
                <FunnelActionsMenu
                  onView={() => alert(`View results for ${f.name}`)}
                  onEdit={() => alert(`Edit ${f.name}`)}
                  onDuplicate={() => alert(`Duplicate ${f.name}`)}
                  onCompare={() => alert(`Compare ${f.name}`)}
                  onExport={() => alert(`Export ${f.name}`)}
                  onAnnotate={() => alert(`Annotate ${f.name}`)}
                  onArchive={() => alert(`Archive ${f.name}`)}
                  onDelete={() => alert(`Delete ${f.name}`)}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
