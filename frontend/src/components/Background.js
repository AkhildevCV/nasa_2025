// frontend/src/components/Background.js
import React, { useCallback } from 'react';
import Particles from 'react-tsparticles';
import { loadSlim } from 'tsparticles-slim';

function Background() {
  const particlesInit = useCallback(async (engine) => {
    // This loads the tsparticles package bundle, it's required for the particles to work
    await loadSlim(engine);
  }, []);

  const particleOptions = {
    background: {
      color: {
        value: 'transparent', // This makes the background transparent so our CSS gradient shows
      },
    },
    fpsLimit: 60,
    interactivity: {
      events: {
        onHover: {
          enable: true,
          mode: 'repulse', // This makes the rain "splash" away from the cursor
        },
      },
      modes: {
        repulse: {
          distance: 100,
          duration: 0.4,
        },
      },
    },
    particles: {
      color: {
        value: '#aaddff', // A light blue color for rain
      },
      links: {
        enable: false, // We don't want lines connecting the drops
      },
      move: {
        direction: 'bottom',
        enable: true,
        outModes: {
          default: 'out',
        },
        random: false,
        speed: 4, // Speed of the rain
        straight: true,
      },
      number: {
        density: {
          enable: true,
        },
        value: 150, // Number of raindrops
      },
      opacity: {
        value: { min: 0.1, max: 0.5 }, // Varying opacity
      },
      shape: {
        type: 'circle', // Simple shape
      },
      size: {
        value: { min: 1, max: 3 }, // Raindrops of different sizes
      },
    },
    detectRetina: true,
  };

  return (
    <Particles
      id="tsparticles"
      init={particlesInit}
      options={particleOptions}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1, // Ensure it's in the background
      }}
    />
  );
}

export default Background;