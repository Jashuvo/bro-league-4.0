import React, { useState } from 'react';
import { Share2, Check } from 'lucide-react';
import Button from './ui/Button';

// Native share (Web Share API) with a clipboard fallback for desktop
// browsers that don't support it. Purely presentational — callers hand in
// the text; user-cancelled shares are swallowed (cancelling isn't an
// error).
const ShareButton = ({ title = 'BRO League', text = '', className = '', children }) => {
  const [copied, setCopied] = useState(false);

  const onShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title, text });
      } else {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (error) {
      if (error?.name !== 'AbortError') console.warn('Share failed:', error);
    }
  };

  return (
    <Button
      variant="outline"
      className={className}
      onClick={(e) => {
        e.stopPropagation();
        onShare();
      }}
      aria-label={copied ? 'Copied to clipboard' : 'Share'}
    >
      {copied ? <Check size={19} className="text-pitch-ink" /> : <Share2 size={19} />}
      {copied ? 'Copied' : (children || 'Share')}
    </Button>
  );
};

export default ShareButton;