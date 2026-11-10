import * as THREE from "three";

export function createHeroLighting(scene, mobile) {
  scene.add(new THREE.HemisphereLight(0xb3c5d7, 0x24201c, 0.22));
  const key = new THREE.DirectionalLight(0xc2d4e7, 0.62);
  key.position.set(-65, 100, 60);
  key.castShadow = !mobile;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -55, right: 55, top: 65, bottom: -45, near: 1, far: 250 });
  key.shadow.normalBias = 0.035;
  key.shadow.bias = -0.00015;
  scene.add(key);

  // A broad, soft fill reveals the studio's left facade without raising exposure.
  const fill = new THREE.SpotLight(0xdce0df, 12000, 170, Math.PI / 5, 1, 2);
  fill.position.set(-45, 35, 48);
  fill.target.position.set(-14, 24, -5);
  scene.add(fill, fill.target);

  const rim = new THREE.DirectionalLight(0xa5c7e3, 0.9);
  rim.position.set(50, 56, -85);
  scene.add(rim);
  for (const [x, y, z, power, range] of [[0, 5, -15, 130, 20], [-5.5, 14, -6, 160, 23], [5.5, 14, -6, 160, 23], [0, 1.8, 2, 35, 12]]) {
    const light = new THREE.PointLight(0xffce82, power, range, 2);
    light.position.set(x, y, z);
    scene.add(light);
  }
  return { key };
}
