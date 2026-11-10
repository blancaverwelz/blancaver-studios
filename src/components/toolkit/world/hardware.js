import {
  AdditiveBlending, BufferGeometry, Color, CylinderGeometry, ExtrudeGeometry, Float32BufferAttribute, Group, IcosahedronGeometry,
  LatheGeometry, Mesh, MeshBasicMaterial, PlaneGeometry, Points, PointsMaterial, Shape, SphereGeometry, TorusGeometry, Vector2, Vector3,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { FRAME_GLOW } from "./textures";
import { CUBE, PEDESTAL_GLOW, SPHERE_CORE, activation } from "./tuning";

const shadowed = (mesh) => {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
};

export function createHardware(mats) {
  const box = (w, h, d, r = 0.04, mat = mats.metal) => shadowed(new Mesh(new RoundedBoxGeometry(w, h, d, 3, r), mat));

  const polygon = (sides, radius, rot = 0) => {
    const s = new Shape();
    for (let i = 0; i < sides; i++) {
      const a = rot + (i / sides) * Math.PI * 2;
      const x = Math.cos(a) * radius;
      const y = Math.sin(a) * radius;
      if (i === 0) s.moveTo(x, y);
      else s.lineTo(x, y);
    }
    s.closePath();
    return s;
  };

  // Thin emissive outline lying flat (rim light on pedestals and platforms).
  const outline = (sides, radius, thickness, rot = 0) => {
    const shape = polygon(sides, radius, rot);
    shape.holes.push(polygon(sides, radius - thickness, rot));
    const geo = new ExtrudeGeometry(shape, { depth: 0.014, bevelEnabled: false });
    geo.rotateX(-Math.PI / 2);
    return new Mesh(geo, mats.glowYellow);
  };

  const prism = (sides, radius, height, mat, rot = 0, bevel = 0.03) => {
    const geo = new ExtrudeGeometry(polygon(sides, radius, rot), {
      depth: height, bevelEnabled: true, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 2, curveSegments: 1,
    });
    geo.rotateX(-Math.PI / 2);
    return shadowed(new Mesh(geo, mat));
  };

  // ---- Pedestals -----------------------------------------------------------
  // Soft halo lying on a pedestal top; lights up with the module sitting on it.
  // `width` × `depth` is the outline it should hug (the pedestal top).
  function addHalo(group, texture, width, depth, y) {
    const material = new MeshBasicMaterial({
      map: texture, color: new Color(...PEDESTAL_GLOW.color), transparent: true, opacity: 0,
      blending: AdditiveBlending, depthWrite: false, toneMapped: false,
    });
    const halo = new Mesh(new PlaneGeometry(1, 1), material);
    halo.rotation.x = -Math.PI / 2;
    halo.position.y = y;
    // The texture's outline fills (size − 2·inset)/size of the plane; scale so it lands on the top edge.
    const fit = FRAME_GLOW.size / (FRAME_GLOW.size - FRAME_GLOW.inset * 2);
    halo.scale.set(width * fit, depth * fit, 1);
    halo.renderOrder = 4;
    group.add(halo);
    group.userData.setGlow = (level) => {
      material.opacity = PEDESTAL_GLOW.opacity * activation(level);
      halo.visible = material.opacity > 0.003;
    };
    group.userData.setGlow(0);
  }

  function plinth(w, h, d, { glow = false } = {}) {
    const g = new Group();
    const lip = box(w + 0.22, 0.12, d + 0.22, 0.03, mats.metal);
    lip.position.y = 0.06;
    const body = box(w, h, d, 0.05, mats.paint);
    body.position.y = 0.12 + h / 2;
    const top = box(w + 0.08, 0.07, d + 0.08, 0.02, mats.aluminium);
    top.position.y = 0.12 + h + 0.035;
    const rim = outline(4, Math.SQRT1_2 * (w + 0.02), 0.03, Math.PI / 4);
    rim.scale.set(1, 1, d / w);
    rim.position.y = 0.12 + h + 0.075;
    g.add(lip, body, top, rim);
    g.userData.topY = 0.12 + h + 0.07;

    if (glow) addHalo(g, mats.frameGlow, w + 0.08, d + 0.08, g.userData.topY + 0.01);
    return g;
  }

  function hexPlinth(r, h, { glow = false } = {}) {
    const g = new Group();
    const lower = prism(6, r + 0.32, 0.16, mats.metal, Math.PI / 6);
    const body = prism(6, r + 0.06, h, mats.paint, Math.PI / 6);
    body.position.y = 0.16;
    const top = prism(6, r + 0.14, 0.07, mats.aluminium, Math.PI / 6, 0.015);
    top.position.y = 0.16 + h;
    const rim = outline(6, r + 0.1, 0.035, Math.PI / 6);
    rim.position.y = 0.16 + h + 0.085;
    g.add(lower, body, top, rim);
    g.userData.topY = 0.16 + h + 0.075;
    if (glow) addHalo(g, mats.hexGlow, 2 * (r + 0.1), 2 * (r + 0.1), g.userData.topY + 0.01);
    return g;
  }

  function platform(radius, height) {
    const g = new Group();
    const profile = [new Vector2(0.001, 0), new Vector2(radius, 0), new Vector2(radius, height - 0.07), new Vector2(radius - 0.07, height), new Vector2(0.001, height)];
    const disc = shadowed(new Mesh(new LatheGeometry(profile, 96), mats.metal));
    const inner = shadowed(new Mesh(new CylinderGeometry(radius - 0.9, radius - 0.9, 0.12, 96), mats.paint));
    inner.position.y = height + 0.06;
    const rim = new Mesh(new TorusGeometry(radius - 0.05, 0.03, 8, 128), mats.glowYellow);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = height;
    const groove = new Mesh(new TorusGeometry(radius - 1.7, 0.014, 6, 128), mats.glowYellow);
    groove.rotation.x = Math.PI / 2;
    groove.position.y = height + 0.125;
    g.add(disc, inner, rim, groove);
    g.userData.topY = height + 0.12;
    return g;
  }

  // ---- Modules -------------------------------------------------------------
  // Every module exposes: group, face { center, width, height? } (local, front-facing; the
  // logo is centred on it — no height means "project the centre point"), coupling (local
  // point where conduits terminate) and setLevel(0..1).
  // Cubes, hexagons and vaults never glow inside: activity shows as a halo on their pedestal
  // (`drivesPedestal`). Only spheres, which have no pedestal, keep an inner core.
  function cube() {
    const { size, radius, base, crown, face } = CUBE;
    const group = new Group();
    const bodyBottom = base.height;
    const body = shadowed(new Mesh(new RoundedBoxGeometry(size, size, size, 6, radius), mats.frosted));
    body.position.y = bodyBottom + size / 2;
    const baseW = size + base.overhang * 2;
    const cap = box(baseW, base.height, baseW, 0.03, mats.metal);
    cap.position.y = base.height / 2;
    const crownW = size + crown.overhang * 2;
    const lid = box(crownW, crown.height, crownW, 0.03, mats.metal);
    lid.position.y = bodyBottom + size + crown.gap + crown.height / 2;
    const rim = outline(4, Math.SQRT1_2 * (baseW - 0.04), 0.028, Math.PI / 4);
    rim.position.y = base.height + 0.005;
    group.add(body, cap, lid, rim);
    return {
      group, coupling: new Vector3(0, 0.05, 0), drivesPedestal: true, setLevel() {},
      face: { center: new Vector3(0, body.position.y, size / 2 + 0.02), width: face, height: face },
    };
  }

  function hex() {
    const group = new Group();
    const hexShape = (r) => polygon(6, r, Math.PI / 2); // pointy-top, faces +z
    const solid = (r, depth, z, mat, bevel = 0) => {
      const geo = new ExtrudeGeometry(hexShape(r), {
        depth, bevelEnabled: bevel > 0, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 3, curveSegments: 1,
      });
      geo.translate(0, 0, z);
      return shadowed(new Mesh(geo, mat));
    };
    const body = solid(0.95, 0.5, -0.25, mats.frosted, 0.07);
    body.position.y = 1.05;
    const back = solid(1.04, 0.07, -0.42, mats.metal, 0.02);
    back.position.y = 1.05;
    const stem = shadowed(new Mesh(new CylinderGeometry(0.34, 0.52, 0.18, 6), mats.metal));
    stem.position.y = 0.09;
    group.add(body, back, stem);
    return {
      group, coupling: new Vector3(0, 0.1, 0), drivesPedestal: true, setLevel() {},
      face: { center: new Vector3(0, 1.05, 0.34), width: 1.2, height: 1.2 },
    };
  }

  // Idle core is near-black so no light patch shows behind the logo; it turns yellow as the sphere becomes active.
  function sphere(radius = 0.85, withRing = true) {
    const group = new Group();
    const body = shadowed(new Mesh(new SphereGeometry(radius, 64, 48), mats.frosted));
    const core = new Mesh(new SphereGeometry(radius * 0.5, 32, 24), new MeshBasicMaterial({ color: new Color(...SPHERE_CORE.idle) }));
    group.add(body, core);
    if (withRing) {
      const ring = shadowed(new Mesh(new TorusGeometry(radius * 1.06, 0.022, 10, 96), mats.aluminium));
      ring.rotation.x = Math.PI / 2 - 0.35;
      group.add(ring);
    }
    const [r, g, b] = SPHERE_CORE.idle;
    return {
      group, core, coupling: new Vector3(0, -radius, 0),
      setLevel(l) {
        const a = activation(l) * SPHERE_CORE.gain;
        core.material.color.setRGB(r + 2.0 * a, g + 1.4 * a, b + 0.06 * a);
      },
      // No height ⇒ the logo is centred on the sphere's own centre, not on a pole facing +z.
      face: { center: new Vector3(0, 0, 0), width: radius * 1.25 },
    };
  }

  // Vaults never glow inside: activity is shown by the halo on their pedestal instead.
  function vault() {
    const group = new Group();
    const body = box(1.9, 1.75, 1.3, 0.08, mats.paint);
    body.position.y = 0.95;
    const frame = box(1.7, 1.55, 0.14, 0.06, mats.aluminium);
    frame.position.set(0, 0.95, 0.68);
    const panel = box(1.38, 1.22, 0.05, 0.03, mats.blackGlass);
    panel.position.set(0, 0.95, 0.77);
    const bolts = [[-0.78, 0.2], [0.78, 0.2], [-0.78, 1.7], [0.78, 1.7]].map(([x, y]) => {
      const b = shadowed(new Mesh(new CylinderGeometry(0.05, 0.05, 0.05, 14), mats.aluminium));
      b.rotation.x = Math.PI / 2;
      b.position.set(x, y, 0.77);
      return b;
    });
    const latch = box(0.12, 0.5, 0.12, 0.03, mats.aluminium);
    latch.position.set(1.0, 0.95, 0.66);
    const hinges = [0.45, 1.45].map((y) => {
      const h = shadowed(new Mesh(new CylinderGeometry(0.07, 0.07, 0.3, 14), mats.aluminium));
      h.position.set(-1.0, y, 0.66);
      return h;
    });
    const strip = new Mesh(new RoundedBoxGeometry(1.5, 0.03, 0.03, 1, 0.01), mats.glowYellow);
    strip.position.set(0, 0.1, 0.68);
    group.add(body, frame, panel, latch, strip, ...bolts, ...hinges);
    return {
      group, coupling: new Vector3(0, 0.1, 0), drivesPedestal: true, setLevel() {},
      face: { center: new Vector3(0, 0.95, 0.8), width: 1.2, height: 1.05 },
    };
  }

  // Central AI apparatus: large blank frosted sphere with a live lattice core.
  function apparatus() {
    const group = new Group();
    const clear = mats.frosted.clone();
    clear.roughness = 0.14;
    clear.thickness = 2.2;
    const body = shadowed(new Mesh(new SphereGeometry(1.35, 80, 60), clear));
    const lattice = new Mesh(new IcosahedronGeometry(0.8, 2), new MeshBasicMaterial({ color: new Color(0.9, 0.62, 0.03), wireframe: true, toneMapped: false }));
    const heart = new Mesh(new SphereGeometry(0.22, 24, 18), new MeshBasicMaterial({ color: new Color(1.6, 1.2, 0.25), toneMapped: false }));
    const pts = [];
    for (let i = 0; i < 160; i++) {
      const v = new Vector3().randomDirection().multiplyScalar(0.25 + Math.random() * 0.62);
      pts.push(v.x, v.y, v.z);
    }
    const geo = new BufferGeometry();
    geo.setAttribute("position", new Float32BufferAttribute(pts, 3));
    const dust = new Points(geo, new PointsMaterial({ color: new Color(1.4, 1.0, 0.15), size: 0.03, toneMapped: false }));
    const gimbal = shadowed(new Mesh(new TorusGeometry(1.5, 0.03, 10, 128), mats.aluminium));
    gimbal.rotation.x = Math.PI / 2 - 0.28;
    group.add(body, lattice, heart, dust, gimbal);
    return {
      group, lattice, heart, dust, core: lattice,
      coupling: new Vector3(0, 0, 0), setLevel() {},
    };
  }

  return { plinth, hexPlinth, platform, cube, hex, sphere, vault, apparatus };
}
