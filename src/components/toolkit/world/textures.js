import { CanvasTexture, NoColorSpace, RepeatWrapping, SRGBColorSpace } from "three";

// Procedural surface detail (roughness / bump / emissive) so metals and floors
// carry fine grain instead of reading as flat CG colour.

const makeCanvas = (w, h = w) => {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
};
const rng = (seed) => {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
};
const finish = (canvas, { repeat = [1, 1], srgb = false } = {}) => {
  const t = new CanvasTexture(canvas);
  t.wrapS = t.wrapT = RepeatWrapping;
  t.repeat.set(repeat[0], repeat[1]);
  t.anisotropy = 4;
  t.colorSpace = srgb ? SRGBColorSpace : NoColorSpace;
  return t;
};

export function brushedTexture(seed = 1, repeat = [2, 2]) {
  const c = makeCanvas(512);
  const g = c.getContext("2d");
  const r = rng(seed);
  g.fillStyle = "#808080";
  g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 2600; i++) {
    const a = 0.04 + r() * 0.12;
    const x = r() * 512;
    const y = Math.floor(r() * 512);
    const len = 30 + r() * 320;
    g.fillStyle = r() > 0.5 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a})`;
    g.fillRect(x, y, len, 1);
    g.fillRect(x - 512, y, len, 1);
  }
  return finish(c, { repeat });
}

export function grainTexture(seed = 2, repeat = [3, 3]) {
  const c = makeCanvas(256);
  const g = c.getContext("2d");
  const img = g.createImageData(256, 256);
  const r = rng(seed);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 128 + (r() - 0.5) * 80;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return finish(c, { repeat });
}

export function floorTexture(repeat = [10, 10]) {
  const c = makeCanvas(512);
  const g = c.getContext("2d");
  const r = rng(7);
  g.fillStyle = "#6a6a6a";
  g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 9000; i++) {
    const v = 70 + r() * 90;
    g.fillStyle = `rgba(${v},${v},${v},0.35)`;
    g.fillRect(r() * 512, r() * 512, 1 + r() * 3, 1 + r() * 3);
  }
  g.strokeStyle = "#1c1c1c";
  g.lineWidth = 3;
  for (const p of [0, 256]) {
    g.strokeRect(p, 0, 256, 512);
    g.beginPath();
    g.moveTo(0, p);
    g.lineTo(512, p);
    g.stroke();
  }
  return finish(c, { repeat });
}

export function glowTexture() {
  const c = makeCanvas(128);
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.25, "rgba(255,255,255,0.45)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  return finish(c, { srgb: true });
}

// Glow outline for pedestal tops: a square (4) or hexagon (6) with a soft falloff. The outline
// sits `inset` px inside the canvas; the blur beyond it is the halo.
export const FRAME_GLOW = { size: 128, inset: 24, blur: 10 };
export function frameGlowTexture(sides = 4) {
  const { size, inset, blur } = FRAME_GLOW;
  const c = makeCanvas(size);
  const g = c.getContext("2d");
  g.shadowColor = "rgba(255,255,255,1)";
  g.shadowBlur = blur;
  g.strokeStyle = "rgba(255,255,255,0.9)";
  g.lineWidth = 4;
  if (sides === 4) {
    g.strokeRect(inset, inset, size - inset * 2, size - inset * 2);
  } else {
    const r = size / 2 - inset;
    g.beginPath();
    for (let i = 0; i < sides; i++) {
      const a = Math.PI / 6 + (i / sides) * Math.PI * 2; // same orientation as the hexagon pedestal
      g[i ? "lineTo" : "moveTo"](size / 2 + Math.cos(a) * r, size / 2 - Math.sin(a) * r);
    }
    g.closePath();
    g.stroke();
  }
  return finish(c, { srgb: true });
}
