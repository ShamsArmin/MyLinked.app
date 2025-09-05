// client/src/lib/queryClient.ts
import { QueryClient, QueryFunctionContext } from "@tanstack/react-query";

export async function apiRequest(method: string, url: string, data?: any) {
  const res = await fetch(url, {
    method,
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: data !== undefined ? JSON.stringify(data) : undefined,
  });
  const text = await res.text().catch(() => "");
  if (!res.ok) {
    try {
      throw new Error(JSON.parse(text)?.message || text || `HTTP ${res.status}`);
    } catch {
      throw new Error(text || `HTTP ${res.status}`);
    }
  }
  return text ? JSON.parse(text) : null;
}

// Default query function that uses the first element of the query key as the URL
// and performs a GET request using the apiRequest helper above. This allows
// components to specify only a `queryKey` when calling `useQuery`.
async function defaultQueryFn({ queryKey }: QueryFunctionContext<[string, ...unknown[]]>) {
  const [url] = queryKey;
  return apiRequest("GET", url);
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: defaultQueryFn,
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: { retry: false },
  },
});
