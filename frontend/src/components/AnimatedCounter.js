import { useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

export default function AnimatedCounter({ to, decimals = 1 }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => parseFloat(v.toFixed(decimals)));

  useEffect(() => {
    const controls = animate(count, to, { duration: 1.5, ease: 'easeOut' });
    return controls.stop;
  }, [to, count, decimals]);

  return <motion.span>{rounded}</motion.span>;
}