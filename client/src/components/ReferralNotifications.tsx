import React, { useState } from 'react';
import { useReferralsInbox } from '../hooks/useReferralsInbox';

export default function ReferralNotifications() {
  const { data, isLoading, isError } = useReferralsInbox('pending');
  const count = data?.count ?? 0;
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        className="relative rounded-full p-2"
        onClick={() => setOpen(prev => !prev)}
      >
        {/* bell icon can be lucide-react if you use it */}
        <span aria-hidden>🔔</span>
        {count > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 px-1 rounded-full text-xs flex items-center justify-center bg-red-500 text-white">
            {count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl shadow-lg bg-white border p-3 z-50">
          <div className="font-semibold mb-2">Referral requests</div>
          {isLoading && <div className="text-sm text-gray-500">Loading…</div>}
          {isError && <div className="text-sm text-red-600">Failed to load</div>}
          {!isLoading && !isError && (
            <>
              {count === 0 ? (
                <div className="text-sm text-gray-500">No pending requests</div>
              ) : (
                <ul className="space-y-2 max-h-72 overflow-auto">
                  {data!.items.map(item => (
                    <li key={item.id} className="text-sm">
                      <div className="font-medium">{item.requester_name}</div>
                      <div className="text-gray-600">{item.requester_email}</div>
                      <div className="text-gray-700">“{item.link_title}”</div>
                      <div className="text-xs text-gray-400">{new Date(item.created_at).toLocaleString()}</div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
