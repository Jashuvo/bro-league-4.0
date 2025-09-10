// src/components/ErrorMessage.jsx - Error Message Component
import React from 'react';
import { AlertCircle, RefreshCw, WifiOff, Clock } from 'lucide-react';

const ErrorMessage = ({ message, onRetry, details }) => {
  const getErrorIcon = () => {
    if (message?.toLowerCase().includes('timeout')) return <Clock className="w-6 h-6" />;
    if (message?.toLowerCase().includes('network')) return <WifiOff className="w-6 h-6" />;
    return <AlertCircle className="w-6 h-6" />;
  };
  
  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 shadow-lg">
        <div className="flex items-start gap-4">
          <div className="text-red-600 flex-shrink-0">
            {getErrorIcon()}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-900 mb-2">
              Failed to Load League Data
            </h3>
            <p className="text-red-700 mb-3">
              {message || 'An unexpected error occurred while fetching data.'}
            </p>
            {details && (
              <p className="text-sm text-red-600 mb-4">
                {details}
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={onRetry}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Helpful Tips */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h4 className="font-semibold text-yellow-900 mb-2">Troubleshooting Tips:</h4>
        <ul className="text-sm text-yellow-800 space-y-1">
          <li>• Check your internet connection</li>
          <li>• FPL API might be temporarily unavailable</li>
          <li>• Try again in a few moments</li>
          <li>• Clear your browser cache if the problem persists</li>
        </ul>
      </div>
    </div>
  );
};

export default ErrorMessage;