import { useEffect, useRef } from 'react';
import './StarField.css';

export default function StarField({ density = 200, speed = 0.3 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animId;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Generate stars
    const stars = Array.from({ length: density }, () => ({
      x:         Math.random() * canvas.width,
      y:         Math.random() * canvas.height,
      r:         Math.random() * 1.8 + 0.3,
      baseAlpha: Math.random() * 0.7 + 0.3,
      alpha:     0,
      twinkleSpeed: Math.random() * 0.02 + 0.005,
      twinklePhase: Math.random() * Math.PI * 2,
      color:     Math.random() > 0.85 ? '#a8d4ff' : Math.random() > 0.7 ? '#ffd580' : '#f0f4ff',
    }));

    // Shooting stars
    const shootingStars = [];
    const addShootingStar = () => {
      if (Math.random() < 0.003) {
        shootingStars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height * 0.5,
          vx: (Math.random() * 4 + 2) * (Math.random() > 0.5 ? 1 : -1),
          vy: Math.random() * 2 + 1,
          life: 1,
          length: Math.random() * 80 + 40,
        });
      }
    };

    let t = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw nebula clouds
      const drawNebula = (x, y, r, color, alpha) => {
        const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, color.replace(')', `, ${alpha})`).replace('rgb', 'rgba'));
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(x, y, r * 1.5, r, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
      };
      drawNebula(canvas.width * 0.2, canvas.height * 0.3, 200, 'rgb(45, 27, 78)', 0.3 + Math.sin(t * 0.001) * 0.1);
      drawNebula(canvas.width * 0.8, canvas.height * 0.7, 150, 'rgb(10, 30, 60)', 0.2 + Math.cos(t * 0.0015) * 0.1);

      // Draw stars
      stars.forEach(s => {
        s.twinklePhase += s.twinkleSpeed;
        s.alpha = s.baseAlpha * (0.5 + 0.5 * Math.sin(s.twinklePhase));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = s.color.replace('#', '').match(/.{2}/g)
          ? `rgba(${parseInt(s.color.slice(1,3),16)},${parseInt(s.color.slice(3,5),16)},${parseInt(s.color.slice(5,7),16)},${s.alpha})`
          : s.color;
        ctx.fill();
        if (s.r > 1.2) {
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(240,244,255,${s.alpha * 0.1})`;
          ctx.fill();
        }
      });

      // Shooting stars
      addShootingStar();
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const ss = shootingStars[i];
        const grad = ctx.createLinearGradient(ss.x, ss.y, ss.x - ss.vx * ss.length / ss.vx, ss.y - ss.vy * ss.length / ss.vx);
        grad.addColorStop(0, `rgba(200,230,255,${ss.life})`);
        grad.addColorStop(1, 'rgba(200,230,255,0)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(ss.x, ss.y);
        ctx.lineTo(ss.x - ss.vx * 20, ss.y - ss.vy * 20);
        ctx.stroke();
        ss.x += ss.vx;
        ss.y += ss.vy;
        ss.life -= 0.02;
        if (ss.life <= 0) shootingStars.splice(i, 1);
      }

      t += 1;
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [density]);

  return <canvas ref={canvasRef} className="starfield-canvas" />;
}
