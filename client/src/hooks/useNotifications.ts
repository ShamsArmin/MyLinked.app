import { useQuery } from '@tanstack/react-query';

export type NotificationItem = {
  id: string;
  type: 'referral_request' | string;
  title: string;
  body?: string;
  created_at: string;
  link?: string;
};

export function useNotifications() {
  return useQuery<NotificationItem[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await fetch('/api/notifications', { cache: 'no-store' });
      if (!res.ok) throw new Error(`Failed to load notifications: ${res.status}`);
      return res.json();
    },
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
    staleTime: 5000,
  });
}

export default useNotifications;
