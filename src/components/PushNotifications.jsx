import React, { useState, useEffect, useCallback } from 'react';
import { Bell, BellRing, BellOff } from 'lucide-react';

// Matchday push notifications — the enable/disable card shown in More.
// Backend: api/push.js stores subscriptions; api/warm-cache.js's daily cron
// sends deadline reminders and settled-gameweek results; the service
// worker's push handler (public/push-listener.js, injected via vite
// config's workbox importScripts) displays them.
//
// State machine:
//   'checking'    — mount-time capability + key check
//   'unavailable' — browser/SW can't do push, or VAPID keys not configured
//                    server-side (the whole card hides in that case)
//   'off'         — capable, user hasn't subscribed (permission may still
//                    be 'default' or 'denied'; the button handles both)
//   'on'          — subscribed in this browser AND registered server-side
const STORAGE_KEY = 'bro_push_subscribed';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
}

async function pushCapabilities() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    return null;
  }
  // The service worker IS the push receiver — until it's active, there's
  // nothing to subscribe through (and iOS only exposes push once the PWA
  // is installed to the home screen, which surfaces as no pushManager).
  const registration = await navigator.serviceWorker.getRegistration();
  return registration || null;
}

const PushNotifications = () => {
  const [status, setStatus] = useState('checking');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  // Mount: figure out what this browser can do and whether it's already
  // subscribed. A subscription that exists in the browser but was never
  // registered server-side (e.g. a previous POST failed) is re-registered
  // rather than ignored.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const registration = await pushCapabilities();
      if (cancelled) return;
      if (!registration) return setStatus('unavailable');

      const publicKey = await window.fplApi.getPushPublicKey();
      if (cancelled) return;
      if (!publicKey) return setStatus('unavailable');

      const existing = await registration.pushManager.getSubscription();
      if (cancelled) return;

      if (existing && !localStorage.getItem(STORAGE_KEY)) {
        // Server-side sync only; the UI decision stays local.
        window.fplApi.subscribeToPush(existing);
      }
      setStatus(existing && localStorage.getItem(STORAGE_KEY) ? 'on' : 'off');
    })().catch(() => { if (!cancelled) setStatus('unavailable'); });
    return () => { cancelled = true; };
  }, []);

  const enable = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'denied') {
        setError('Notifications are blocked for this site — enable them in your browser settings.');
        return;
      }

      const publicKey = await window.fplApi.getPushPublicKey();
      if (!publicKey) {
        setError("The league's notification keys aren't set up yet.");
        return;
      }

      const registration = (await pushCapabilities()) || (await navigator.serviceWorker.ready);
      const existing = await registration.pushManager.getSubscription();
      const subscription = existing || await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const ok = await window.fplApi.subscribeToPush(subscription);
      if (!ok) {
        setError("Couldn't reach the server — try again in a moment.");
        return;
      }
      localStorage.setItem(STORAGE_KEY, '1');
      setStatus('on');
    } catch (err) {
      // Subscribe rejects when the browser-level prompt is dismissed, too.
      setError(err?.name === 'NotAllowedError' ? 'Notification permission was not granted.' : 'Something went wrong — try again.');
    } finally {
      setBusy(false);
    }
  }, []);

  const disable = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const registration = await pushCapabilities();
      const subscription = registration ? await registration.pushManager.getSubscription() : null;
      if (subscription) {
        await window.fplApi.unsubscribeFromPush(subscription.endpoint);
        await subscription.unsubscribe();
      }
      localStorage.removeItem(STORAGE_KEY);
      setStatus('off');
    } catch {
      setError("Couldn't unsubscribe cleanly — you may still get one more notification.");
    } finally {
      setBusy(false);
    }
  }, []);

  if (status === 'checking' || status === 'unavailable') return null;

  const isOn = status === 'on';

  return (
    <div className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-surface-sunk border-2 border-ink/15">
      <div className="flex items-center gap-3 min-w-0">
        <span className={`w-10 h-10 shrink-0 rounded-xl border-2 border-ink/85 flex items-center justify-center ${isOn ? 'bg-mint' : 'bg-surface-alt'}`}>
          {isOn ? <BellRing size={18} className="text-ink" /> : <Bell size={18} className="text-ink" />}
        </span>
        <div className="min-w-0">
          <p className="font-bold text-ink text-sm">Matchday alerts</p>
          <p className="text-[11px] font-semibold text-ink-soft">
            {isOn ? 'Deadline reminders & weekly results' : 'Get pinged when results are in'}
          </p>
          {error && <p className="text-[11px] font-semibold text-coral-ink mt-0.5">{error}</p>}
        </div>
      </div>
      <button
        type="button"
        onClick={isOn ? disable : enable}
        disabled={busy}
        className="shrink-0 px-3 py-1.5 rounded-xl border-2 border-ink/85 font-bold text-xs uppercase tracking-wider bg-surface-alt disabled:opacity-50 flex items-center gap-1.5"
      >
        {busy ? '…' : isOn ? <><BellOff size={14} /> Off</> : 'Turn on'}
      </button>
    </div>
  );
};

export default PushNotifications;
