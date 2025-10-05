import { motion, useMotionValue } from 'framer-motion';

export default function MagneticButton({ children, ...props }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const onMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set(e.clientX - rect.left - rect.width / 2);
    y.set(e.clientY - rect.top - rect.height / 2);
  };
  const onMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.button
      {...props}
      style={{ display: 'inline-block' }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      animate={{ x, y }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.05 }}
    >
      {children}
    </motion.button>
  );
}