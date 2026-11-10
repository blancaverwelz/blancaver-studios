import { useEffect, useRef } from 'react';
import { createVortexRenderer } from './vortex/renderer.js';
import { paintVortex } from './vortex/fallback.js';

function createSurface(host) {
  const canvas = document.createElement('canvas');
  host.appendChild(canvas);
  return canvas;
}

function drawFallback(canvas, frame, progress, mobile, ratio, time) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const width = Math.max(1, Math.round(frame.width * ratio));
  const height = Math.max(1, Math.round(frame.height * ratio));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  paintVortex(ctx, frame, progress, mobile, time);
}

export default function StudioVortex({ frame, progress, mobile, image }) {
  const host = useRef(null);
  const refresh = useRef(null);
  const sample = useRef(null);
  const armed = progress > 0.10 && progress < 0.99;
  const visible = progress > 0.22 && armed;

  useEffect(() => {
    sample.current = { frame, progress, visible };
    refresh.current?.();
  }, [frame, progress, visible]);

  useEffect(() => {
    if (!armed || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const gpu = createSurface(host.current);
    const fallback = createSurface(host.current);
    let ready = false, closed = false, raf = 0, engine, time = 0, previous = null;
    function draw(timestamp) {
      raf = 0;
      const { frame, progress, visible } = sample.current;
      if (!visible || document.hidden) { previous = null; return; }
      if (previous !== null) time += Math.min((timestamp - previous) / 1000, 0.05);
      previous = timestamp;
      const { width, height } = frame;
      const ratio = Math.max(1, Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 1.25));
      gpu.style.display = ready ? 'block' : 'none';
      fallback.style.display = ready ? 'none' : 'block';
      if (ready) engine.render({ frame, progress, width, height, ratio, mobile, time });
      else drawFallback(fallback, frame, progress, mobile, ratio, time);
      schedule();
    }
    function schedule() {
      if (!closed && !raf) raf = requestAnimationFrame(draw);
    }
    try {
      engine = createVortexRenderer(gpu, {
        image, mobile,
        onReady: () => { ready = true; schedule(); },
        onFailure: () => { ready = false; schedule(); },
      });
    } catch { ready = false; }
    const onVisibility = () => { previous = null; schedule(); };
    document.addEventListener('visibilitychange', onVisibility);
    refresh.current = schedule;
    schedule();
    return () => {
      closed = true;
      document.removeEventListener('visibilitychange', onVisibility);
      refresh.current = null;
      cancelAnimationFrame(raf);
      engine?.dispose();
      gpu.remove();
      fallback.remove();
    };
  }, [armed, image, mobile]);

  return <div ref={host} className="studio-vortex" aria-hidden="true"
    style={{ visibility: visible ? 'visible' : 'hidden' }} />;
}
