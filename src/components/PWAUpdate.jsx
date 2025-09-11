// src/components/PWAUpdate.jsx - Enhanced PWA Update Notification
import { useState, useEffect } from 'react'
import { Download, X, Wifi, WifiOff } from 'lucide-react'

export default function PWAUpdate() {
  const [showUpdateBanner, setShowUpdateBanner] = useState(false)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [deferredPrompt, setDeferredPrompt] = useState(null)

  useEffect(() => {
    // Handle install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallPrompt(true)
    }

    // Handle online/offline status
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
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

  return (
    <>
      {/* Offline Indicator */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-orange-500 text-white px-4 py-2 text-center text-sm font-medium z-50 flex items-center justify-center gap-2">
          <WifiOff size={16} />
          <span>You're offline - Using cached data</span>
        </div>
      )}

      {/* Online Indicator (brief) */}
      {isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-green-500 text-white px-4 py-1 text-center text-sm font-medium z-50 flex items-center justify-center gap-2 transition-all duration-300">
          <Wifi size={16} />
          <span>Back online</span>
        </div>
      )}

      {/* Install App Banner */}
      {showInstallPrompt && (
        <div className="fixed bottom-4 left-4 right-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg shadow-lg p-4 z-40 mx-auto max-w-md">
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
                className="bg-white text-purple-600 px-3 py-1 rounded-md text-xs font-medium hover:bg-gray-100 transition-colors"
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
        <div className="fixed bottom-4 left-4 right-4 bg-blue-600 text-white rounded-lg shadow-lg p-4 z-40 mx-auto max-w-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">Update Available</p>
              <p className="text-xs opacity-90">New features and improvements</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => window.location.reload()}
                className="bg-white text-blue-600 px-3 py-1 rounded-md text-xs font-medium hover:bg-gray-100 transition-colors"
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