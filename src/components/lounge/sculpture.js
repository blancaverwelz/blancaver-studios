import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// Fine circumferential tool marks modulate roughness instead of painting
// stripes into the metal. The UV seam closes around the ring.
function brushedSurface() {
  const width = 64, height = 128;
  const pixels = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    const line = Math.sin(y * 71.493) * 1432.81;
    for (let x = 0; x < width; x++) {
      const value = Math.round(183 + 48 * (line - Math.floor(line)) +
        9 * Math.cos(2 * Math.PI * x / width + y));
      const i = 4 * (y * width + x);
      pixels.set([value, value, value, 255], i);
    }
  }
  const texture = new THREE.DataTexture(pixels, width, height);
  texture.wrapS = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

// Turn a bevelled band around its axis. Both faces have a narrow machined
// edge that catches a different reflection from the broad satin surface.
function band(radius, width, thickness) {
  const inside = radius - width / 2, outside = radius + width / 2;
  const z = thickness / 2, b = Math.min(0.55, z / 2);
  const profile = [[inside+b,-z],[outside-b,-z],[outside,-z+b],
    [outside,z-b],[outside-b,z],[inside+b,z],[inside,z-b],[inside,-z+b],[inside+b,-z]];
  const geometry = new THREE.LatheGeometry(profile.map(([r, h]) => new THREE.Vector2(r, h)), 128);
  return geometry.rotateX(Math.PI / 2);
}

export function createLoungeSculpture() {
  const root = new THREE.Group();
  const rotor = new THREE.Group();
  const finish = brushedSurface();
  const steel = new THREE.MeshStandardMaterial({ color: 0xa9aaa6, metalness: 0.96, roughness: 0.44, roughnessMap: finish });
  const bronze = new THREE.MeshStandardMaterial({ color: 0x98816b, metalness: 0.91, roughness: 0.5, roughnessMap: finish });
  const graphite = new THREE.MeshStandardMaterial({ color: 0x42423f, metalness: 0.76, roughness: 0.47 });
  const rubber = new THREE.MeshStandardMaterial({ color: 0x242320, metalness: 0, roughness: 0.84 });
  const geometries = [];
  function part(parent, name, geometry, material, x, y, z = 0) {
    geometries.push(geometry);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  const hubY = 61;
  part(root, 'recessed foot', new RoundedBoxGeometry(105, 1.5, 30, 2, 0.6), rubber, 0, 0.75);
  part(root, 'plinth', new RoundedBoxGeometry(110, 6, 34, 3, 1.2), graphite, 0, 4.5);
  part(root, 'outer ring', band(40, 4, 4.2), steel, 0, hubY);
  for (const side of [-1, 1]) {
    part(root, 'bearing post', new RoundedBoxGeometry(4.5, hubY-7.5, 6, 3, 0.85),
      graphite, side*48, (hubY+7.5)/2);
    const axle = part(root, 'side axle', new THREE.CylinderGeometry(1.65, 1.65, 10.5, 24),
      bronze, side*45.2, hubY);
    axle.rotation.z = Math.PI / 2;
    const cap = part(root, 'bearing cap', new THREE.CylinderGeometry(3.4, 3.4, 2.0, 32),
      steel, side*50, hubY);
    cap.rotation.z = Math.PI / 2;
  }

  root.add(rotor);
  rotor.position.y = hubY;
  part(rotor, 'inner ring', band(30.8, 3.0, 3.4), bronze, 0, 0);
  for (const side of [-1, 1]) {
    part(root, 'rotor spindle', new THREE.CylinderGeometry(1.25, 1.25, 7.5, 20),
      graphite, 0, hubY + side*35.45);
  }
  const rod = part(rotor, 'counterweight shaft', new THREE.CylinderGeometry(0.95, 0.95, 60, 20), steel, 0, 0);
  rod.rotation.z = Math.PI / 2;
  const weight = part(rotor, 'counterweight', new THREE.SphereGeometry(6, 32, 24), graphite, 0, 0);
  weight.scale.set(1.35, 1, 1);

  return {
    root,
    pose(angle) { rotor.rotation.y = angle; },
    dispose() {
      geometries.forEach(g => g.dispose());
      [steel, bronze, graphite, rubber].forEach(m => m.dispose());
      finish.dispose();
    },
  };
}
