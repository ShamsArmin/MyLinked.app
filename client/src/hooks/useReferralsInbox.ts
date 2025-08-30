import { useQuery } from '@tanstack/react-query';

export type ReferralInboxItem = {
  id: number;
  requester_name: string;
  requester_email: string;
  link_title: string;
  created_at: string;
};

type InboxResponse = {
  count: number;
  items: ReferralInboxItem[];
};

export function useReferralsInbox(status: 'pending' | 'approved' | 'rejected' = 'pending') {
  return useQuery<InboxResponse>({
    queryKey: ['referralsInbox', status],
    queryFn: async () => {
      const res = await fetch(`/api/referral-requests/inbox?status=${status}&limit=10`);
      if (!res.ok) throw new Error(`Failed to load inbox: ${res.status}`);
      return res.json();
    },
    // live updates; adjust as desired
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
    staleTime: 5000
  });
}
