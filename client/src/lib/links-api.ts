import { apiRequest, queryClient } from "@/lib/queryClient";

export const LINKS_QK = ["/api/links"]; // single source of truth

export type LinkPayload = {
  platform: string;
  title: string;
  url: string;
  description?: string;
  color?: string;
  featured?: boolean;
  customIcon?: string;
};

export const fetchLinks = async () => {
  // must include credentials (already done in apiRequest)
  return await apiRequest("GET", "/api/links");
};

export const createLink = async (payload: LinkPayload) => {
  return await apiRequest("POST", "/api/links", payload);
};

export const deleteLink = async (id: number) => {
  // DELETE returns 204 or { success: true }
  return await apiRequest("DELETE", `/api/links/${id}`);
};

export function invalidateLinks() {
  return queryClient.invalidateQueries({ queryKey: LINKS_QK, exact: true });
}

export function addLinkOptimistic(newLink: any) {
  queryClient.setQueryData(LINKS_QK, (old: any) => {
    if (!old) return [newLink];
    // ensure newest appears first (optional)
    return [newLink, ...old];
  });
}

export function removeLinkOptimistic(id: number) {
  queryClient.setQueryData(LINKS_QK, (old: any) => {
    if (!old) return old;
    return old.filter((l: any) => l.id !== id);
  });
}
