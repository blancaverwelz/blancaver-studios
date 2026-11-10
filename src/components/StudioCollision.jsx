import { useEffect, useRef } from 'react';
import { trustFrame } from './studioTrust';

// Scroll-sampled artwork, no timer or extra WebGL context.
export default function StudioCollision({ progress, x, y, width, height }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5, 2000 / Math.max(width, height));
    canvas.width = Math.max(1, Math.round(width * ratio));
    canvas.height = Math.max(1, Math.round(height * ratio));
    ctx.scale(ratio, ratio);
    const frame = trustFrame(progress);
    const radius = Math.min(width, height) * (.04 + frame.burst * .88);
    const fade = 1 - frame.burst;
    ctx.translate(x, y);
    ctx.globalCompositeOperation = 'screen';
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 1.2);
    glow.addColorStop(0, `rgba(255,252,229,${frame.impact * .95})`);
    glow.addColorStop(.18, `rgba(255,222,112,${frame.impact * .8})`);
    glow.addColorStop(.5, `rgba(255,172,39,${frame.impact * .25})`);
    glow.addColorStop(1, 'rgba(255,172,39,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(-radius * 1.2, -radius * 1.2, radius * 2.4, radius * 2.4);
    for (let ring = 0; ring < 3; ring++) {
      ctx.beginPath();
      ctx.ellipse(0, 0, radius * (1 - ring * .09), radius * (.42 + ring * .04), -.16, 0, Math.PI * 2);
      ctx.lineWidth = 1 + 4 * fade;
      ctx.strokeStyle = `rgba(255,220,135,${fade * frame.impact * (.8 - ring * .2)})`;
      ctx.stroke();
    }
    for (let i = 0; i < 94; i++) {
      const a = i * 2.399963;
      const seed = (Math.sin(i * 127.1 + 12) * 43758.5453) % 1;
      const distance = radius * (.3 + Math.abs(seed) * .85);
      const px = Math.cos(a) * distance, py = Math.sin(a) * distance * .72;
      ctx.strokeStyle = `rgba(255,${190 + i % 60},110,${fade * .85})`;
      ctx.lineWidth = i % 7 === 0 ? 2.5 : .8;
      ctx.beginPath();
      ctx.moveTo(px * .88, py * .88); ctx.lineTo(px, py); ctx.stroke();
    }
  }, [progress, x, y, width, height]);
  if (progress <= .42 || progress >= .72) return null;
  return <canvas ref={canvasRef} className="studio-collision" aria-hidden="true" />;
}
