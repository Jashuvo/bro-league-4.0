import React from 'react';
import { cn } from '../../utils/cn';

// Flat sticker pill: solid token tint, thin ink outline, ink text. Every
// variant resolves to a token from tailwind.config.js — no stock palette
// entries, no per-component hexes.
const VARIANTS = {
    default: 'bg-surface-sunk text-ink border-ink/70',
    primary: 'bg-violet/20 text-violet-ink border-violet/70',
    secondary: 'bg-mint/25 text-ink border-mint',
    accent: 'bg-coral/20 text-coral-ink border-coral/70',
    success: 'bg-pitch/20 text-pitch-ink border-pitch/70',
    warning: 'bg-sunflower/35 text-ink border-sunflower',
    info: 'bg-sky/20 text-sky-ink border-sky/70',
    gold: 'bg-sunflower text-ink border-ink/80',
    ghost: 'bg-transparent text-ink-soft border-ink/25',
};

const Badge = ({ children, variant = 'default', className, ...props }) => (
    <span
        className={cn(
            'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border-2 text-xs font-bold whitespace-nowrap',
            VARIANTS[variant] || VARIANTS.default,
            className
        )}
        {...props}
    >
        {children}
    </span>
);

export default Badge;
