import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createStudioChair, createChairMaterials } from './studioChairModel';
import { createSpatialView, spatialGrain, createSoftboxEnvironment, contactShadow } from './studioSpatialView';
const finishes = [{ name: 'Oak', color: '#b98a55' }, { name: 'Walnut', color: '#68432d' }, { name: 'Black', color: '#282828' }];
const details = ['Shape', 'Back', 'Finish'];
const explanations = ['Turn the chair to compare its silhouette and gently splayed legs.', 'A curved backrest and tapered supports, viewed up close.', 'See the selected wood finish beside the upholstered seat.'];

export default function SpatialWorkbench({ mode, active }) {
  const mount = useRef(null), api = useRef(null), markers = useRef([]), input = useRef({});
  const [finish, setFinish] = useState(1), [detail, setDetail] = useState(-1), [exploring, setExploring] = useState(false), [unavailable, setUnavailable] = useState(false);
  useEffect(() => { if (!active) setExploring(false); }, [active]);
  useEffect(() => { input.current = { active, mode, finish, detail, exploring }; api.current?.draw(); }, [active, mode, finish, detail, exploring]);
  useEffect(() => {
    if (!active) return;
    const view = createSpatialView(mount.current, input, ({ scene, camera, renderer, draw }) => {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));const softbox=createSoftboxEnvironment(renderer);scene.environment=softbox.texture;scene.environmentIntensity=.85;renderer.toneMappingExposure=1.2;scene.fog=new THREE.FogExp2('#25282c',.1);
      RectAreaLightUniformsLib.init();
      const grain = spatialGrain();
      const { wood, fabric } = createChairMaterials(finishes[1].color, .6); fabric.sheen = .45; fabric.sheenColor.set('#5c666b');
      const chair = createStudioChair(wood, fabric); chair.scale.setScalar(.6); scene.add(chair);
      const contact = contactShadow(1.1, 1.0, .6); contact.position.y = -.018; scene.add(contact);
      const stone = new THREE.MeshStandardMaterial({ color: '#3b3f43', roughness: .8, map: grain });
      const dark = new THREE.MeshStandardMaterial({ color: '#25282c', roughness: .66, metalness: .15 });
      function box(w,h,d,x,y,z,material=stone,parent=scene) { const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m; }
      const floorGrain = spatialGrain(); floorGrain.repeat.set(30, 30);
      const floor = new THREE.MeshStandardMaterial({ color: '#2d2f32', roughness: .7, metalness: .05, envMapIntensity: .1, roughnessMap: floorGrain, bumpMap: floorGrain, bumpScale: .004 });
      box(40,.08,40,0,-.06,0,floor);
      const context = new THREE.Group(); scene.add(context); context.visible=false;
      box(5,2.8,.1,0,1.4,-2,stone,context); box(.1,2.8,4,-2.5,1.4,0,stone,context);
      const tabletop = new THREE.MeshStandardMaterial({ color:'#806047',roughness:.6 });
      box(1.35,.06,.8,1,.75,-.2,tabletop,context);
      for(const x of [.5,1.5]) for(const z of [-.5,.1]) box(.045,.72,.045,x,.36,z,dark,context);
      const rug = new THREE.MeshStandardMaterial({color:'#a09a88',roughness:1,bumpMap:grain,bumpScale:.01});box(2.8,.018,2.4,.45,0,.1,rug,context);
      box(.8,1.05,.055,-1.2,1.5,-1.92,dark,context);
      const art = new THREE.MeshStandardMaterial({color:'#d7c9a8',roughness:1});box(.64,.89,.02,-1.2,1.5,-1.88,art,context);
      scene.add(new THREE.HemisphereLight('#e6ecf0','#302820',.5));
      const daylight=new THREE.RectAreaLight('#e9f0f5',2,4,4);daylight.position.set(-3,4,3);daylight.lookAt(0,.5,0);scene.add(daylight);
      const light = new THREE.DirectionalLight('#ffe6c8',3.4);light.position.set(-3.2,4.4,3);light.castShadow=true;const sm=mount.current.clientWidth<=680?1024:2048;light.shadow.mapSize.set(sm,sm);light.shadow.camera.left=-3.2;light.shadow.camera.right=3.2;light.shadow.camera.top=3.2;light.shadow.camera.bottom=-3.2;light.shadow.camera.near=1;light.shadow.camera.far=14;light.shadow.normalBias=.02;scene.add(light);
      const rimLight = new THREE.DirectionalLight('#ffe0ad',1);rimLight.position.set(3.5,3,-3.5);scene.add(rimLight);
      const controls = new OrbitControls(camera,renderer.domElement);controls.enablePan=false;controls.enableZoom=false;controls.enableDamping=false;controls.enabled=false;renderer.domElement.style.touchAction="pan-y";controls.minPolarAngle=.35;controls.maxPolarAngle=Math.PI*.49;
      let lastMode, lastDetail;
      const targets = [new THREE.Vector3(0,.2,.12),new THREE.Vector3(0,.9,-.24),new THREE.Vector3(.27,.46,.22)];
      function frame(mode,detail) {
        if(mode==='context'){camera.position.set(3,2.15,3.5);controls.target.set(.25,.65,-.15);}
        else if(detail>=0 && mode==='inspect'){controls.target.copy(targets[detail]);camera.position.copy(targets[detail]).add(detail===2?new THREE.Vector3(.3,.13,.42):new THREE.Vector3(detail===1?1.25:1.5,.7,detail===1?-1.9:2));}
        else {camera.position.set(1.2,1.05,1.65);controls.target.set(0,.5,0);}
        controls.update();
      }
      controls.addEventListener('change',draw);
      renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('role','img');
      const key = event => {
        if(event.key==='Escape'){setExploring(false);return;}
        if(!input.current.exploring || !['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)) return;
        event.preventDefault();const spherical=new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
        if(event.key==='ArrowLeft')spherical.theta-=.15;if(event.key==='ArrowRight')spherical.theta+=.15;if(event.key==='ArrowUp')spherical.phi-=.1;if(event.key==='ArrowDown')spherical.phi+=.1;
        spherical.phi=THREE.MathUtils.clamp(spherical.phi,controls.minPolarAngle,controls.maxPolarAngle);camera.position.setFromSpherical(spherical).add(controls.target);controls.update();draw();
      };renderer.domElement.addEventListener('keydown',key);
      return {update(state,rect){
        wood.color.set(finishes[state.finish].color);context.visible=state.mode==='context';chair.position.y=context.visible?-.01:-.04;contact.position.y=context.visible?.011:-.018;renderer.toneMappingExposure=context.visible?.92:1.2;
        controls.enabled=state.active&&state.exploring;renderer.domElement.style.touchAction=state.exploring?'none':'pan-y';
        renderer.domElement.setAttribute('aria-label',`Dining chair in ${finishes[state.finish].name}. ${state.mode==='context'?'Shown in an illustrative furnished room. ':''}${state.exploring?'Drag or use arrow keys to rotate. Escape returns to scrolling.':'Choose Explore the model to rotate.'}`);
        if(lastMode!==state.mode||lastDetail!==state.detail){frame(state.mode,state.detail);lastMode=state.mode;lastDetail=state.detail;}
        targets.forEach((v,i)=>{const point=v.clone().project(camera),el=markers.current[i];if(el){const dx=[-48,0,60][i],dy=[12,-20,0][i];el.style.left=`${THREE.MathUtils.clamp((point.x*.5+.5)*rect.width+dx,24,rect.width-24)}px`;el.style.top=`${THREE.MathUtils.clamp((-point.y*.5+.5)*rect.height+dy,24,rect.height-24)}px`;}});
      },dispose(){controls.dispose();renderer.domElement.removeEventListener('keydown',key);softbox.dispose();}};
    }, '#25282c');
    api.current=view;if(!view)setUnavailable(true);
    return()=>{view?.dispose();api.current=null;};
  }, [active]);
  return <figure className="spatial-workbench">
    <header><span>OAKSTEAD / THE EVERYDAY CHAIR</span><button type="button" onClick={()=>{setDetail(d=>d===-1?-2:-1);setExploring(false);}} disabled={unavailable}>Reset view</button></header>
    <div className="spatial-workbench__viewport" data-journey-interaction={exploring?'true':undefined} onKeyDown={event=>{if(event.key==='Escape')setExploring(false);}}>
      <div ref={mount} className="spatial-workbench__canvas" />
      {mode==='inspect'&&!unavailable&&details.map((name,i)=><button type="button" key={name} ref={el=>{markers.current[i]=el;}} className="spatial-workbench__hotspot" style={{width:30,height:30,fontSize:11}} aria-label={`Inspect chair ${name.toLowerCase()}`} aria-pressed={detail===i} onClick={()=>setDetail(i)}>{i+1}</button>)}
      {unavailable&&<p className="spatial-workbench__fallback">The 3D preview isn’t available in this browser. You can still read all three benefits using the mode buttons.</p>}
    </div>
    <div className="spatial-workbench__controls"><button type="button" disabled={unavailable} aria-pressed={exploring} onClick={()=>setExploring(v=>!v)}>{exploring?'Return to scrolling':'Explore the model'} <span aria-hidden="true">{exploring?'↓':'↔'}</span></button><span>{exploring?'Drag · Arrow keys · Esc to exit':'Interaction is optional'}</span></div>
    <div className="spatial-workbench__detail" aria-live="polite">
      {mode==='compare'?<div className="spatial-workbench__finishes" role="group" aria-label="Chair finish">{finishes.map((f,i)=><button type="button" key={f.name} disabled={unavailable} aria-pressed={finish===i} onClick={()=>setFinish(i)}><i style={{background:f.color}} />{f.name}</button>)}</div>:mode==='context'?<p>Illustrative room setting · arrangement and scale are conceptual.</p>:<p>{detail>=0?explanations[detail]:'Select a numbered detail, or explore the chair freely.'}</p>}
    </div>
    <figcaption>Oakstead Furniture — illustrative interactive concept.</figcaption>
  </figure>;
}
