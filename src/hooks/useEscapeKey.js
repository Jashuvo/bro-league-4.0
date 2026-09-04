import { useEffect } from 'react';

// Closes a modal/sheet on Escape — shared by every full-screen overlay
// (PlayerDetail, TeamView, SeasonArchiveSheet) rather than each
// hand-rolling the same five-line effect. `active` lets a caller skip
// attaching the listener entirely while nothing is actually open, instead
// of mounting-then-immediately-no-oping.
export function useEscapeKey(onClose, active = true) {
  useEffect(() => {
    if (!active || !onClose) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, active]);
}
