import {
  BoxGeometry, BufferGeometry, CylinderGeometry, Float32BufferAttribute, Fog, Group, Mesh, PlaneGeometry, Points, PointsMaterial,
} from "three";
import { Conduit, circlePath, pathFrom } from "./conduits";
import { createHardware } from "./hardware";
import { createRackWall } from "./rack";
import { CUBE_SCALE, FACE_INWARD } from "./tuning";

// 3D layouts for the four scenes. Positions are in metres; every module is
// placed on real hardware (plinths, platforms) and projected to screen for its
// accessible logo/label button.

const floorPlane = (mats, size = 120) => {
  const f = new Mesh(new PlaneGeometry(size, size), mats.floor);
  f.rotation.x = -Math.PI / 2;
  f.receiveShadow = true;
  return f;
};

// Places a module (optionally on a plinth). Plinth and module share rotation and scale so the
// two always match. Modules with `drivesPedestal` hand their "active" glow to the plinth halo.
function addModule(ctx, id, mod, { x, z, y = 0, plinth, rotY = 0, scale = 1 }) {
  const { root, modules } = ctx;
  let base = y;
  mod.group.scale.setScalar(scale);
  if (plinth) {
    plinth.position.set(x, y, z);
    plinth.rotation.y = rotY;
    plinth.scale.setScalar(scale);
    root.add(plinth);
    base = y + plinth.userData.topY * scale;
    if (mod.drivesPedestal && plinth.userData.setGlow) mod.setLevel = plinth.userData.setGlow;
  }
  mod.group.position.set(x, base, z);
  mod.group.rotation.y = rotY;
  root.add(mod.group);
  modules[id] = mod;
}

function mountConduit(ctx, opts) {
  const c = new Conduit({ mats: ctx.mats, flash: ctx.pulseFlash, ...opts });
  c.mount(ctx.root);
  ctx.conduits.push(c);
  return c;
}

function scatterStars(count, radius) {
  const pts = [];
  for (let i = 0; i < count; i++) {
    const r = radius * (0.5 + Math.random() * 0.5);
    const a = Math.random() * Math.PI * 2;
    const b = Math.acos(2 * Math.random() - 1);
    pts.push(r * Math.sin(b) * Math.cos(a), r * Math.cos(b) * 0.7, -Math.abs(r * Math.sin(b) * Math.sin(a)) - 6);
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(pts, 3));
  return new Points(g, new PointsMaterial({ color: 0xaab4c4, size: 0.07, transparent: true, opacity: 0.55, sizeAttenuation: true }));
}

