import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// Shared lifecycle for the lab and its on-demand interactive viewer.
export function createSpatialView(mount, inputs, configure, background = '#141c1e', { alpha = false } = {}) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ alpha, antialias: true, powerPreference: 'low-power' }); } catch { return null; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, mount.clientWidth <= 680 ? 1.2 : 1.5));
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  mount.appendChild(renderer.domElement);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(background);
  const camera = new THREE.PerspectiveCamera(44, 1, .05, 100);
  const pmrem = new THREE.PMREMGenerator(renderer), room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, .04); scene.environment = environment.texture; scene.environmentIntensity = .4; room.dispose(); pmrem.dispose();
  let raf = 0, disposed = false, lost = false;
  const paint = () => {
    raf = 0;
    if (disposed || lost || document.hidden || !inputs.current.active) return;
    const rect = mount.getBoundingClientRect();
    if (!rect.width || !rect.height || rect.bottom <= 0 || rect.top >= innerHeight) return;
    behavior.update(inputs.current, rect);
    renderer.render(scene, camera); renderer.domElement.dataset.rendered = 'true';
  };
  const draw = () => { if (!disposed && !raf) raf = requestAnimationFrame(paint); };
  const behavior = configure({ scene, camera, renderer, draw });
  const resize = () => {
    const w = mount.clientWidth, h = mount.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); draw();
  };
  const observer = new ResizeObserver(resize); observer.observe(mount);
  const intersection = new IntersectionObserver(draw); intersection.observe(mount);
  const onLost = event => { event.preventDefault(); lost = true; cancelAnimationFrame(raf); raf = 0; };
  const onRestored = () => { lost = false; draw(); };
  renderer.domElement.addEventListener('webglcontextlost', onLost);
  renderer.domElement.addEventListener('webglcontextrestored', onRestored);
  document.addEventListener('visibilitychange', draw); resize();
  return { draw, dispose() {
    disposed = true; cancelAnimationFrame(raf); observer.disconnect(); intersection.disconnect(); behavior.dispose?.();
    document.removeEventListener('visibilitychange', draw);
    renderer.domElement.removeEventListener('webglcontextlost', onLost); renderer.domElement.removeEventListener('webglcontextrestored', onRestored);
    const geometries = new Set(), materials = new Set(), textures = new Set();
    scene.traverse(o => { o.shadow?.dispose?.(); if (o.geometry) geometries.add(o.geometry); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => materials.add(m)); });
    materials.forEach(m => { Object.values(m).forEach(v => { if (v?.isTexture) textures.add(v); }); m.dispose(); });
    geometries.forEach(g => g.dispose()); textures.forEach(t => t.dispose()); environment.dispose(); renderer.dispose(); renderer.domElement.remove();
  } };
}

export function spatialGrain() {
  const c = document.createElement('canvas'); c.width = c.height = 256; const ctx = c.getContext('2d'), pixels = ctx.createImageData(256, 256);
  let seed = 3027;
  for (let i = 0; i < pixels.data.length; i += 4) { seed = (seed * 1664525 + 1013904223) >>> 0; const n = 155 + (seed / 4294967296) * 65; pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = n; pixels.data[i + 3] = 255; }
  ctx.putImageData(pixels, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(4, 4); return t;
}

// Soft studio reflection environment (key softbox, top strip, rim strip, dark room) for
// glossy/clear-coated materials. Returns a PMREM render target; caller owns disposal.
export function createSoftboxEnvironment(renderer) {
  const env = new THREE.Scene(), owned = [];
  const add = (geometry, material, x, y, z, lookAt = [0, 1, 0]) => {
    const m = new THREE.Mesh(geometry, material); m.position.set(x, y, z); if (lookAt) m.lookAt(...lookAt);
    env.add(m); owned.push(geometry, material); return m;
  };
  add(new THREE.BoxGeometry(26, 14, 26), new THREE.MeshBasicMaterial({ color: '#0d0f11', side: THREE.BackSide }), 0, 5, 0, null);
  const light = (w, h, x, y, z, color, gain) => add(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(gain), side: THREE.DoubleSide, toneMapped: false }), x, y, z);
  light(6, 5, -7, 5, 5, '#ffe6c8', 7);   // warm key softbox, camera-left
  light(10, 2.5, 0, 9, 0, '#f2f5f8', 3); // overhead strip
  light(2, 6, 6, 3, -8, '#f4f8ff', 8);   // cool rim strip, back-right
  light(4, 4, 9, 2, 3, '#e8eef4', 1.2);  // low right fill
  const pmrem = new THREE.PMREMGenerator(renderer), target = pmrem.fromScene(env, .02);
  pmrem.dispose(); owned.forEach(o => o.dispose());
  return target;
}

// Soft blob under an object so it sits on the floor instead of hovering above it.
export function contactShadow(width, depth, opacity = .5) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const ctx = c.getContext('2d'), g = ctx.createRadialGradient(64, 64, 4, 64, 64, 64);
  g.addColorStop(0, '#fff'); g.addColorStop(.45, '#999'); g.addColorStop(1, '#000');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
  const alphaMap = new THREE.CanvasTexture(c);
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), new THREE.MeshBasicMaterial({ color: '#000', alphaMap, transparent: true, opacity, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  mesh.rotation.x = -Math.PI / 2; mesh.renderOrder = 1; return mesh;
}
