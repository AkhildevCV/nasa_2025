import { useEffect, useRef } from 'react';

export default function FogBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;
    let time = 0;

    /* ---------- canvas sizing ---------- */
    const resize = () => {
      canvas.width = window.innerWidth * window.devicePixelRatio;
      canvas.height = window.innerHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
    };
    resize();
    window.addEventListener('resize', resize);

    /* ---------- slow ambient fog ---------- */
    const ambientFog = [];
    const numAmbient = 50;
    for (let i = 0; i < numAmbient; i++) {
      ambientFog.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: Math.random() * 150 + 100,
        sx: (Math.random() - 0.5) * 0.2,
        sy: (Math.random() - 0.5) * 0.1,
        o: Math.random() * 0.12 + 0.04,
      });
    }

    /* ---------- fast upward smoke wisps ---------- */
    const smoke = [];
    const numSmoke = 80;
    for (let i = 0; i < numSmoke; i++) {
      smoke.push({
        x: Math.random() * window.innerWidth,
        y: window.innerHeight + Math.random() * 200, // start below screen
        r: Math.random() * 60 + 40,
        sx: (Math.random() - 0.5) * 0.8,      // horizontal drift
        sy: -Math.random() * 1.5 - 0.5,       // upward speed
        o: Math.random() * 0.25 + 0.1,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.02,
      });
    }

    /* ---------- draw helpers ---------- */
    const drawFogBall = (x, y, r, o) => {
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, `rgba(200,200,200,${o})`);
      grad.addColorStop(0.5, `rgba(180,180,180,${o * 0.5})`);
      grad.addColorStop(1, 'rgba(180,180,180,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawSmoke = (s) => {
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.rot);
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, s.r);
      grad.addColorStop(0, `rgba(255,255,255,${s.o})`);
      grad.addColorStop(0.7, `rgba(220,220,220,${s.o * 0.4})`);
      grad.addColorStop(1, 'rgba(200,200,200,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, s.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    /* ---------- animation loop ---------- */
    const animate = () => {
      time++;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      /* slow ambient fog */
      ambientFog.forEach((f) => {
        f.x += f.sx + Math.sin(time * 0.001) * 0.1;
        f.y += f.sy + Math.cos(time * 0.001) * 0.05;
        if (f.x < -f.r) f.x = window.innerWidth + f.r;
        if (f.x > window.innerWidth + f.r) f.x = -f.r;
        if (f.y < -f.r) f.y = window.innerHeight + f.r;
        if (f.y > window.innerHeight + f.r) f.y = -f.r;
        drawFogBall(f.x, f.y, f.r, f.o);
      });

      /* upward smoke */
      smoke.forEach((s) => {
        s.x += s.sx + Math.sin(time * 0.005 + s.rot) * 0.3;
        s.y += s.sy;
        s.rot += s.rotSpeed;
        s.o *= 0.996; // fade out as it rises
        if (s.y < -s.r || s.o < 0.01) {
          // recycle particle
          s.x = Math.random() * window.innerWidth;
          s.y = window.innerHeight + 100 + Math.random() * 200;
          s.r = Math.random() * 60 + 40;
          s.sx = (Math.random() - 0.5) * 0.8;
          s.sy = -Math.random() * 1.5 - 0.5;
          s.o = Math.random() * 0.25 + 0.1;
        }
        drawSmoke(s);
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    /* ---------- cleanup ---------- */
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
        opacity: 0.75,
      }}
    />
  );
}