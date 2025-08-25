// client/src/lib/queryClient.ts
import { QueryClient, QueryFunctionContext } from "@tanstack/react-query";

export async function apiRequest(method: string, url: string, data?: any) {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    credentials: "include", // ✅ send session cookie
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Request failed: ${res.status} ${res.statusText} ${text}`);
  }

  if (method === "DELETE" || res.status === 204) return null;

  const text = await res.text();
  if (!text) return null;
  return JSON.parse(text);
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
