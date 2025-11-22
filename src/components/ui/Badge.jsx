import React from 'react';

const Badge = ({ children, variant = 'default', className, ...props }) => {
    const variants = {
        default: "bg-base-200 text-base-content border border-base-content/10",
        primary: "bg-bro-primary/20 text-bro-primary border border-bro-primary/20",
        secondary: "bg-bro-secondary/20 text-bro-secondary border border-bro-secondary/20",
        accent: "bg-bro-accent/20 text-bro-accent border border-bro-accent/20",
        success: "bg-green-500/20 text-green-400 border border-green-500/20",
        warning: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/20",
    };

    return (
        <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}
            {...props}
        >
            {children}
        </span>
    );
};

export default Badge;
