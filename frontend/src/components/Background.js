import { useEffect, useRef } from 'react';

export default function InteractiveWeatherBackground({
  rainProbability = null,
  temperature     = null,
  precipitation   = null,
  season          = null,
  hourlyData      = null
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    /* 1.  No analysis yet → nothing to draw */
    if (rainProbability === null) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    /* 2.  Utility */
    const rand = (min, max) => Math.random() * (max - min) + min;
    const abs = Math.abs;

    /* 3.  Decide weather-mode from season (backend string) */
    let weatherMode = 'windy';       // default
    let intensity   = 30;            // particle-count multiplier

    const S = (season || '').toLowerCase();

    /* ----------  WINTER BLOCK – no rain allowed  ---------- */
    if (S.includes('winter') || S.includes('polar')) {
      weatherMode = (temperature !== null && temperature < 5) ? 'snow' : 'fog';
      intensity   = weatherMode === 'snow' ? 45 : 35;
    }
    /* ------------------------------------------------------- */
    else if (S.includes('summer') || S.includes('midnight')) {
      weatherMode = 'clear';
      intensity   = 25;
    }
    else if (S.includes('autumn') || S.includes('fall')) {
      weatherMode = 'leaves';
      intensity   = 40;
    }
    else if (S.includes('spring')) {
      weatherMode = (rainProbability > 50) ? 'rain' : 'windy';
      intensity   = weatherMode === 'rain' ? 40 : 30;
    }
    else if (S.includes('monsoon') || S.includes('wet')) {
      weatherMode = 'rain';
      intensity   = 45;
    }
    else if (S.includes('dry') || S.includes('post-monsoon') || S.includes('hot')) {
      weatherMode = 'windy';
      intensity   = 30;
    }

    /* 4.  Setup canvas */
    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    /* 5.  Particle pools */
    let animationId, time = 0, mouseX = 0, mouseY = 0;
    const lightningStrikes = [];
    const particles        = [];
    const windParticles    = [];
    const fogParticles     = [];
    const sunRays          = [];

    const numParticles     = Math.floor(intensity * 4);
    const numWind          = 30;
    const numFog           = 40;
    const numSun           = 12;

    /* 6.  Init helpers */
    function initParticles() {
      particles.length = 0;
      if (weatherMode === 'clear' || weatherMode === 'windy') return;

      for (let i = 0; i < numParticles; i++) {
        if (weatherMode === 'snow') {
          particles.push({
            x: rand(0, canvas.width),
            y: rand(-canvas.height, 0),
            r: rand(2, 5),
            sp: rand(0.5, 1.5),
            drift: rand(-1, 1),
            o: rand(0.4, 1)
          });
        } else if (weatherMode === 'leaves') {
          particles.push({
            x: rand(0, canvas.width),
            y: rand(-canvas.height, 0),
            r: rand(3, 7),
            sp: rand(1, 3),
            drift: rand(-1.5, 1.5),
            rot: rand(0, Math.PI * 2),
            rotSp: rand(-0.05, 0.05),
            o: rand(0.4, 1),
            color: ['#ff8c42','#ffa62b','#c1512f','#8b4513','#d4a574'][Math.floor(rand(0,5))]
          });
        } 
        // ✨ FIX #1: Changed `else` to `else if` to be specific about rain
        else if (weatherMode === 'rain' || weatherMode === 'storm') {
          particles.push({
            x: rand(0, canvas.width),
            y: rand(-canvas.height, 0),
            len: rand(15, 40),
            sp:  rand(6, 10),
            o:   rand(0.15, 0.3)
          });
        }
      }
    }

    for (let i = 0; i < numWind; i++) windParticles.push({
      x: rand(0, canvas.width),
      y: rand(0, canvas.height),
      len: rand(20, 60),
      sx: rand(2, 5),
      sy: rand(-0.5, 0.5),
      o: rand(0.05, 0.15)
    });

    for (let i = 0; i < numFog; i++) fogParticles.push({
      x: rand(0, canvas.width),
      y: rand(0, canvas.height),
      r: rand(100, 250),
      sx: rand(-0.3, 0.3),
      sy: rand(-0.2, 0.2),
      o: rand(0.05, 0.2)
    });

    for (let i = 0; i < numSun; i++) sunRays.push({
      angle: (Math.PI * 2 * i) / numSun,
      len: rand(150, 250),
      o: rand(0.05, 0.1)
    });

    initParticles();

    /* 7.  Mouse & lightning */
    const handleMove = e => { mouseX = e.clientX; mouseY = e.clientY; };
    window.addEventListener('mousemove', handleMove);

    function createLightning(x, y) {
      const branches = [];
      const main = { points: [{ x, y: 0 }], x, y: 0 };
      let cy = 0, cx = x;
      while (cy < y) {
        cy += rand(40, 80);
        cx += rand(-80, 80);
        main.points.push({ x: cx, y: cy });
      }
      branches.push(main);
      for (let i = 1; i < main.points.length - 1; i++) {
        if (Math.random() > 0.6) {
          const bp = main.points[i];
          const side = { points: [{ x: bp.x, y: bp.y }], x: bp.x, y: bp.y };
          let bx = bp.x, by = bp.y;
          const dir = Math.random() > 0.5 ? 1 : -1;
          for (let j = 0; j < 3; j++) {
            by += rand(20, 40);
            bx += dir * rand(30, 60);
            side.points.push({ x: bx, y: by });
          }
          branches.push(side);
        }
      }
      lightningStrikes.push({ branches, opacity: 1, createdAt: time });
    }

    const handleClick = e => { if (weatherMode === 'storm') createLightning(e.clientX, e.clientY); };
    canvas.addEventListener('click', handleClick);

    /* 8.  Animation loop */
    function animate() {
      time++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      /* 8a. Sun (summer) */
      if (weatherMode === 'clear') {
        const sunX = canvas.width - 150;
        const sunY = 150;
        sunRays.forEach(ray => {
          const endX = sunX + Math.cos(ray.angle + time * 0.005) * ray.len;
          const endY = sunY + Math.sin(ray.angle + time * 0.005) * ray.len;
          const grad = ctx.createLinearGradient(sunX, sunY, endX, endY);
          grad.addColorStop(0, `rgba(255,220,100,${ray.o})`);
          grad.addColorStop(1, 'rgba(255,220,100,0)');
          ctx.strokeStyle = grad;
          ctx.lineWidth = 15;
          ctx.beginPath();
          ctx.moveTo(sunX, sunY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
        });
        const glow = ctx.createRadialGradient(sunX, sunY, 30, sunX, sunY, 80);
        glow.addColorStop(0, 'rgba(255,240,150,0.15)');
        glow.addColorStop(1, 'rgba(255,240,150,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(sunX, sunY, 80, 0, Math.PI * 2);
        ctx.fill();
      }

      /* 8b. Fog */
      if (weatherMode === 'fog' || weatherMode === 'rain') {
        fogParticles.forEach(f => {
          const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r);
          grad.addColorStop(0, `rgba(200,200,200,${f.o * (weatherMode === 'fog' ? 2 : 1)})`);
          grad.addColorStop(1, 'rgba(180,180,180,0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
          ctx.fill();
          f.x += f.sx + Math.sin(time * 0.01) * 0.1;
          f.y += f.sy + Math.cos(time * 0.01) * 0.1;
          if (f.x < -f.r) f.x = canvas.width + f.r;
          if (f.x > canvas.width + f.r) f.x = -f.r;
          if (f.y < -f.r) f.y = canvas.height + f.r;
          if (f.y > canvas.height + f.r) f.y = -f.r;
        });
      }

      /* 8c. Wind */
      if (weatherMode === 'windy' || weatherMode === 'storm' || weatherMode === 'clear') {
        windParticles.forEach(w => {
          const dist = Math.hypot(w.x - mouseX, w.y - mouseY);
          const push = Math.max(0, 1 - dist / 300);
          ctx.strokeStyle = `rgba(255,255,255,${w.o})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(w.x, w.y);
          ctx.lineTo(w.x - w.len, w.y);
          ctx.stroke();
          w.x += w.sx + push * 5;
          w.y += w.sy + (mouseY - w.y) * push * 0.02;
          if (w.x > canvas.width) { w.x = 0; w.y = rand(0, canvas.height); }
        });
      }

      /* 8d. Particles (snow / leaves / rain) */
      particles.forEach(p => {
        if (weatherMode === 'snow') {
          ctx.fillStyle = `rgba(255,255,255,${p.o})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
          p.y += p.sp;
          p.x += p.drift + Math.sin(time * 0.02 + p.y * 0.01) * 0.5;
          if (p.y > canvas.height) { p.y = -10; p.x = rand(0, canvas.width); }
        } else if (weatherMode === 'leaves') {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.o;
          ctx.beginPath();
          ctx.moveTo(0, -p.r);
          ctx.quadraticCurveTo(p.r, -p.r / 2, p.r / 2, 0);
          ctx.quadraticCurveTo(p.r, p.r / 2, 0, p.r);
          ctx.quadraticCurveTo(-p.r, p.r / 2, -p.r / 2, 0);
          ctx.quadraticCurveTo(-p.r, -p.r / 2, 0, -p.r);
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.restore();
          p.y += p.sp;
          p.x += p.drift + Math.sin(time * 0.02 + p.y * 0.01) * 0.8;
          p.rot += p.rotSp;
          if (p.y > canvas.height) {
            p.y = -10; p.x = rand(0, canvas.width); p.rot = rand(0, Math.PI * 2);
          }
        } 
        // ✨ FIX #2: Changed `else` to `else if` to match the fix above
        else if (weatherMode === 'rain' || weatherMode === 'storm') {
          const grad = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.len);
          grad.addColorStop(0, `rgba(255,255,255,${p.o * (weatherMode === 'storm' ? 1.5 : 1)})`);
          grad.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.strokeStyle = grad;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x, p.y + p.len);
          ctx.stroke();
          p.y += p.sp;
          if (p.y > canvas.height) { p.y = -p.len; p.x = rand(0, canvas.width); }
        }
      });

      /* 8e. Lightning */
      lightningStrikes.forEach((strike, idx) => {
        const age = time - strike.createdAt;
        strike.opacity = Math.max(0, 1 - age / 20);
        if (strike.opacity > 0) {
          strike.branches.forEach(b => {
            ctx.strokeStyle = `rgba(200,220,255,${strike.opacity})`;
            ctx.lineWidth = 3;
            ctx.shadowBlur = 20;
            ctx.shadowColor = 'rgba(150,200,255,0.8)';
            ctx.beginPath();
            ctx.moveTo(b.points[0].x, b.points[0].y);
            for (let i = 1; i < b.points.length; i++) ctx.lineTo(b.points[i].x, b.points[i].y);
            ctx.stroke();
            ctx.shadowBlur = 0;
          });
        }
        if (strike.opacity <= 0) lightningStrikes.splice(idx, 1);
      });
      if (weatherMode === 'storm' && Math.random() > 0.995)
        createLightning(rand(0, canvas.width), rand(0, canvas.height * 0.6));

      animationId = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMove);
      canvas.removeEventListener('click', handleClick);
    };
  }, [rainProbability, temperature, season, hourlyData]);

  /* 9.  Nothing to show until first analysis */
  if (rainProbability === null) return null;

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
        pointerEvents: 'auto',
        opacity: 0.7
      }}
    />
  );
}