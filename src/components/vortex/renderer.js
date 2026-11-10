import * as THREE from 'three';
import { easeRange } from '../studioMonitor.js';
import { vortexVertex, vortexFragment } from './shader.js';

// Scroll-sampled WebGL renderer: draws only when asked, never runs its own loop.
export function createVortexRenderer(canvas, { image, mobile, onReady, onFailure }) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, premultipliedAlpha: true });
  renderer.debug.onShaderError = onFailure;
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
  const material = new THREE.ShaderMaterial({
    vertexShader: vortexVertex,
    fragmentShader: vortexFragment,
    defines: { TAPS: mobile ? 4 : 6 },
    depthTest: false,
    depthWrite: false,
    uniforms: {
      uTex: { value: null }, uRes: { value: new THREE.Vector2() }, uRatio: { value: 1 },
      uCenter: { value: new THREE.Vector2() }, uRadius: { value: 1 }, uSeed: { value: 1 },
      uTime: { value: 0 }, uProgress: { value: 0 }, uCharge: { value: 0 }, uCollapse: { value: 0 }, uOpen: { value: 0 },
      uEnv: { value: 0 }, uAmbient: { value: 1 }, uOpacity: { value: 0 }, uSpin: { value: 0 },
      uImgOrigin: { value: new THREE.Vector2() }, uCover: { value: 1 }, uScale: { value: 1 },
      uTrans: { value: new THREE.Vector2() },
    },
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  scene.add(mesh);

  let last = null, disposed = false, size = '';
  const u = material.uniforms;

  function draw() {
    if (disposed || !last || !u.uTex.value) return;
    const { frame, progress, width, height, ratio, mobile: isMobile } = last;
    const taps = isMobile ? 4 : 6;
    if (material.defines.TAPS !== taps) { material.defines.TAPS = taps; material.needsUpdate = true; }
    const key = `${width}x${height}@${ratio}`;
    if (key !== size) {
      size = key;
      renderer.setPixelRatio(ratio);
      renderer.setSize(width, height, false);
      renderer.getDrawingBufferSize(u.uRes.value);
    }
    const cover = Math.max(width / 1536, height / 1024);
    u.uRatio.value = u.uRes.value.x / width;
    u.uCenter.value.set(frame.centerX, frame.centerY);
    u.uRadius.value = frame.radius * 0.92;
    u.uSeed.value = frame.seed;
    u.uProgress.value = progress;
    u.uTime.value = last.time ?? 0;
    u.uCharge.value = easeRange(progress, 0.22, 0.39) * (1 - easeRange(progress, 0.43, 0.57));
    u.uCollapse.value = easeRange(progress, 0.4, 0.92);
    u.uOpen.value = easeRange(progress, 0.46, 0.88);
    u.uEnv.value = easeRange(progress, 0.22, 0.27);
    u.uAmbient.value = 1 - 0.38 * easeRange(progress, 0.26, 0.42) - 0.27 * easeRange(progress, 0.45, 0.7);
    u.uOpacity.value = frame.vortexOpacity;
    u.uSpin.value = (frame.rotation * Math.PI) / 180;
    u.uImgOrigin.value.set((width - 1536 * cover) * 0.6, (height - 1024 * cover) * 0.5);
    u.uCover.value = cover;
    u.uScale.value = frame.scale;
    u.uTrans.value.set(frame.tx, frame.ty);
    renderer.render(scene, camera);
  }

  const texture = new THREE.TextureLoader().load(image, () => {
    if (disposed) return;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;
    u.uTex.value = texture;
    if (!renderer.getContext().isContextLost()) onReady();
  }, undefined, () => { if (!disposed) onFailure(); });
  const onLost = (e) => { e.preventDefault(); onFailure(); };
  const onRestored = () => { if (!disposed && u.uTex.value) onReady(); };
  canvas.addEventListener('webglcontextlost', onLost);
  canvas.addEventListener('webglcontextrestored', onRestored);

  return {
    render(params) { last = params; draw(); },
    dispose() {
      disposed = true;
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('webglcontextrestored', onRestored);
      texture.dispose();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
