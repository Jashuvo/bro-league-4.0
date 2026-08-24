import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

// Chunky flat button — solid token fill, thin ink outline, and a press that
// sinks the control rather than collapsing a shadow, since this direction has
// no shadows at all (see `.btn-pop` in index.css).
const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    className,
    isLoading,
    ...props
}) => {
    const baseStyles =
        'inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-ink/85 font-bold font-display tracking-tight btn-pop focus:outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
        primary: 'bg-violet text-white hover:bg-violet/90',
        secondary: 'bg-mint text-ink hover:bg-mint/85',
        accent: 'bg-coral text-ink hover:bg-coral/90',
        sunny: 'bg-sunflower text-ink hover:bg-sunflower/85',
        outline: 'bg-surface-alt text-ink hover:bg-surface-sunk',
        ghost: 'bg-transparent border-transparent shadow-none text-ink-soft hover:text-ink hover:bg-ink/5 active:translate-x-0 active:translate-y-0',
        danger: 'bg-coral text-ink hover:bg-coral/90',
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg',
    };

    return (
        <motion.button
            whileTap={{ scale: 0.98 }}
            className={cn(baseStyles, variants[variant], sizes[size], className)}
            disabled={isLoading}
            {...props}
        >
            {isLoading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : null}
            {children}
        </motion.button>
    );
};

export default Button;
