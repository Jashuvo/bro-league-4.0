import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn'; // Assuming you have a cn utility or I will create one

// If cn utility doesn't exist, I'll create it in the next step.
// For now, I'll assume standard clsx/tailwind-merge usage pattern or just use template literals if simple.
// But for a robust system, cn is better. I'll create it.

const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    className,
    isLoading,
    ...props
}) => {
    const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
        primary: "bg-bro-primary text-white hover:bg-bro-primary/90 shadow-lg shadow-bro-primary/20 hover:shadow-bro-primary/40",
        secondary: "bg-bro-secondary text-bro-dark hover:bg-bro-secondary/90 shadow-lg shadow-bro-secondary/20 hover:shadow-bro-secondary/40",
        outline: "border-2 border-bro-primary text-bro-primary hover:bg-bro-primary/10",
        ghost: "text-bro-text hover:bg-white/10",
        danger: "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20",
    };

    const sizes = {
        sm: "px-3 py-1.5 text-sm",
        md: "px-4 py-2 text-base",
        lg: "px-6 py-3 text-lg",
    };

    return (
        <motion.button
            whileTap={{ scale: 0.98 }}
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            disabled={isLoading}
            {...props}
        >
            {isLoading ? (
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : null}
            {children}
        </motion.button>
    );
};

export default Button;
