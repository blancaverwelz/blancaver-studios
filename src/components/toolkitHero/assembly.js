import * as THREE from 'three';
import { box, ease } from '../cinematicHero';
import { CORE_X, DECK_Y } from './bench';
import { clipped } from './materials';
import { createPlasmaOrb } from './plasmaOrb';
import { ITEMS, T, itemStart } from './timeline';

// Parts live in a spring-fed magazine inside the dais. Doors slide apart, the stack rises through the
// slot, and each part is lifted off the top by an arm, carried to the core and latched into place.
// Core first (the heart), then the six 60° housing segments around it.

const SLOT = { x: CORE_X, z: -0.05, w: 1.9, d: 0.9 };
const PICK_Y = DECK_Y + 0.72; // height of the top part, ready to grab
const PITCH = 0.36; // spacing between stacked parts
const RING_R = 1.43;
const HEART_R = 0.43;
const HEART_REST = 0.26; // the heart sits on top of the stack
const HOLD_UP = 0.5; // gripper hover above a part in the magazine
const HOLD_FRONT = 0.5; // gripper hover in front of a part at the ring
const HEART_HOLD = 0.75;
const HUMP = 0.6; // arc height while carrying
const GLOW = { housing: 0.22, light: 5 }; // steady glow: housing emissive, core light

const Z = new THREE.Vector3(0, 0, 1);
const X = new THREE.Vector3(1, 0, 0);
const _a = new THREE.Vector3();
const _b = new THREE.Vector3();

export const CORE_GLOW_LIGHT = GLOW.light;

