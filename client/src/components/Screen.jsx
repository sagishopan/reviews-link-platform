import React from 'react';
import { motion } from 'framer-motion';

// Shared 250ms horizontal-slide + fade transition used between every step of
// the customer flow, so screens read as "one question at a time" with no
// progress bar or step counter.
export default function Screen({ children, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
