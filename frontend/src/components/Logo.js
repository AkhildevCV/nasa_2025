import { motion } from 'framer-motion';

const container = { hidden: { opacity: 0 }, visible: { transition: { staggerChildren: 0.1 } } };
const letter = {
  hidden: { opacity: 0, y: -30 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 15 } },
};

export default function Logo({ text }) {
  const chars = Array.from(text);
  return (
    <motion.div variants={container} initial="hidden" animate="visible" className="logo-container">
      {chars.map((ch, i) => (
        <motion.span key={i} variants={letter} whileHover={{ scale: 1.2, y: -5, color: '#fff' }}>
          {ch}
        </motion.span>
      ))}
    </motion.div>
  );
}