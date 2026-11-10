import * as THREE from 'three';
import { box, cylinder, ring } from '../cinematicHero';
import { createPlasmaHalo } from './plasmaOrb';
import { CORE_X, CORE_Z } from './bench';

export const CORE_Y = 6.65;
export const CORE_YAW = 0.2;

// Local to the module: +x right, +y up, +z out from the ring face.
const HEART_OFFSET = { x: 0, y: 0, z: 0 };
const HALO_BRIGHTNESS = 0.65; // peak brightness of the charged halo, from 0 to 1

// The permanent skeleton: three containment rings, a spoked rotor, bolts and two supports standing on
// the dais. The housing segments and the heart are installed onto it by the arms (assembly.js).
export function createCore({ scene, mats }) {
  const { alloy, black } = mats;
  const module = new THREE.Group();
  module.position.set(CORE_X, CORE_Y, CORE_Z);
  module.rotation.y = CORE_YAW;
  scene.add(module);

  const containment = [];
  for (let i = 0; i < 3; i++) {
    const r = 1.35 - i * 0.29;
    const frame = ring(module, r, r - 0.095, 0.12, [0, 0, -i * 0.14], i === 1 ? alloy : black);
    frame.rotation.x = Math.PI / 2;
    containment.push(frame);
  }

  const rotor = new THREE.Group();
  module.add(rotor);
  const haloPlasma = createPlasmaHalo(HALO_BRIGHTNESS);
  const haloDepth = 0.035;
  const halo = ring(rotor, 0.64, 0.59, haloDepth, [0, 0, 0.2], haloPlasma.material);
  halo.rotation.x = Math.PI / 2;

  // ring() extrudes forward from its origin. Aim for the midpoint of the band.
  const heartTarget = module.localToWorld(new THREE.Vector3(
    halo.position.x + HEART_OFFSET.x,
    halo.position.y + HEART_OFFSET.y,
    halo.position.z + haloDepth / 2 + HEART_OFFSET.z,
  ));
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    const spoke = box(rotor, [0.055, 0.36, 0.12], [Math.cos(a) * 0.89, Math.sin(a) * 0.89, 0.12], alloy, 0.015);
    spoke.rotation.z = a - Math.PI / 2;
    const bolt = cylinder(module, 0.045, 0.08, [Math.cos(a) * 1.27, Math.sin(a) * 1.27, 0.16], alloy, 10);
    bolt.rotation.x = Math.PI / 2;
  }

  // Supports rise out of the dais (their feet are inside it).
  for (const x of [CORE_X - 0.75, CORE_X + 0.75]) box(scene, [0.16, 0.9, 0.35], [x, 5.35, CORE_Z - 0.15], alloy, 0.035);

  const wire = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(0.55, 0)),
    new THREE.LineBasicMaterial({ color: '#ffd301', transparent: true, opacity: 0 }),
  );
  module.add(wire);

  module.updateMatrixWorld(true);
  return { module, containment, rotor, wire, heartTarget, updateHalo: haloPlasma.update };
}
