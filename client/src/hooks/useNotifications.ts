import { useQuery, useQueryClient } from '@tanstack/react-query';

export type NotificationItem = {
  id: string;
  type: 'referral_request' | string;
  title: string;
  body?: string;
  created_at: string;
  link?: string;
};

export function useNotifications(userId?: string) {
  const enabled = Boolean(userId);

  return useQuery<NotificationItem[]>({
    queryKey: ['notifications', userId],
    queryFn: async () => {
      const res = await fetch('/api/notifications', {
        cache: 'no-store',
        credentials: 'include',
        headers: { 'Cache-Control': 'no-store' }
      });
      if (!res.ok) throw new Error(`Failed to load notifications: ${res.status}`);
      return res.json();
    },
    enabled,
    refetchOnMount: 'always',
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
    retry: 1,
  });
}

export function useNotificationsActions() {
  const qc = useQueryClient();
  return {
    invalidate: async (userId?: string) =>
      qc.invalidateQueries({ queryKey: ['notifications', userId] }),
  };
}
