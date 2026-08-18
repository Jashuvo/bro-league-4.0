// src/components/PWAUpdate.jsx - PWA install prompt, offline indicator, and
// service-worker update banner.
import { useState, useEffect, useRef } from 'react'
import { registerSW } from 'virtual:pwa-register'
import { Download, X, Wifi, WifiOff, RefreshCw } from 'lucide-react'

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
    // Handle install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallPrompt(true)
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

  return (
    <>
      {/* Offline Indicator */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-orange-500 text-white px-4 py-2 text-center text-sm font-medium z-50 flex items-center justify-center gap-2">
          <WifiOff size={16} />
          <span>You&rsquo;re offline - Using cached data</span>
        </div>
      )}

      {/* Online Indicator (brief, only right after reconnecting) */}
      {isOnline && justReconnected && (
        <div className="fixed top-0 left-0 right-0 bg-green-500 text-white px-4 py-1 text-center text-sm font-medium z-50 flex items-center justify-center gap-2 transition-all duration-300">
          <Wifi size={16} />
          <span>Back online</span>
        </div>
      )}

      {/* Install App Banner */}
      {showInstallPrompt && (
        <div className="fixed bottom-4 left-4 right-4 bg-gradient-to-r from-bro-primary to-bro-secondary text-white rounded-lg shadow-lg p-4 z-40 mx-auto max-w-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Download size={20} />
              </div>
              <div>
                <p className="font-semibold text-sm">Install BRO League 4.0</p>
                <p className="text-xs opacity-90">Get faster access & offline mode</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleInstallClick}
                className="bg-white text-bro-primary px-3 py-1 rounded-md text-xs font-medium hover:bg-gray-100 transition-colors"
              >
                Install
              </button>
              <button
                onClick={() => setShowInstallPrompt(false)}
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
        <div className="fixed bottom-4 left-4 right-4 bg-bro-primary text-white rounded-lg shadow-lg p-4 z-40 mx-auto max-w-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <RefreshCw size={20} />
              </div>
              <div>
                <p className="font-semibold text-sm">Update Available</p>
                <p className="text-xs opacity-90">New features and improvements</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleUpdateClick}
                className="bg-white text-bro-primary px-3 py-1 rounded-md text-xs font-medium hover:bg-gray-100 transition-colors"
              >
                Update
              </button>
              <button
                onClick={() => setShowUpdateBanner(false)}
                className="text-white/80 hover:text-white transition-colors"
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
