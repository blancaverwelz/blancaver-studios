import { useEffect, useRef } from 'react';
import './WorkGalleryScene.css';

export default function WorkGalleryScene() {
  const host = useRef(null);
  const canvas = useRef(null);
  useEffect(() => {
    const node = host.current, surface = canvas.current;
    const context = surface.getContext('2d');
    if (!context) return undefined;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    let width = 0, height = 0, frame = 0, last = 0, time = 0;
    let visible = false, disposed = false, seed = 741;
    const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    const particles = Array.from({ length: 45 }, () => ({
      x: random(), y: random(), depth: .3 + random() * .7,
      phase: random() * Math.PI * 2, speed: .003 + random() * .006,
    }));
    function stop() { cancelAnimationFrame(frame); frame = 0; last = 0; }
    function paint(now) {
      frame = 0;
      if (disposed || !visible || document.hidden || motion.matches) return;
      if (last && now - last < 33) { frame = requestAnimationFrame(paint); return; }
      time += last ? Math.min((now - last) / 1000, .1) : 0;
      last = now;
      context.clearRect(0, 0, width, height);
      const count = width < 768 ? 25 : particles.length;
      for (let i = 0; i < count; i++) {
        const p = particles[i];
        const x = ((p.x + time * p.speed * .35) % 1) * width;
        const y = ((p.y - time * p.speed + 100) % 1) * height;
        const drift = Math.sin(time * .16 + p.phase) * 12 * p.depth;
        const opacity = (.12 + p.depth * .25) * (.8 + .2 * Math.sin(time * .35 + p.phase));
        context.fillStyle = `rgba(255,235,160,${opacity})`;
        context.beginPath();
        context.arc(x + drift, y, .45 + p.depth, 0, Math.PI * 2);
        context.fill();
      }
      frame = requestAnimationFrame(paint);
    }
    function resume() {
      stop();
      if (motion.matches) context.clearRect(0, 0, width, height);
      else if (visible && !document.hidden && !disposed) frame = requestAnimationFrame(paint);
    }
    const resize = new ResizeObserver(() => {
      width = node.clientWidth; height = node.clientHeight;
      const ratio = Math.min(devicePixelRatio || 1, 1.5);
      surface.width = Math.round(width * ratio); surface.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0); resume();
    });
    const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; resume(); });
    resize.observe(node); intersection.observe(node);
    motion.addEventListener('change', resume);
    document.addEventListener('visibilitychange', resume);
    return () => {
      disposed = true; stop(); resize.disconnect(); intersection.disconnect();
      motion.removeEventListener('change', resume);
      document.removeEventListener('visibilitychange', resume);
    };
  }, []);
  return <div ref={host} className="work-archive-scene" aria-hidden="true">
    <img src={`${import.meta.env.BASE_URL}images/work-gallery/studio-archive.webp`}
      alt="" fetchPriority="high" decoding="async" />
    <canvas ref={canvas} />
  </div>;
}
