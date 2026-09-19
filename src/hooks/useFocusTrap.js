import { useCallback, useEffect, useRef, useState } from 'react';
import { useEscapeKey } from './useEscapeKey';

// A LIFO registry of the overlays currently on screen. Two overlays can be
// stacked (a player's detail opened from inside a team sheet), and only the
// TOP one should react to Tab — without this, the trap behind the top sheet
// would drag focus straight back out of it. Escape already has the same
// problem solved a different way (TeamView disables its own listener while
// its child is open); this keeps the trap honest for any depth.
const trapStack = [];
const isTopTrap = (token) => trapStack[trapStack.length - 1] === token;

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * Makes a modal/sheet behave like one to a keyboard: focus moves into it
 * when it opens, Tab and Shift+Tab cycle within it instead of escaping to
 * the page behind, the page underneath can't scroll, and focus is handed
 * back to whatever opened it when it closes.
 *
 * Returns a ref to attach to the sheet's own panel element (the box focus
 * is trapped inside — not the full-screen backdrop wrapper, which would
 * make every element in the app "inside" the trap).
 *
 * `escapeActive` is split out from `active` for the stacked case: TeamView
 * keeps its trap ACTIVE while a child PlayerDetail sheet sits on top (the
 * LIFO stack already stops the lower trap from stealing Tab, so there's
 * nothing to switch off), but its Escape must NOT be — otherwise one
 * keystroke would close both sheets at once. Defaulting it to `active`
 * keeps the single-sheet callers a one-argument affair.
 */
export function useFocusTrap(onClose, active = true, escapeActive = active) {
  // A callback ref backed by state, not a plain useRef: TeamView mounts in
  // a "Scouting team..." loading state and only swaps its real panel in
  // once picks resolve, so the element arrives long after the first render.
  // With a plain ref the effect (which can only re-run on a dependency
  // change) would have looked once, found null, and never engaged again —
  // the trap would silently never turn on. Setting state on attach makes
  // the node itself the dependency.
  const [node, setNode] = useState(null);
  const ref = useCallback((element) => setNode(element), []);
  // Captured during render rather than inside the effect: a sheet with its
  // own autoFocus (PinPrompt's PIN field) has already moved focus into
  // itself by the time any effect runs, so by then the "what opened me"
  // element is unrecoverable. Reading document.activeElement during render
  // is harmless and idempotent, and StrictMode's double render just reads
  // the same value twice.
  const openerRef = useRef(null);
  if (openerRef.current === null && typeof document !== 'undefined') {
    openerRef.current = document.activeElement;
  }
  // Escape is handled by the shared hook so there's one place that knows
  // which layer owns the key.
  useEscapeKey(onClose, escapeActive);

  useEffect(() => {
    if (!active || !node) return undefined;

    const token = {};
    trapStack.push(token);

    const previouslyFocused = openerRef.current;

    const focusable = () =>
      Array.from(node.querySelectorAll(FOCUSABLE)).filter(
        (el) => el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement
      );

    // Move focus inside — but only if it isn't already there. A sheet whose
    // own field carries autoFocus (PinPrompt) is the case that matters: it
    // has legitimately chosen where focus should start, and yanking it to
    // the header's close button would be a downgrade. A sheet with nothing
    // focusable (e.g. a loading state) still gets focus on the panel itself
    // so the reader doesn't stay lost on the page behind it.
    if (!node.contains(document.activeElement)) {
      const first = focusable()[0];
      if (first) {
        first.focus();
      } else {
        node.setAttribute('tabindex', '-1');
        node.focus();
      }
    }

    const handleKeyDown = (event) => {
      if (event.key !== 'Tab' || !isTopTrap(token)) return;
      const items = focusable();
      if (items.length === 0) {
        event.preventDefault();
        return;
      }
      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      const current = document.activeElement;
      const outside = !node.contains(current);

      if (event.shiftKey && (current === firstItem || outside)) {
        event.preventDefault();
        lastItem.focus();
      } else if (!event.shiftKey && (current === lastItem || outside)) {
        event.preventDefault();
        firstItem.focus();
      }
    };

    // Capture phase: the sheet's own inputs may swallow Tab otherwise.
    document.addEventListener('keydown', handleKeyDown, true);

    // Lock the page behind the sheet so a scroll gesture or arrow key
    // doesn't move the list underneath it.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.body.style.overflow = previousOverflow;
      const index = trapStack.lastIndexOf(token);
      if (index !== -1) trapStack.splice(index, 1);
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') previouslyFocused.focus();
    };
  }, [active, node]);

  return ref;
}
