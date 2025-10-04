import { useEffect, useRef } from 'react';

export default function Background() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationId;
    let time = 0;
    
    // Set canvas size
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Rain drops array
    const drops = [];
    const numDrops = 200;

    // Fog particles
    const fogParticles = [];
    const numFogParticles = 50;

    // Create rain drops
    for (let i = 0; i < numDrops; i++) {
      drops.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        length: Math.random() * 25 + 15,
        speed: Math.random() * 4 + 6,
        opacity: Math.random() * 0.2 + 0.15
      });
    }

    // Create fog particles
    for (let i = 0; i < numFogParticles; i++) {
      fogParticles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 150 + 100,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: (Math.random() - 0.5) * 0.2,
        opacity: Math.random() * 0.15 + 0.05
      });
    }

    // Animation loop
    const animate = () => {
      time++;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw fog layer
      fogParticles.forEach(fog => {
        const gradient = ctx.createRadialGradient(
          fog.x, fog.y, 0,
          fog.x, fog.y, fog.radius
        );
        gradient.addColorStop(0, `rgba(200, 200, 200, ${fog.opacity})`);
        gradient.addColorStop(0.5, `rgba(180, 180, 180, ${fog.opacity * 0.5})`);
        gradient.addColorStop(1, 'rgba(180, 180, 180, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(fog.x, fog.y, fog.radius, 0, Math.PI * 2);
        ctx.fill();

        // Move fog particles slowly
        fog.x += fog.speedX + Math.sin(time * 0.01) * 0.1;
        fog.y += fog.speedY + Math.cos(time * 0.01) * 0.1;

        // Wrap around screen
        if (fog.x < -fog.radius) fog.x = canvas.width + fog.radius;
        if (fog.x > canvas.width + fog.radius) fog.x = -fog.radius;
        if (fog.y < -fog.radius) fog.y = canvas.height + fog.radius;
        if (fog.y > canvas.height + fog.radius) fog.y = -fog.radius;
      });

      // Draw falling rain drops on top of fog
      drops.forEach(drop => {
        const gradient = ctx.createLinearGradient(drop.x, drop.y, drop.x, drop.y + drop.length);
        gradient.addColorStop(0, `rgba(255, 255, 255, ${drop.opacity})`);
        gradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x, drop.y + drop.length);
        ctx.stroke();

        // Update position
        drop.y += drop.speed;

        // Reset when drop falls off screen
        if (drop.y > canvas.height) {
          drop.y = -drop.length;
          drop.x = Math.random() * canvas.width;
          drop.speed = Math.random() * 4 + 6;
          drop.opacity = Math.random() * 0.2 + 0.15;
        }
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        pointerEvents: 'none',
        opacity: 0.7
      }}
    />
  );
}