import { easeRange } from "../studioMonitor.js";

const TAU = Math.PI * 2;
const noise = (n) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

function glow(ctx, x, y, radius, color, strength) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
  g.addColorStop(0, `rgba(${color},${strength})`);
  g.addColorStop(0.3, `rgba(${color},${strength * 0.32})`);
  g.addColorStop(1, `rgba(${color},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

// Deterministic Canvas 2D artwork: lighting, depth layers and turbulent strands
// use scroll progress and elapsed active time; no image asset or WebGL context.
export function paintVortex(ctx, frame, progress, mobile, time = 0) {
  const { centerX: cx, centerY: cy, radius: r } = frame;
  if (progress < 0.22 || progress >= 0.99) return;
  const charge =
    easeRange(progress, 0.22, 0.39) * (1 - easeRange(progress, 0.43, 0.57));
  const spin = (frame.rotation * Math.PI) / 180;
  const innerSpin = progress * 12 + time * 0.65;
  ctx.save();
  ctx.translate(cx, cy);

  // The monitor emits a steady amber glow; filaments converge before opening.
  if (charge > 0) {
    const size = frame.seed * (1.3 + charge * 1.5);
    ctx.globalCompositeOperation = "screen";
    glow(ctx, 0, 0, size * 3.8, "255,211,1", 0.32 * charge);
    glow(ctx, 0, 0, size * 0.9, "255,230,94", 0.8 * charge);
    for (let arm = 0; arm < 6; arm++) {
      ctx.beginPath();
      for (let j = 0; j <= 28; j++) {
        const t = j / 28;
        const a = (arm * TAU) / 6 + spin + t * 2.1;
        const distance = size * (0.18 + 2.25 * (1 - t));
        const jag =
          Math.sin(j * 2.7 + arm * 3) * 0.075 * size * Math.sin(t * Math.PI);
        const x = Math.cos(a) * distance + jag,
          y = Math.sin(a) * distance - jag;
        if (j) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
      }
      ctx.strokeStyle = `rgba(255,211,1,${charge * 0.7})`;
      ctx.lineWidth = Math.max(0.7, frame.seed * 0.035);
      ctx.stroke();
    }
    ctx.globalCompositeOperation = "source-over";
  }

  if (frame.vortexOpacity <= 0) {
    ctx.restore();
    return;
  }
  ctx.globalAlpha = frame.vortexOpacity;
  const body = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 1.06);
  body.addColorStop(0, "#020202");
  body.addColorStop(0.73, "#0d0d0d");
  body.addColorStop(0.94, "rgba(9,9,9,.99)");
  body.addColorStop(1, "rgba(9,9,9,0)");
  ctx.fillStyle = body;
  ctx.fillRect(-r * 1.06, -r * 1.06, r * 2.12, r * 2.12);

  // Offset the vanishing point: layered walls curve into a deep throat.
  const point = (rad, angle) => ({
    x: Math.cos(angle) * rad * r + 0.095 * r * (1 - rad),
    y: Math.sin(angle) * rad * r * 0.94 - 0.065 * r * (1 - rad),
  });

  // Soft, overlapping cloud volumes form uneven lit/dark spiral walls.
  const clouds = mobile ? 72 : 132;
  for (let i = 0; i < clouds; i++) {
    const rad = 0.17 + 0.8 * noise(i + 4);
    const angle =
      ((i % 5) * TAU) / 5 + innerSpin + (1 - rad) * 8.8 + noise(i + 21) * 0.45;
    const p = point(rad, angle);
    const light = 0.28 + 0.72 * Math.pow(Math.max(0, Math.cos(angle + 0.8)), 2);
    const warm = i % 5 === 0;
    glow(
      ctx,
      p.x,
      p.y,
      r * (0.075 + 0.15 * noise(i + 18)) * rad,
      warm ? "151,122,12" : "80,80,80",
      (0.17 + 0.28 * light) * rad,
    );
  }

  // Hundreds of tapered, broken strands replace the flat six-ribbon pattern.
  const strands = mobile ? 100 : 190;
  for (let i = 0; i < strands; i++) {
    const base = 0.17 + 0.82 * noise(i + 100);
    const length = 0.13 + 0.3 * noise(i + 400);
    const phase = ((i % 5) * TAU) / 5 + noise(i + 28) * 0.75 + innerSpin;
    ctx.beginPath();
    for (let j = 0; j <= 80; j++) {
      const t = j / 80;
      const rad = Math.max(0.105, base - length * t);
      const angle = phase + t * 2.1 + (1 - rad) * 6.3;
      const rough =
        1 + 0.009 * Math.sin(t * 18 + i * 7) + 0.004 * Math.sin(t * 39 + i);
      const p = point(rad * rough, angle);
      if (j) ctx.lineTo(p.x, p.y);
      else ctx.moveTo(p.x, p.y);
    }
    const start = point(base, phase + (1 - base) * 6.3);
    const endRad = Math.max(0.105, base - length);
    const end = point(endRad, phase + 2.1 + (1 - endRad) * 6.3);
    const g = ctx.createLinearGradient(start.x, start.y, end.x, end.y);
    const warm = i % 7 === 0;
    const color = warm ? "232,189,12" : i % 3 ? "108,108,108" : "18,18,18";
    const strength = (0.12 + 0.35 * noise(i + 30)) * base;
    g.addColorStop(0, `rgba(${color},0)`);
    g.addColorStop(0.3, `rgba(${color},${strength})`);
    g.addColorStop(0.78, `rgba(${color},${strength * 0.42})`);
    g.addColorStop(1, `rgba(${color},0)`);
    ctx.strokeStyle = g;
    if (i % 4 === 0) {
      ctx.globalAlpha = frame.vortexOpacity * 0.28;
      ctx.lineWidth = r * 0.024 * base;
      ctx.stroke();
      ctx.globalAlpha = frame.vortexOpacity;
    }
    ctx.lineWidth = Math.max(0.5, r * (0.0005 + 0.003 * noise(i + 44)) * base);
    ctx.lineCap = "round";
    ctx.stroke();
  }

  // Fixed pixel cores; crossfade new positions throughout expansion and pauses.
  const cycle = Math.max(0, progress - 0.4) * 16 + time * 0.8;
  const epoch = Math.floor(cycle);
  const blend = easeRange(cycle - epoch, 0, 1);
  for (let field = 0; field < 2; field++) {
    const weight = field ? blend : 1 - blend;
    for (let i = 0; i < (mobile ? 90 : 180); i++) {
      const seed = i + (epoch + field) * 997;
      const star = point(
        0.08 + 0.68 * noise(seed + 1008),
        noise(seed + 701) * TAU,
      );
      glow(ctx, star.x, star.y, 1, "255,228,86", 0.6 * weight);
    }
  }

  // Fine orbital debris and long inward trails create foreground/background scale.
  ctx.globalCompositeOperation = "screen";
  const count = mobile ? 65 : 150;
  for (let i = 0; i < count; i++) {
    const travel = Math.max(0, progress - 0.44) + time * 0.08;
    const rad = 0.14 + ((noise(i + 700) + 1 - travel * 0.57) % 1) * 0.83;
    const a = i * 2.39996 + innerSpin + travel * 3 + (1 - rad) * 6;
    const p = point(rad, a);
    const hot = i % 11 === 0;
    const alpha = (0.1 + 0.5 * noise(i + 64)) * rad;
    const tail = point(
      Math.max(0.1, rad - 0.018 - 0.025 * noise(i + 31)),
      a + 0.035,
    );
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(tail.x, tail.y);
    ctx.strokeStyle = `rgba(${hot ? "255,231,104" : "155,137,70"},${alpha})`;
    ctx.lineWidth = 0.65;
    ctx.stroke();
    if (hot) glow(ctx, p.x, p.y, 2, "255,211,1", 0.25 * rad);
  }
  ctx.globalCompositeOperation = "source-over";

  // Deep central occlusion conceals the inner endpoints and prevents a flat disc.
  const depth = ctx.createRadialGradient(
    r * 0.095,
    -r * 0.065,
    r * 0.03,
    r * 0.075,
    -r * 0.05,
    r * 0.46,
  );
  depth.addColorStop(0, "#010101");
  depth.addColorStop(0.3, "rgba(0,0,0,1)");
  depth.addColorStop(0.61, "rgba(0,0,0,.82)");
  depth.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = depth;
  ctx.fillRect(-r, -r, r * 2, r * 2);
  ctx.restore();
}
