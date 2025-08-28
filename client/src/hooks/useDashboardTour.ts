import { useEffect, useState, useCallback } from 'react';

const LS_KEY = 'ml_hasSeenDashboardTour_v1';

export function useDashboardTour(profile?: { hasSeenDashboardTour?: boolean }) {
  const [shouldStart, setShouldStart] = useState(false);

  useEffect(() => {
    const seenLS =
      typeof window !== 'undefined' && localStorage.getItem(LS_KEY) === '1';
    const seenServer = !!profile?.hasSeenDashboardTour;
    setShouldStart(!(seenLS || seenServer));
  }, [profile]);

  const completeTour = useCallback(async () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(LS_KEY, '1');
      }
      await fetch('/api/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hasSeenDashboardTour: true }),
      });
    } catch {
      // ignore
    } finally {
      setShouldStart(false);
    }
  }, []);

  const startTour = useCallback(() => setShouldStart(true), []);

  return { shouldStart, startTour, completeTour };
}
