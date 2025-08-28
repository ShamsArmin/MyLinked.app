import { useState, useEffect } from 'react';
import { useAuth } from './use-auth';

export function useTour() {
  const { user } = useAuth();
  const [showTour, setShowTour] = useState(false);
  const [tourCompleted, setTourCompleted] = useState(false);

  useEffect(() => {
    if (!user) return;

    const tourKey = `tour_completed_${user.id}`;
    const hasCompletedTour = localStorage.getItem(tourKey) === 'true';

    if (hasCompletedTour) {
      // Persist completion state across sessions
      if (!tourCompleted) {
        setTourCompleted(true);
      }
      return;
    }

    if (!tourCompleted) {
      // Show tour after a brief delay to let the page load
      const timer = setTimeout(() => {
        setShowTour(true);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [user, tourCompleted]);

  const completeTour = () => {
    if (user) {
      const tourKey = `tour_completed_${user.id}`;
      localStorage.setItem(tourKey, 'true');
      setTourCompleted(true);
      setShowTour(false);
    }
  };

  const skipTour = () => {
    completeTour(); // Same action as completing
  };

  const restartTour = () => {
    if (user) {
      const tourKey = `tour_completed_${user.id}`;
      localStorage.removeItem(tourKey);
      setTourCompleted(false);
      setShowTour(true);
    }
  };

  return {
    showTour,
    completeTour,
    skipTour,
    restartTour,
    tourCompleted
  };
}