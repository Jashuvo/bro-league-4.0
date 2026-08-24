// src/components/ErrorMessage.jsx — inline problem banner, drawn as flat
// paper with a thin ink outline like everything else. Tone comes from the
// central tokens (coral = negative, sunflower = warning).
import React from 'react';
import { AlertTriangle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import Button from './ui/Button';

const TONES = {
  error: {
    surface: 'bg-coral/12',
    text: 'text-coral-ink',
    icon: <AlertTriangle size={22} className="text-coral-ink" />,
    title: 'Error',
    button: 'danger',
  },
  network: {
    surface: 'bg-coral/12',
    text: 'text-coral-ink',
    icon: <WifiOff size={22} className="text-coral-ink" />,
    title: 'Connection Problem',
    button: 'danger',
  },
  warning: {
    surface: 'bg-sunflower/25',
    text: 'text-ink',
    icon: <AlertTriangle size={22} className="text-tangerine-ink" />,
    title: 'Heads up',
    button: 'sunny',
  },
};

const ErrorMessage = ({
  message = "Something went wrong",
  onRetry = null,
  type = "error" // "error", "warning", "network"
}) => {
  const tone = TONES[type] || TONES.error;

  return (
    <div className={`${tone.surface} rounded-3xl border-2 border-ink/85 shadow-card p-5 mb-6 animate-fade-in-up`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-shrink-0 w-11 h-11 rounded-2xl bg-surface-alt border-2 border-ink/85 flex items-center justify-center">
          {tone.icon}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className={`font-display font-bold ${tone.text} mb-0.5`}>
            {tone.title}
          </h3>
          <p className="text-ink text-sm font-medium leading-relaxed">
            {message}
          </p>

          {type === "network" && (
            <p className="text-ink-soft text-xs mt-2 font-medium">
              Check your internet connection or try again in a few moments.
            </p>
          )}
        </div>

        {onRetry && (
          <div className="flex-shrink-0 w-full sm:w-auto">
            <Button variant={tone.button} size="sm" onClick={onRetry} className="w-full sm:w-auto">
              <RefreshCw size={16} />
              <span>Try Again</span>
            </Button>
          </div>
        )}
      </div>

      {type === "network" && (
        <div className="mt-4 pt-4 border-t-2 border-dashed border-ink/15">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink-soft">
            <Wifi size={14} />
            <span>Network status will update automatically when connection is restored</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ErrorMessage;
