// src/components/ErrorBoundary.jsx - Enhanced Error Boundary with Visual Polish
import { Component } from 'react'
import { AlertTriangle, RefreshCw, Home, Bug, Github } from 'lucide-react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('🚨 React Error Boundary Caught:', error, errorInfo)
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    })

    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      // You could log to Sentry, LogRocket, etc.
      console.log('Would log to external service:', { error, errorInfo })
    }
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }))
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      const isDev = process.env.NODE_ENV === 'development'
      
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(239, 68, 68, 0.1) 1px, transparent 1px)',
              backgroundSize: '60px 60px'
            }}></div>
          </div>

          <div className="relative max-w-2xl mx-auto text-center">
            {/* Error Icon */}
            <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
              <AlertTriangle className="text-white" size={48} />
            </div>

            {/* Error Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Oops! Something went wrong
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              The BRO League 4.0 app encountered an unexpected error. 
              Don't worry, your FPL data is safe!
            </p>

            {/* Error Details (Development Only) */}
            {isDev && this.state.error && (
              <div className="mb-8 p-4 bg-red-100 border border-red-200 rounded-lg text-left max-w-xl mx-auto">
                <div className="flex items-center gap-2 mb-2">
                  <Bug className="text-red-600" size={16} />
                  <span className="font-semibold text-red-800">Development Error Details:</span>
                </div>
                <div className="text-sm text-red-700 font-mono">
                  <div className="mb-2">
                    <strong>Error:</strong> {this.state.error.toString()}
                  </div>
                  {this.state.errorInfo && (
                    <details className="mt-2">
                      <summary className="cursor-pointer">Stack Trace</summary>
                      <pre className="mt-2 text-xs overflow-auto bg-red-50 p-2 rounded">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <button 
                onClick={this.handleRetry}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <RefreshCw size={20} />
                Try Again
              </button>
              
              <button 
                onClick={this.handleReload}
                className="flex items-center gap-2 px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-300 font-semibold shadow-md hover:shadow-lg"
              >
                <RefreshCw size={20} />
                Reload Page
              </button>
              
              <button 
                onClick={this.handleGoHome}
                className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-all duration-300 font-semibold"
              >
                <Home size={20} />
                Go Home
              </button>
            </div>

            {/* Retry Counter */}
            {this.state.retryCount > 0 && (
              <div className="mb-6 p-3 bg-blue-100 border border-blue-200 rounded-lg">
                <span className="text-blue-800 text-sm">
                  Retry attempts: {this.state.retryCount}
                </span>
              </div>
            )}

            {/* Help Text */}
            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-gray-200 shadow-lg">
              <h3 className="font-bold text-gray-900 mb-3">What can you do?</h3>
              <div className="space-y-2 text-sm text-gray-600 text-left">
                <div className="flex items-start gap-2">
                  <span className="text-purple-600">•</span>
                  <span><strong>Try Again:</strong> Attempt to reload the component that crashed</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-purple-600">•</span>
                  <span><strong>Reload Page:</strong> Refresh the entire application</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-purple-600">•</span>
                  <span><strong>Check Connection:</strong> Ensure you have a stable internet connection</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-purple-600">•</span>
                  <span><strong>Contact Support:</strong> If the problem persists, let us know!</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 text-sm text-gray-500">
              <p>BRO League 4.0 • Fantasy Premier League Championship</p>
              <p className="mt-1">Don't worry, your league data is safe and sound! 🏆</p>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Higher-order component for specific error boundaries
export const withErrorBoundary = (Component, errorFallback) => {
  return function WithErrorBoundaryComponent(props) {
    return (
      <ErrorBoundary fallback={errorFallback}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}

// Specific error fallbacks for different components
export const StandingsErrorFallback = () => (
  <div className="bg-white rounded-xl shadow-lg border border-red-200 p-8 text-center">
    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
    <h3 className="text-lg font-semibold text-gray-900 mb-2">Standings Unavailable</h3>
    <p className="text-gray-600 mb-4">There was an error loading the league standings.</p>
    <button 
      onClick={() => window.location.reload()}
      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
    >
      Reload Standings
    </button>
  </div>
)

export const HeroErrorFallback = () => (
  <div className="bg-gradient-to-r from-gray-600 to-gray-700 text-white p-8 text-center">
    <h1 className="text-3xl font-bold mb-2">BRO League 4.0</h1>
    <p className="text-gray-200">Fantasy Premier League Championship</p>
    <p className="text-sm text-gray-300 mt-4">Hero section temporarily unavailable</p>
  </div>
)

export default ErrorBoundary