// Drones and mechanical crawlers lifted from studioWorld.js, retargeted to the pre-rendered hero.
// World convention (three.js, Y up): x = right, y = up, z = -scene depth.
// Scene-local convention (Blender): lx = x, ly = height, lz = depth into the scene, so world z = -lz.
import * as THREE from "three";

export const DEFAULT_HABITAT = {
  groundY: 0,
  road: { lo: -92, hi: -62, y: -0.15 },
  insect: { lo: -96, hi: -3 },
  drone: { lo: -80, hi: -4, hMin: 4.5, hMax: 9 },
  ahead: { insectNear: 6, insectFar: 50, droneNear: 12, droneFar: 42 },
};

export function createHeroCreatures({ mobile = false, habitat = {}, interactive = true, reflections = true, placeShadow } = {}) {
  const H = {
    ...DEFAULT_HABITAT,
    ...habitat,
    road: { ...DEFAULT_HABITAT.road, ...habitat.road },
    insect: { ...DEFAULT_HABITAT.insect, ...habitat.insect },
    drone: { ...DEFAULT_HABITAT.drone, ...habitat.drone },
    ahead: { ...DEFAULT_HABITAT.ahead, ...habitat.ahead },
  };
  const root = new THREE.Group();
  root.name = "Hero_Creatures";
  const point = (lx, ly, lz) => new THREE.Vector3(lx, ly, -lz);
  const local = (v) => new THREE.Vector3(v.x, v.y, -v.z);
  const yellow = new THREE.MeshStandardMaterial({
    color: 0xffd301,
    emissive: 0xffd301,
    emissiveIntensity: 1.6,
    roughness: 0.4,
  });
  const rotorLight = new THREE.MeshBasicMaterial({ color: 0xfff0b0, transparent: true, opacity: 0.55 });
  const gold = new THREE.MeshStandardMaterial({ color: 0xffd77c, metalness: 0.62, roughness: 0.34, envMapIntensity: 1.9, emissive: 0x6b4515, emissiveIntensity: 0.14 });
  const silver = new THREE.MeshStandardMaterial({ color: 0xc9d4dd, metalness: 0.94, roughness: 0.2, envMapIntensity: 1.8 });
  const droneShell = new THREE.MeshStandardMaterial({ color: 0x778893, metalness: 0.6, roughness: 0.32, envMapIntensity: 1.4 });
  const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
  const sphere = new THREE.SphereGeometry(1, 10, 6);
  const ring = new THREE.TorusGeometry(0.24, 0.035, 5, 16);
  const rod = new THREE.CylinderGeometry(1, 1, 1, 5);
  function part(parent, shape, material, p, s) {
    const m = new THREE.Mesh(shape, material);
    m.position.set(...p);
    m.scale.set(...s);
    parent.add(m);
    return m;
  }
  function limb(parent, a, b, r = 0.012) {
    const m = new THREE.Mesh(rod, silver);
    const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
    m.position.copy(va).add(vb).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize());
    m.scale.set(r, va.distanceTo(vb), r);
    parent.add(m);
    return m;
  }
  // Soft contact shadow and a faint wet-ground reflection, so overlays sit on the pre-rendered street.
  const blobTexture = (() => {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d");
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, "rgba(0,0,0,0.6)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })();
  const blobGeometry = new THREE.PlaneGeometry(1, 1);
  const reflectionMaterial = new THREE.MeshBasicMaterial({ color: 0x9aa6b4, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false });

  const actors = [];
  function finish(a) {
    a.blob = new THREE.Mesh(blobGeometry, new THREE.MeshBasicMaterial({ map: blobTexture, transparent: true, depthWrite: false, opacity: a.type === "drone" ? 0.28 : 0.55 }));
    a.blob.rotation.x = -Math.PI / 2;
    a.blob.scale.setScalar(a.type === "drone" ? 1.6 : 0.5 * a.g.scale.x + 0.15);
    a.blob.renderOrder = 1;
    root.add(a.blob);
    a.mirror = a.g.clone(true);
    a.mirror.traverse((o) => { if (o.isMesh) o.material = reflectionMaterial; });
    root.add(a.mirror);
    actors.push(a);
  }
  for (let i = 0; i < (mobile ? 2 : 3); i++) {
    const g = new THREE.Group();
    root.add(g);
    part(g, sphere, i === 0 ? gold : droneShell, [0, 0, 0], [0.38, 0.16, 0.24]);
    const lamp = part(g, boxGeometry, yellow.clone(), [0, 0, 0.24], [0.13, 0.04, 0.03]);
    const rotors = [];
    for (const side of [-1, 1]) {
      part(g, boxGeometry, i === 0 ? gold : droneShell, [side * 0.37, 0, 0], [0.5, 0.05, 0.06]);
      const r = part(g, ring, silver, [side * 0.57, 0.04, 0], [1, 1, 1]);
      r.rotation.x = Math.PI / 2;
      rotors.push(part(g, boxGeometry, rotorLight, [side * 0.57, 0.04, 0], [0.37, 0.015, 0.035]));
    }
    finish({ type: "drone", g, rotors, lamp, mode: "patrol", speed: 1.3 + i * 0.2, height: H.drone.hMin + i * 1.5, id: i, wait: i * 1.1,
      pos: new THREE.Vector3(0, H.drone.hMin + i * 1.5, -40), target: null, rest: 0, heading: new THREE.Vector3(1, 0, 0) });
  }
  for (let i = 0; i < (mobile ? 4 : 7); i++) {
    const g = new THREE.Group();
    g.name = "Slender_Crawler_" + i;
    g.scale.setScalar(i === 0 ? 1 : [0.3, 0.42, 0.55, 0.36, 0.62, 0.28][(i - 1) % 6]);
    root.add(g);
    const legs = [];
    for (let k = 0; k < 5; k++) part(g, sphere, silver, [0, 0.19, -0.15 + k * 0.07], [0.045, 0.045, 0.043]);
    part(g, sphere, silver, [0, 0.2, 0.23], [0.055, 0.043, 0.07]);
    for (const side of [-1, 1]) {
      part(g, sphere, yellow, [side * 0.023, 0.21, 0.29], [0.008, 0.008, 0.008]);
      limb(g, [side * 0.025, 0.22, 0.26], [side * 0.12, 0.26, 0.43], 0.006);
      for (let k = 0; k < 3; k++) {
        const pivot = new THREE.Group();
        pivot.position.set(side * 0.035, 0.19, (k - 1) * 0.12);
        g.add(pivot);
        const reach = (k - 1) * 0.12;
        limb(pivot, [0, 0, 0], [side * 0.15, 0.09, reach]);
        limb(pivot, [side * 0.15, 0.09, reach], [side * 0.28, -0.16, reach * 1.4], 0.009);
        limb(pivot, [side * 0.28, -0.16, reach * 1.4], [side * 0.33, -0.19, reach * 1.6], 0.006);
        legs.push(pivot);
      }
    }
    const tail = [];
    if (i % 2 === 0) {
      let parent = g;
      for (let j = 0; j < 6; j++) {
        const joint = new THREE.Group();
        joint.position.set(0, j === 0 ? 0.19 : 0, j === 0 ? -0.21 : -0.09);
        parent.add(joint);
        limb(joint, [0, 0, 0], [0, 0.025, -0.09], 0.012 - j * 0.001);
        part(joint, sphere, silver, [0, 0, 0], [0.021, 0.021, 0.021]);
        tail.push(joint);
        parent = joint;
      }
    }
    finish({ type: "insect", g, legs, tail, mode: "patrol", id: i, speed: i === 3 ? 0.32 : 0.55 + (i % 3) * 0.13,
      heading: new THREE.Vector3(1, 0, 0), turnIn: 0, wait: i === 0 ? 0 : 0.6 + Math.random() * 3, pos: new THREE.Vector3(0, 0, -60), target: null, rest: 0 });
  }

  const markers = [];
  const markerGeometry = new THREE.RingGeometry(0.18, 0.24, 32);
  let lastTime = null, clock = 0, viewCamera = null, enabled = true;

  function surfaceY(lz) {
    const r = H.road, soft = 0.5;
    const inRoad = THREE.MathUtils.smoothstep(lz, r.lo - soft, r.lo + soft) * (1 - THREE.MathUtils.smoothstep(lz, r.hi - soft, r.hi + soft));
    return 0.045 + inRoad * r.y;
  }
  function groundAtWorldZ(worldZ) {
    const localDepth = -worldZ;
    return localDepth >= H.road.lo && localDepth <= H.road.hi ? H.road.y : H.groundY;
  }
  function camZ() { return viewCamera ? local(viewCamera.position).z : -110; }
  // Zone the creature may use right now: fixed world habitat intersected with the stretch ahead of the camera.
  function zone(type) {
    const cz = camZ(), A = H.ahead;
    if (type === "insect") return [Math.max(H.insect.lo, cz + A.insectNear), Math.min(H.insect.hi, cz + A.insectFar)];
    return [Math.max(H.drone.lo, cz + A.droneNear), Math.min(H.drone.hi, cz + A.droneFar)];
  }
  function edgeX(a, side) {
    if (!viewCamera) return side * 24;
    const c = point(0, a.type === "insect" ? surfaceY(a.pos.z) : a.pos.y, a.pos.z);
    const ndc = c.clone().project(viewCamera);
    const ray = new THREE.Raycaster();
    ray.setFromCamera(new THREE.Vector2(side * 1.12, ndc.y), viewCamera);
    const hit = new THREE.Vector3();
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(new THREE.Vector3(0, 0, 1), c);
    return ray.ray.intersectPlane(plane, hit) ? local(hit).x : side * 24;
  }
  function outside(a) {
    if (!viewCamera) return Math.abs(a.pos.x) > 60;
    const ndc = a.g.position.clone().project(viewCamera);
    return Math.abs(ndc.x) > 1.07 || Math.abs(ndc.y) > 1.07 || ndc.z > 1;
  }
  function setCamera(camera) { viewCamera = camera; }
  function place(a) {
    if (a.type === "insect") a.pos.y = surfaceY(a.pos.z);
    a.g.position.copy(point(a.pos.x, a.pos.y, a.pos.z));
    const gy = a.type === "insect" ? a.g.position.y : surfaceY(a.pos.z);
    if (placeShadow) {
      placeShadow(a, groundAtWorldZ);
    } else {
      a.blob.position.set(a.g.position.x, gy + 0.012, a.g.position.z);
      if (a.type === "drone") {
        const k = THREE.MathUtils.clamp(1 - (a.pos.y - 3) / 14, 0.25, 1);
        a.blob.scale.setScalar(1.2 + (a.pos.y - 3) * 0.12);
        a.blob.material.opacity = 0.3 * k;
      }
    }
    const gp = a.type === "insect" ? a.g.position.y : gy;
    a.mirror.position.set(a.g.position.x, 2 * gp - a.g.position.y, a.g.position.z);
    a.mirror.rotation.copy(a.g.rotation);
    a.mirror.scale.set(a.g.scale.x, -a.g.scale.y, a.g.scale.z);
    a.mirror.quaternion.copy(a.g.quaternion);
    a.mirror.visible = reflections && a.g.visible && a.pos.y < 14;
    a.blob.visible = a.g.visible;
  }
  function spawn(a) {
    const [lo, hi] = zone(a.type);
    if (hi - lo < 4) { a.wait = 1.2; a.started = false; a.g.visible = false; place(a); return; }
    a.mode = "patrol"; a.rest = 0; a.started = true;
    a.pos.z = lo + Math.random() * (hi - lo);
    if (a.type === "drone") a.pos.y = a.height + (Math.random() - 0.5) * 1.5;
    const side = Math.random() < 0.5 ? -1 : 1;
    let bottom = false;
    if (a.type === "insect" && viewCamera && Math.random() < 0.45) {
      const ray = new THREE.Raycaster();
      ray.setFromCamera(new THREE.Vector2((Math.random() - 0.5) * 1.5, -1.12), viewCamera);
      const wp = new THREE.Vector3();
      if (ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), -H.groundY), wp)) {
        const q = local(wp);
        if (q.z > lo && q.z < hi) { a.pos.copy(q); bottom = true; }
      }
    }
    a.arriving = bottom;
    if (!bottom) a.pos.x = edgeX(a, side);
    a.target = new THREE.Vector3(bottom ? a.pos.x + (Math.random() - 0.5) * 4 : a.pos.x - side * 6, a.pos.y, bottom ? Math.min(hi, a.pos.z + 1.2) : a.pos.z);
    a.heading.copy(a.target).sub(a.pos).normalize();
    a.turnIn = bottom ? 1.4 : 2;
    a.g.visible = true;
    place(a);
  }
  function patrolTarget(a) {
    const [lo, hi] = zone(a.type);
    if (a.type === "drone") {
      const l = edgeX(a, -1), r = edgeX(a, 1);
      return new THREE.Vector3(THREE.MathUtils.lerp(l, r, 0.18 + Math.random() * 0.64), a.height + (Math.random() - 0.5) * 2,
        THREE.MathUtils.clamp(a.pos.z + (Math.random() - 0.5) * 6, lo, Math.max(lo, hi)));
    }
    if (a.arriving) {
      if (a.pos.z < hi - 2) return new THREE.Vector3(a.pos.x + (Math.random() - 0.5) * 3, 0, Math.min(hi - 0.5, a.pos.z + 2 + Math.random() * 2));
      a.arriving = false;
    }
    const angle = Math.atan2(a.heading.z, a.heading.x) + (Math.random() - 0.5) * 2.8;
    const step = 0.7 + Math.random() * 2.5;
    const l = Math.min(edgeX(a, -1), edgeX(a, 1)), r = Math.max(edgeX(a, -1), edgeX(a, 1));
    return new THREE.Vector3(THREE.MathUtils.clamp(a.pos.x + Math.cos(angle) * step, l + 0.5, r - 0.5), 0,
      THREE.MathUtils.clamp(a.pos.z + Math.sin(angle) * step, lo, Math.max(lo, hi)));
  }
  actors.forEach((a) => { place(a); a.g.visible = false; a.blob.visible = false; a.mirror.visible = false; });
  function mark(target, ground, camera) {
    const material = new THREE.MeshBasicMaterial({ color: 0xffc15a, transparent: true, opacity: 0.8, depthWrite: false, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(markerGeometry, material);
    mesh.position.copy(target);
    if (ground) { mesh.rotation.x = -Math.PI / 2; mesh.position.y += 0.04; } else mesh.quaternion.copy(camera.quaternion);
    root.add(mesh);
    markers.push({ mesh, life: 0 });
  }
  // `occluder` is the depth-only proxy group, so buildings hide creatures from picks exactly as they hide them from view.
  function interact(ray, camera, occluder) {
    if (!interactive || !enabled) return false;
    const meshes = actors.filter((a) => a.g.visible).map((a) => a.g);
    root.updateMatrixWorld(true);
    const hit = ray.intersectObjects(meshes, true)[0];
    const blocked = occluder ? ray.intersectObject(occluder, true)[0] : null;
    if (hit && (!blocked || hit.distance < blocked.distance)) {
      const a = actors.find((q) => { let o = hit.object; while (o) { if (o === q.g) return true; o = o.parent; } return false; });
      if (a.type === "drone") {
        a.mode = "react"; a.until = clock + 1.5; a.target = null;
        const d = camera.position.clone().sub(a.g.position);
        a.g.rotation.set(0, Math.atan2(d.x, d.z), 0);
      } else {
        a.mode = "escape"; a.rest = 0;
        a.exitSide = a.g.position.clone().project(camera).x < 0 ? -1 : 1;
        a.target = new THREE.Vector3(edgeX(a, a.exitSide), 0, a.pos.z);
      }
      return true;
    }
    const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), -H.groundY);
    const wp = new THREE.Vector3();
    const groundHit = ray.ray.intersectPlane(ground, wp);
    let target = groundHit ? local(wp) : null;
    const [ilo, ihi] = zone("insect");
    const isFloor = target && target.z > ilo && target.z < ihi && Math.abs(target.x) < 60;
    if (isFloor && blocked && blocked.distance < ray.ray.origin.distanceTo(wp)) return false;
    if (!isFloor) {
      const [dlo, dhi] = zone("drone");
      const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(camera.getWorldDirection(new THREE.Vector3()), point(0, 7, (dlo + dhi) / 2));
      if (!ray.ray.intersectPlane(plane, wp)) return false;
      if (blocked && blocked.distance < ray.ray.origin.distanceTo(wp)) return false;
      target = local(wp);
      if (target.y < 2 || target.y > 25) return false;
      target.x = THREE.MathUtils.clamp(target.x, -40, 40);
      target.z = THREE.MathUtils.clamp(target.z, dlo, Math.max(dlo, dhi));
    } else {
      target.y = surfaceY(target.z);
    }
    mark(point(target.x, target.y, target.z), isFloor, camera);
    actors.filter((a) => a.g.visible && a.type === (isFloor ? "insect" : "drone") && a.mode !== "escape").forEach((a, i) => {
      if (a.lamp) a.lamp.material.copy(yellow);
      a.mode = "investigate"; a.target = target.clone(); a.target.x += (i - 1) * 0.6; a.until = clock + 7; a.rest = 0;
    });
    return true;
  }
  function update(time, reducedMotion = false) {
    const dt = lastTime === null ? 0 : Math.max(0, Math.min(time - lastTime, 0.05));
    lastTime = time; clock = time;
    for (let i = markers.length - 1; i >= 0; i--) {
      const m = markers[i];
      m.life += dt;
      m.mesh.scale.setScalar(1 + m.life * 1.5);
      m.mesh.material.opacity = Math.max(0, 0.8 - m.life * 0.5);
      if (m.life > 1.6) { root.remove(m.mesh); m.mesh.material.dispose(); markers.splice(i, 1); }
    }
    for (const a of actors) {
      const [lo, hi] = zone(a.type);
      const live = enabled && !reducedMotion && hi - lo >= 4;
      if (!live) { a.g.visible = false; a.blob.visible = false; a.mirror.visible = false; a.started = false; continue; }
      if (a.wait > 0) { a.wait -= dt; a.g.visible = false; a.blob.visible = false; a.mirror.visible = false; continue; }
      if (!a.started) spawn(a);
      if (!a.started) continue;
      if (a.mode === "react") {
        a.lamp.material.color.set(0xff3030); a.lamp.material.emissive.set(0xff0000);
        place(a); a.g.position.x += Math.sin(time * 65) * 0.025;
        if (time >= a.until) { a.mode = "patrol"; a.lamp.material.copy(yellow); }
        continue;
      }
      if ((a.mode === "inspect" || a.mode === "investigate") && time >= a.until) { a.mode = "patrol"; a.target = null; }
      if (a.mode === "escape" || a.mode === "exit") {
        a.target = new THREE.Vector3(edgeX(a, a.exitSide), a.pos.y, a.pos.z);
        if (outside(a)) { a.wait = a.mode === "escape" ? 1 : 0.5 + Math.random() * 2; a.g.visible = false; a.started = false; a.target = null; place(a); continue; }
      }
      if (a.type === "insect" && a.mode === "patrol") {
        a.turnIn -= dt;
        if (a.turnIn <= 0) { a.target = patrolTarget(a); a.turnIn = 0.7 + Math.random() * 1.7; }
      }
      if (!a.target) a.target = patrolTarget(a);
      let walking = false;
      if (a.mode !== "inspect" && a.rest <= 0) {
        const delta = a.target.clone().sub(a.pos);
        delta.y = a.type === "insect" ? 0 : delta.y;
        const distance = delta.length();
        const speed = a.mode === "escape" ? 3.8 : a.mode === "investigate" ? a.speed * 1.5 : a.speed;
        if (distance > (a.type === "drone" ? 0.18 : 0.08)) {
          walking = true;
          if (a.mode === "patrol" && a.type === "insect") {
            a.heading.lerp(delta.clone().normalize(), 1 - Math.exp(-dt * 3)).normalize();
            a.pos.addScaledVector(a.heading, Math.min(distance, speed * dt));
          } else {
            delta.setLength(Math.min(distance, speed * dt));
            a.pos.add(delta);
            a.heading.copy(delta).normalize();
          }
          if (a.type === "insect") a.pos.z = THREE.MathUtils.clamp(a.pos.z, H.insect.lo, H.insect.hi);
          place(a);
          if (a.type === "drone") {
            const d = new THREE.Vector3(a.heading.x, 0, -a.heading.z);
            if (d.lengthSq() > 1e-8) {
              const yaw = Math.atan2(d.x, d.z);
              const angle = Math.atan2(Math.sin(yaw - a.g.rotation.y), Math.cos(yaw - a.g.rotation.y));
              a.g.rotation.set(0, a.g.rotation.y + angle * (1 - Math.exp(-dt * 5)), 0);
            }
          } else a.g.lookAt(point(a.pos.x + a.heading.x, a.g.position.y, a.pos.z + a.heading.z));
        } else if (a.mode === "escape" || a.mode === "exit") {
          a.target.x += a.exitSide * 2;
        } else if (a.mode === "investigate") {
          a.mode = "inspect"; a.until = time + 1.5;
        } else {
          a.target = null;
          a.rest = Math.random() < 0.28 ? 0.4 + Math.random() * 1.5 : 0;
          if (Math.random() < 0.15) {
            a.mode = "exit"; a.exitSide = Math.random() < 0.5 ? -1 : 1; a.rest = 0;
            a.target = new THREE.Vector3(edgeX(a, a.exitSide), a.pos.y, a.pos.z);
          }
        }
      } else a.rest = Math.max(0, (a.rest || 0) - dt);
      if (a.type === "drone") {
        place(a);
        a.g.position.y += Math.sin(time * 1.2 + a.id) * 0.12;
        a.rotors.forEach((r) => { r.rotation.y = time * 18; });
      } else {
        a.legs.forEach((leg, i) => {
          leg.rotation.y = walking ? Math.sin(time * 12 + i * Math.PI) * 0.3 : 0;
          leg.rotation.x = walking ? Math.cos(time * 12 + i * Math.PI) * 0.13 : 0;
        });
        a.tail.forEach((joint, i) => {
          joint.rotation.y = Math.sin(time * 1.4 - i * 0.55) * 0.15;
          joint.rotation.x = -0.12 + Math.sin(time - i * 0.3) * 0.06;
        });
        place(a);
      }
    }
  }
  function setEnabled(v) { enabled = v; }
  function dispose() {
    root.traverse((o) => { if (o.geometry) o.geometry.dispose?.(); });
    blobTexture.dispose();
  }
  return { root, update, interact, setCamera, setEnabled, dispose, actors, habitat: H };
}
