// frontend/src/components/AnimatedCounter.js
import React, { useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

function AnimatedCounter({ to, decimals = 1 }) {
  const count = useMotionValue(0);
  
  // This rounds the animated value to the desired number of decimal places
  const rounded = useTransform(count, (latest) => {
    return parseFloat(latest.toFixed(decimals));
  });

  useEffect(() => {
    const controls = animate(count, to, {
      duration: 1.5, // Animation duration in seconds
      ease: "easeOut",
    });
    return controls.stop;
  }, [to, count, decimals]);

  return <motion.span>{rounded}</motion.span>;
}

export default AnimatedCounter;