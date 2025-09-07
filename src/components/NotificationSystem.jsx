// src/components/NotificationSystem.jsx - Toast Notification System
import { useState, useEffect, createContext, useContext } from 'react'
import { CheckCircle, AlertCircle, XCircle, Info, X, Zap, Trophy, TrendingUp } from 'lucide-react'

// Notification Context
const NotificationContext = createContext()

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider')
  }
  return context
}

// Notification Provider Component
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([])

  const addNotification = (notification) => {
    const id = Date.now() + Math.random()
    const newNotification = {
      id,
      type: 'info',
      duration: 5000,
      ...notification
    }
    
    setNotifications(prev => [...prev, newNotification])
    
    // Auto remove after duration
    if (newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, newNotification.duration)
    }
    
    return id
  }

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id))
  }

  const clearAll = () => {
    setNotifications([])
  }

  // Convenience methods
  const success = (message, options = {}) => addNotification({ ...options, type: 'success', message })
  const error = (message, options = {}) => addNotification({ ...options, type: 'error', message })
  const warning = (message, options = {}) => addNotification({ ...options, type: 'warning', message })
  const info = (message, options = {}) => addNotification({ ...options, type: 'info', message })

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      removeNotification,
      clearAll,
      success,
      error,
      warning,
      info
    }}>
      {children}
      <NotificationContainer notifications={notifications} onRemove={removeNotification} />
    </NotificationContext.Provider>
  )
}

// Individual Notification Component
const NotificationItem = ({ notification, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    // Entrance animation
    setTimeout(() => setIsVisible(true), 10)
  }, [])

  const handleRemove = () => {
    setIsLeaving(true)
    setTimeout(() => onRemove(notification.id), 300)
  }

  const getTypeConfig = () => {
    switch (notification.type) {
      case 'success':
        return {
          icon: CheckCircle,
          bgColor: 'bg-green-50 border-green-200',
          iconColor: 'text-green-500',
          textColor: 'text-green-800'
        }
      case 'error':
        return {
          icon: XCircle,
          bgColor: 'bg-red-50 border-red-200',
          iconColor: 'text-red-500',
          textColor: 'text-red-800'
        }
      case 'warning':
        return {
          icon: AlertCircle,
          bgColor: 'bg-yellow-50 border-yellow-200',
          iconColor: 'text-yellow-500',
          textColor: 'text-yellow-800'
        }
      case 'fpl-update':
        return {
          icon: Trophy,
          bgColor: 'bg-purple-50 border-purple-200',
          iconColor: 'text-purple-500',
          textColor: 'text-purple-800'
        }
      case 'performance':
        return {
          icon: Zap,
          bgColor: 'bg-blue-50 border-blue-200',
          iconColor: 'text-blue-500',
          textColor: 'text-blue-800'
        }
      default:
        return {
          icon: Info,
          bgColor: 'bg-blue-50 border-blue-200',
          iconColor: 'text-blue-500',
          textColor: 'text-blue-800'
        }
    }
  }

  const config = getTypeConfig()
  const IconComponent = config.icon

  return (
    <div className={`
      transform transition-all duration-300 ease-out
      ${isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
    `}>
      <div className={`
        flex items-start gap-3 p-4 rounded-lg border shadow-lg backdrop-blur-sm
        ${config.bgColor} ${config.textColor}
        max-w-md
      `}>
        <IconComponent className={config.iconColor} size={20} />
        
        <div className="flex-1 min-w-0">
          {notification.title && (
            <div className="font-semibold mb-1">{notification.title}</div>
          )}
          <div className={notification.title ? 'text-sm' : ''}>{notification.message}</div>
          
          {notification.action && (
            <button 
              onClick={notification.action.onClick}
              className="mt-2 text-sm font-medium underline hover:no-underline"
            >
              {notification.action.label}
            </button>
          )}
        </div>
        
        <button 
          onClick={handleRemove}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}

// Notification Container
const NotificationContainer = ({ notifications, onRemove }) => {
  if (notifications.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-h-screen overflow-hidden">
      {notifications.map((notification) => (
        <NotificationItem 
          key={notification.id} 
          notification={notification} 
          onRemove={onRemove}
        />
      ))}
    </div>
  )
}

// FPL-specific notification helpers
export const useFPLNotifications = () => {
  const { success, error, warning, info, addNotification } = useNotifications()

  const dataRefreshed = (loadTime) => {
    success(`Data refreshed successfully`, {
      title: 'FPL Update',
      type: 'fpl-update',
      duration: 3000
    })
  }

  const fastLoad = (loadTime) => {
    if (loadTime < 1000) {
      info(`Lightning fast load: ${loadTime}ms`, {
        type: 'performance',
        duration: 2000
      })
    }
  }

  const apiConnected = () => {
    success('Connected to FPL API', {
      title: 'Connection Restored',
      type: 'fpl-update',
      duration: 3000
    })
  }

  const apiDisconnected = () => {
    warning('Using cached data - API temporarily unavailable', {
      title: 'Connection Issue',
      duration: 5000
    })
  }

  const newWeeklyWinner = (managerName, points) => {
    addNotification({
      type: 'fpl-update',
      title: '🏆 New Weekly Winner!',
      message: `${managerName} wins with ${points} points`,
      duration: 7000
    })
  }

  const achievementUnlocked = (managerName, achievement) => {
    addNotification({
      type: 'success',
      title: '🏅 Achievement Unlocked!',
      message: `${managerName} earned: ${achievement}`,
      duration: 6000
    })
  }

  const deadlineReminder = (timeRemaining) => {
    warning(`Deadline in ${timeRemaining}`, {
      title: '⏰ Transfer Deadline Approaching',
      duration: 8000
    })
  }

  return {
    dataRefreshed,
    fastLoad,
    apiConnected,
    apiDisconnected,
    newWeeklyWinner,
    achievementUnlocked,
    deadlineReminder,
    success,
    error,
    warning,
    info
  }
}

export default NotificationProvider