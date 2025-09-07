// src/components/LoadingSpinner.jsx - Enhanced Loading Component
import React from 'react';
import { Loader2, Trophy, Users, BarChart3, Zap } from 'lucide-react';

const LoadingSpinner = ({ 
  message = "Loading FPL data...", 
  size = "default",
  showStats = false 
}) => {
  const sizeClasses = {
    small: "w-6 h-6",
    default: "w-8 h-8", 
    large: "w-12 h-12"
  };

  const containerClasses = {
    small: "p-4",
    default: "p-8",
    large: "p-12"
  };

  return (
    <div className={`flex flex-col items-center justify-center ${containerClasses[size]}`}>
      {/* Main Loading Spinner */}
      <div className="relative mb-6">
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full border-4 border-purple-200 animate-spin">
          <div className="absolute top-0 right-0 w-3 h-3 bg-purple-600 rounded-full transform -translate-y-1 translate-x-1"></div>
        </div>
        
        {/* Inner spinner */}
        <Loader2 
          className={`${sizeClasses[size]} text-purple-600 animate-spin`}
          style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}
        />
      </div>

      {/* Loading Message */}
      <div className="text-center mb-4">
        <p className="text-gray-700 font-medium mb-2">{message}</p>
        <p className="text-gray-500 text-sm">Fetching latest data from FPL API...</p>
      </div>

      {/* Loading Stats (optional) */}
      {showStats && (
        <div className="w-full max-w-md">
          {/* Progress Indicators */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Trophy className="text-yellow-500" size={16} />
                <span className="text-gray-600">League Data</span>
              </div>
              <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="w-full h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Users className="text-blue-500" size={16} />
                <span className="text-gray-600">Manager Details</span>
              </div>
              <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="w-3/4 h-full bg-gradient-to-r from-blue-400 to-purple-500 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <BarChart3 className="text-green-500" size={16} />
                <span className="text-gray-600">Gameweek History</span>
              </div>
              <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="w-1/2 h-full bg-gradient-to-r from-green-400 to-blue-500 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
              </div>
            </div>
          </div>

          {/* Loading Tips */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-start gap-2">
              <Zap className="text-blue-500 mt-0.5" size={16} />
              <div>
                <p className="text-blue-700 text-sm font-medium mb-1">Loading Tips</p>
                <p className="text-blue-600 text-xs">
                  First load may take longer. Subsequent loads will be faster thanks to caching!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Animated Dots */}
      <div className="flex space-x-1 mt-4">
        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
      </div>
    </div>
  );
};

// Full Page Loading Component
export const FullPageLoading = ({ message = "Loading BRO League 4.0..." }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="text-white" size={24} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">BRO League 4.0</h2>
          <p className="text-gray-600">Fantasy Premier League</p>
        </div>
        
        <LoadingSpinner 
          message={message} 
          size="large" 
          showStats={true}
        />
      </div>
    </div>
  );
};

// Mini Loading Component for small areas
export const MiniLoading = ({ className = "" }) => {
  return (
    <div className={`flex items-center justify-center p-4 ${className}`}>
      <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
    </div>
  );
};

export default LoadingSpinner;