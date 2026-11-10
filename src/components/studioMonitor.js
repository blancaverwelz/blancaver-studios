// Monitor coordinates in the original 1536 × 1024 lobby photograph.
export const MONITOR = { x: 951, y: 508, width: 38, height: 28 };
export const clamp01 = x => Math.max(0, Math.min(1, x));
export const easeRange = (x, a, b) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

export function monitorFrame(width, height, progress) {
  const cover = Math.max(width / 1536, height / 1024);
  const x = (width - 1536 * cover) * .6 + MONITOR.x * cover;
  const y = (height - 1024 * cover) * .5 + MONITOR.y * cover;
  // R16: complete the closer approach before the energy gathers and opens.
  // The photo stops early; the procedural funnel supplies the remaining motion.
  const approach = easeRange(progress, .02, .28);
  const scale = 1.025 + (width <= 680 ? .255 : .355) * approach;
  const initialX = width * .65 + (x - width * .65) * 1.025;
  const initialY = height * .5 + (y - height * .5) * 1.025;
  const targetX = initialX + (width / 2 - initialX) * .40 * approach;
  const targetY = initialY + (height / 2 - initialY) * .40 * approach;
  // Keep photo edges outside the viewport while gently reframing.
  const tx = Math.max(width * (1 - scale), Math.min(0, targetX - x * scale));
  const ty = Math.max(height * (1 - scale), Math.min(0, targetY - y * scale));
  const opening = easeRange(progress, .46, .88);
  const centering = easeRange(progress, .50, .85);
  const centerX = x * scale + tx + (width / 2 - (x * scale + tx)) * centering;
  const centerY = y * scale + ty + (height / 2 - (y * scale + ty)) * centering;
  const seed = MONITOR.height * cover * scale * .46;
  const coveringRadius = Math.hypot(Math.max(centerX, width - centerX), Math.max(centerY, height - centerY)) + 8;
  const radius = seed + (coveringRadius / .92 - seed) * Math.pow(opening, 1.65);
  return {
    width, height, tx, ty, seed, scale, centerX, centerY, radius,
    rotation: 335 * easeRange(progress, .23, .93),
    vortexOpacity: easeRange(progress, .40, .48) * (1 - easeRange(progress, .87, .99)),
    transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
    clipPath: `circle(${radius * .92}px at ${centerX}px ${centerY}px)`,
  };
}

