import { useCallback } from 'react';
import Particles from 'react-tsparticles';
import { loadSlim } from 'tsparticles-slim';

export default function Background() {
  const init = useCallback(async (engine) => { await loadSlim(engine); }, []);

  return (
    <Particles
      init={init}
      options={{
        fullScreen: { enable: true, zIndex: -1 },
        background: { color: 'transparent' },
        particles: {
          number: { value: 120 },
          color: { value: ['#26F17F', '#ffffff'] },
          shape: { type: 'circle' },
          opacity: { value: { min: 0.1, max: 0.5 } },
          size: { value: { min: 1, max: 3 } },
          move: {
            enable: true,
            speed: 3,
            direction: 'bottom',
            straight: true,
            outModes: 'out',
          },
        },
        interactivity: {
          events: {
            onHover: { enable: true, mode: 'repulse' },
            onClick: { enable: true, mode: 'push' },
          },
          modes: { repulse: { distance: 120 } },
        },
      }}
    />
  );
}