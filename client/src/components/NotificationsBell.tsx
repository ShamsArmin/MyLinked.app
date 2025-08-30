import React, { useEffect, useRef, useState } from 'react';
import { useNotifications, useNotificationsActions } from '@/hooks/useNotifications';
import { useAuth } from '@/hooks/use-auth';

export default function NotificationsBell() {
  const { user } = useAuth();
  const userId = user?.id;
  const { data, isLoading, isError, refetch } = useNotifications(userId);
  const { removeAll } = useNotificationsActions();
  const items = data ?? [];
  const count = items.length;
  const [open, setOpen] = useState(false);

  const didRefetchOnce = useRef(false);

  useEffect(() => {
    (async () => {
      await removeAll();
    })();
  }, [userId, removeAll]);

  useEffect(() => {
    if (userId && !didRefetchOnce.current) {
      didRefetchOnce.current = true;
      refetch({ cancelRefetch: false });
    }
  }, [userId, refetch]);

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
          <div className="font-semibold mb-2">Notifications</div>
          {isLoading && <div className="text-sm text-gray-500">Loading…</div>}
          {isError && <div className="text-sm text-red-600">Failed to load</div>}
          {!isLoading && !isError && (
            <>
              {count === 0 ? (
                <div className="text-sm text-gray-500">No notifications</div>
              ) : (
                <ul className="space-y-2 max-h-72 overflow-auto">
                  {items.map(item => (
                    <li key={item.id} className="text-sm">
                      <div className="font-medium">{item.title}</div>
                      {item.body && <div className="text-gray-600">{item.body}</div>}
                      <div className="text-xs text-gray-400">{new Date(item.created_at).toLocaleString()}</div>
                      {item.link && (
                        <a href={item.link} className="text-xs text-blue-600 hover:underline">
                          View
                        </a>
                      )}
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
