// frontend/src/components/Loader.js
import React from 'react';
import { motion } from 'framer-motion';
import './Loader.css'; // We'll create this CSS file next

function Loader() {
  return (
    <motion.div 
      className="loader-container"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" }}
      >
        🌦 Loading Weather Data...
      </motion.h1>
    </motion.div>
  );
}

export default Loader;