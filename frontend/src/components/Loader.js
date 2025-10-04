import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import './Loader.css';

const texts = [
  'Consulting the clouds…',
  'Calibrating satellites…',
  'Reading the skies…',
  'Forecasting fate…',
];

export default function Loader() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % texts.length), 1800);
    return () => clearInterval(t);
  }, []);

  return (
    <motion.div
      className="loader-wrapper"
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.6 } }}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 4, ease: 'linear', repeat: Infinity }}
        className="loader-ring"
      />
      <motion.h2
        key={idx}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -20, opacity: 0 }}
      >
        {texts[idx]}
      </motion.h2>
    </motion.div>
  );
}