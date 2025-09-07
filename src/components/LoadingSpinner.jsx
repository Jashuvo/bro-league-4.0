// src/components/LoadingSpinner.jsx - Enhanced Loading Component with Animations
import { Trophy, Zap, Target } from 'lucide-react'

const LoadingSpinner = ({ 
  message = "Loading FPL data...", 
  submessage = "Getting the latest standings and stats",
  size = "default",
  fullScreen = false 
}) => {
  const sizeClasses = {
    small: "w-8 h-8",
    default: "w-16 h-16", 
    large: "w-24 h-24"
  }

  const containerClasses = fullScreen 
    ? "fixed inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center z-50"
    : "flex items-center justify-center p-8"

  const LoadingAnimation = () => (
    <div className="relative">
      {/* Main spinning circle */}
      <div className={`${sizeClasses[size]} relative`}>
        <div className="absolute inset-0 rounded-full border-4 border-purple-200"></div>
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-600 border-r-purple-600 animate-spin"></div>
      </div>
      
      {/* Center icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <Trophy className="text-purple-600" size={size === "small" ? 16 : size === "large" ? 32 : 24} />
      </div>
      
      {/* Floating elements */}
      <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full animate-pulse"></div>
      <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-blue-400 rounded-full animate-pulse delay-300"></div>
      <div className="absolute top-0 -left-3 w-2 h-2 bg-green-400 rounded-full animate-pulse delay-700"></div>
    </div>
  )

  if (fullScreen) {
    return (
      <div className={containerClasses}>
        <div className="text-center">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '60px 60px'
            }}></div>
          </div>
          
          {/* Content */}
          <div className="relative">
            <LoadingAnimation />
            
            <div className="mt-8 text-white">
              <h2 className="text-2xl font-bold mb-2">{message}</h2>
              <p className="text-blue-200">{submessage}</p>
            </div>
            
            {/* Progress indicators */}
            <div className="flex justify-center gap-2 mt-6">
              <div className="w-2 h-2 bg-white/40 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-white/40 rounded-full animate-pulse delay-200"></div>
              <div className="w-2 h-2 bg-white/40 rounded-full animate-pulse delay-500"></div>
            </div>
            
            {/* Fun loading messages */}
            <div className="mt-6 text-purple-200 text-sm">
              <div className="animate-pulse">
                ⚽ Fetching the latest gameweek data...
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={containerClasses}>
      <div className="text-center">
        <LoadingAnimation />
        
        <div className="mt-4">
          <div className="font-semibold text-gray-900">{message}</div>
          <div className="text-sm text-gray-600 mt-1">{submessage}</div>
        </div>
      </div>
    </div>
  )
}

// Skeleton loader for tables
export const SkeletonLoader = ({ rows = 5, columns = 4 }) => {
  return (
    <div className="space-y-4">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex gap-4 p-4 bg-gray-50 rounded-lg animate-pulse">
          {[...Array(columns)].map((_, j) => (
            <div 
              key={j} 
              className={`bg-gray-200 rounded ${j === 0 ? 'w-12 h-12' : 'h-4 flex-1'}`}
            ></div>
          ))}
        </div>
      ))}
    </div>
  )
}

// Mini loading spinner for buttons
export const ButtonSpinner = ({ size = 16 }) => (
  <div className="inline-flex items-center gap-2">
    <div 
      className="border-2 border-current border-t-transparent rounded-full animate-spin"
      style={{ width: size, height: size }}
    ></div>
  </div>
)

// Loading overlay for sections
export const LoadingOverlay = ({ children, loading, message = "Loading..." }) => {
  return (
    <div className="relative">
      {children}
      {loading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-lg">
          <div className="text-center">
            <LoadingSpinner size="small" message={message} />
          </div>
        </div>
      )}
    </div>
  )
}

export default LoadingSpinner