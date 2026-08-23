import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

// The app's one surface primitive: flat paper, a single thin ink outline and
// a hard (never blurred) offset shadow. `tone` picks the accent used for the
// outline tint so a card can join the celebration without a gradient.
const TONES = {
  paper: 'border-ink/85 shadow-card',
  coral: 'border-coral shadow-[3px_3px_0_0_rgb(var(--c-coral))]',
  violet: 'border-violet shadow-[3px_3px_0_0_rgb(var(--c-violet))]',
  mint: 'border-mint shadow-[3px_3px_0_0_rgb(var(--c-mint))]',
  sunflower: 'border-sunflower shadow-[3px_3px_0_0_rgb(var(--c-sunflower))]',
  sky: 'border-sky shadow-[3px_3px_0_0_rgb(var(--c-sky))]',
};

const Card = ({ children, className, hover = false, tone = 'paper', ...props }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            whileHover={hover ? { y: -4, transition: { duration: 0.2 } } : {}}
            className={cn(
                'bg-surface-alt border-2 rounded-3xl p-6',
                TONES[tone] || TONES.paper,
                className
            )}
            {...props}
        >
            {children}
        </motion.div>
    );
};

export default Card;
