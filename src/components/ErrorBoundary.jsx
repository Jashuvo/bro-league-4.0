// src/components/ErrorBoundary.jsx - Error Handling Component
import React from 'react';
import { AlertTriangle, RefreshCw, Home, Bug, ExternalLink } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error('Error Boundary caught an error:', error);
      console.error('Error Info:', errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: this.state.retryCount + 1 
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full">
            {/* Error Icon */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="text-white" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops! Something went wrong</h2>
              <p className="text-gray-600">
                We encountered an unexpected error while loading BRO League 4.0
              </p>
            </div>

            {/* Error Details */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <Bug className="text-red-500 mt-1" size={20} />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-800 mb-2">Error Details</h3>
                  <p className="text-red-700 text-sm mb-2">
                    {this.state.error && this.state.error.toString()}
                  </p>
                  
                  {/* Show stack trace in development */}
                  {import.meta.env.DEV && this.state.errorInfo && (
                    <details className="mt-3">
                      <summary className="text-red-600 text-sm cursor-pointer hover:text-red-800">
                        View technical details
                      </summary>
                      <pre className="text-xs text-red-600 mt-2 overflow-auto bg-red-100 p-2 rounded">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>

            {/* Troubleshooting Steps */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-800 mb-3">Troubleshooting Steps</h3>
              <div className="space-y-2 text-sm text-blue-700">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Check your internet connection</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>The FPL API might be temporarily unavailable</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Try refreshing the page or waiting a few minutes</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Clear your browser cache if the problem persists</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={this.handleRetry}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw size={18} />
                Try Again {this.state.retryCount > 0 && `(${this.state.retryCount + 1})`}
              </button>
              
              <button
                onClick={this.handleReload}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Home size={18} />
                Reload Page
              </button>
            </div>

            {/* Support Info */}
            <div className="mt-6 pt-6 border-t border-gray-200 text-center">
              <p className="text-gray-600 text-sm mb-3">
                If this problem continues, you can:
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center text-sm">
                <a 
                  href="https://status.premierleague.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1"
                >
                  <ExternalLink size={14} />
                  Check FPL Status
                </a>
                <a 
                  href="https://vercel.com/status" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1"
                >
                  <ExternalLink size={14} />
                  Check Vercel Status
                </a>
              </div>
            </div>

            {/* Debug Info */}
            {import.meta.env.DEV && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <details className="text-xs text-gray-500">
                  <summary className="cursor-pointer hover:text-gray-700">Debug Information</summary>
                  <div className="mt-2 bg-gray-100 p-2 rounded">
                    <p>Retry Count: {this.state.retryCount}</p>
                    <p>Timestamp: {new Date().toISOString()}</p>
                    <p>User Agent: {navigator.userAgent}</p>
                    <p>URL: {window.location.href}</p>
                  </div>
                </details>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Simple Error Component for API errors
export const ApiError = ({ 
  error, 
  onRetry, 
  showDetails = false 
}) => {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
      <AlertTriangle className="mx-auto text-red-500 mb-4" size={32} />
      <h3 className="text-lg font-semibold text-red-800 mb-2">Failed to load data</h3>
      <p className="text-red-700 mb-4">
        We couldn't fetch the latest FPL data. This might be temporary.
      </p>
      
      {showDetails && error && (
        <div className="bg-red-100 rounded p-3 mb-4 text-left">
          <p className="text-red-800 text-sm font-medium">Error Details:</p>
          <p className="text-red-700 text-sm">{error.message || error.toString()}</p>
        </div>
      )}
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 mx-auto"
        >
          <RefreshCw size={16} />
          Try Again
        </button>
      )}
    </div>
  );
};

// Network Error Component
export const NetworkError = ({ onRetry }) => {
  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 text-center">
      <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
        <ExternalLink className="text-white" size={20} />
      </div>
      <h3 className="text-lg font-semibold text-orange-800 mb-2">Connection Problem</h3>
      <p className="text-orange-700 mb-4">
        Unable to connect to the FPL API. Please check your internet connection.
      </p>
      
      <div className="bg-orange-100 rounded p-3 mb-4">
        <p className="text-orange-800 text-sm">
          💡 <strong>Tip:</strong> The FPL API is sometimes slow during busy periods (like deadline day)
        </p>
      </div>
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 mx-auto"
        >
          <RefreshCw size={16} />
          Retry Connection
        </button>
      )}
    </div>
  );
};

export default ErrorBoundary;