import * as THREE from 'three';
import { box, cylinder } from '../cinematicHero';

const SHOULDER_Y = 6.3;
const SLEEVE = 1.2; // fixed housing; the rod telescopes out of it

// Fixed bases. `dir` is the idle heading (toward the core). Index = ITEMS[].arm.
const DEFS = [
  { x: -0.5, z: -1, dir: [1, 0] }, // left
  { x: 6.5, z: -1, dir: [-1, 0] }, // right
  { x: 0.8, z: 1.1, dir: [0.8, -1] }, // front: reaches the core without crossing the ring plane
];

const _d = new THREE.Vector3();

// Telescoping manipulators: yaw + pitch the turret toward a target point, stretch the rod to reach it.
export function createArms({ scene, mats }) {
  const { alloy, black, yellow } = mats;
  const arms = DEFS.map(({ x, z, dir }) => {
    cylinder(scene, 0.45, 0.35, [x, 4.7, z], alloy);
    box(scene, [0.4, 1.5, 0.48], [x, 5.55, z], black, 0.08);

    const turret = new THREE.Group();
    turret.position.set(x, SHOULDER_Y, z);
    turret.rotation.order = 'YZX'; // yaw first, then pitch
    scene.add(turret);
    cylinder(turret, 0.27, 0.5, [0, 0, 0], alloy).rotation.x = Math.PI / 2;
    box(turret, [SLEEVE, 0.28, 0.35], [SLEEVE / 2, 0, 0], alloy, 0.06);
    const rod = new THREE.Mesh(new THREE.BoxGeometry(1, 0.14, 0.2), black);
    rod.castShadow = true;
    turret.add(rod);
    const head = new THREE.Group();
    turret.add(head);
    box(head, [0.45, 0.48, 0.55], [0, 0, 0], black, 0.07);
    const lens = yellow.clone();
    box(head, [0.05, 0.15, 0.25], [0.24, 0, 0], lens, 0.01);

    const len = Math.hypot(...dir);
    const rest = new THREE.Vector3(x + (dir[0] / len) * 1.4, SHOULDER_Y + 0.15, z + (dir[1] / len) * 1.4);
    return { turret, rod, head, lens, rest, shoulder: turret.position };
  });

  function aim({ turret, rod, head, shoulder }, point, recoil) {
    _d.subVectors(point, shoulder);
    const horizontal = Math.hypot(_d.x, _d.z);
    turret.rotation.set(0, Math.atan2(-_d.z, _d.x), Math.atan2(_d.y, horizontal));
    const reach = Math.max(SLEEVE, _d.length() - recoil);
    const rodLen = Math.max(0.1, reach - SLEEVE * 0.6);
    rod.scale.x = rodLen;
    rod.position.x = SLEEVE * 0.6 + rodLen / 2;
    head.position.x = reach;
  }

  return {
    rests: arms.map((a) => a.rest),
    // targets[i] = { point, flash } while arm i is working, else undefined.
    update(targets, { t, ready, power, idle }) {
      const sway = new THREE.Vector3();
      arms.forEach((arm, i) => {
        const job = targets[i];
        sway.set(0, idle ? ready * Math.sin(t * 0.45 + i) * 0.05 : 0, 0);
        const point = job ? job.point : sway.add(arm.rest);
        aim(arm, point, job ? job.flash * 0.07 : 0);
        arm.lens.emissiveIntensity = 0.15 + power * 0.5 + (job ? job.flash * 2.5 : 0);
      });
    },
  };
}
