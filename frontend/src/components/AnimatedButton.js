// frontend/src/components/AnimatedButton.js
import React from 'react';
import { motion } from 'framer-motion';

// Added a 'className' prop to allow custom styles
function AnimatedButton({ children, onClick, disabled, type = "button", className = "" }) {
  return (
    <motion.button
      className={className} // Pass the className to the button element
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      onClick={onClick}
      disabled={disabled}
      type={type}
    >
      {children}
    </motion.button>
  );
}

export default AnimatedButton;