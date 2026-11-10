import * as THREE from 'three';

// Reused on both sides of the threshold so its material and curvature agree.
export function createGalleryPartition(material) {
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(7, 7, 16, 64, 1, true, -.95, 1.9), material);
  wall.position.set(0, 6, -7);
  return wall;
}

