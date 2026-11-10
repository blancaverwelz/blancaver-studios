import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

// UVs are absent on Blender generated-coordinate materials. Preserve authored UVs;
// use world-space box projection only for affected exported architectural meshes.
function supplyMissingUVs(mesh) {
  const geometry = mesh.geometry;
  if (geometry.attributes.uv || !geometry.attributes.normal) return;
  const position = geometry.attributes.position, normal = geometry.attributes.normal;
  const uv = new Float32Array(position.count * 2);
  const point = new THREE.Vector3(), direction = new THREE.Vector3();
  const normalMatrix = new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld);
  for (let i = 0; i < position.count; i++) {
    point.fromBufferAttribute(position, i).applyMatrix4(mesh.matrixWorld);
    direction.fromBufferAttribute(normal, i).applyNormalMatrix(normalMatrix);
    const x = Math.abs(direction.x), y = Math.abs(direction.y), z = Math.abs(direction.z);
    uv[i * 2] = (x > y && x > z ? point.z : point.x) / 2;
    uv[i * 2 + 1] = (y >= x && y >= z ? point.z : point.y) / 2;
  }
  geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
}

function parentNamed(object, pattern) {
  for (let node = object; node; node = node.parent) if (pattern.test(node.name)) return node;
  return null;
}

// Each exported leaf's pane occupied the full frame bounds. Inset the pane in
// all axes, keeping the animated parent, tracks, handles and frame untouched.
function repairDoorPane(mesh) {
  const geometry = mesh.geometry, position = geometry.attributes.position;
  const bounds = new THREE.Box3();
  const point = new THREE.Vector3();
  const index = geometry.index;
  for (let i = 0; i < (index?.count ?? position.count); i++) {
    bounds.expandByPoint(point.fromBufferAttribute(position, index ? index.getX(i) : i));
  }
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  const pane = new THREE.BoxGeometry(size.x - 0.22, size.y - 0.42, 0.018);
  pane.translate(center.x, center.y, center.z);
  mesh.geometry = pane;
  geometry.dispose();
}

function repairLeafFrame(mesh) {
  const old = mesh.geometry;
  old.computeBoundingBox();
  const box = old.boundingBox, center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const parts = [];
  const add = (width, height, x, y) => {
    const part = new THREE.BoxGeometry(width, height, size.z);
    part.translate(x, y, center.z);
    parts.push(part);
  };
  add(0.1, size.y, box.min.x + 0.05, center.y);
  add(0.1, size.y, box.max.x - 0.05, center.y);
  add(size.x - 0.2, 0.2, center.x, box.min.y + 0.1);
  add(size.x - 0.2, 0.2, center.x, box.max.y - 0.1);
  mesh.geometry = mergeGeometries(parts);
  parts.forEach((part) => part.dispose());
  old.dispose();
}

export function prepareHeroMaterials(model, renderer, mobile) {
  const materials = new Set();
  const entranceMetal = new THREE.MeshStandardMaterial({ name: "Hero_EntranceMetal", color: 0x30383e, metalness: 0.75, roughness: 0.38, envMapIntensity: 0.5 });
  model.updateMatrixWorld(true);
  model.traverse((object) => {
    if (/FOG_BANK/i.test(object.name) || object.isLight || /studio[._]?entrance[._]?door_frame/.test(object.name)) {
      object.visible = false;
      object.raycast = () => {};
    }
    if (!object.isMesh) return;
    supplyMissingUVs(object);
    if (/plaza[._]?details/.test(object.name)) {
      const clone = (material) => {
        const copy = material.clone();
        copy.polygonOffset = true;
        copy.polygonOffsetFactor = -1;
        copy.polygonOffsetUnits = -2;
        return copy;
      };
      object.material = Array.isArray(object.material) ? object.material.map(clone) : clone(object.material);
    }
    object.castShadow = !mobile;
    object.receiveShadow = !mobile;
    if (parentNamed(object, /studio[._]?entrance/)) {
      object.receiveShadow = false;
      object.castShadow = false;
      const replaceMetal = (material) => material.name === "bo_dark_metal" ? entranceMetal : material;
      if (Array.isArray(object.material)) object.material = object.material.map(replaceMetal);
      else object.material = replaceMetal(object.material);
      if (/entrance[._]?leaf_[LR]_1$/.test(object.name)) repairLeafFrame(object);
    }
    const list = [object.material].flat();
    if (list.some((m) => m.name === "bo_glass_clear")) {
      object.castShadow = false;
      object.receiveShadow = false;
      if (parentNamed(object, /entrance[._]?leaf_[LR]/)) repairDoorPane(object);
    }
    for (const material of list) {
      if (materials.has(material)) continue;
      materials.add(material);
      if (material.map) material.map.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      if (material.map && /^bo_/.test(material.name)) material.color.multiplyScalar(0.15);
      if (material.normalMap && /^bo_/.test(material.name)) material.normalScale.setScalar(0.22);
      if (/^bo_(ground|road|floor_charcoal)$/.test(material.name)) {
        material.color.setScalar(material.name === "bo_road" ? 0.09 : 0.16);
        material.roughness = 0.95;
        material.metalness = 0;
        material.envMapIntensity = 0;
        material.userData.heroDetachedTextures = [material.roughnessMap, material.metalnessMap].filter(Boolean);
        material.roughnessMap = null;
        material.metalnessMap = null;
        material.normalScale.setScalar(0.35);
      }
      if (material.name === "bo_glass_clear") {
        material.color.setRGB(0.30, 0.38, 0.44);
        material.roughness = 0.12;
        // Alpha glass avoids the extra screen-space refraction render target.
        material.transmission = 0;
        material.transparent = true;
        material.opacity = 0.24;
        material.depthWrite = false;
        material.thickness = 0.025;
        material.ior = 1.45;
        material.side = THREE.FrontSide;
        material.envMapIntensity = 0.45;
      }
      if (material.name === "bo_studio_low") material.color.multiplyScalar(1.5);
      if (material.name === "bo_glass_dark") {
        material.roughness = 0.22;
        material.metalness = 0.45;
        material.envMapIntensity = 0.7;
      }
      if (/bo_glass_(warm|cool)/.test(material.name)) material.emissiveIntensity = 0.65;
      if (material.name === "bo_yellow") material.emissiveIntensity = 10;
      if (material.name === "bo_strip") material.emissiveIntensity = 3;
      if (material.name === "bo_portal_light") material.emissiveIntensity = 0.65;
      material.needsUpdate = true;
    }
  });
  return materials;
}
