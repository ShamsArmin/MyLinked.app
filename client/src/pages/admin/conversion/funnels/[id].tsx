import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface Funnel {
  id: string;
  name: string;
}

export default function FunnelResultsPage() {
  const [match, params] = useRoute("/admin/conversion/funnels/:id");
  const id = params?.id;
  const { data } = useQuery<{ funnel: Funnel } | undefined>({
    queryKey: ["funnel", id],
    enabled: !!id,
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/funnels/${id}`);
      return res.json();
    },
  });

  if (!match || !id) return null;

  const name = data?.funnel?.name ?? "Funnel";
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">{name} Results</h1>
      <p>Analysis view coming soon.</p>
    </div>
  );
}

