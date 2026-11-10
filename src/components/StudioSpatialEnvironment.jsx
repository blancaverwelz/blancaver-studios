import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { createSpatialView, spatialGrain, contactShadow } from './studioSpatialView';
import { createStudioChair, createChairMaterials } from './studioChairModel';
import { createGalleryPartition } from './studioGalleryPartition';
import { easeRange } from './studioMonitor';

export default function StudioSpatialEnvironment({ progress, entrance, exitProgress = 0, active }) {
  const mount=useRef(null),api=useRef(null),input=useRef({progress,entrance,exitProgress,active});
  useEffect(()=>{input.current={progress,entrance,exitProgress,active};api.current?.draw();},[progress,entrance,exitProgress,active]);
  useEffect(()=>{
    const view=createSpatialView(mount.current,input,({scene,camera,renderer})=>{
      renderer.toneMappingExposure=.95;
      scene.background=new THREE.Color('#202428');
      scene.fog=new THREE.FogExp2('#24282c',.009);
      scene.environmentIntensity=.3;
      RectAreaLightUniformsLib.init();
      // Directional surface grain: warm walnut and fine brushed aluminium.
      function surfaceTexture(wood=false){
        const c=document.createElement('canvas');c.width=256;c.height=512;
        const ctx=c.getContext('2d');ctx.fillStyle=wood?'#896044':'#a4a4a4';ctx.fillRect(0,0,256,512);
        let seed=419;
        for(let i=0;i<650;i++){
          seed=(seed*1664525+1013904223)>>>0;const n=seed/4294967296,x=n*256;
          ctx.strokeStyle=wood?`rgba(44,24,13,${.06+n*.18})`:`rgba(255,255,255,${.02+n*.14})`;
          ctx.lineWidth=wood?.5+n: .4;ctx.beginPath();ctx.moveTo(x,0);
          ctx.bezierCurveTo(x+(wood?9:0),170,x-(wood?6:0),340,x,512);ctx.stroke();
        }
        const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;
        if(wood)t.colorSpace=THREE.SRGBColorSpace;return t;
      }
      const walnut=surfaceTexture(true),brushed=surfaceTexture();
      const wood=new THREE.MeshStandardMaterial({color:'#c5a48b',map:walnut,bumpMap:walnut,bumpScale:.006,roughness:.58});
      const grain=spatialGrain();
      const concrete=new THREE.MeshStandardMaterial({color:'#373b40',map:grain,bumpMap:grain,bumpScale:.018,roughness:.88});
      const metal=new THREE.MeshStandardMaterial({color:'#787d82',metalness:.7,roughness:.46,bumpMap:brushed,bumpScale:.003});
      const dark=new THREE.MeshStandardMaterial({color:'#191d21',metalness:.3,roughness:.58});
      const floor=new THREE.MeshStandardMaterial({color:'#303237',metalness:.12,roughness:.68,bumpMap:grain,bumpScale:.02});
      const white=new THREE.MeshStandardMaterial({color:'#f3e7d5',emissive:'#f3e7d5',emissiveIntensity:1.2});
      const yellow=new THREE.MeshStandardMaterial({color:'#ffd301',emissive:'#ffd301',emissiveIntensity:1.1});
      const glass=new THREE.MeshPhysicalMaterial({color:'#bac1c5',metalness:.18,roughness:.14,transparent:true,opacity:.13,depthWrite:false});
      function mesh(geometry,material,x,y,z){const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=material!==white&&material!==yellow&&material!==glass;m.receiveShadow=true;scene.add(m);return m;}
      function box(w,h,d,x,y,z,m=metal){return mesh(Math.min(w,h,d)>.15?new RoundedBoxGeometry(w,h,d,1,.035):new THREE.BoxGeometry(w,h,d),m,x,y,z);}
      function cylinder(r,h,x,y,z,m=metal,r2=r){return mesh(new THREE.CylinderGeometry(r,r2,h,48),m,x,y,z);}
      function ring(r,t,y,m=metal,x=0,z=-4){const a=mesh(new THREE.TorusGeometry(r,t,8,96),m,x,y,z);a.rotation.x=Math.PI/2;return a;}
      function rod(a,b,r=.04,m=metal){const p=new THREE.Vector3(...a),q=new THREE.Vector3(...b),v=q.clone().sub(p),o=mesh(new THREE.CylinderGeometry(r,r,v.length(),10),m,...p.clone().add(q).multiplyScalar(.5).toArray());o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());return o;}
      cylinder(14.1,.3,0,-.2,-4,floor);
      const shell=new THREE.MeshStandardMaterial({color:'#303438',map:grain,roughness:.9,side:THREE.BackSide});mesh(new THREE.CylinderGeometry(14,14,13,64,1,true),shell,0,6.4,-4);
      cylinder(14,.3,0,13,-4,dark);
      // Radial concrete bays, bolted steel bases and vertical service conduits.
      for(let i=0;i<18;i++){
        const a=i*Math.PI/9,x=Math.sin(a)*13.5,z=-4+Math.cos(a)*13.5;
        const rib=box(.55,12.5,.8,x,6.25,z,concrete);rib.rotation.y=a;
        const base=box(.85,.25,1.1,x,.125,z,dark);base.rotation.y=a;
        for(const y of [2.5,5,9,11.5]){const seam=box(.57,.035,.83,x,y,z,dark);seam.rotation.y=a;}
        rod([x*.98,1,z],[x*.98,11.8,z],.035);
        if(i%3===0){const lamp=box(.07,3.8,.1,x*.97,4,z+.12,yellow);lamp.rotation.y=a;}
      }
      const galleryPartition = createGalleryPartition(concrete.clone());
      galleryPartition.material.side = THREE.DoubleSide;
      galleryPartition.position.set(12,6,-2);
      galleryPartition.rotation.y = -.7;
      scene.add(galleryPartition);
      // An upper gallery identifies this as a distinct room above the soundstage.
      const deck=mesh(new THREE.RingGeometry(11.1,13.8,72),metal,0,7.2,-4);deck.rotation.x=-Math.PI/2;deck.material.side=THREE.DoubleSide;
      ring(11.1,.08,7.2);ring(11.1,.035,8.3);ring(11.1,.025,7.8);
      for(let i=0;i<30;i++){const a=i*Math.PI/15;rod([Math.sin(a)*11.1,7.2,-4+Math.cos(a)*11.1],[Math.sin(a)*11.1,8.3,-4+Math.cos(a)*11.1],.025);}
      // Central prototype platform: thick machined base, recessed band and stone top.
      cylinder(2.9,.9,2,.45,-4,dark);cylinder(3.1,.16,2,.98,-4,metal);cylinder(3,.1,2,1.11,-4,concrete);
      ring(2.91,.018,.72,yellow,2,-4);
      const {wood:chairWood,fabric:chairCloth}=createChairMaterials('#68432d',1.25);chairCloth.color.set('#383a3c');chairCloth.sheen=.45;chairCloth.sheenColor.set('#5c666b');
      const chair=createStudioChair(chairWood,chairCloth);chair.position.set(2,1.12,-4);chair.scale.setScalar(1.25);chair.rotation.y=-.4;scene.add(chair);
      const contact=contactShadow(2.2,2,.55);contact.position.set(2,1.163,-4);scene.add(contact);
      ring(3.7,.12,7.2,metal,2,-4);ring(3.65,.04,7.06,white,2,-4);
      for(let i=0;i<4;i++){const a=i*Math.PI/2;rod([2+Math.cos(a)*3.7,7.2,-4+Math.sin(a)*3.7],[2+Math.cos(a)*3.7,12.8,-4+Math.sin(a)*3.7],.018,dark);}
      // Articulated scanning arms with actual joints and supported sensor heads.
      for(const x of [-2.4,6.4]){
        cylinder(.42,.18,x,.09,-6.3,dark);cylinder(.17,1.5,x,.9,-6.3,metal);
        rod([x,1.6,-6.3],[x+(x<0?1:-1),2.8,-5.8],.09);
        rod([x+(x<0?1:-1),2.8,-5.8],[x+(x<0?1.6:-1.6),2.6,-5],.065);
        for(const [y,z,dx] of [[1.6,-6.3,0],[2.8,-5.8,x<0?1:-1]])mesh(new THREE.SphereGeometry(.17,16,12),dark,x+dx,y,z);
        box(.4,.22,.35,x+(x<0?1.6:-1.6),2.6,-5,dark);box(.28,.05,.02,x+(x<0?1.6:-1.6),2.6,-4.81,white);
      }
      // Material library: tactile samples with brackets, separate from the central prototype.
      box(6,3.8,.2,-5.5,3,-13,metal);
      const swatches=['#a68c66','#5d4230','#bdc5c0','#53565b','#292e30','#b3a790'];
      swatches.forEach((color,i)=>{const m=new THREE.MeshStandardMaterial({color,roughness:i===2?.25:.7,metalness:i===2?.7:.05,map:grain});box(1.4,1.25,.1,-7.3+(i%3)*1.8,2.1+Math.floor(i/3)*1.65,-12.84,m);box(1.5,.07,.25,-7.3+(i%3)*1.8,1.42+Math.floor(i/3)*1.65,-12.75,dark);});
      // A scale-model worktable and glazed measuring screen.
      box(4.6,.18,2.4,8,1.3,-9,wood);for(const x of [6.3,9.7])box(.12,1.2,2,x,.6,-9,dark);
      box(3.5,.07,1.9,8,1.44,-9,concrete);
      for(const [x,h,z] of [[6.8,.7,-9.4],[7.8,1.15,-9.3],[8.9,.5,-8.8]]){box(.72,h,.62,x,1.5+h/2,z,concrete);for(let y=1.65;y<1.5+h;y+=.2)box(.74,.025,.64,x,y,z,dark);}
      box(3.8,2.5,.035,-6,2.7,-6,glass);for(const x of [-7.95,-4.05]){box(.06,3.7,.06,x,1.85,-6,metal);box(.6,.05,.7,x,.05,-6,dark);}
      // Wireframe and orthographic study monitors, using an internally drawn texture.
      const c=document.createElement('canvas');c.width=768;c.height=384;const ctx=c.getContext('2d');ctx.fillStyle='#191d21';ctx.fillRect(0,0,768,384);ctx.strokeStyle='#a7babb';ctx.lineWidth=2;
      for(let i=0;i<10;i++){ctx.strokeRect(60+i*8,65+i*5,175,210);}
      ctx.strokeStyle='#ffd301';ctx.strokeRect(405,90,245,160);ctx.beginPath();ctx.moveTo(405,250);ctx.lineTo(450,310);ctx.lineTo(680,310);ctx.lineTo(650,250);ctx.stroke();ctx.font='18px monospace';ctx.fillStyle='#c7d4d5';ctx.fillText('MESH / FORM / MATERIAL',40,350);
      const screenTexture=new THREE.CanvasTexture(c);screenTexture.colorSpace=THREE.SRGBColorSpace;const screenMaterial=new THREE.MeshBasicMaterial({map:screenTexture,toneMapped:false});
      box(5,.14,1.6,-6,1.25,-2,wood);for(const x of [-8,-4])box(.15,1.2,1.3,x,.6,-2,dark);
      for(const x of [-7.2,-4.8]){box(2.1,1.15,.13,x,2.05,-2.4,dark);mesh(new THREE.PlaneGeometry(1.95,.98),screenMaterial,x,2.05,-2.32);box(.1,.35,.12,x,1.5,-2.4,metal);}
      scene.add(new THREE.HemisphereLight('#e2e8ed','#30281f',.8));
      const daylight=new THREE.RectAreaLight('#e9f0f5',2.4,9,6);daylight.position.set(-8,7,3);daylight.lookAt(2,2,-4);scene.add(daylight);
      const key=new THREE.SpotLight('#ffe9cc',420,35,.9,.9,2);key.position.set(2,8,-3);key.target.position.set(2,1,-4);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.normalBias=.025;key.shadow.radius=4;scene.add(key,key.target);
      const fill=new THREE.PointLight('#e1e9f0',55,28,2);fill.position.set(-5,5,3);scene.add(fill);const rim=new THREE.PointLight('#ffe0ad',55,18,2);rim.position.set(7,4,-12);scene.add(rim);
      // Normalize index layout before batching the static architecture.
      for(const material of [concrete,metal,dark,floor,white,yellow]){
        const objects=scene.children.filter(o=>o.isMesh&&o.material===material);if(!objects.length)continue;
        const geometries=objects.map(o=>{o.updateMatrix();const g=o.geometry.clone().applyMatrix4(o.matrix);if(!g.index)return g;const flat=g.toNonIndexed();g.dispose();return flat;});
        const merged=mergeGeometries(geometries);geometries.forEach(g=>g.dispose());if(!merged)continue;
        objects.forEach(o=>{scene.remove(o);o.geometry.dispose();});const m=mesh(merged,material,0,0,0);m.castShadow=material!==white&&material!==yellow;
      }
      return {update({progress:p,entrance:e,exitProgress:exit},rect){
        const narrow=rect.width<=680,approach=easeRange(p,.4,1.25),settle=1-easeRange(e,.5,1);
        camera.position.set(narrow?3:8-approach*2,narrow?4+settle*1.5:4.4+settle*2,narrow?20-approach*2:14-approach*3);
        const turn=easeRange(exit,0,.5);
        camera.position.x += turn*(narrow?1.5:3);
        camera.lookAt((narrow?2:-1.8)+turn*5,narrow?.7:2.8,-4);
      }};
    });api.current=view;return()=>{view?.dispose();api.current=null;};
  },[]);
  return <div ref={mount}/>;
}
