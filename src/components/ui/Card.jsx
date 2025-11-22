import React from 'react';
import { motion } from 'framer-motion';

const Card = ({ children, className, hover = false, ...props }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            whileHover={hover ? { y: -5, transition: { duration: 0.2 } } : {}}
            className={`glass-panel rounded-xl p-6 ${className}`}
            {...props}
        >
            {children}
        </motion.div>
    );
};

export default Card;
