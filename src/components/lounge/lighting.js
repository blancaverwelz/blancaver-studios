import * as THREE from 'three';

// A small reflection probe shaped for the photographed lounge. Directions
// are in sculpture space: soft light on the left, warm cove high on the right,
// and walnut bounce below. This is an approximation of the room's lighting.
function loungeProbe() {
  const w = 256, h = 128, pixels = new Float32Array(w*h*4);
  const lobe = (dot, power) => Math.pow(Math.max(0, dot), power);
  for (let y=0; y<h; y++) {
    const elevation = ((y+0.5)/h-0.5)*Math.PI;
    for (let x=0; x<w; x++) {
      const azimuth = ((x+0.5)/w-0.5)*Math.PI*2;
      const dx = Math.cos(elevation)*Math.cos(azimuth), dy = Math.sin(elevation);
      const dz = Math.cos(elevation)*Math.sin(azimuth);
      const soft = lobe(-0.71*dx + 0.40*dy + 0.57*dz, 8);
      const cove = Math.exp(-Math.pow((dy-0.69)/0.045, 2))*lobe(0.90*dx-0.44*dz, 2);
      const floor = Math.max(-dy, 0);
      const i=4*(y*w+x);
      pixels[i]=0.085+2.7*soft+7*cove+0.22*floor;
      pixels[i+1]=0.080+2.6*soft+4.2*cove+0.105*floor;
      pixels[i+2]=0.076+2.5*soft+2.0*cove+0.05*floor;
      pixels[i+3]=1;
    }
  }
  const texture = new THREE.DataTexture(pixels,w,h,THREE.RGBAFormat,THREE.FloatType);
  texture.mapping=THREE.EquirectangularReflectionMapping;
  texture.needsUpdate=true;
  return texture;
}

export function lightLounge(scene, renderer) {
  const probe = loungeProbe();
  const generator = new THREE.PMREMGenerator(renderer);
  let reflected;
  function refresh() {
    const next = generator.fromEquirectangular(probe);
    scene.environment = next.texture;
    reflected?.dispose();
    reflected = next;
  }
  refresh();
  const key = new THREE.DirectionalLight(0xfff1e1, 1.8);
  key.position.set(-70, 150, 80);
  key.target.position.set(0, 36, 0);
  key.castShadow = true;
  Object.assign(key.shadow.camera, { left:-100, right:100, top:110, bottom:-110, near:1, far:350 });
  key.shadow.camera.updateProjectionMatrix();
  key.shadow.mapSize.set(512,512);
  key.shadow.normalBias=0.25;
  key.shadow.bias=-0.00015;
  key.shadow.radius=4;
  scene.add(key,key.target);
  scene.add(new THREE.HemisphereLight(0xffebd1,0x63402a,0.42));

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(270,170),
    new THREE.ShadowMaterial({ opacity: 0.22, depthWrite: false }));
  ground.rotation.x=-Math.PI/2;
  ground.receiveShadow=true;
  scene.add(ground);
  return {
    refresh,
    dispose() {
      ground.geometry.dispose(); ground.material.dispose(); key.shadow.dispose();
      reflected?.dispose(); probe.dispose(); generator.dispose();
    },
  };
}
