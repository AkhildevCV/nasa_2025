import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { useState, useEffect } from 'react';

// ✨ UPDATED: Accept the onAnimationComplete prop from App.js
function Hero({ onAnimationComplete }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [particles, setParticles] = useState([]);

  const smoothMouseX = useSpring(mouseX, { damping: 30, stiffness: 200 });
  const smoothMouseY = useSpring(mouseY, { damping: 30, stiffness: 200 });

  useEffect(() => {
    const newParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 1,
      duration: Math.random() * 20 + 15,
      delay: Math.random() * 5,
    }));
    setParticles(newParticles);
  }, []);

  const onMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left - rect.width / 2) / 2);
    mouseY.set((e.clientY - rect.top - rect.height / 2) / 2);
  };

  const rotateX = useTransform(smoothMouseY, [-150, 150], [8, -8]);
  const rotateY = useTransform(smoothMouseX, [-150, 150], [-8, 8]);
  const scale = useTransform(smoothMouseX, [-150, 150], [0.98, 1.02]);

  const letters = 'Lluvia'.split('');
  const subLetters = 'Will it rain on my parade?'.split('');

  return (
    <div
      className="hero-container"
      onMouseMove={onMouseMove}
    >
      {/* ... (background and particle effects remain the same) ... */}
       <div className="hero-background-orbs">
        <motion.div
          className="orb orb-1"
          animate={{ x: [0, 100, 0], y: [0, -50, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="orb orb-2"
          animate={{ x: [0, -100, 0], y: [0, 50, 0], scale: [1, 1.3, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="orb orb-3"
          animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="hero-particle"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
          }}
          animate={{ y: [0, -100, 0], opacity: [0, 1, 0] }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: "linear",
          }}
        />
      ))}
      <div className="hero-grid-overlay" />

      {/* Hero Content */}
      <div className="hero-content">
        <motion.div
          style={{
            rotateX,
            rotateY,
            scale,
            transformStyle: 'preserve-3d',
            perspective: 1000,
          }}
          className="text-center"
        >
          {/* Main Title */}
          <motion.div
            className="title-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            <div className="title-letters">
              {letters.map((ch, i) => (
                <motion.span
                  key={i}
                  className="hero-title-letter"
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: 'translateZ(50px)',
                  }}
                  initial={{ opacity: 0, y: 120, rotateX: -90, scale: 0.5 }}
                  animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
                  transition={{
                    opacity: { duration: 0.5, delay: i * 0.08 },
                    y: { duration: 0.8, delay: i * 0.08, ease: [0.34, 1.56, 0.64, 1] },
                    rotateX: { duration: 0.8, delay: i * 0.08, ease: [0.34, 1.56, 0.64, 1] },
                    scale: { duration: 0.8, delay: i * 0.08, ease: [0.34, 1.56, 0.64, 1] },
                  }}
                  whileHover={{
                    y: -40,
                    scale: 1.3,
                    rotateZ: 0,
                    filter: 'drop-shadow(0 0 50px rgba(139, 92, 246, 1))',
                    transition: { duration: 0.3 },
                  }}
                >
                  <motion.span
                     animate={{
                       y: [0, -18, 0],
                       scale: [1, 1.1, 1],
                       rotateZ: [0, 4, -4, 0],
                     }}
                     transition={{
                       duration: 4 + i * 0.4,
                       repeat: Infinity,
                       repeatType: "mirror",
                       ease: "easeInOut",
                       delay: i * 0.2 + 1.5,
                     }}
                  >
                    {ch}
                  </motion.span>
                </motion.span>
              ))}
            </div>

            <motion.div
              className="glowing-line"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: '60%', opacity: 1 }}
              transition={{ duration: 1.5, delay: 1 }}
            />
          </motion.div>

          {/* Subtitle */}
          <motion.div
            className="subtitle-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 1 }}
          >
            <div className="subtitle-letters">
              {subLetters.map((ch, i) => (
                <motion.span
                  key={i}
                  className="hero-subtitle-letter"
                  initial={{ opacity: 0, y: 40, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{
                    delay: 0.8 + i * 0.03,
                    duration: 0.5,
                    ease: "easeOut"
                  }}
                  whileHover={{
                    color: '#a78bfa',
                    scale: 1.15,
                    y: -5,
                    textShadow: '0 0 20px rgba(167, 139, 250, 0.8)',
                    transition: { duration: 0.2 }
                  }}
                  // ✨ UPDATED: Trigger the callback when the LAST letter's animation finishes
                  onAnimationComplete={() => {
                    if (i === subLetters.length - 1) {
                      onAnimationComplete?.(); // Safely call the function from App.js
                    }
                  }}
                >
                  {ch === ' ' ? '\u00A0' : ch}
                </motion.span>
              ))}
            </div>
          </motion.div>

        </motion.div>
      </div>
      <div className="hero-vignette" />
    </div>
  );
}

export default Hero;