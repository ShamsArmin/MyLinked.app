import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { FunnelActionsMenu } from "@/components/admin/funnel-actions-menu";
import { FunnelBuilder, FunnelForm } from "@/components/conversion/FunnelBuilder";

interface Funnel {
  id: string;
  name: string;
  windowSeconds: number;
  steps: { eventKey: string }[];
  lastComputedAt?: string | null;
  conversionRate?: number | null;
  ownerName?: string | null;
  tags?: string[];
}

export default function AdminFunnelsPage() {
  const [, setLocation] = useLocation();
  const { data } = useQuery<{ funnels: Funnel[] }>({
    queryKey: ["funnels"],
    queryFn: () => apiRequest("GET", "/api/admin/funnels"),
  });
  const funnels = data?.funnels ?? [];
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editing, setEditing] = useState<FunnelForm | null>(null);

  function openNew() {
    setEditing(null);
    setBuilderOpen(true);
  }

  async function openEdit(f: Funnel) {
    // Fetch full funnel details so the builder has the latest steps
    const full = await apiRequest("GET", `/api/admin/funnels/${f.id}`);
    const raw = full.steps ?? full.steps_json ?? full.stepsJson ?? [];
    const steps = typeof raw === "string" ? JSON.parse(raw) : raw;
    setEditing({
      id: full.id,
      name: full.name,
      description: full.description || "",
      windowSeconds: full.windowSeconds,
      steps,
    });
    setBuilderOpen(true);
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Funnels</h1>
        <Button onClick={openNew}>New Funnel</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Window</TableHead>
            <TableHead>Steps</TableHead>
            <TableHead>Last computed</TableHead>
            <TableHead>Conversion</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Tags</TableHead>
            <TableHead className="w-0">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {funnels.map(f => {
            const raw = (f as any).steps;
            const parsed = Array.isArray(raw)
              ? raw
              : typeof raw === "string"
                ? (() => {
                    try {
                      return JSON.parse(raw);
                    } catch {
                      return [];
                    }
                  })()
                : raw?.steps ?? [];
            return (
              <TableRow key={f.id}>
                <TableCell>{f.name}</TableCell>
                <TableCell>{f.windowSeconds / 3600}h</TableCell>
                <TableCell>
                  {parsed.length ? parsed.map((s: any) => s.eventKey).join(" → ") : "—"}
                </TableCell>
                <TableCell>{f.lastComputedAt ? new Date(f.lastComputedAt).toLocaleString() : "—"}</TableCell>
                <TableCell>{f.conversionRate != null ? `${(f.conversionRate * 100).toFixed(1)}%` : "—"}</TableCell>
                <TableCell>{f.ownerName ?? "—"}</TableCell>
                <TableCell>{f.tags?.join(", ") ?? ""}</TableCell>
                <TableCell>
                  <FunnelActionsMenu
                    onView={() => setLocation(`/admin/conversion/funnels/${f.id}`)}
                    onEdit={() => openEdit(f)}
                    onDuplicate={() => alert(`Duplicate ${f.name}`)}
                    onCompare={() => alert(`Compare ${f.name}`)}
                    onExport={() => alert(`Export ${f.name}`)}
                    onAnnotate={() => alert(`Annotate ${f.name}`)}
                    onArchive={() => alert(`Archive ${f.name}`)}
                    onDelete={() => alert(`Delete ${f.name}`)}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <FunnelBuilder
        open={builderOpen}
        onOpenChange={setBuilderOpen}
        initial={editing}
        onSaved={() => queryClient.invalidateQueries(["funnels"])}
      />
    </div>
  );
}