// ---------------------------------------------------------------------------
const SCENES = {
  // 01 — frosted cubes on a tiered circular platform --------------------------
  interface(ctx, mobile) {
    const { mats, hw, root } = ctx;
    const platformR = mobile ? 7.4 : 7.6;
    const platform = hw.platform(platformR, 0.4);
    root.add(platform);
    const y = platform.userData.topY;
    // [id, x, z, plinth height]. Desktop JavaScript sits JAVASCRIPT_SETBACK metres further
    // from the camera (−z) so its logo clears the TypeScript cube in front of it.
    const JAVASCRIPT_SETBACK = 1.4;
    const items = mobile
      ? [
          ["javascript", -4.2, 4.3, 0.35], ["typescript", 0, 4.6, 0.35], ["swift", 4.2, 4.3, 0.35],
          ["react", -2.2, 1.2, 1.0], ["nextjs", 2.2, 1.2, 1.0],
          ["tailwind", -2.3, -4.4, 0.7], ["motion", 2.3, -4.4, 0.7], ["three", -4.5, -1.4, 0.7], ["lucide", 4.5, -1.4, 0.7],
        ]
      : [
          ["react", -1.8, -2.7, 1.0], ["nextjs", 1.7, -2.9, 1.0],
          ["javascript", -4.9, -0.3 - JAVASCRIPT_SETBACK, 0.35], ["typescript", -3.3, 2.8, 0.35], ["swift", -0.5, 3.3, 0.35],
          ["tailwind", 4.9, -1.8, 0.7], ["motion", 5.6, 1.3, 0.7], ["three", 3.0, 3.0, 0.7], ["lucide", 1.3, 0.4, 0.35],
        ];
    const scale = CUBE_SCALE[mobile ? "mobile" : "desktop"];
    for (const [id, x, z, h] of items) {
      // Cube and plinth turn together, slightly toward the platform centre.
      addModule(ctx, id, hw.cube(), { x, z, y, plinth: hw.plinth(1.9, h, 1.9, { glow: true }), rotY: Math.atan2(-x * FACE_INWARD, 1), scale });
    }
    const rim = mountConduit(ctx, { curve: circlePath(platformR - 0.05, 0.42, 72), sleeve: false, wrap: true, radius: 0.028, trail: 0.1, cycle: 7, travel: 3.6, seed: 1 });
    ctx.charges = () => {
      rim.target = 0.6;
    };
    ctx.selectLight = { intensity: 0 }; // activity shows on the pedestal halo, not as light on the glass
    ctx.camera = mobile
      ? { fov: 36, pos: [0, 20, 28], target: [0, 0.2, 0.8] }
      : { fov: 27, pos: [0, 10.2, 20], target: [-4.0, 0.7, 0] };
    ctx.background = 0x07090b;
    ctx.fog = new Fog(0x07090b, 28, 60);
    root.add(floorPlane(mats));
  },

  // 02 — frosted hexagons in a server room -------------------------------------
  services(ctx, mobile) {
    const { mats, hw, root } = ctx;
    root.add(floorPlane(mats));
    const spec = mobile
      ? { supabase: [-2.9, -2.4, 1.2], resend: [2.9, -2.4, 1.2], cloudinary: [0, 2.4, 0.55] }
      : { supabase: [-6.2, -0.6, 1.3], resend: [2.6, -1.0, 1.3], cloudinary: [-1.8, 1.6, 0.55] };
    for (const [id, [x, z, h]] of Object.entries(spec)) {
      addModule(ctx, id, hw.hex(), { x, z, plinth: hw.hexPlinth(1.0, h, { glow: true }) });
    }
    const top = (id) => ctx.modules[id].group.position;
    const s = top("supabase"), r = top("resend"), c = top("cloudinary");
    const mid = (a, b, t) => [a.x + (b.x - a.x) * t, 0, a.z + (b.z - a.z) * t];
    const arc = (a, b, lift, y0 = 1.1) => [
      [a.x, a.y + y0, a.z - 0.1],
      [a.x + (b.x - a.x) * 0.2, a.y + lift * 0.8, a.z + (b.z - a.z) * 0.2 - 0.6],
      [mid(a, b, 0.5)[0], Math.max(a.y, b.y) + lift, mid(a, b, 0.5)[2] - 0.9],
      [a.x + (b.x - a.x) * 0.8, b.y + lift * 0.8, a.z + (b.z - a.z) * 0.8 - 0.6],
      [b.x, b.y + y0, b.z - 0.1],
    ];
    const low = (a, b, bow) => [
      [a.x, 0.3, a.z],
      [a.x + (b.x - a.x) * 0.3, 0.32, a.z + (b.z - a.z) * 0.3 + bow],
      [a.x + (b.x - a.x) * 0.7, 0.32, a.z + (b.z - a.z) * 0.7 + bow * 0.6],
      [b.x, 0.3, b.z],
    ];
    const sr = mountConduit(ctx, { curve: pathFrom(arc(s, r, 2.2)), radius: 0.035, seed: 0 });
    const sc = mountConduit(ctx, { curve: pathFrom(low(s, c, 1.4)), radius: 0.035, seed: 1 });
    const cr = mountConduit(ctx, { curve: pathFrom(low(c, r, 1.0)), radius: 0.035, seed: 2 });
    ctx.charges = (sel) => {
      for (const [cd, a, b] of [[sr, "supabase", "resend"], [sc, "supabase", "cloudinary"], [cr, "cloudinary", "resend"]]) {
        cd.target = sel === a || sel === b ? 1 : 0.5;
      }
    };

    // Server racks: back wall and two side aisles, with LEDs scrolling like code.
    const placements = [];
    for (let x = -18; x <= 18; x += 1.85) placements.push([x, -11, 0]);
    for (let z = -9; z <= 5; z += 1.85) placements.push([-13.5, z, Math.PI / 2], [13.5, z, -Math.PI / 2]);
    const wall = createRackWall(placements);
    root.add(wall.mesh);
    ctx.disposables.push(wall);
    ctx.update = (time, dt, animate) => wall.update(dt, animate);
    ctx.selectLight = { intensity: 0 };
    ctx.camera = mobile
      ? { fov: 36, pos: [0, 7.5, 18], target: [0, 1.0, 0] }
      : { fov: 27, pos: [0, 3.8, 20], target: [2.3, 1.7, -0.5] };
    ctx.background = 0x050607;
    ctx.fog = new Fog(0x050607, 16, 44);
  },

  // 03 — frosted spheres around a central apparatus --------------------------
  ai(ctx, mobile) {
    const { hw, root } = ctx;
    const core = hw.apparatus();
    root.add(core.group);
    ctx.apparatus = core;
    const spots = mobile
      ? { chatgpt: [0, 4.6, -0.5], claude: [-3.6, 1.4, 0.6], grok: [3.6, 1.4, 0.6], codex: [-2.5, -3.6, 1.2], gemini: [2.5, -3.6, 1.2] }
      : { chatgpt: [0.2, 3.5, -0.5], claude: [-4.7, 0.7, 0.8], grok: [4.9, 1.7, -0.4], codex: [-2.7, -2.5, 1.8], gemini: [3.2, -2.4, 1.5] };
    const tethers = [];
    let seed = 0;
    for (const [id, [x, y, z]] of Object.entries(spots)) {
      const mod = hw.sphere(0.9, true);
      mod.group.position.set(x, y, z);
      root.add(mod.group);
      ctx.modules[id] = mod;
      const bow = [x * 0.5 + (y > 0 ? 0 : 0.4), y * 0.5 + 0.5, z * 0.5 + 0.4];
      tethers.push([id, mountConduit(ctx, { curve: pathFrom([[0, 0, 0], bow, [x, y, z]]), radius: 0.018, sleeve: true, seed: seed++, cycle: 6.5 })]);
    }
    const ringSpecs = mobile
      ? [[3.4, 0.0], [4.6, 0.25], [5.8, -0.2]]
      : [[3.4, 0.0], [4.6, 0.3], [5.8, -0.25], [7.0, 0.12], [8.2, -0.1]];
    ctx.rings = ringSpecs.map(([r, tilt], i) => {
      const curve = circlePath(r, 0, 64);
      const c = mountConduit(ctx, { curve, radius: 0.012, sleeve: false, wrap: true, trail: 0.1, cycle: 8 + i * 1.3, travel: 4.2, seed: i + 3 });
      c.object.rotation.set(Math.PI / 2 - 1.28 + tilt * 0.4, i * 0.18, tilt * 0.3);
      c.target = 0.3;
      return c;
    });
    ctx.charges = (sel) => {
      for (const [id, c] of tethers) c.target = id === sel ? 1 : 0.55;
    };
    root.add(scatterStars(mobile ? 160 : 320, 38));
    ctx.camera = mobile ? { fov: 36, pos: [0, 1.5, 21], target: [0, 0, 0] } : { fov: 27, pos: [0, 2.2, 21], target: [-4.2, 0, 0] };
    ctx.background = 0x04050a;
    ctx.noShadow = true;
    ctx.update = (time, dt, animate) => {
      if (!animate) return;
      core.lattice.rotation.y = time * 0.25;
      core.lattice.rotation.x = time * 0.12;
      core.dust.rotation.y = -time * 0.18;
      const k = 1 + 0.06 * Math.sin(time * 1.3);
      core.heart.scale.setScalar(k);
    };
  },

  // 04 — vaults on pedestals along a charged rail ----------------------------
  deployment(ctx, mobile) {
    const { mats, hw, root } = ctx;
    // Rail pulses run at floor level, so their light and spark are kept smaller and dimmer here.
    ctx.pulseLight = { intensity: 3, distance: 2.2, lift: 0.35 };
    ctx.pulseFlash = { size: 0.12, growth: 0.15, opacity: 0.45 };
    root.add(floorPlane(mats));
    const spec = mobile
      ? { vscode: [-2.7, -4.6, 0.7], stackblitz: [2.7, -4.6, 0.7], vite: [0, -0.8, 0.7], github: [0, 3.0, 0.7], vercel: [0, 6.8, 0.7] }
      : { vscode: [-9.4, -3.4, 0.8], stackblitz: [-5.7, 2.5, 0.8], vite: [-2.7, -0.2, 0.8], github: [0.9, 0, 0.8], vercel: [4.4, 0.1, 0.8] };
    for (const [id, [x, z, h]] of Object.entries(spec)) {
      addModule(ctx, id, hw.vault(), { x, z, plinth: hw.plinth(2.3, h, 1.7, { glow: true }) });
    }
    const p = (id) => ctx.modules[id].group.position;
    const rail = (a, b, via = []) => [[a.x, 0.24, a.z], ...via.map(([x, z]) => [x, 0.24, z]), [b.x, 0.24, b.z]];
    const v = (id) => p(id);
    const connect = (a, b, i, via) => mountConduit(ctx, { curve: pathFrom(rail(v(a), v(b), via)), radius: 0.05, seed: i, cycle: 5, travel: 1.7 });
    const mid = (a, b, t, off = 0) => [v(a).x + (v(b).x - v(a).x) * t, v(a).z + (v(b).z - v(a).z) * t + off];
    const cons = [
      ["vscode", "vite", connect("vscode", "vite", 0, [mid("vscode", "vite", 0.5, 0.2)])],
      ["stackblitz", "vite", connect("stackblitz", "vite", 1, [mid("stackblitz", "vite", 0.5, -0.2)])],
      ["vite", "github", connect("vite", "github", 2, [mid("vite", "github", 0.5)])],
      ["github", "vercel", connect("github", "vercel", 3, [mid("github", "vercel", 0.5)])],
    ];
    const order = ["vscode", "stackblitz", "vite", "github", "vercel"];
    ctx.charges = (sel) => {
      for (const [from, , c] of cons) c.target = order.indexOf(sel) >= order.indexOf(from) ? 1 : 0.4;
    };
    // Industrial backdrop: columns, overhead pipes, vertical light slits.
    const columnGeo = new BoxGeometry(1.1, 11, 1.1);
    for (let x = -22; x <= 22; x += 5.5) {
      const col = new Mesh(columnGeo, mats.paint);
      col.position.set(x, 5.5, -10);
      col.castShadow = true;
      root.add(col);
      const slit = new Mesh(new BoxGeometry(0.06, 7, 0.06), mats.glowYellow);
      slit.position.set(x + 0.6, 4.2, -9.4);
      root.add(slit);
    }
    const pipeGeo = new CylinderGeometry(0.35, 0.35, 60, 20);
    for (const y of [8.4, 9.6]) {
      const pipe = new Mesh(pipeGeo, mats.metal);
      pipe.rotation.z = Math.PI / 2;
      pipe.position.set(0, y, -9.2);
      root.add(pipe);
    }
    ctx.camera = mobile
      ? { fov: 36, pos: [0, 17, 17], target: [0, 0.4, 1.0] }
      : { fov: 27, pos: [0, 7.8, 22], target: [2.4, 1.0, 0] };
    ctx.background = 0x050607;
    ctx.fog = new Fog(0x050607, 18, 48);
    // No point light on the active vault (its pedestal halo does the work); no yellow strip reflection on the left.
    ctx.selectLight = { intensity: 0 };
    ctx.environment = { practicals: { left: false } };
  },
};

export function buildScene(id, mats, mobile) {
  const ctx = {
    mats, hw: createHardware(mats), root: new Group(), modules: {}, conduits: [], disposables: [],
    charges: () => {}, update: null, selectLight: {}, pulseLight: {}, pulseFlash: {}, environment: {},
  };
  SCENES[id](ctx, mobile);
  return ctx;
}
