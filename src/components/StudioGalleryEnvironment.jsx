import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { createSpatialView, spatialGrain } from './studioSpatialView';
import { galleryFrame } from './gallerySequence';
import { easeRange } from './studioMonitor';

import { createGalleryPartition } from './studioGalleryPartition';

export default function StudioGalleryEnvironment({ progress, entrance, count, active, mobile, exitProgress = 0 }) {
  const mount = useRef(null), api = useRef(null), input = useRef({ progress, entrance, count, active, mobile, exitProgress });
  useEffect(() => { input.current = { progress, entrance, count, active, mobile, exitProgress }; api.current?.draw(); }, [progress, entrance, count, active, mobile, exitProgress]);
  useEffect(() => {
    const view = createSpatialView(mount.current, input, ({ scene, camera, renderer }) => {
      renderer.toneMappingExposure = .95;
      scene.environmentIntensity = .3;
      scene.fog = new THREE.FogExp2('#24282c', .009);
      RectAreaLightUniformsLib.init();
      function surfaceTexture(wood = false) {
        const c = document.createElement('canvas'); c.width = 256; c.height = 512;
        const ctx = c.getContext('2d'); ctx.fillStyle = wood ? '#896044' : '#a4a4a4'; ctx.fillRect(0,0,256,512);
        let seed = 419;
        for (let i = 0; i < 650; i++) {
          seed = (seed * 1664525 + 1013904223) >>> 0; const n = seed / 4294967296, x = n * 256;
          ctx.strokeStyle = wood ? `rgba(44,24,13,${.06+n*.18})` : `rgba(255,255,255,${.02+n*.14})`;
          ctx.lineWidth = wood ? .5+n : .4; ctx.beginPath(); ctx.moveTo(x,0);
          ctx.bezierCurveTo(x+(wood?9:0),170,x-(wood?6:0),340,x,512); ctx.stroke();
        }
        const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping;
        if (wood) t.colorSpace = THREE.SRGBColorSpace;
        return t;
      }
      const walnut = surfaceTexture(true), brushed = surfaceTexture();
      const wood = new THREE.MeshStandardMaterial({color:'#c5a48b',map:walnut,bumpMap:walnut,bumpScale:.006,roughness:.58});
      const grain = spatialGrain();
      const concrete = new THREE.MeshStandardMaterial({ color: '#383c40', map: grain, bumpMap: grain, bumpScale: .018, roughness: .9, side: THREE.DoubleSide });
      const steel = new THREE.MeshStandardMaterial({ color: '#73797e', roughness: .46, metalness: .7, bumpMap: brushed, bumpScale: .003 });
      const dark = new THREE.MeshStandardMaterial({ color: '#171b1f', roughness: .58, metalness: .25 });
      const floor = new THREE.MeshStandardMaterial({ color: '#303338', map: grain, bumpMap: grain, bumpScale: .009, roughness: .68, metalness: .12 });
      const light = new THREE.MeshStandardMaterial({ color: '#f3e7d5', emissive: '#f3e7d5', emissiveIntensity: 1.2 });
      const yellow = new THREE.MeshStandardMaterial({ color: '#ffd301', emissive: '#ffd301', emissiveIntensity: 1.1 });
      const box = (w,h,d,x,y,z,material) => {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), material);
        mesh.position.set(x,y,z); mesh.receiveShadow = true; scene.add(mesh); return mesh;
      };
      box(105,.3,24,36,-.2,-4,floor); box(105,.4,24,36,12,-4,concrete);
      box(105,12,.5,36,6,-15,concrete);
      box(105,3,.2,36,1.5,-14.7,wood);
      const lamps = [];
      for (let i = -1; i < 8; i++) {
        const x = i * 14;
        box(.55,12,1.1,x-6.8,6,-14.1,concrete);
        box(.6,.35,24,x-6.8,11.7,-4,steel);
        box(11,.16,.8,x,11.45,-4,light);
        box(11.5,5.5,.45,x,5,-13.9,steel);
        box(11.1,5.1,.48,x,5,-13.6,dark);
        box(11.5,.04,.1,x,2.15,-13.3,yellow);
        for (const dx of [-4.8, 4.8]) box(.07,5.3,.1,x+dx,5,-13.3,steel);
        const spot = new THREE.PointLight('#ffe9cf', 85, 18, 2); spot.position.set(x,9,-8); scene.add(spot); lamps.push(spot);
        box(4,.22,1.4,x,.7,-9,wood);
        for (const dx of [-1.6,1.6]) box(.14,.65,1.1,x+dx,.3,-9,dark);
      }
      const partition = createGalleryPartition(concrete); partition.position.x = -12; partition.position.z = -2; scene.add(partition);
      scene.add(new THREE.HemisphereLight('#e4ebf0','#302820',.85));
      // Broad daylight follows the active bay without changing the camera path.
      const daylight = new THREE.RectAreaLight('#e9f0f5',2.5,10,7); scene.add(daylight);
      const fill = new THREE.PointLight('#ffe1b8',35,25,2); scene.add(fill);
      return { update({ progress:p, entrance:e, count:n, mobile:narrow, exitProgress:exit }) {
        const { position } = galleryFrame(p, n), settle = 1 - easeRange(e,.5,1);
        const x = position * 14;
        camera.position.set(x - settle * (narrow ? 1 : 3), narrow ? 4.3 : 4.8, narrow ? 13 : 10);
        const turn=easeRange(exit,0,.36);
        camera.position.x+=turn*(narrow?1.2:2.5);
        camera.lookAt(x+turn*(narrow?3:7),4.2,-13);
        fill.position.set(x,4,-10);
        daylight.position.set(x-6,8,0); daylight.lookAt(x,4,-13);
        lamps.forEach((lamp,i) => { lamp.intensity = 40 + 80 * (1 - easeRange(Math.abs(i-1-position),.2,1.2)); });
      } };
    }, '#202428');
    api.current = view; return () => { view?.dispose(); api.current = null; };
  }, []);
  return <div ref={mount} />;
}
