import { useEffect, useRef } from 'react';

export default function InteractiveWeatherBackground({ 
  rainProbability = null, 
  temperature = null,
  precipitation = null,
  season = null,
  hourlyData = null
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    // Don't render anything if no analysis data is available
    if (rainProbability === null) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationId;
    let time = 0;
    let mouseX = 0;
    let mouseY = 0;
    
    // Determine weather mode and intensity ONLY based on season
    let weatherMode = 'windy';
    let intensity = 30;

    // Season takes absolute priority
    if (season === 'Summer') {
      weatherMode = 'clear';
      intensity = 25;
    } else if (season === 'Autumn') {
      weatherMode = 'leaves';
      intensity = 40;
    } else if (season === 'Winter') {
      if (temperature !== null && temperature < 5) {
        weatherMode = 'snow';
        intensity = 45;
      } else {
        weatherMode = 'fog';
        intensity = 35;
      }
    } else if (season === 'Spring') {
      // For spring, use rain probability to vary between gentle rain and windy
      if (rainProbability > 50) {
        weatherMode = 'rain';
        intensity = 40;
      } else {
        weatherMode = 'windy';
        intensity = 30;
      }
    } else {
      // Fallback if no season is provided
      weatherMode = 'windy';
      intensity = 30;
    }

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const lightningStrikes = [];
    const particles = [];
    const numParticles = Math.floor(intensity * 4);
    const windParticles = [];
    const numWindParticles = 30;
    const fogParticles = [];
    const numFogParticles = 40;
    const sunRays = [];
    const numSunRays = 12;

    const initParticles = () => {
      particles.length = 0;
      // Only create particles for weather modes that need them
      if (weatherMode === 'clear' || weatherMode === 'windy') {
        return; // No particles for clear/windy weather
      }
      
      for (let i = 0; i < numParticles; i++) {
        if (weatherMode === 'snow') {
          particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            radius: Math.random() * 3 + 2,
            speed: Math.random() * 1 + 0.5,
            drift: Math.random() * 2 - 1,
            opacity: Math.random() * 0.6 + 0.4
          });
        } else if (weatherMode === 'leaves') {
          particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            radius: Math.random() * 4 + 3,
            speed: Math.random() * 2 + 1,
            drift: Math.random() * 3 - 1.5,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.1,
            opacity: Math.random() * 0.6 + 0.4,
            color: ['#ff8c42', '#ffa62b', '#c1512f', '#8b4513', '#d4a574'][Math.floor(Math.random() * 5)]
          });
        } else if (weatherMode === 'rain' || weatherMode === 'storm' || weatherMode === 'fog') {
          particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            length: Math.random() * 25 + 15,
            speed: Math.random() * 4 + 6,
            opacity: Math.random() * 0.2 + 0.15
          });
        }
      }
    };

    for (let i = 0; i < numWindParticles; i++) {
      windParticles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speedX: Math.random() * 3 + 2,
        speedY: (Math.random() - 0.5) * 0.5,
        length: Math.random() * 40 + 20,
        opacity: Math.random() * 0.1 + 0.05
      });
    }

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

    for (let i = 0; i < numSunRays; i++) {
      sunRays.push({
        angle: (Math.PI * 2 * i) / numSunRays,
        length: Math.random() * 100 + 150,
        opacity: Math.random() * 0.1 + 0.05
      });
    }

    initParticles();

    const handleMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);

    const handleClick = (e) => {
      if (weatherMode === 'storm') {
        createLightning(e.clientX, e.clientY);
      }
    };
    canvas.addEventListener('click', handleClick);

    const createLightning = (x, y) => {
      const branches = [];
      const mainBranch = {
        points: [{ x, y: 0 }],
        x: x,
        y: 0
      };

      let currentY = 0;
      let currentX = x;
      while (currentY < y) {
        currentY += Math.random() * 60 + 40;
        currentX += (Math.random() - 0.5) * 80;
        mainBranch.points.push({ x: currentX, y: currentY });
      }

      branches.push(mainBranch);

      for (let i = 1; i < mainBranch.points.length - 1; i++) {
        if (Math.random() > 0.6) {
          const branchPoint = mainBranch.points[i];
          const sideBranch = {
            points: [{ x: branchPoint.x, y: branchPoint.y }],
            x: branchPoint.x,
            y: branchPoint.y
          };
          
          let bx = branchPoint.x;
          let by = branchPoint.y;
          const dir = Math.random() > 0.5 ? 1 : -1;
          
          for (let j = 0; j < 3; j++) {
            by += Math.random() * 40 + 20;
            bx += dir * (Math.random() * 50 + 30);
            sideBranch.points.push({ x: bx, y: by });
          }
          branches.push(sideBranch);
        }
      }

      lightningStrikes.push({
        branches,
        opacity: 1,
        createdAt: time
      });
    };

    const animate = () => {
      time++;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw summer sun rays
      if (weatherMode === 'clear') {
        const sunX = canvas.width - 150;
        const sunY = 150;
        
        sunRays.forEach(ray => {
          const endX = sunX + Math.cos(ray.angle + time * 0.005) * ray.length;
          const endY = sunY + Math.sin(ray.angle + time * 0.005) * ray.length;
          
          const gradient = ctx.createLinearGradient(sunX, sunY, endX, endY);
          gradient.addColorStop(0, `rgba(255, 220, 100, ${ray.opacity})`);
          gradient.addColorStop(1, 'rgba(255, 220, 100, 0)');
          
          ctx.strokeStyle = gradient;
          ctx.lineWidth = 15;
          ctx.beginPath();
          ctx.moveTo(sunX, sunY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
        });

        // Draw sun glow
        const sunGradient = ctx.createRadialGradient(sunX, sunY, 30, sunX, sunY, 80);
        sunGradient.addColorStop(0, 'rgba(255, 240, 150, 0.15)');
        sunGradient.addColorStop(1, 'rgba(255, 240, 150, 0)');
        ctx.fillStyle = sunGradient;
        ctx.beginPath();
        ctx.arc(sunX, sunY, 80, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw fog layer
      if (weatherMode === 'fog' || weatherMode === 'rain') {
        fogParticles.forEach(fog => {
          const gradient = ctx.createRadialGradient(
            fog.x, fog.y, 0,
            fog.x, fog.y, fog.radius
          );
          const opacity = weatherMode === 'fog' ? fog.opacity * 2 : fog.opacity;
          gradient.addColorStop(0, `rgba(200, 200, 200, ${opacity})`);
          gradient.addColorStop(0.5, `rgba(180, 180, 180, ${opacity * 0.5})`);
          gradient.addColorStop(1, 'rgba(180, 180, 180, 0)');
          
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(fog.x, fog.y, fog.radius, 0, Math.PI * 2);
          ctx.fill();

          fog.x += fog.speedX + Math.sin(time * 0.01) * 0.1;
          fog.y += fog.speedY + Math.cos(time * 0.01) * 0.1;

          if (fog.x < -fog.radius) fog.x = canvas.width + fog.radius;
          if (fog.x > canvas.width + fog.radius) fog.x = -fog.radius;
          if (fog.y < -fog.radius) fog.y = canvas.height + fog.radius;
          if (fog.y > canvas.height + fog.radius) fog.y = -fog.radius;
        });
      }

      // Draw wind effect
      if (weatherMode === 'windy' || weatherMode === 'storm' || weatherMode === 'clear') {
        windParticles.forEach(wind => {
          const distToMouse = Math.hypot(wind.x - mouseX, wind.y - mouseY);
          const pushForce = Math.max(0, 1 - distToMouse / 300);
          
          ctx.strokeStyle = `rgba(255, 255, 255, ${wind.opacity})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(wind.x, wind.y);
          ctx.lineTo(wind.x - wind.length, wind.y);
          ctx.stroke();

          wind.x += wind.speedX + pushForce * 5;
          wind.y += wind.speedY + (mouseY - wind.y) * pushForce * 0.02;

          if (wind.x > canvas.width) {
            wind.x = 0;
            wind.y = Math.random() * canvas.height;
          }
        });
      }

      // Draw precipitation/particles
      particles.forEach(p => {
        if (weatherMode === 'snow') {
          ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();

          p.y += p.speed;
          p.x += p.drift + Math.sin(time * 0.02 + p.y * 0.01) * 0.5;

          if (p.y > canvas.height) {
            p.y = -10;
            p.x = Math.random() * canvas.width;
          }
        } else if (weatherMode === 'leaves') {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.opacity;
          
          // Draw leaf shape
          ctx.beginPath();
          ctx.moveTo(0, -p.radius);
          ctx.quadraticCurveTo(p.radius, -p.radius / 2, p.radius / 2, 0);
          ctx.quadraticCurveTo(p.radius, p.radius / 2, 0, p.radius);
          ctx.quadraticCurveTo(-p.radius, p.radius / 2, -p.radius / 2, 0);
          ctx.quadraticCurveTo(-p.radius, -p.radius / 2, 0, -p.radius);
          ctx.fill();
          
          ctx.globalAlpha = 1;
          ctx.restore();

          p.y += p.speed;
          p.x += p.drift + Math.sin(time * 0.02 + p.y * 0.01) * 0.8;
          p.rotation += p.rotationSpeed;

          if (p.y > canvas.height) {
            p.y = -10;
            p.x = Math.random() * canvas.width;
            p.rotation = Math.random() * Math.PI * 2;
          }
        } else {
          const gradient = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.length);
          const baseOpacity = weatherMode === 'storm' ? p.opacity * 1.5 : p.opacity;
          gradient.addColorStop(0, `rgba(255, 255, 255, ${baseOpacity})`);
          gradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
          
          ctx.strokeStyle = gradient;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x, p.y + p.length);
          ctx.stroke();

          p.y += p.speed;

          if (p.y > canvas.height) {
            p.y = -p.length;
            p.x = Math.random() * canvas.width;
          }
        }
      });

      // Draw lightning strikes
      lightningStrikes.forEach((strike, idx) => {
        const age = time - strike.createdAt;
        strike.opacity = Math.max(0, 1 - age / 20);

        if (strike.opacity > 0) {
          strike.branches.forEach(branch => {
            ctx.strokeStyle = `rgba(200, 220, 255, ${strike.opacity})`;
            ctx.lineWidth = 3;
            ctx.shadowBlur = 20;
            ctx.shadowColor = 'rgba(150, 200, 255, 0.8)';
            
            ctx.beginPath();
            ctx.moveTo(branch.points[0].x, branch.points[0].y);
            for (let i = 1; i < branch.points.length; i++) {
              ctx.lineTo(branch.points[i].x, branch.points[i].y);
            }
            ctx.stroke();
            ctx.shadowBlur = 0;
          });
        }
      });

      lightningStrikes.forEach((strike, idx) => {
        if (strike.opacity <= 0) {
          lightningStrikes.splice(idx, 1);
        }
      });

      if (weatherMode === 'storm' && Math.random() > 0.995) {
        createLightning(Math.random() * canvas.width, Math.random() * canvas.height * 0.6);
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
    };
  }, [rainProbability, temperature, season, hourlyData]);

  // Don't render canvas if no data
  if (rainProbability === null) {
    return null;
  }

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