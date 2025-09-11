import React from 'react';
import { Trophy, Zap, Target } from 'lucide-react';

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
  };

  const containerClasses = fullScreen 
    ? "fixed inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center z-50"
    : "flex items-center justify-center p-8";

  const LoadingAnimation = () => (
    <div className="relative">
      <div className={`${sizeClasses[size]} relative`}>
        <div className="absolute inset-0 rounded-full border-4 border-purple-200"></div>
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-600 border-r-purple-600 animate-spin"></div>
      </div>
      
      <div className="absolute inset-0 flex items-center justify-center">
        <Trophy className="text-purple-600 animate-pulse" size={size === "small" ? 16 : size === "large" ? 32 : 24} />
      </div>
    </div>
  );

  const FloatingIcons = () => (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-1/4 left-1/4 animate-float">
        <div className="w-8 h-8 bg-yellow-400/20 rounded-full flex items-center justify-center">
          <Zap className="text-yellow-400" size={16} />
        </div>
      </div>
      <div className="absolute top-1/3 right-1/4 animate-float" style={{ animationDelay: '1s' }}>
        <div className="w-6 h-6 bg-blue-400/20 rounded-full flex items-center justify-center">
          <Target className="text-blue-400" size={12} />
        </div>
      </div>
      <div className="absolute bottom-1/3 left-1/3 animate-float" style={{ animationDelay: '2s' }}>
        <div className="w-7 h-7 bg-green-400/20 rounded-full flex items-center justify-center">
          <Trophy className="text-green-400" size={14} />
        </div>
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className={containerClasses}>
        <FloatingIcons />
        
        <div className="absolute inset-0 bg-black/20"></div>
        
        <div className="relative z-10 text-center">
          <div className="mb-8">
            <LoadingAnimation />
          </div>
          
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-white">{message}</h2>
            <p className="text-blue-200 max-w-md mx-auto">{submessage}</p>
            
            <div className="flex justify-center space-x-2 mt-6">
              <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      <div className="text-center">
        <LoadingAnimation />
        {message && (
          <div className="mt-4 space-y-2">
            <p className="text-gray-700 font-medium">{message}</p>
            {submessage && (
              <p className="text-gray-500 text-sm">{submessage}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingSpinner;