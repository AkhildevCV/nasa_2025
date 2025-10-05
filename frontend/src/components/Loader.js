import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

const texts = [
  'Consulting the clouds…',
  'Calibrating satellites…',
  'Reading the skies…',
  'Forecasting fate…',
];

export default function Loader() {
  const [idx, setIdx] = useState(0);
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % texts.length), 1800);
    
    // Generate random particles
    const newParticles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 3 + 2,
      delay: Math.random() * 2,
    }));
    setParticles(newParticles);
    
    return () => clearInterval(t);
  }, []);

  return (
    <motion.div
      className="loader-wrapper-new"
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.6 } }}
    >
      {/* Animated Background Grid */}
      <div className="loader-grid">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="grid-line"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.1, 0] }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.1,
            }}
            style={{
              left: `${(i * 5) % 100}%`,
            }}
          />
        ))}
      </div>

      {/* Floating Particles */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="loader-particle"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
          }}
          animate={{
            y: [-20, -100],
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: "easeOut",
          }}
        />
      ))}

      {/* Central Loading Animation */}
      <div className="loader-center">
        {/* Orbital Rings System */}
        <div className="orbital-container">
          {/* Outer Ring */}
          <motion.div
            className="orbit-ring outer"
            animate={{ rotate: 360 }}
            transition={{ duration: 8, ease: "linear", repeat: Infinity }}
          >
            <div className="orbit-dot" style={{ background: '#22d3ee' }} />
          </motion.div>

          {/* Middle Ring */}
          <motion.div
            className="orbit-ring middle"
            animate={{ rotate: -360 }}
            transition={{ duration: 6, ease: "linear", repeat: Infinity }}
          >
            <div className="orbit-dot" style={{ background: '#a78bfa' }} />
          </motion.div>

          {/* Inner Ring */}
          <motion.div
            className="orbit-ring inner"
            animate={{ rotate: 360 }}
            transition={{ duration: 4, ease: "linear", repeat: Infinity }}
          >
            <div className="orbit-dot" style={{ background: '#f472b6' }} />
          </motion.div>

          {/* Center Core */}
          <motion.div
            className="loader-core"
            animate={{
              scale: [1, 1.2, 1],
              boxShadow: [
                '0 0 20px #26F17F, 0 0 40px #26F17F',
                '0 0 40px #26F17F, 0 0 80px #26F17F, 0 0 100px #00D9FF',
                '0 0 20px #26F17F, 0 0 40px #26F17F',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <motion.svg
              width="50"
              height="50"
              viewBox="0 0 24 24"
              fill="none"
              animate={{ rotate: 360 }}
              transition={{ duration: 4, ease: "linear", repeat: Infinity }}
            >
              <motion.path
                d="M12 2L2 7L12 12L22 7L12 2Z"
                stroke="#26F17F"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                animate={{ pathLength: [0, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <motion.path
                d="M2 17L12 22L22 17"
                stroke="#26F17F"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                animate={{ pathLength: [0, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
              />
              <motion.path
                d="M2 12L12 17L22 12"
                stroke="#26F17F"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                animate={{ pathLength: [0, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
              />
            </motion.svg>
          </motion.div>
        </div>

        {/* Animated Text */}
        <div className="loader-text-container">
          <AnimatePresence mode="wait">
            <motion.h2
              key={idx}
              className="loader-text"
              initial={{ y: 20, opacity: 0, filter: 'blur(10px)' }}
              animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
              exit={{ y: -20, opacity: 0, filter: 'blur(10px)' }}
              transition={{ duration: 0.5 }}
            >
              {texts[idx].split('').map((char, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  {char}
                </motion.span>
              ))}
            </motion.h2>
          </AnimatePresence>

          {/* Progress Bar */}
          <div className="progress-container">
            <motion.div
              className="progress-fill"
              animate={{
                width: ['0%', '100%'],
              }}
              transition={{
                duration: 2.5,
                ease: "easeInOut",
                repeat: Infinity,
              }}
            />
            <motion.div
              className="progress-glow"
              animate={{
                x: ['-100%', '200%'],
              }}
              transition={{
                duration: 2,
                ease: "easeInOut",
                repeat: Infinity,
              }}
            />
          </div>

          {/* Loading Percentage */}
          <motion.div
            className="loading-percent"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <motion.span
              key={idx}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {((idx + 1) * 25) % 100}%
            </motion.span>
          </motion.div>
        </div>
      </div>

      {/* Corner Decorations */}
      <motion.div
        className="corner-decoration top-left"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, ease: "linear", repeat: Infinity }}
      />
      <motion.div
        className="corner-decoration top-right"
        animate={{ rotate: -360 }}
        transition={{ duration: 20, ease: "linear", repeat: Infinity }}
      />
      <motion.div
        className="corner-decoration bottom-left"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, ease: "linear", repeat: Infinity }}
      />
      <motion.div
        className="corner-decoration bottom-right"
        animate={{ rotate: -360 }}
        transition={{ duration: 20, ease: "linear", repeat: Infinity }}
      />

      {/* Gradient Blobs */}
      <motion.div
        className="blob blob-1"
        animate={{
          x: [0, 100, 0],
          y: [0, -50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="blob blob-2"
        animate={{
          x: [0, -100, 0],
          y: [0, 50, 0],
          scale: [1, 1.3, 1],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />

      <style>{`
        .loader-wrapper-new {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
          overflow: hidden;
        }

        .loader-grid {
          position: absolute;
          inset: 0;
          overflow: hidden;
        }

        .grid-line {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 1px;
          background: linear-gradient(to bottom, transparent, rgba(38, 241, 127, 0.3), transparent);
        }

        .loader-particle {
          position: absolute;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(38, 241, 127, 0.8), rgba(0, 217, 255, 0.4));
          pointer-events: none;
        }

        .loader-center {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3rem;
          position: relative;
          z-index: 10;
        }

        .orbital-container {
          position: relative;
          width: 250px;
          height: 250px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .orbit-ring {
          position: absolute;
          border-radius: 50%;
          border: 2px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 0 20px rgba(38, 241, 127, 0.2);
        }

        .orbit-ring.outer {
          width: 200px;
          height: 200px;
        }

        .orbit-ring.middle {
          width: 140px;
          height: 140px;
        }

        .orbit-ring.inner {
          width: 80px;
          height: 80px;
        }

        .orbit-dot {
          position: absolute;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          top: -4px;
          left: 50%;
          transform: translateX(-50%);
          box-shadow: 0 0 15px currentColor;
        }

        .loader-core {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(38, 241, 127, 0.2), transparent);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          z-index: 2;
        }

        .loader-text-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
          min-height: 120px;
        }

        .loader-text {
          color: #fff;
          font-weight: 300;
          letter-spacing: 0.15em;
          font-size: 1.5rem;
          text-align: center;
          background: linear-gradient(90deg, #26F17F, #00D9FF, #A78BFA);
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin: 0;
        }

        .progress-container {
          width: 300px;
          height: 4px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          overflow: hidden;
          position: relative;
          box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.5);
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #26F17F, #00D9FF, #A78BFA);
          border-radius: 10px;
          box-shadow: 0 0 20px rgba(38, 241, 127, 0.6);
        }

        .progress-glow {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          width: 50%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
          filter: blur(5px);
        }

        .loading-percent {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.6);
          letter-spacing: 0.1em;
        }

        .corner-decoration {
          position: absolute;
          width: 100px;
          height: 100px;
          border: 2px solid rgba(38, 241, 127, 0.2);
          border-radius: 20px;
        }

        .corner-decoration.top-left {
          top: 2rem;
          left: 2rem;
          border-right: none;
          border-bottom: none;
        }

        .corner-decoration.top-right {
          top: 2rem;
          right: 2rem;
          border-left: none;
          border-bottom: none;
        }

        .corner-decoration.bottom-left {
          bottom: 2rem;
          left: 2rem;
          border-right: none;
          border-top: none;
        }

        .corner-decoration.bottom-right {
          bottom: 2rem;
          right: 2rem;
          border-left: none;
          border-top: none;
        }
          .loader-wrapper{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:2rem;background:#0d0d0d;}
          .loader-ring{width:80px;height:80px;border-radius:50%;border:4px solid transparent;border-top-color:#26F17F;box-shadow:0 0 20px #26F17F;}
          .loader-wrapper h2{color:#fff;font-weight:300;letter-spacing:.1em;}

        .blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.3;
          pointer-events: none;
        }

        .blob-1 {
          top: 10%;
          left: 10%;
          width: 400px;
          height: 400px;
          background: linear-gradient(135deg, #26F17F, #00D9FF);
        }

        .blob-2 {
          bottom: 10%;
          right: 10%;
          width: 400px;
          height: 400px;
          background: linear-gradient(135deg, #A78BFA, #F472B6);
        }

        @media (max-width: 768px) {
          .orbital-container {
            width: 200px;
            height: 200px;
          }

          .orbit-ring.outer { width: 160px; height: 160px; }
          .orbit-ring.middle { width: 110px; height: 110px; }
          .orbit-ring.inner { width: 60px; height: 60px; }

          .loader-core {
            width: 80px;
            height: 80px;
          }

          .loader-core svg {
            width: 40px;
            height: 40px;
          }

          .loader-text {
            font-size: 1.2rem;
          }

          .progress-container {
            width: 250px;
          }

          .corner-decoration {
            width: 60px;
            height: 60px;
          }
        }
      `}</style>
    </motion.div>
  );
}