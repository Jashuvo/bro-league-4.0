import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

// The app's one surface primitive.
//
// In the page-3 artboards a content card is simply WHITE PAPER on the cream
// ground: a generous radius, no outline and no shadow. The ink outline is not
// decoration there — it is reserved for the few blocks that have to sit
// forward of the page (the command bar, the leader strip, the sign-off), and
// spending it on every card is what made the first pass read as a different,
// louder design than the one on the canvas.
//
// So `tone` no longer picks an outline colour. It picks how the paper is
// TINTED — the artboards' podium rows are a warmer cream, not a bordered
// card — and `outlined` is the explicit opt-in for a block that needs the ink.
// Each tinted tone is now the artboards' own flat tile fill rather than its
// accent composited at 12-40% alpha. Same intent, but alpha-over-cream was
// landing several steps paler and greyer than the canvas — see the
// TINTED TILES note in tailwind.config.js.
const TONES = {
  paper: 'bg-surface-alt border-transparent',
  outlined: 'bg-surface-alt border-ink/85',
  sunflower: 'bg-tile-gold border-transparent',
  mint: 'bg-tile-sage border-transparent',
  coral: 'bg-tile-clay border-transparent',
  violet: 'bg-tile-lilac border-transparent',
  sky: 'bg-tile-sky border-transparent',
  tangerine: 'bg-tile-peach border-transparent',
  bubblegum: 'bg-tile-rose border-transparent',
};

const Card = ({ children, className, hover = false, tone = 'paper', ...props }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            whileHover={hover ? { y: -3, transition: { duration: 0.2 } } : {}}
            className={cn(
                'border-2 rounded-3xl p-6',
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
