// src/components/ErrorMessage.jsx - Updated with Theme Support
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
        return <WifiOff className="text-error" size={24} />;
      case "warning":
        return <AlertTriangle className="text-warning" size={24} />;
      default:
        return <AlertTriangle className="text-error" size={24} />;
    }
  };

  const getContainerStyles = () => {
    switch (type) {
      case "network":
        return "bg-error/10 border-error/20";
      case "warning":
        return "bg-warning/10 border-warning/20";
      default:
        return "bg-error/10 border-error/20";
    }
  };

  const getTextColor = () => {
    switch (type) {
      case "network":
        return "text-error";
      case "warning":
        return "text-warning";
      default:
        return "text-error";
    }
  };

  const getButtonColor = () => {
    switch (type) {
      case "network":
        return "btn-error";
      case "warning":
        return "btn-warning";
      default:
        return "btn-error";
    }
  };

  return (
    <div className={`
      ${getContainerStyles()} rounded-xl border p-6 mb-6
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
            <p className="text-base-content/60 text-xs mt-2">
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
                px-4 py-2 rounded-lg text-white font-medium btn btn-sm
                ${getButtonColor()}
                transition-all duration-200 
                hover:shadow-lg active:scale-95
              `}
            >
              <RefreshCw size={16} />
              <span>Try Again</span>
            </button>
          </div>
        )}
      </div>

      {type === "network" && (
        <div className="mt-4 pt-4 border-t border-error/10">
          <div className="flex items-center gap-2 text-sm text-error">
            <Wifi size={14} />
            <span>Network status will update automatically when connection is restored</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ErrorMessage;