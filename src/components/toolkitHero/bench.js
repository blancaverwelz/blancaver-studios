import * as THREE from 'three';
import { box } from '../cinematicHero';
import { createDiagnostics } from './diagnostics';

export const CORE_X = 3;
export const CORE_Z = -1;
const LIFT = 2.6; // ~1.1m working height at the bench's 2.5m width scale.
export const TABLE_TOP = 1.91 + LIFT + 0.06; // 4.57
// The dais carries the core and hides the parts magazine. DECK_Y is the walking surface.
export const DAIS = { w: 4, d: 3.2, h: 0.51 };
export const DECK_Y = TABLE_TOP + DAIS.h; // 5.08

export function createBench({ scene, mats, mobile }) {
  const { alloy, black, yellow } = mats;
  const b = (size, pos, mat = black, r = 0.04) => box(scene, size, pos, mat, r);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(32, 32), new THREE.ShadowMaterial({ opacity: 0.3 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.04;
  floor.receiveShadow = true;
  scene.add(floor);

  // Table, legs and back beam.
  b([10, 0.5, 5], [CORE_X, 1.6 + LIFT, CORE_Z], alloy, 0.16);
  b([9.8, 0.12, 4.8], [CORE_X, 1.91 + LIFT, CORE_Z], black, 0.1);
  for (const x of [-0.7, 6.7]) {
    b([0.7, 4.1, 3.8], [x, 2, CORE_Z]);
    b([1.2, 0.2, 4.2], [x, 0.06, CORE_Z], alloy);
  }
  b([7.4, 0.2, 0.25], [CORE_X, 3.7, -2.8], alloy);

  // Power rail along the front edge; the pulse travels it left → right.
  b([9.4, 0.035, 0.035], [CORE_X, 1.65 + LIFT, 1.53], yellow, 0);
  const pulse = b([0.8, 0.055, 0.055], [-1.4, 1.65 + LIFT, 1.55], new THREE.MeshBasicMaterial({ color: '#ffd301' }), 0);

  // Dais with yellow edge strips.
  b([DAIS.w, DAIS.h, DAIS.d], [CORE_X, TABLE_TOP + DAIS.h / 2, CORE_Z], alloy, 0.06);
  const frontZ = CORE_Z + DAIS.d / 2;
  b([DAIS.w - 0.1, 0.04, 0.03], [CORE_X, TABLE_TOP + 0.1, frontZ + 0.012], yellow, 0);
  for (const s of [-1, 1]) b([0.03, 0.04, DAIS.d - 0.1], [CORE_X + (s * DAIS.w) / 2 + s * 0.012, TABLE_TOP + 0.1, CORE_Z], yellow, 0);

  // Wall monitors.
  const panels = [];
  for (const x of [-0.5, 6.6]) {
    const diag = createDiagnostics(x > 3);
    diag.update(0);
    const screenMat = new THREE.MeshBasicMaterial({ map: diag.texture, color: '#111111' });
    panels.push({ diag, screenMat });
    const monitor = new THREE.Group();
    monitor.position.set(x, 3.4 + LIFT, -3.4);
    monitor.rotation.y = x < 3 ? 0.24 : -0.24;
    scene.add(monitor);
    box(monitor, [3.3, 1.8, 0.16], [0, 0, 0], black, 0.07);
    const display = new THREE.Mesh(new THREE.PlaneGeometry(3.12, 1.56), screenMat);
    display.position.z = 0.09;
    monitor.add(display);
    box(monitor, [0.15, 1.1, 0.2], [0, -1.15, 0], alloy);
  }

  // Lighting.
  scene.add(new THREE.HemisphereLight('#c2b69f', '#14120e', 0.22));
  const key = new THREE.SpotLight('#ffe3b3', 0, 45, 0.6, 0.75, 1.6);
  key.castShadow = true;
  key.shadow.mapSize.set(mobile ? 512 : 1024, mobile ? 512 : 1024);
  key.shadow.bias = -0.0005;
  key.shadow.normalBias = 0.025;
  key.position.set(4, 12, 4);
  key.target.position.set(3, 5.5, -1);
  scene.add(key, key.target);
  const rim = new THREE.PointLight('#c8c5bb', 0, 30, 2);
  rim.position.set(8, 6, -6);
  scene.add(rim);
  const coreLight = new THREE.PointLight('#ffd301', 0, 8, 2);
  coreLight.position.set(CORE_X, 6.65, -0.5);
  scene.add(coreLight);

  return { pulse, panels, key, rim, coreLight };
}
