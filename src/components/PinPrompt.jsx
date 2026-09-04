import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Lock, AlertCircle } from 'lucide-react';
import { useEscapeKey } from '../hooks/useEscapeKey';

// A styled stand-in for window.prompt()/alert() when excluding/restoring a
// manager — those native dialogs were the one place left in the app that
// didn't match its own design system (every other overlay is one of these
// scrim+card sheets). `request` is `{ title, action }` where `action(pin)`
// is the actual write (fplApi.addExclusion/removeExclusion/etc) — this
// component owns the retry loop: a wrong PIN or a rate-limit response
// shows inline instead of closing, so the caller doesn't need its own
// error-handling path for "the PIN was wrong."
const PinPrompt = ({ request, onDone }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEscapeKey(() => onDone(), !!request);

  if (!request) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pin) return;
    setSubmitting(true);
    setError(null);
    try {
      await request.action(pin);
      sessionStorage.setItem('exclusionPin', pin);
      setPin('');
      onDone();
    } catch (err) {
      setError(err.message || 'Something went wrong — try again.');
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setPin('');
    setError(null);
    onDone();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
    >
      <div onClick={handleCancel} className="absolute inset-0 bg-scrim/75" />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', bounce: 0.15, duration: 0.3 }}
        className="relative w-full max-w-xs bg-surface rounded-3xl border-2 border-ink/85 shadow-pop-lg overflow-hidden"
      >
        <div className="bg-violet text-white p-4 flex items-start gap-3">
          <span className="w-10 h-10 shrink-0 rounded-2xl bg-surface-alt border-2 border-ink/85 flex items-center justify-center">
            <Lock size={18} className="text-violet-ink" />
          </span>
          <div className="min-w-0 flex-grow">
            <h2 className="font-display font-bold text-base leading-tight">Enter PIN</h2>
            <p className="text-white/80 text-xs font-semibold truncate">{request.title}</p>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            aria-label="Cancel"
            className="w-8 h-8 shrink-0 rounded-xl bg-surface-alt border-2 border-ink/85 flex items-center justify-center"
          >
            <X size={16} className="text-ink" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <input
            type="password"
            inputMode="numeric"
            autoFocus
            value={pin}
            onChange={(e) => { setPin(e.target.value); setError(null); }}
            placeholder="PIN"
            className="w-full h-12 px-4 rounded-2xl border-2 border-ink/85 bg-surface-sunk text-center font-display font-bold text-lg tracking-[0.3em] text-ink focus:outline-none focus:ring-2 focus:ring-violet"
          />

          {error && (
            <p className="flex items-center gap-1.5 text-xs font-bold text-coral-ink">
              <AlertCircle size={14} className="shrink-0" />
              {error}
            </p>
          )}

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={handleCancel}
              className="btn-pop h-11 rounded-2xl border-2 border-ink/85 bg-surface-sunk text-ink font-display font-bold text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!pin || submitting}
              className="btn-pop h-11 rounded-2xl border-2 border-ink/85 bg-violet text-white font-display font-bold text-sm disabled:opacity-60"
            >
              {submitting ? 'Checking…' : 'Confirm'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default PinPrompt;
