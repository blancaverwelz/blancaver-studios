import * as THREE from 'three';
import { surfaceTexture } from '../cinematicHero';

export function createMaterials() {
  const brushed = surfaceTexture({ brushed: true });
  return {
    alloy: new THREE.MeshStandardMaterial({ color: '#45433f', metalness: 0.9, roughness: 0.36, bumpMap: brushed, bumpScale: 0.018 }),
    black: new THREE.MeshStandardMaterial({ color: '#171716', metalness: 0.72, roughness: 0.43, map: brushed }),
    yellow: new THREE.MeshStandardMaterial({ color: '#ffd301', emissive: '#ffd301', emissiveIntensity: 0, roughness: 0.3 }),
  };
}

// Copy of a material that is cut away below `plane`, so parts stored inside the dais stay hidden
// until they rise through the slot (shadows are clipped too).
export function clipped(material, plane) {
  const m = material.clone();
  m.clippingPlanes = [plane];
  m.clipShadows = true;
  return m;
}
