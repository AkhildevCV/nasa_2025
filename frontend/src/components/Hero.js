import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { useState, useEffect } from 'react';

// GitHub contributors - Replace with actual usernames
const contributors = [
  { name: 'AKHILDEV C VASUDEVAN', github: 'AkhildevCV', color: '#22d3ee', icon: '🌟' },
  { name: 'ALVIN N S', github: 'alvinns', color: '#a78bfa', icon: '⚡' },
  { name: 'ANWIN K SUNNY', github: 'anwinksunny', color: '#f472b6', icon: '🚀' },
  { name: 'ADAM FELANSO SIJO', github: 'felanso-777', color: '#fb923c', icon: '💫' },
];

function Hero({ onAnimationComplete }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [particles, setParticles] = useState([]);
  const [hoveredIndex, setHoveredIndex] = useState(null);

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
    <div className="hero-container" onMouseMove={onMouseMove}>
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
                  onAnimationComplete={() => {
                    if (i === subLetters.length - 1) {
                      onAnimationComplete?.();
                    }
                  }}
                >
                  {ch === ' ' ? '\u00A0' : ch}
                </motion.span>
              ))}
            </div>
          </motion.div>

          {/* GitHub Contributors Section */}
          <motion.div
            className="contributors-section"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.8, duration: 0.8, type: "spring" }}
          >
            <motion.div
              className="contributors-label-wrapper"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2, duration: 0.6 }}
            >
              <motion.div className="label-line left" />
              <span className="contributors-label">Crafted by</span>
              <motion.div className="label-line right" />
            </motion.div>

            <div className="contributors-grid">
              {contributors.map((contributor, i) => (
                <motion.a
                  key={contributor.github}
                  href={`https://github.com/${contributor.github}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contributor-card"
                  initial={{ opacity: 0, y: 50, rotateX: -30 }}
                  animate={{ opacity: 1, y: 0, rotateX: 0 }}
                  transition={{
                    delay: 2.2 + i * 0.1,
                    duration: 0.6,
                    type: "spring",
                    stiffness: 100
                  }}
                  whileHover={{
                    y: -15,
                    rotateY: 5,
                    transition: { duration: 0.3 }
                  }}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  style={{
                    '--contributor-color': contributor.color,
                  }}
                >
                  {/* Animated Background Glow */}
                  <motion.div
                    className="card-glow"
                    animate={{
                      opacity: hoveredIndex === i ? 0.8 : 0.3,
                      scale: hoveredIndex === i ? 1.2 : 1,
                    }}
                    transition={{ duration: 0.3 }}
                  />

                  {/* Floating Particles */}
                  {[...Array(3)].map((_, particleIndex) => (
                    <motion.div
                      key={particleIndex}
                      className="card-particle"
                      animate={{
                        y: [0, -30, 0],
                        x: [0, Math.sin(particleIndex) * 20, 0],
                        opacity: [0, 1, 0],
                      }}
                      transition={{
                        duration: 2 + particleIndex * 0.5,
                        repeat: Infinity,
                        delay: i * 0.2 + particleIndex * 0.3,
                      }}
                      style={{ background: contributor.color }}
                    />
                  ))}

                  {/* Icon */}
                  <motion.div
                    className="contributor-icon"
                    animate={{
                      rotate: hoveredIndex === i ? 360 : 0,
                      scale: hoveredIndex === i ? 1.1 : 1,
                    }}
                    transition={{ duration: 0.6 }}
                  >
                    {contributor.icon}
                  </motion.div>

                  {/* GitHub Logo */}
                  <motion.div
                    className="github-logo"
                    animate={{
                      scale: hoveredIndex === i ? 1.1 : 1,
                      rotate: hoveredIndex === i ? 360 : 0,
                    }}
                    transition={{ duration: 0.5 }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                    </svg>
                  </motion.div>

                  {/* Name */}
                  <motion.div
                    className="contributor-name"
                    animate={{
                      color: hoveredIndex === i ? contributor.color : 'rgba(203, 213, 225, 0.9)',
                    }}
                  >
                    {contributor.name}
                  </motion.div>

                  {/* Username */}
                  <div className="contributor-username">@{contributor.github}</div>

                  {/* Border Animation */}
                  <motion.div
                    className="card-border"
                    animate={{
                      rotate: hoveredIndex === i ? 360 : 0,
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  />
                </motion.a>
              ))}
            </div>
          </motion.div>

        </motion.div>
      </div>

      <div className="hero-vignette" />

      <style>{`
        .contributors-section {
          margin-top: 4rem;
          display: flex;
          flex-direction: column;
          gap: 2rem;
          position: relative;
          z-index: 10;
        }

        .contributors-label-wrapper {
          display: flex;
          align-items: center;
          gap: 1rem;
          justify-content: center;
        }

        .label-line {
          height: 1px;
          width: 60px;
          background: linear-gradient(to right, transparent, rgba(167, 139, 250, 0.5));
        }

        .label-line.right {
          background: linear-gradient(to left, transparent, rgba(167, 139, 250, 0.5));
        }

        .contributors-label {
          font-size: 0.75rem;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: rgba(167, 139, 250, 0.7);
          font-weight: 400;
        }

        .contributors-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
          max-width: 900px;
          margin: 0 auto;
        }

        .contributor-card {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
          padding: 2rem 1.5rem;
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          text-decoration: none;
          cursor: pointer;
          overflow: hidden;
          transition: all 0.3s ease;
          transform-style: preserve-3d;
        }

        .contributor-card:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: var(--contributor-color);
          box-shadow: 
            0 20px 60px rgba(0, 0, 0, 0.5),
            0 0 40px var(--contributor-color);
        }

        .card-glow {
          position: absolute;
          inset: -50%;
          background: radial-gradient(circle, var(--contributor-color), transparent 70%);
          filter: blur(40px);
          z-index: -1;
          pointer-events: none;
        }

        .card-particle {
          position: absolute;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          filter: blur(1px);
          pointer-events: none;
        }

        .contributor-icon {
          font-size: 2.5rem;
          line-height: 1;
          filter: drop-shadow(0 0 10px var(--contributor-color));
        }

        .github-logo {
          color: var(--contributor-color);
          filter: drop-shadow(0 0 8px var(--contributor-color));
        }

        .contributor-name {
          font-size: 1rem;
          font-weight: 600;
          text-align: center;
          transition: color 0.3s;
        }

        .contributor-username {
          font-size: 0.85rem;
          color: rgba(203, 213, 225, 0.5);
          text-align: center;
        }

        .card-border {
          position: absolute;
          inset: -1px;
          border-radius: 20px;
          background: conic-gradient(
            from 0deg,
            transparent 0deg,
            var(--contributor-color) 90deg,
            transparent 180deg,
            transparent 360deg
          );
          opacity: 0;
          transition: opacity 0.3s;
          pointer-events: none;
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask-composite: exclude;
          padding: 1px;
        }

        .contributor-card:hover .card-border {
          opacity: 0.6;
        }

        @media (max-width: 1024px) {
          .contributors-grid {
            grid-template-columns: repeat(2, 1fr);
            max-width: 500px;
          }
        }

        @media (max-width: 640px) {
          .contributors-section {
            margin-top: 3rem;
          }

          .contributors-grid {
            grid-template-columns: 1fr;
            max-width: 280px;
            gap: 1rem;
          }

          .contributor-card {
            padding: 1.5rem 1rem;
          }

          .contributor-icon {
            font-size: 2rem;
          }
        }
      `}</style>
    </div>
  );
}

export default Hero;