import { motion } from 'framer-motion';

export default function GlassCard({ children, className, style }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      className={`glass ${className || ''}`}
      style={style}
      whileHover={{ scale: 1.01 }}
    >
      {children}
    </motion.div>
  );
}