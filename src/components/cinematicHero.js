import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// Shared only by the two standalone heroes. All motion uses visible elapsed time.
export function createCinematicHero(node, configure, { mobileDpr = 1 } = {}) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias:true, powerPreference:'low-power', alpha:true }); }
  catch { return null; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, node.clientWidth < 768 ? mobileDpr : 1.5));
  renderer.setSize(node.clientWidth, node.clientHeight);
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.15;
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  node.appendChild(renderer.domElement);
  const scene=new THREE.Scene();scene.background=new THREE.Color('#070a0d');
  const camera=new THREE.PerspectiveCamera(43,1,.1,200);
  const pmrem=new THREE.PMREMGenerator(renderer), room=new RoomEnvironment();
  const environment=pmrem.fromScene(room,.05);scene.environment=environment.texture;scene.environmentIntensity=.65;room.dispose();pmrem.dispose();
  let dead=false, visible=false, raf=0, last=0, elapsed=0, lowPower=false, frames=0, cost=0, lost=false;
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  const behavior=configure({THREE,scene,camera,renderer,mobile:node.clientWidth<768,invalidate:()=>draw()});
  const render=now=>{
    raf=0;
    if(dead||lost||document.hidden||!visible){last=0;return;}
    const staticView=motion.matches||lowPower;
    if(last&&now-last<32&&!staticView){raf=requestAnimationFrame(render);return;}
    const delta=last?Math.min((now-last)/1000,.1):0;last=now;
    if(!staticView)elapsed+=delta;
    const rect=node.getBoundingClientRect();
    if(!rect.width||!rect.height)return;
    camera.aspect=rect.width/rect.height;
    const stage=behavior.update(staticView?12:elapsed,rect,staticView);
    camera.updateProjectionMatrix();
    const start=performance.now();renderer.render(scene,camera);
    node.dataset.phase=staticView?'static':stage||'operational';
    renderer.domElement.dataset.rendered='true';
    cost+=performance.now()-start;frames++;
    // Sustained expensive rendering falls back to one completed frame, not a failed scene.
    if(frames===120){lowPower=cost/frames>65;}
    if(!staticView)raf=requestAnimationFrame(render);
  };
  const draw=()=>{cancelAnimationFrame(raf);last=0;if(!dead)raf=requestAnimationFrame(render);};
  const resize=new ResizeObserver(()=>{renderer.setPixelRatio(Math.min(devicePixelRatio,node.clientWidth<768?mobileDpr:1.5));renderer.setSize(node.clientWidth,node.clientHeight);draw();});resize.observe(node);
  const intersection=new IntersectionObserver(([e])=>{visible=e.isIntersecting;draw();});intersection.observe(node);
  const onLost=e=>{e.preventDefault();lost=true;cancelAnimationFrame(raf);renderer.domElement.style.opacity='0';};
  const onRestored=()=>{lost=false;renderer.domElement.style.opacity='1';draw();};
  renderer.domElement.addEventListener('webglcontextlost',onLost);renderer.domElement.addEventListener('webglcontextrestored',onRestored);
  document.addEventListener('visibilitychange',draw);motion.addEventListener('change',draw);
  return {dispose(){dead=true;cancelAnimationFrame(raf);resize.disconnect();intersection.disconnect();document.removeEventListener('visibilitychange',draw);motion.removeEventListener('change',draw);renderer.domElement.removeEventListener('webglcontextlost',onLost);renderer.domElement.removeEventListener('webglcontextrestored',onRestored);behavior.dispose?.();const gs=new Set(),ms=new Set(),ts=new Set();scene.traverse(o=>{o.shadow?.dispose?.();if(o.geometry)gs.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>ms.add(m));});ms.forEach(m=>{Object.values(m).forEach(v=>{if(v?.isTexture)ts.add(v);});m.dispose();});gs.forEach(g=>g.dispose());ts.forEach(t=>t.dispose());environment.dispose();renderer.dispose();renderer.domElement.remove();}};
}

export function surfaceTexture({brushed=false}={}) {
  const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
  const ctx=canvas.getContext('2d'), pixels=ctx.createImageData(256,256);let seed=901;
  for(let y=0;y<256;y++)for(let x=0;x<256;x++){seed=(seed*1664525+1013904223)>>>0;const v=brushed?150+Math.sin(y*2.2)*12+(seed/4294967296)*12:145+(seed/4294967296)*50;const i=(y*256+x)*4;pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=v;pixels.data[i+3]=255;}
  ctx.putImageData(pixels,0,0);const t=new THREE.CanvasTexture(canvas);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(3,3);return t;
}
export function box(parent, size, position, material, radius=.04) {
  const mesh=new THREE.Mesh(radius?new RoundedBoxGeometry(...size,2,radius):new THREE.BoxGeometry(...size),material);
  mesh.castShadow=true;mesh.receiveShadow=true;mesh.position.set(...position);parent.add(mesh);return mesh;
}
export function cylinder(parent,radius,height,position,material,segments=48) {
  const m=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,height,segments),material);m.castShadow=true;m.receiveShadow=true;m.position.set(...position);parent.add(m);return m;
}
export function ring(parent,outer,inner,height,position,material) {
  const shape=new THREE.Shape();shape.absarc(0,0,outer,0,Math.PI*2,false);const hole=new THREE.Path();hole.absarc(0,0,inner,0,Math.PI*2,true);shape.holes.push(hole);
  const g=new THREE.ExtrudeGeometry(shape,{depth:height,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.025,bevelThickness:.02,curveSegments:48});g.rotateX(-Math.PI/2);
  const mesh=new THREE.Mesh(g,material);mesh.castShadow=true;mesh.receiveShadow=true;mesh.position.set(...position);parent.add(mesh);return mesh;
}
export const ease=(t,a,b)=>{const x=THREE.MathUtils.clamp((t-a)/(b-a),0,1);return x*x*(3-2*x);};
