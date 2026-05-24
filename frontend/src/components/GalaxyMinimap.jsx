import { useEffect, useRef } from 'react';
import './GalaxyMinimap.css';

// Earth is ~26,000 ly from galactic center, in Orion Arm
// We map this to canvas coordinates
const EARTH_ANGLE_DEG = 225; // approximate position in galaxy map
const EARTH_DIST_FRAC = 0.55; // fraction from center to edge

export default function GalaxyMinimap({ highlightedPlanet }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2;
    const maxR = Math.min(W, H) / 2 - 4;

    let animId;
    let t = 0;

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      // ── Background ────────────────────────────────────────────────────────
      ctx.fillStyle = 'rgba(2, 5, 12, 0.95)';
      ctx.beginPath();
      ctx.arc(cx, cy, maxR, 0, Math.PI * 2);
      ctx.fill();

      // ── Galaxy core glow ─────────────────────────────────────────────────
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR * 0.3);
      coreGrad.addColorStop(0,   'rgba(255, 220, 150, 0.9)');
      coreGrad.addColorStop(0.2, 'rgba(200, 150, 80, 0.4)');
      coreGrad.addColorStop(1,   'rgba(0, 0, 0, 0)');
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, maxR, 0, Math.PI * 2);
      ctx.fill();

      // ── Spiral arms ───────────────────────────────────────────────────────
      const drawArm = (startAngle, color, alpha) => {
        ctx.save();
        ctx.globalAlpha = alpha;
        for (let i = 0; i < 600; i++) {
          const frac = i / 600;
          const angle = startAngle + frac * Math.PI * 3.5;
          const r = frac * maxR * 0.92;
          const x = cx + Math.cos(angle) * r;
          const y = cy + Math.sin(angle) * r * 0.45; // flatten into ellipse
          const dotR = (1 - frac) * 2.5 + 0.3;
          const brightness = 0.3 + Math.sin(frac * 20 + t * 0.01) * 0.15;
          ctx.fillStyle = color.replace('{b}', brightness.toFixed(2));
          ctx.beginPath();
          ctx.arc(x, y, dotR, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      };

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(t * 0.001); // very slow rotation
      ctx.translate(-cx, -cy);

      drawArm(0,           'rgba(180, 200, 255, {b})', 0.9);
      drawArm(Math.PI,     'rgba(160, 190, 255, {b})', 0.85);
      drawArm(Math.PI / 2, 'rgba(140, 180, 240, {b})', 0.6);
      drawArm(Math.PI * 1.5, 'rgba(140, 180, 240, {b})', 0.55);
      ctx.restore();

      // ── Dust lanes ───────────────────────────────────────────────────────
      const dustGrad = ctx.createRadialGradient(cx, cy, maxR * 0.1, cx, cy, maxR * 0.6);
      dustGrad.addColorStop(0, 'rgba(20, 10, 5, 0)');
      dustGrad.addColorStop(0.5, 'rgba(10, 5, 2, 0.3)');
      dustGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = dustGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, maxR, 0, Math.PI * 2);
      ctx.fill();

      // ── Earth position ────────────────────────────────────────────────────
      const earthAngle = (EARTH_ANGLE_DEG * Math.PI) / 180;
      const earthR     = EARTH_DIST_FRAC * maxR;
      const ex = cx + Math.cos(earthAngle) * earthR;
      const ey = cy + Math.sin(earthAngle) * earthR * 0.45;

      // Ripple
      const rippleAlpha = 0.6 - (t % 60) / 60 * 0.6;
      const rippleR = 4 + (t % 60) / 60 * 12;
      ctx.beginPath();
      ctx.arc(ex, ey, rippleR, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 60, 60, ${rippleAlpha})`;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Dot
      ctx.beginPath();
      ctx.arc(ex, ey, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#ff3b3b';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(ex, ey, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#ffaaaa';
      ctx.fill();

      // "You are here" label
      ctx.fillStyle = 'rgba(255, 100, 100, 0.9)';
      ctx.font = '6px "Space Mono", monospace';
      ctx.fillText('YOU', ex + 6, ey - 2);

      // ── Border ────────────────────────────────────────────────────────────
      ctx.beginPath();
      ctx.arc(cx, cy, maxR, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      t++;
      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="galaxy-minimap">
      <canvas ref={canvasRef} width={140} height={140} />
      <p className="minimap-label">Milky Way — You are here</p>
    </div>
  );
}
