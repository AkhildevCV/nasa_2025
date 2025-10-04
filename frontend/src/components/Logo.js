// frontend/src/components/Logo.js
import React from 'react';
import { motion } from 'framer-motion';

// Animation variants for the container to orchestrate the letters
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1, // Delay between each letter's animation
    },
  },
};

// Animation variants for each individual letter
const letterVariants = {
  hidden: { opacity: 0, y: -30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 15 },
  },
};

function Logo({ text }) {
  // Split the text into an array of characters
  const letters = Array.from(text);

  return (
    <motion.div
      className="logo-container"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {letters.map((letter, index) => (
        <motion.span
          key={index}
          className="animated-gradient-text"
          variants={letterVariants}
          whileHover={{ scale: 1.2, y: -5, color: '#fff' }} // Interactive hover effect
        >
          {letter}
        </motion.span>
      ))}
    </motion.div>
  );
}

export default Logo;