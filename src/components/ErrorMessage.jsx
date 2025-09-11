import React from 'react';
import { AlertTriangle, RefreshCw, Wifi, WifiOff } from 'lucide-react';

const ErrorMessage = ({ 
  message = "Something went wrong", 
  onRetry = null,
  type = "error" // "error", "warning", "network"
}) => {
  const getIcon = () => {
    switch (type) {
      case "network":
        return <WifiOff className="text-red-500" size={24} />;
      case "warning":
        return <AlertTriangle className="text-yellow-500" size={24} />;
      default:
        return <AlertTriangle className="text-red-500" size={24} />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case "network":
        return "bg-red-50 border-red-200";
      case "warning":
        return "bg-yellow-50 border-yellow-200";
      default:
        return "bg-red-50 border-red-200";
    }
  };

  const getTextColor = () => {
    switch (type) {
      case "network":
        return "text-red-800";
      case "warning":
        return "text-yellow-800";
      default:
        return "text-red-800";
    }
  };

  const getButtonColor = () => {
    switch (type) {
      case "network":
        return "bg-red-600 hover:bg-red-700";
      case "warning":
        return "bg-yellow-600 hover:bg-yellow-700";
      default:
        return "bg-red-600 hover:bg-red-700";
    }
  };

  return (
    <div className={`
      ${getBackgroundColor()} rounded-xl border p-6 mb-6
      animate-fade-in-up
    `}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold ${getTextColor()} mb-1`}>
            {type === "network" ? "Connection Problem" : "Error"}
          </h3>
          <p className={`${getTextColor()} opacity-90 text-sm leading-relaxed`}>
            {message}
          </p>
          
          {type === "network" && (
            <p className="text-gray-600 text-xs mt-2">
              Check your internet connection or try again in a few moments.
            </p>
          )}
        </div>
        
        {onRetry && (
          <div className="flex-shrink-0 w-full sm:w-auto">
            <button
              onClick={onRetry}
              className={`
                w-full sm:w-auto flex items-center justify-center gap-2 
                px-4 py-2 rounded-lg text-white font-medium
                ${getButtonColor()}
                transition-all duration-200 
                hover:shadow-lg active:scale-95
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500
              `}
            >
              <RefreshCw size={16} />
              <span>Try Again</span>
            </button>
          </div>
        )}
      </div>
      
      {type === "network" && (
        <div className="mt-4 pt-4 border-t border-red-200">
          <div className="flex items-center gap-2 text-sm text-red-700">
            <Wifi size={14} />
            <span>Network status will update automatically when connection is restored</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ErrorMessage;