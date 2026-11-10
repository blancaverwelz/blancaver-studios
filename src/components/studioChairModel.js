import * as THREE from "three";
import { mergeGeometries, mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";

/*
 * Shared "Everyday Chair" — used by SpatialWorkbench and StudioSpatialEnvironment.
 *
 * Public API (unchanged):  createStudioChair(wood, upholstery) -> THREE.Group
 * New (optional):          createChairMaterials(woodColor, unitScale) -> { wood, fabric }
 *
 * Local units: chair is ~1 wide, ~0.9 deep, ~1.7 tall, feet at y = 0.04, facing +z.
 * Everything is procedural: no assets, no dependencies beyond three/addons.
 * The whole chair is 3 meshes (wood, upholstery, glides) = 3 draw calls.
 */

const TAU = Math.PI * 2;

// ---------------------------------------------------------------- textures

function rng(seed) {
  let s = seed >>> 0;
  return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
}

// Canvases are cached so remounting a viewer doesn't repaint them.
let woodCanvas, fabricCanvas;

// Tileable walnut-style grain: flat-sawn cathedrals, latewood lines, fibre streaks, pores.
// Greyscale-warm so the material colour (finish) tints it. Texture covers 0.35 x 0.70 units.
function paintWood() {
  if (woodCanvas) return woodCanvas;
  const W = 512, H = 1024;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d");
  const img = ctx.createImageData(W, H), d = img.data;
  const rnd = rng(11);
  const raw = new Float32Array(W);
  for (let i = 0; i < W; i++) raw[i] = rnd();
  const fibre = raw.map((v, i) => (raw[(i + W - 1) % W] + v * 2 + raw[(i + 1) % W]) / 4);

  for (let y = 0; y < H; y++) {
    const v = y / H;
    for (let x = 0; x < W; x++) {
      const u = x / W;
      // ring coordinate; every term is periodic in u and v so the tile is seamless
      const s = 14 * u
        + 0.4 * Math.sin(TAU * (v + 0.2 + 0.08 * Math.sin(TAU * 2 * u)))
        + 0.12 * Math.sin(TAU * (2 * v + 3 * u + 0.6))
        + 0.05 * Math.sin(TAU * (5 * v - 4 * u));
      const ring = s - Math.floor(s);
      const late = ring * ring * ring;
      const line = Math.exp(-(((ring - 0.93) / 0.05) ** 2));
      let L = 0.92 - 0.27 * late - 0.08 * line;
      L += (fibre[x] - 0.5) * 0.24 * (0.6 + 0.4 * Math.sin(TAU * (3 * v + 5 * u)));
      L += 0.03 * Math.sin(TAU * (110 * u + 0.8 * Math.sin(TAU * (3 * v + u))));
      L = Math.min(1, Math.max(0.22, L));
      const i = (y * W + x) * 4;
      d[i] = L * 255; d[i + 1] = L * 243; d[i + 2] = L * 226; d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  // open pores: short dark flecks along the grain
  for (let n = 0; n < 1500; n++) {
    ctx.fillStyle = `rgba(38,20,9,${0.1 + 0.25 * rnd()})`;
    ctx.fillRect(rnd() * W, rnd() * H, 1, 3 + rnd() * 12);
  }
  return (woodCanvas = c);
}

// Tileable plain-weave with slubs and a very soft tonal pattern. Covers 0.4 x 0.4 units.
function paintFabric() {
  if (fabricCanvas) return fabricCanvas;
  const N = 256;
  const c = document.createElement("canvas");
  c.width = c.height = N;
  const ctx = c.getContext("2d");
  const img = ctx.createImageData(N, N), d = img.data;
  const hash = (a, b) => {
    let h = (Math.imul(a, 374761393) + Math.imul(b, 668265263)) >>> 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
    return (h >>> 8) / 16777216;
  };
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const cx = x >> 2, cy = y >> 2;
      const over = (cx + cy) & 1;
      const px = (x & 3) + 0.5, py = (y & 3) + 0.5;
      const thread = Math.sin((Math.PI * (over ? py : px)) / 4);
      let L = 0.5 + 0.38 * thread;
      L *= 0.9 + 0.2 * hash(over ? cx : cx + 977, over ? cy + 31 : cy);
      const u = x / N, v = y / N;
      L += 0.05 * Math.sin(TAU * (2 * u + 0.6 * Math.sin(TAU * v))) * Math.sin(TAU * (3 * v + 0.4 * Math.sin(TAU * u)));
      L = Math.min(1, Math.max(0.1, L));
      const i = (y * N + x) * 4;
      d[i] = L * 250; d[i + 1] = L * 252; d[i + 2] = L * 255; d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return (fabricCanvas = c);
}

function makeTexture(canvas) {
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/**
 * Physically based chair materials. `unitScale` is the scale you will give the chair
 * (bump height is in scene units, so it needs to follow the chair's scale).
 * `wood.color` is the finish colour — change it freely, the grain multiplies on top.
 */
export function createChairMaterials(woodColor = "#68432d", unitScale = 1) {
  const woodMap = makeTexture(paintWood());
  const fabricMap = makeTexture(paintFabric());
  const wood = new THREE.MeshPhysicalMaterial({
    color: woodColor,
    map: woodMap,
    bumpMap: woodMap,
    bumpScale: 0.0035 * unitScale,
    roughness: 0.5,
    metalness: 0,
    clearcoat: 0.35,
    clearcoatRoughness: 0.32,
  });
  const fabric = new THREE.MeshPhysicalMaterial({
    color: "#363b3c",
    map: fabricMap,
    bumpMap: fabricMap,
    bumpScale: 0.02 * unitScale,
    roughness: 0.94,
    metalness: 0,
    sheen: 1,
    sheenRoughness: 0.6,
    sheenColor: new THREE.Color("#8d979b"),
  });
  return { wood, fabric };
}

// ---------------------------------------------------------------- geometry helpers

function roundedRectPath(target, w, h, r) {
  const x = -w / 2, y = -h / 2, P = Math.PI;
  target.moveTo(x + r, y);
  target.lineTo(x + w - r, y);
  target.absarc(x + w - r, y + r, r, -P / 2, 0, false);
  target.lineTo(x + w, y + h - r);
  target.absarc(x + w - r, y + h - r, r, 0, P / 2, false);
  target.lineTo(x + r, y + h);
  target.absarc(x + r, y + h - r, r, P / 2, P, false);
  target.lineTo(x, y + r);
  target.absarc(x + r, y + r, r, P, (3 * P) / 2, false);
  return target;
}

// Weld vertices so normals are smooth across bevels.
function weld(g) {
  g.deleteAttribute("uv");
  g.deleteAttribute("normal");
  const m = mergeVertices(g, 1e-4);
  g.dispose();
  return m;
}

// Conforming edge-split refinement: every edge longer than maxEdge is split at its
// midpoint (no T-junctions), so later bends/domes have vertices to move.
function refine(g, maxEdge, maxPasses = 6) {
  const pos = Array.from(g.attributes.position.array);
  let idx = Array.from(g.index.array);
  const max2 = maxEdge * maxEdge;
  const d2 = (a, b) => {
    const dx = pos[3 * a] - pos[3 * b], dy = pos[3 * a + 1] - pos[3 * b + 1], dz = pos[3 * a + 2] - pos[3 * b + 2];
    return dx * dx + dy * dy + dz * dz;
  };
  for (let pass = 0; pass < maxPasses; pass++) {
    const mid = new Map();
    let any = false;
    const split = (a, b) => {
      if (d2(a, b) <= max2) return -1;
      const k = a < b ? a * 1e7 + b : b * 1e7 + a;
      let m = mid.get(k);
      if (m === undefined) {
        m = pos.length / 3;
        pos.push((pos[3 * a] + pos[3 * b]) / 2, (pos[3 * a + 1] + pos[3 * b + 1]) / 2, (pos[3 * a + 2] + pos[3 * b + 2]) / 2);
        mid.set(k, m);
      }
      any = true;
      return m;
    };
    const out = [];
    for (let t = 0; t < idx.length; t += 3) {
      const a = idx[t], b = idx[t + 1], c = idx[t + 2];
      const ab = split(a, b), bc = split(b, c), ca = split(c, a);
      const n = (ab >= 0) + (bc >= 0) + (ca >= 0);
      if (n === 0) out.push(a, b, c);
      else if (n === 3) out.push(a, ab, ca, ab, b, bc, ca, bc, c, ab, bc, ca);
      else if (n === 1) {
        if (ab >= 0) out.push(a, ab, c, ab, b, c);
        else if (bc >= 0) out.push(b, bc, a, bc, c, a);
        else out.push(c, ca, b, ca, a, b);
      } else if (ab >= 0 && bc >= 0) out.push(ab, b, bc, a, ab, bc, a, bc, c);
      else if (bc >= 0 && ca >= 0) out.push(bc, c, ca, b, bc, ca, b, ca, a);
      else out.push(ca, a, ab, c, ca, ab, c, ab, b);
    }
    idx = out;
    if (!any) break;
  }
  const r = new THREE.BufferGeometry();
  r.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  r.setIndex(idx);
  g.dispose();
  return r;
}

function extrude(shape, depth, bevel, segments) {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth, steps: 1, bevelEnabled: true,
    bevelThickness: bevel, bevelSize: bevel, bevelSegments: segments, curveSegments: 8,
  });
  g.center();
  return g;
}

// Flat profile extruded and stood up so the thickness runs along +y; welded and refined.
function slab(shape, depth, bevel, { segments = 4, refineTo = 0.05 } = {}) {
  const g = extrude(shape, depth, bevel, segments);
  g.rotateX(-Math.PI / 2);
  return refine(weld(g), refineTo);
}

// Same, but left upright (thickness along z) — for the backrest.
function upright(shape, depth, bevel, { segments = 4, refineTo = 0.05 } = {}) {
  return refine(weld(extrude(shape, depth, bevel, segments)), refineTo);
}

// Box-projected UVs. `grain` is the axis the grain/threads run along (0=x,1=y,2=z); it can
// be chosen per vertex via `pick(x, y, z)`. Faces at the grain's end get end-grain mapping.
function projectUV(g, grain, tu, tv, pick) {
  const p = g.attributes.position, n = g.attributes.normal;
  const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const pos = [p.getX(i), p.getY(i), p.getZ(i)];
    const nor = [Math.abs(n.getX(i)), Math.abs(n.getY(i)), Math.abs(n.getZ(i))];
    const gi = pick ? pick(pos[0], pos[1], pos[2]) : grain;
    const a = nor[0] >= nor[1] && nor[0] >= nor[2] ? 0 : nor[1] >= nor[2] ? 1 : 2;
    let u, v;
    if (a === gi) {
      const o = [0, 1, 2].filter((k) => k !== gi);
      u = pos[o[0]]; v = pos[o[1]];
    } else {
      v = pos[gi];
      u = pos[[0, 1, 2].find((k) => k !== gi && k !== a)];
    }
    uv[2 * i] = u * tu;
    uv[2 * i + 1] = v * tv;
  }
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  return g;
}

// Tapered round member swept along a path (legs, rear posts). Smooth analytic normals,
// UV = (around, arclength) so the grain runs along the member.
function taperedTube(points, radiusAt, { radial = 16, tubular = 24 } = {}) {
  const V = (p) => new THREE.Vector3(...p);
  const curve = points.length === 2
    ? new THREE.LineCurve3(V(points[0]), V(points[1]))
    : new THREE.CatmullRomCurve3(points.map(V), false, "centripetal");
  const L = curve.getLength();
  const frames = curve.computeFrenetFrames(tubular, false);
  const pos = [], nor = [], uv = [], index = [];
  const eps = 0.002;
  for (let i = 0; i <= tubular; i++) {
    const t = i / tubular;
    const P = curve.getPointAt(t), T = frames.tangents[i], N = frames.normals[i], B = frames.binormals[i];
    const r = radiusAt(t);
    const t0 = Math.max(0, t - eps), t1 = Math.min(1, t + eps);
    const slope = (radiusAt(t1) - radiusAt(t0)) / ((t1 - t0) * L);
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * TAU, c = Math.cos(a), s = Math.sin(a);
      const dx = N.x * c + B.x * s, dy = N.y * c + B.y * s, dz = N.z * c + B.z * s;
      pos.push(P.x + dx * r, P.y + dy * r, P.z + dz * r);
      const nx = dx - T.x * slope, ny = dy - T.y * slope, nz = dz - T.z * slope;
      const len = Math.hypot(nx, ny, nz) || 1;
      nor.push(nx / len, ny / len, nz / len);
      uv.push(j / radial, (t * L) / 0.7);
    }
  }
  for (let i = 0; i < tubular; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * (radial + 1) + j, b = (i + 1) * (radial + 1) + j;
      index.push(a, a + 1, b, b, a + 1, b + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(index);
  return g;
}

// ---------------------------------------------------------------- the chair

export function createStudioChair(wood, upholstery) {
  const chair = new THREE.Group();
  if (!wood || !upholstery) {
    const own = createChairMaterials();
    wood = wood || own.wood;
    upholstery = upholstery || own.fabric;
    chair.userData.materials = own;
  }

  const woodParts = [];

  // --- Legs: four tapered, gently splayed round legs; rear pair continue up as the back posts.
  const FOOT = 0.05;
  const lerp = (t, a, b) => a + (b - a) * t;
  const chamfer = (s, r) => (s < 0.007 ? r - 0.0028 * (1 - s / 0.007) ** 2 : r);
  for (const sx of [-1, 1]) {
    woodParts.push(taperedTube(
      [[sx * 0.47, FOOT, 0.46], [sx * 0.405, 0.86, 0.35]],
      (t) => chamfer(t * 0.8, lerp(t, 0.028, 0.046)),
    ));
  }
  for (const sx of [-1, 1]) {
    // bottom -> seat joint -> top of post, one continuous bent member
    const pts = [[sx * 0.45, FOOT, -0.46], [sx * 0.395, 0.84, -0.35], [sx * 0.362, 1.52, -0.4]];
    const tSeat = 0.55;
    woodParts.push(taperedTube(pts, (t) => {
      const r = t < tSeat ? lerp(t / tSeat, 0.028, 0.044) : lerp((t - tSeat) / (1 - tSeat), 0.044, 0.027);
      return chamfer(t * 1.45, r);
    }, { tubular: 36 }));
  }

  // --- Seat frame: a softly eased rounded-rectangle rail with a crisp, bevelled arris.
  const frameShape = roundedRectPath(new THREE.Shape(), 0.92, 0.8, 0.12);
  frameShape.holes.push(roundedRectPath(new THREE.Path(), 0.8, 0.68, 0.07));
  const frame = slab(frameShape, 0.06, 0.012, { segments: 2, refineTo: 0.09 });
  frame.translate(0, 0.84, 0);
  frame.computeVertexNormals();
  // grain follows the rail: along x on the front/back rails, along z on the sides (mitred corners)
  projectUV(frame, 0, 1 / 0.35, 1 / 0.7, (x, y, z) => (Math.abs(x) / 0.47 > Math.abs(z) / 0.41 ? 2 : 0));
  woodParts.push(frame);

  // --- Backrest: wrap-around curved panel, generous radii, sitting on the rear posts.
  const backShape = roundedRectPath(new THREE.Shape(), 0.976, 0.356, 0.1);
  const back = upright(backShape, 0.04, 0.012, { segments: 3, refineTo: 0.07 });
  const bp = back.attributes.position;
  for (let i = 0; i < bp.count; i++) {
    const x = bp.getX(i);
    bp.setZ(i, bp.getZ(i) + 0.24 * x * x);
  }
  back.applyMatrix4(new THREE.Matrix4().compose(
    new THREE.Vector3(0, 1.52, -0.43),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.08, 0, 0)),
    new THREE.Vector3(1, 1, 1),
  ));
  back.computeVertexNormals();
  projectUV(back, 0, 1 / 0.35, 1 / 0.7);
  woodParts.push(back);

  const woodGeometry = mergeGeometries(woodParts);
  woodParts.forEach((g) => g.dispose());
  const woodMesh = new THREE.Mesh(woodGeometry, wood);
  woodMesh.castShadow = woodMesh.receiveShadow = true;
  chair.add(woodMesh);

  // --- Upholstered seat: pillowed cushion with rolled edge, slightly sunk into the frame.
  const cushionShape = roundedRectPath(new THREE.Shape(), 0.776, 0.636, 0.12);
  const cushion = slab(cushionShape, 0.026, 0.032, { segments: 4, refineTo: 0.08 });
  const cp = cushion.attributes.position;
  const hx = 0.42, hz = 0.35;
  for (let i = 0; i < cp.count; i++) {
    const x = cp.getX(i), y = cp.getY(i), z = cp.getZ(i);
    if (y <= 0) continue;
    const dome = Math.max(0, 1 - (x / hx) ** 2) ** 0.8 * Math.max(0, 1 - (z / hz) ** 2) ** 0.8;
    cp.setY(i, y + 0.024 * dome * Math.min(1, y / 0.045));
  }
  cushion.computeVertexNormals();
  cushion.translate(0, 0.923, 0.004);
  projectUV(cushion, 1, 1 / 0.4, 1 / 0.4);
  const cushionMesh = new THREE.Mesh(cushion, upholstery);
  cushionMesh.castShadow = cushionMesh.receiveShadow = true;
  chair.add(cushionMesh);

  // --- Felt glides under each foot.
  const glideGeometries = [];
  for (const [x, z] of [[-0.47, 0.46], [0.47, 0.46], [-0.45, -0.46], [0.45, -0.46]]) {
    const g = new THREE.CylinderGeometry(0.0245, 0.0245, 0.016, 18);
    g.translate(x, 0.048, z);
    glideGeometries.push(g);
  }
  const glides = new THREE.Mesh(
    mergeGeometries(glideGeometries),
    new THREE.MeshStandardMaterial({ color: "#16171a", roughness: 0.85, metalness: 0 }),
  );
  glideGeometries.forEach((g) => g.dispose());
  glides.castShadow = glides.receiveShadow = true;
  chair.add(glides);

  return chair;
}
