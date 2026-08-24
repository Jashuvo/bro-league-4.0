// src/components/PWAUpdate.jsx - PWA install prompt, offline indicator, and
// service-worker update banner.
import { useState, useEffect, useRef } from 'react'
import { registerSW } from 'virtual:pwa-register'
import { Download, X, Wifi, WifiOff, RefreshCw } from 'lucide-react'

// Where a floating banner is allowed to sit.
//
// Both banners used to be `fixed bottom-4 left-4 right-4 ... mx-auto max-w-md`,
// which put them dead centre at the bottom of the viewport: on a phone that is
// exactly where the docked bottom nav lives (AppNav's BottomNav, ~56px plus the
// safe-area inset), and on a desktop it parks a card over the middle of
// whatever table is being read. Now it clears the nav on mobile and tucks into
// the bottom-right corner from `lg` up, where nothing primary lives.
const BANNER_POSITION =
  'fixed z-40 left-4 right-4 bottom-[calc(env(safe-area-inset-bottom)+4.75rem)] mx-auto max-w-md ' +
  'lg:left-auto lg:right-6 lg:bottom-6 lg:mx-0 lg:w-[24rem] lg:max-w-none'

const INSTALL_DISMISSED_KEY = 'pwaInstallDismissed'

export default function PWAUpdate() {
  const [showUpdateBanner, setShowUpdateBanner] = useState(false)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [justReconnected, setJustReconnected] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const updateSWRef = useRef(null)

  useEffect(() => {
    // Registers the service worker vite-plugin-pwa builds, and calls back
    // when a new version is ready — this is what actually makes
    // "Update Available" reachable instead of dead state that's never set.
    updateSWRef.current = registerSW({
      immediate: true,
      onNeedRefresh: () => setShowUpdateBanner(true),
      onRegisterError: (error) => console.error('SW registration failed:', error)
    })
  }, [])

  useEffect(() => {
    // Handle install prompt. A dismissal now sticks — the banner reappearing
    // on every single load is what turned it from an offer into an obstacle.
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      let dismissed = false
      try {
        dismissed = localStorage.getItem(INSTALL_DISMISSED_KEY) === '1'
      } catch {
        dismissed = false
      }
      if (!dismissed) setShowInstallPrompt(true)
    }

    // Handle online/offline status. The "back online" banner should only
    // flash briefly right after reconnecting, not sit there permanently
    // whenever the user is (as almost always) online.
    let reconnectTimer
    const handleOnline = () => {
      setIsOnline(true)
      setJustReconnected(true)
      reconnectTimer = setTimeout(() => setJustReconnected(false), 3000)
    }
    const handleOffline = () => {
      setIsOnline(false)
      setJustReconnected(false)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearTimeout(reconnectTimer)
    }
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice

      if (outcome === 'accepted') {
        console.log('PWA installed')
      }

      setDeferredPrompt(null)
      setShowInstallPrompt(false)
    }
  }

  const handleUpdateClick = () => {
    updateSWRef.current?.(true)
  }

  const handleInstallDismiss = () => {
    setShowInstallPrompt(false)
    try {
      localStorage.setItem(INSTALL_DISMISSED_KEY, '1')
    } catch {
      // Private-mode / storage-disabled: the banner just comes back next
      // load, which is the old behaviour and no worse.
    }
  }

  // Only ever one floating card at a time. An available update is the more
  // urgent of the two, so it wins the slot.
  const installVisible = showInstallPrompt && !showUpdateBanner

  return (
    <>
      {/* Offline Indicator */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-tangerine text-ink border-b-2 border-ink/85 px-4 py-2 text-center text-sm font-bold z-50 flex items-center justify-center gap-2">
          <WifiOff size={16} />
          <span>You&rsquo;re offline - Using cached data</span>
        </div>
      )}

      {/* Online Indicator (brief, only right after reconnecting) */}
      {isOnline && justReconnected && (
        <div className="fixed top-0 left-0 right-0 bg-pitch text-white border-b-2 border-ink/85 px-4 py-1 text-center text-sm font-bold z-50 flex items-center justify-center gap-2 transition-all duration-300">
          <Wifi size={16} />
          <span>Back online</span>
        </div>
      )}

      {/* Install App Banner */}
      {installVisible && (
        <div className={`${BANNER_POSITION} bg-violet text-white rounded-2xl border-2 border-ink/85 p-4`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 shrink-0 bg-white/20 border-2 border-white/40 rounded-xl flex items-center justify-center">
                <Download size={20} />
              </div>
              <div className="min-w-0">
                <p className="font-display font-bold text-sm">Install BRO League 5</p>
                <p className="text-xs opacity-90">Get faster access & offline mode</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleInstallClick}
                className="bg-sunflower text-ink border-2 border-ink/85 px-3 py-1 rounded-lg text-xs font-bold hover:bg-surface-alt transition-colors"
              >
                Install
              </button>
              <button
                onClick={handleInstallDismiss}
                aria-label="Dismiss"
                className="text-white/80 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Available Banner */}
      {showUpdateBanner && (
        <div className={`${BANNER_POSITION} bg-mint text-ink rounded-2xl border-2 border-ink/85 p-4`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 shrink-0 bg-surface-alt border-2 border-ink/85 rounded-xl flex items-center justify-center">
                <RefreshCw size={20} />
              </div>
              <div className="min-w-0">
                <p className="font-display font-bold text-sm">Update Available</p>
                <p className="text-xs opacity-80">New features and improvements</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleUpdateClick}
                className="bg-ink text-surface px-3 py-1 rounded-lg text-xs font-bold hover:bg-violet transition-colors"
              >
                Update
              </button>
              <button
                onClick={() => setShowUpdateBanner(false)}
                aria-label="Dismiss"
                className="text-ink/60 hover:text-ink transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
