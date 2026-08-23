// src/components/LoadingSpinner.jsx — Memphis loading state: a ball rolling
// inside a ring of ink, with blob colour fields drifting behind it.
import React from 'react';
import { Ball, Blob, Jersey, Whistle } from './ui/Doodles';

const LoadingSpinner = ({
  message = "Loading FPL data...",
  submessage = "Getting the latest standings and stats",
  size = "default",
  fullScreen = false
}) => {
  const px = { small: 32, default: 64, large: 96 }[size] || 64;

  const containerClasses = fullScreen
    ? "fixed inset-0 bg-surface flex items-center justify-center z-50 overflow-hidden"
    : "flex items-center justify-center p-8";

  const LoadingAnimation = () => (
    <div className="relative inline-flex items-center justify-center">
      <div
        className="rounded-full border-[3px] border-ink/15 border-t-violet border-r-violet animate-spin"
        style={{ width: px, height: px }}
      />
      <span className="absolute inset-0 flex items-center justify-center">
        <Ball size={px * 0.52} className="animate-roll" />
      </span>
    </div>
  );

  const FloatingProps = () => (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      <Blob className="w-96 h-96 -left-24 -top-16" tone="fill-violet" opacity={0.14} variant={0} />
      <Blob className="w-80 h-80 -right-20 bottom-0" tone="fill-mint" opacity={0.14} variant={1} />
      <div className="absolute top-1/4 left-[18%] animate-float">
        <Jersey size={40} tone="fill-coral" />
      </div>
      <div className="absolute top-1/3 right-[18%] animate-float" style={{ animationDelay: '1s' }}>
        <Whistle size={36} />
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className={containerClasses}>
        <FloatingProps />

        <div className="relative z-10 text-center px-6">
          <div className="mb-8">
            <LoadingAnimation />
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-display font-bold text-ink">{message}</h2>
            <p className="text-ink-soft font-medium max-w-md mx-auto">{submessage}</p>

            <div className="flex justify-center space-x-2 mt-6">
              <span className="w-2.5 h-2.5 bg-coral rounded-full animate-bounce" />
              <span className="w-2.5 h-2.5 bg-sunflower rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
              <span className="w-2.5 h-2.5 bg-mint rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
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
          <div className="mt-4 space-y-1">
            <p className="text-ink font-bold">{message}</p>
            {submessage && (
              <p className="text-ink-soft text-sm font-medium">{submessage}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingSpinner;
