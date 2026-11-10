import {
  BoxGeometry, CanvasTexture, Color, InstancedBufferAttribute, InstancedMesh, MeshStandardMaterial, Object3D, RepeatWrapping,
  SRGBColorSpace,
} from "three";
import { RACK_MATRIX } from "./tuning";

// Server-room wall: instanced racks whose status LEDs behave like falling code.
// One shared canvas texture is redrawn at RACK_MATRIX.rate; every rack reads it
// with its own row offset so the walls never repeat in lock-step.

const ROWS = 24;
const COLS = 14;
const ROW_H = 21;
const W = 256;
const H = 512;
const OFF = 0;
const AMBER = 1;
const WHITE = 2;
const RED = 3;

const rng = (seed) => {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
};

// Static chassis: dark 1U units and drive bays. LEDs are drawn on top each frame.
function drawChassis() {
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d");
  g.fillStyle = "#0b0d0f";
  g.fillRect(0, 0, W, H);
  for (let row = 0; row < ROWS; row++) {
    const y = row * ROW_H + 6;
    g.fillStyle = "#14171a";
    g.fillRect(10, y, 236, 17);
    g.fillStyle = "#050607";
    g.fillRect(10, y + 16, 236, 1.5);
    g.fillStyle = "#07080a";
    for (let k = 0; k < 5; k++) g.fillRect(150 + k * 18, y + 4, 12, 9);
  }
  return c;
}

function createLedField(seed) {
  const r = rng(seed);
  const kind = new Uint8Array(ROWS * COLS); // steady state of each LED
  const heat = new Float32Array(ROWS * COLS); // transient brightness from streams / flips
  const pick = () => {
    if (r() < 0.45) return OFF;
    const roll = r();
    return roll < 0.62 ? AMBER : roll < 0.86 ? WHITE : RED;
  };
  for (let i = 0; i < kind.length; i++) kind[i] = pick();
  const streams = Array.from({ length: COLS }, () => ({ head: -1, speed: 0, on: false }));

  function step() {
    const { streamChance, streamSpeed, flipChance, fade } = RACK_MATRIX;
    for (let i = 0; i < heat.length; i++) heat[i] *= fade;
    for (let i = 0; i < kind.length; i++) {
      if (r() < flipChance) {
        kind[i] = pick();
        heat[i] = 0.9;
      }
    }
    streams.forEach((s, col) => {
      if (!s.on) {
        if (r() < streamChance) Object.assign(s, { on: true, head: 0, speed: streamSpeed[0] + r() * (streamSpeed[1] - streamSpeed[0]) });
        return;
      }
      s.head += s.speed;
      const row = Math.floor(s.head);
      if (row >= ROWS) s.on = false;
      else heat[row * COLS + col] = 1;
    });
  }
  return { kind, heat, step };
}

function paintLeds(g, { kind, heat }) {
  for (let row = 0; row < ROWS; row++) {
    const y = row * ROW_H + 12;
    for (let col = 0; col < COLS; col++) {
      const i = row * COLS + col;
      const h = heat[i];
      let color = null;
      if (h > 0.85) color = `rgba(255,241,194,${Math.min(1, h)})`;
      else if (h > 0.08 && kind[i] !== RED) color = `rgba(255,179,0,${0.35 + h * 0.65})`;
      else if (kind[i] === AMBER) color = "#ffb300";
      else if (kind[i] === WHITE) color = "#fff1c2";
      else if (kind[i] === RED) color = "#7a1a10";
      if (!color) continue;
      g.fillStyle = color;
      g.fillRect(16 + col * 7, y, 3, 3);
    }
  }
}

export function createRackWall(placements) {
  const chassis = drawChassis();
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const g = canvas.getContext("2d");
  const leds = createLedField(3);
  const draw = () => {
    g.drawImage(chassis, 0, 0);
    paintLeds(g, leds);
  };
  draw();

  const texture = new CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;

  const material = new MeshStandardMaterial({
    color: 0x0f1113, metalness: 0.6, roughness: 0.5, map: texture,
    emissive: new Color(0xffffff), emissiveMap: texture, emissiveIntensity: 0.9,
  });
  // Per-rack vertical offset, in whole rows so LEDs stay aligned with their units.
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nattribute float aRowShift;")
      .replace(
        "#include <uv_vertex>",
        "#include <uv_vertex>\n#ifdef USE_MAP\nvMapUv.y += aRowShift;\n#endif\n#ifdef USE_EMISSIVEMAP\nvEmissiveMapUv.y += aRowShift;\n#endif",
      );
  };
  material.customProgramCacheKey = () => "rack-row-shift";

  const geometry = new BoxGeometry(1.7, 4.8, 1.1);
  const r = rng(11);
  const shifts = new Float32Array(placements.length);
  const mesh = new InstancedMesh(geometry, material, placements.length);
  const o = new Object3D();
  placements.forEach(([x, z, ry], i) => {
    o.position.set(x, 2.4, z);
    o.rotation.set(0, ry, 0);
    o.updateMatrix();
    mesh.setMatrixAt(i, o.matrix);
    mesh.setColorAt(i, new Color().setScalar(0.55 + r() * 0.45));
    shifts[i] = Math.floor(r() * ROWS) / ROWS;
  });
  geometry.setAttribute("aRowShift", new InstancedBufferAttribute(shifts, 1));
  mesh.receiveShadow = true;

  let acc = 0;
  return {
    mesh,
    update(dt, animate) {
      if (!animate) return;
      acc += dt;
      if (acc < 1 / RACK_MATRIX.rate) return;
      acc = 0;
      leds.step();
      draw();
      texture.needsUpdate = true;
    },
    dispose() {
      texture.dispose();
      material.dispose();
      geometry.dispose();
      mesh.dispose();
    },
  };
}
