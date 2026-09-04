// src/components/ErrorBoundary.jsx - Error Boundary Component
import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render shows the fallback UI — capturing
    // `error` here (not just in componentDidCatch below) means the first
    // fallback render already has details, instead of needing a second
    // render once componentDidCatch's setState lands.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console in development
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Update state with error details
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    // The root boundary (main.jsx) reloads the whole page — reasonable
    // when literally anything could have crashed. A `compact` boundary
    // wraps one destination (see App.jsx's per-tab boundaries below); its
    // "Try again" should only re-render that one subtree, not blow away
    // the rest of the app (and its in-memory data) over one bad tab.
    if (!this.props.compact) {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.compact) {
        return (
          <div className="rounded-3xl border-2 border-ink/85 bg-surface-alt p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-coral/15 border-2 border-ink/85 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-coral-ink" />
            </div>
            <p className="font-display font-bold text-ink mb-1">This section hit a snag</p>
            <p className="text-sm text-ink-soft font-medium mb-4">
              The rest of the app is unaffected — try again, or switch to another tab.
            </p>
            {import.meta.env.VITE_DEV_MODE === 'true' && this.state.error && (
              <pre className="text-xs text-coral-ink overflow-auto text-left mb-4 p-3 paper-inset">
                {this.state.error.toString()}
              </pre>
            )}
            <button
              onClick={this.handleReset}
              className="btn-pop inline-flex items-center gap-2 px-5 py-2.5 bg-violet text-white rounded-2xl border-2 border-ink/85 font-display font-bold text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Try again
            </button>
          </div>
        );
      }

      return (
        <div className="min-h-screen bg-surface flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            <div className="bg-surface-alt rounded-3xl border-2 border-ink/85 shadow-pop p-8">
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 bg-coral/15 border-2 border-ink/85 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-coral-ink" />
                </div>
              </div>

              <h1 className="text-2xl font-display font-bold text-center text-ink mb-3">
                Oops! Something went wrong
              </h1>

              <p className="text-ink-soft font-medium text-center mb-6">
                The application encountered an unexpected error. Don&rsquo;t worry, your data is safe.
              </p>

              {/* Error details (only in development) */}
              {import.meta.env.VITE_DEV_MODE === 'true' && this.state.error && (
                <div className="mb-6 p-4 paper-inset">
                  <h3 className="font-bold text-ink mb-2">Error Details:</h3>
                  <pre className="text-xs text-coral-ink overflow-auto">
                    {this.state.error.toString()}
                  </pre>
                  {this.state.errorInfo && (
                    <pre className="text-xs text-ink-soft overflow-auto mt-2">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-4 justify-center">
                <button
                  onClick={this.handleReset}
                  className="btn-pop flex items-center gap-2 px-6 py-3 bg-violet text-white rounded-2xl border-2 border-ink/85 font-display font-bold"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reload Application
                </button>

                <button
                  onClick={() => window.history.back()}
                  className="btn-pop px-6 py-3 bg-surface-sunk text-ink rounded-2xl border-2 border-ink/85 font-display font-bold"
                >
                  Go Back
                </button>
              </div>
            </div>

            {/* Help text */}
            <div className="mt-6 text-center text-sm font-medium text-ink-soft">
              <p>If this problem persists, please try:</p>
              <ul className="mt-2">
                <li>• Clearing your browser cache</li>
                <li>• Checking your internet connection</li>
                <li>• Trying again in a few minutes</li>
              </ul>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;