export function createAssembly({ scene, module, heartTarget, mats, rests, mobile }) {
  const { alloy, black, yellow } = mats;
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -(DECK_Y + 0.01)); // keeps y > deck
  const alloyC = clipped(alloy, plane);
  const blackC = clipped(black, plane);
  const heartMat = clipped(new THREE.MeshStandardMaterial({ color: '#e2d4a9', emissive: '#ffd301', emissiveIntensity: 0, metalness: 0.45, roughness: 0.28 }), plane);
  const plasma = createPlasmaOrb({ radius: HEART_R, steps: mobile ? 6 : 9 });
  alloyC.emissive.set('#ffd301'); // housing segments pick up the final glow
  const frontDir = Z.clone().applyQuaternion(module.quaternion);
  const finalQuat = module.quaternion;

  // ---- Hatch: dark recess, two sliding doors, seam lights ---------------------------------------
  const seamMat = yellow.clone();
  box(scene, [SLOT.w, 0.012, SLOT.d], [SLOT.x, DECK_Y + 0.007, SLOT.z], black, 0);
  for (const s of [-1, 1]) box(scene, [SLOT.w, 0.015, 0.025], [SLOT.x, DECK_Y + 0.015, SLOT.z + (s * SLOT.d) / 2], seamMat, 0);
  const doors = [-1, 1].map((side) => ({ side, mesh: box(scene, [SLOT.w / 2 + 0.05, 0.05, SLOT.d + 0.04], [SLOT.x, DECK_Y + 0.045, SLOT.z], alloy, 0.015) }));

  // ---- Parts ------------------------------------------------------------------------------------
  const items = ITEMS.map((spec, j) => {
    if (spec.heart) {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(HEART_R, 48, 32), heartMat);
      mesh.castShadow = true;
      scene.add(mesh);
      return { spec, j, mesh, grip: new THREE.Vector3(), final: heartTarget, hold: HEART_HOLD, restY: HEART_REST };
    }
    const a = (spec.seg * Math.PI) / 3;
    const mid = a + Math.PI / 6;
    const housing = new THREE.Group();
    scene.add(housing);
    const arc = new THREE.Mesh(new THREE.TorusGeometry(RING_R, 0.16, 8, 24, Math.PI / 3 - 0.12), alloyC);
    arc.rotation.z = a + 0.06;
    arc.castShadow = arc.receiveShadow = true;
    housing.add(arc);
    const latch = box(housing, [0.24, 0.38, 0.31], [Math.cos(a + 0.5) * 1.45, Math.sin(a + 0.5) * 1.45, 0], blackC, 0.035);
    latch.rotation.z = a + 0.5;
    const lamp = clipped(yellow, plane);
    box(latch, [0.03, 0.16, 0.2], [0.13, 0, 0], lamp, 0.005);

    const gripLocal = new THREE.Vector3(Math.cos(mid), Math.sin(mid), 0).multiplyScalar(RING_R);
    // Flat in the magazine: arc mid-point toward the ring, chord along X, lying horizontal.
    const flat = new THREE.Quaternion().setFromAxisAngle(X, -Math.PI / 2).multiply(new THREE.Quaternion().setFromAxisAngle(Z, Math.PI / 2 - mid));
    return {
      spec, j, mesh: housing, lamp, gripLocal, flat, hold: HOLD_UP, restY: 0,
      grip: new THREE.Vector3(),
      final: module.localToWorld(gripLocal.clone()),
    };
  });

  const heart = items[0];
  const q = new THREE.Quaternion();
  const stage = new THREE.Vector3();
  const upHold = new THREE.Vector3();
  const frontHold = new THREE.Vector3();
  const carried = new THREE.Vector3();

  function update(t, power) {
    const rise = ease(t, ...T.rise);
    const drop = (items.length * PITCH + 1) * (1 - rise);
    const open = ease(t, ...T.hatchOpen) * (1 - ease(t, ...T.hatchClose));
    for (const d of doors) d.mesh.position.x = SLOT.x + d.side * (SLOT.w / 4 + open * (SLOT.w / 2 + 0.05));
    seamMat.emissiveIntensity = 0.05 + open * 1.1;

    const targets = [];
    let progress = 0;
    let removed = 0; // parts above the current one that have left the stack (0..j)
    let heartLit = 0;

    for (const it of items) {
      const start = itemStart(it.j);
      const p = THREE.MathUtils.clamp((t - start) / T.pickDur, 0, 1);
      const lift = ease(p, 0.22, 0.34); // leaves the stack
      const e = ease(p, 0.22, 0.78); // travels to the core
      progress += e / items.length;

      stage.set(SLOT.x, PICK_Y - (it.j - removed) * PITCH - drop + it.restY, SLOT.z + (it.spec.heart ? 0.1 : 0));
      removed += lift;
      carried.lerpVectors(stage, it.final, e);
      carried.y += HUMP * Math.sin(Math.PI * e);

      if (it.spec.heart) {
        it.mesh.position.copy(carried);
        heartLit = ease(p, 0.78, 1);
      } else {
        q.slerpQuaternions(it.flat, finalQuat, e);
        it.mesh.quaternion.copy(q);
        it.mesh.position.copy(carried).sub(_a.copy(it.gripLocal).applyQuaternion(q));
        const clamp = ease(p, 0.78, 0.86);
        it.lamp.emissiveIntensity = Math.sin(Math.PI * ease(p, 0.78, 0.92)) * 2.5 + clamp * (0.2 + power * 0.5);
      }

      // Gripper: reach down to the part, carry it, hold while it latches, retract.
      if (p > 0 && p < 1) {
        upHold.set(0, it.hold, 0);
        frontHold.copy(frontDir).multiplyScalar(it.spec.heart ? HEART_HOLD : HOLD_FRONT);
        const hover = _b.lerpVectors(upHold, frontHold, e);
        const rest = rests[it.spec.arm];
        const point = new THREE.Vector3();
        if (p < 0.22) point.lerpVectors(rest, _a.copy(stage).add(upHold), ease(p, 0, 0.22));
        else if (p < 0.86) point.copy(carried).add(hover);
        else point.lerpVectors(_a.copy(it.final).add(frontHold), rest, ease(p, 0.86, 1));
        targets[it.spec.arm] = { point, flash: Math.sin(Math.PI * ease(p, 0.78, 0.92)) };
      }
    }

    // Charge-up: a white-hot flash, then the whole core settles into a steady cyber-yellow glow.
    const [c0, c1, c2] = T.charge;
    const flash = ease(t, c0, c1) * (1 - ease(t, c1, c2));
    const glow = ease(t, c1, T.ready[1]);
    // Once charged the heart switches from pale metal to the energy orb.
    heart.mesh.material = glow + flash > 0 ? plasma.material : heartMat;
    plasma.update(t, Math.max(glow, flash), flash);
    heartMat.emissiveIntensity = heartLit * 0.6;
    alloyC.emissiveIntensity = glow * GLOW.housing + flash * 0.9;
    return { progress, heartLit, flash, glow, targets };
  }

  return { update };
}
