import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { easeRange } from './studioMonitor';

const base = `${import.meta.env.BASE_URL}images/`;
const ROOM_W = 1672, ROOM_H = 941;

function paintDisplay(ctx, kind, p, image) {
  const w = ctx.canvas.width, h = ctx.canvas.height;
  ctx.fillStyle = '#101416'; ctx.fillRect(0, 0, w, h);
  const text = (value, x, y, size = 24, color = '#e9e9e4') => {
    ctx.fillStyle = color; ctx.font = `500 ${size}px Arial`; ctx.fillText(value, x, y);
  };
  if (kind === 'code') {
    ctx.save();ctx.scale(w/420,h/840);
    const fill=(x,y,a,b,color)=>{ctx.fillStyle=color;ctx.fillRect(x,y,a,b);};
    const label=(value,x,y,color='#9ca6af',size=9)=>{ctx.font=`${size}px monospace`;ctx.fillStyle=color;ctx.fillText(value,x,y);};
    fill(0,0,420,840,'#181c22');fill(0,0,420,26,'#252a32');
    label('northline-auto — workspace',104,17,'#b9c0c9',10);
    fill(0,26,25,792,'#20252c');fill(25,26,84,792,'#1c2128');
    ['▤','⌕','⑂','▷','▦'].forEach((v,i)=>label(v,7,54+i*38,'#86929f',16));
    label('EXPLORER',34,46,'#b2bac4',9);
    ['⌄ NORTHLINE','  ⌄ src','    ⌄ pages','      Home.jsx','      About.jsx','      Booking.jsx','    ⌄ components','      Header.jsx','      Service.jsx','    styles.css','  package.json','  vite.config.js'].forEach((v,i)=>label(v,30,72+i*19,i===5?'#dfc887':'#909da9',8));
    fill(109,26,311,29,'#222730');fill(109,26,110,29,'#181c22');fill(109,26,110,1,'#c7ab48');
    label('Booking.jsx  ×',119,45,'#d4d9df',9);label('styles.css',235,45,'#8d98a6',9);
    label('src › pages › Booking.jsx',119,73,'#748393',8);
    const lines = [
      "import { useState } from 'react';",
      "import { Header } from '../components/Header';",
      "import '../styles.css';", '',
      'const initialRequest = {',
      "  service: 'inspection',", "  date: '',", "  name: '',", "  email: '',", '};', '',
      'export default function Booking() {',
      '  const [request, setRequest] =', '    useState(initialRequest);',
      "  const [status, setStatus] = useState('idle');", '',
      '  function updateField(event) {',
      '    const { name, value } = event.target;',
      '    setRequest(current => ({',
      '      ...current, [name]: value,', '    }));', '  }', '',
      '  async function submitRequest(event) {',
      '    event.preventDefault();', "    setStatus('sending');", '    try {',
      "      const response = await fetch('/api/booking', {", "        method: 'POST',",
      "        headers: { 'Content-Type': 'application/json' },", '        body: JSON.stringify(request),', '      });',
      "      if (!response.ok) throw new Error('Request failed');", "      setStatus('sent');", '    } catch {', "      setStatus('error');", '    }', '  }', '',
      '  return (', '    <main className="booking-page">', '      <Header />', '      <h1>Book a service</h1>', '      <form onSubmit={submitRequest}>',
      '        <input name="email" type="email"', '          value={request.email}', '          onChange={updateField} required />',
      '        <button disabled={status === "sending"}>', '          Request a booking', '        </button>', '      </form>', '    </main>', '  );', '}',
    ];
    ctx.save();ctx.beginPath();ctx.rect(109,83,311,565);ctx.clip();
    lines.forEach((line,i)=>{
      const yy=96+i*10;
      if(i===18)fill(109,yy-8,311,11,'#242e39');
      label(String(i+1),116,yy,'#5f6c79',8);
      let xx=139;
      const tokens=line.split(/('[^']*'|"[^"]*"|\b(?:const|function|return|export|default|async|await|if|throw|new|try|catch|import|from)\b)/g);
      for(const token of tokens){
        const color=/^['"]/.test(token)?'#b5c796':/^(const|function|return|export|default|async|await|if|throw|new|try|catch|import|from)$/.test(token)?'#bc9bd4':'#b5c7d8';
        label(token,xx,yy,color,8);xx+=ctx.measureText(token).width;
      }
    });ctx.restore();
    fill(109,655,311,163,'#151a20');fill(109,655,311,1,'#333b45');
    label('PROBLEMS   OUTPUT   TERMINAL',120,675,'#c0c7d0',8);
    label('~/northline-auto  main',120,700,'#8caaa1',9);
    label('$ npm run dev',120,720,'#d0d6dd',9);
    label('VITE  ready in 184 ms',120,745,'#a6bc8e',9);
    label('Local: http://localhost:5173/',120,766,'#a1b7d2',9);
    label('›',120,791,'#c3ccd4',10);
    fill(0,818,420,22,'#263747');label('⑂ main   ✓ 0   ⚠ 0',9,833,'#c0cbd4',8);
    label('Ln 19, Col 7   UTF-8   JavaScript JSX',206,833,'#c0cbd4',8);
    ctx.restore();return;
  }
  if (kind === 'testing') {
    text('NORTHLINE / RESPONSIVE REVIEW', 32, 52, 27);
    ['Desktop layout', 'Tablet layout', 'Mobile layout', 'Booking journey'].forEach((label,i) => {
      ctx.fillStyle='#1c252a';ctx.fillRect(32,95+i*74,w-64,57);
      text(label,52,132+i*74,24); text('✓',w-80,132+i*74,26,'#ffd301');
    });
    text('PREVIEW ENVIRONMENT',32,h-25,18,'#9ca8ab');return;
  }
  const portrait = kind === 'phone';
  // The browser chrome is live, separate from the supplied Northline artwork.
  ctx.fillStyle='#22282b';ctx.fillRect(0,0,w,42);
  text('northline.example',18,28,portrait?18:20,p>=2&&p<3?'#ffd301':'#c2c8ca');
  if (p >= 2 && p < 4) {
    paintNorthlinePage(ctx,p,image,portrait);
    return;
  }
  if (image.complete && image.naturalWidth) {
    if (portrait) {
      // Reflow the supplied concept: artwork crop, then readable stacked content.
      ctx.drawImage(image,700,165,790,685,0,42,w,h*.36);
      text('NORTHLINE AUTO',22,h*.46,22);
      text('Expert care.',22,h*.55,39);text('Every mile.',22,h*.62,39);
      text('Services • Maintenance • Repairs',22,h*.70,16);
      ctx.fillStyle='#b71c15';ctx.fillRect(22,h*.76,w-44,64);text('BOOK A SERVICE',42,h*.76+40,22);
    } else {
      ctx.drawImage(image,0,50,image.naturalWidth,image.naturalHeight-50,0,42,w,h-42);
    }
  }

}

// Companion pages retain Northline's black/ivory/red identity and existing photo.
function paintNorthlinePage(ctx,p,image,phone) {
  const width=ctx.canvas.width,height=ctx.canvas.height;
  ctx.save();ctx.scale(width/(phone?360:1200),height/750);
  const w=phone?360:1200;
  const rect=(x,y,a,b,color)=>{ctx.fillStyle=color;ctx.fillRect(x,y,a,b);};
  const text=(value,x,y,size=22,color='#17191a',bold=false)=>{ctx.font=`${bold?700:400} ${size}px Arial`;ctx.fillStyle=color;ctx.fillText(value,x,y);};
  const line=(x,y,a)=>rect(x,y,a,1,'#d2cec7');
  const booking=p>=3;
  rect(0,0,w,750,'#f2efe8');rect(0,0,w,34,'#25292a');
  text(`northline.example/${booking?'book':'about'}`,18,23,phone?14:17,'#bfc5c7');
  rect(0,34,w,86,'#101112');text('///',phone?18:42,85,32,'#c51d16',true);
  text('NORTHLINE AUTO',phone?64:100,83,phone?24:31,'#f8f7f2',true);
  if(!phone){text('Services',675,82,20,'#bfc3c3');text('About',785,82,20,booking?'#bfc3c3':'#fff');rect(920,53,235,47,'#b51b14');text('BOOK A SERVICE ↗',943,83,18,'#fff',true);}
  if(!booking) {
    if(phone){
      text('ABOUT NORTHLINE',22,165,13,'#a7241b',true);
      text('People first.',22,215,39,'#151719',true);text('Cars always.',22,260,39,'#151719',true);
      text('Honest advice. Careful work.',22,305,19);text('A local team you can rely on.',22,332,19);
      if(image.complete&&image.naturalWidth)ctx.drawImage(image,750,170,700,670,22,363,316,244);
      text('Clear advice. No surprises.',22,654,23,'#151719',true);text('We explain the work before we begin.',22,692,17);
    } else {
      text('ABOUT NORTHLINE / RIVERDALE',48,173,17,'#a7241b',true);
      text('People first.',48,250,68,'#151719',true);text('Cars always.',48,323,68,'#151719',true);
      text('Your local team for the miles ahead.',48,383,27);
      text('We believe good auto care starts with a conversation.',48,433,21);
      text('Clear explanations, careful repairs, and practical advice',48,465,21);
      text('help you make the right decision for your vehicle.',48,497,21);
      if(image.complete&&image.naturalWidth)ctx.drawImage(image,750,170,700,670,690,155,460,369);
      line(48,561,1104);
      [['01','Clear advice','Know what your car needs.'],['02','Careful work','Attention to every detail.'],['03','Local service','Here for your next mile.']].forEach(([n,title,copy],i)=>{let x=48+i*378;text(n,x,608,18,'#a7241b',true);text(title,x,649,27,'#151719',true);text(copy,x,686,20,'#585c5b');});
    }
  } else {
    const step=easeRange(p,3.05,3.85);
    const field=(label,value,x,y,fw,selected=false)=>{
      text(label,x,y,phone?14:16,'#5a5e5c');rect(x,y+12,fw,48,'#fffefa');
      ctx.strokeStyle=selected?'#a7241b':'#d6d2ca';ctx.lineWidth=1;ctx.strokeRect(x,y+12,fw,48);
      text(value,x+14,y+43,phone?18:20,selected?'#202424':'#777c78');
    };
    if(phone){
      text('SERVICE REQUEST',22,157,13,'#a7241b',true);text('Let’s get you',22,205,35,'#17191a',true);text('back on the road.',22,246,35,'#17191a',true);
      field('SERVICE','Vehicle inspection   ˅',22,289,316,true);
      field('PREFERRED DATE',step>.25?'Thursday, 14 November':'Choose a date',22,386,316,step>.25);
      field('YOUR NAME',step>.55?'Alex Morgan':'Full name',22,483,316,step>.55);
      rect(22,604,316,56,'#b51b14');text('REQUEST A BOOKING ↗',41,639,20,'#fff',true);
      text('We’ll confirm availability with you.',22,697,15,'#656963');
    }else{
      text('BOOK A SERVICE',48,175,16,'#a7241b',true);text('Let’s get you',48,250,46,'#17191a',true);text('back on the road.',48,312,46,'#17191a',true);
      text('Tell us what your vehicle needs.',48,365,23);text('We’ll get in touch to confirm a time.',48,398,23);
      line(48,445,405);text('WHAT HAPPENS NEXT',48,487,16,'#a7241b',true);
      ['1  Send your request','2  We confirm the details','3  Bring your vehicle in'].forEach((v,i)=>text(v,48,531+i*42,22));
      text('A request does not confirm an appointment.',48,700,16,'#656963');
      rect(515,152,638,558,'#e8e4dc');text('Your service details',545,197,28,'#17191a',true);
      field('SERVICE','Vehicle inspection   ˅',545,236,577,true);
      field('PREFERRED DATE',step>.25?'14 November':'Choose a date',545,334,275,step>.25);
      field('PREFERRED TIME',step>.4?'Morning   ˅':'Select a time   ˅',847,334,275,step>.4);
      field('YOUR NAME',step>.55?'Alex Morgan':'Full name',545,432,275,step>.55);
      field('EMAIL ADDRESS',step>.7?'alex@example.com':'you@example.com',847,432,275,step>.7);
      text('Vehicle details / anything we should know',545,538,16,'#5a5e5c');rect(545,550,577,48,'#fffefa');text('Make, model, year and a short description',559,580,18,'#777c78');
      rect(545,625,577,56,'#b51b14');text('REQUEST A BOOKING ↗',700,661,21,'#fff',true);
    }
  }
  ctx.restore();
}

export default function StudioWebEnvironment({ progress, active, exitProgress = 0 }) {
  const mountRef=useRef(null), controls=useRef(null), inputs=useRef({progress,active,exitProgress});
  useEffect(()=>{inputs.current={progress,active,exitProgress};controls.current?.draw();},[progress,active,exitProgress]);
  useEffect(()=>{
    const mount=mountRef.current;
    let renderer;
    try { renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'}); }
    catch { mount.dataset.fallback='true'; return; }
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=.92;
    mount.appendChild(renderer.domElement);
    const scene=new THREE.Scene(), root=new THREE.Group();scene.add(root);
    const camera=new THREE.OrthographicCamera(0,1,0,-1,.1,4000);camera.position.z=1500;
    const resources=[], displays=[];
    const keep=r=>(resources.push(r),r);
    const metal=keep(new THREE.MeshStandardMaterial({color:'#31383b',metalness:.78,roughness:.32,envMapIntensity:.6}));
    const aluminum=keep(new THREE.MeshStandardMaterial({color:'#454a4e',metalness:.82,roughness:.3,envMapIntensity:.6}));
    function box(parent,w,h,d,x,y,z,material=metal,radius=2) {
      const geo=keep(new RoundedBoxGeometry(w,h,d,2,radius));
      const mesh=new THREE.Mesh(geo,material);mesh.position.set(x,-y,z);parent.add(mesh);return mesh;
    }
    function device(x,y,w,h,kind,angle=0,parent=root,z=20) {
      const g=new THREE.Group();g.position.set(x,-y,z);g.rotation.y=angle;parent.add(g);
      box(g,w+6,h+6,5,0,0,0,kind==='testing'?aluminum:metal,4);
      const canvas=document.createElement('canvas');canvas.width=kind==='phone'?360:kind==='code'?840:1200;canvas.height=kind==='phone'?720:kind==='code'?1680:750;
      const ctx=canvas.getContext('2d'),texture=keep(new THREE.CanvasTexture(canvas));texture.colorSpace=THREE.SRGBColorSpace;
      texture.minFilter=THREE.LinearFilter;
      const surface=new THREE.Mesh(keep(new THREE.PlaneGeometry(w,h)),keep(new THREE.MeshBasicMaterial({map:texture,toneMapped:false})));
      surface.position.z=2.6;g.add(surface);displays.push({ctx,texture,kind});return g;
    }
    function stand(x,top,bottom,width=18) {
      box(root,width,bottom-top,10,x,(top+bottom)/2,12,aluminum);
      box(root,Math.max(28,width*4),3,30,x,bottom,23,metal);
    }
    // Reference layout: raised laptop left, wide central monitor, portrait right.
    device(1110,365,390,210,'main');stand(1110,468,540,17);
    device(1418,384,139,264,'code',-.27);stand(1418,514,543,12);
    device(995,506,95,57,'tablet',.10);stand(995,533,545,9);
    const laptop=new THREE.Group();laptop.position.set(790,-480,35);laptop.rotation.y=.28;root.add(laptop);
    device(0,-58,177,110,'testing',0,laptop,0);
    // Lid, hinge and base share the same parent and meet at the rear edge.
    box(laptop,174,4,5,0,0,1,aluminum,1);
    // Match the base center projected through the laptop's inward yaw.
    const laptopStand=new THREE.Group();laptopStand.position.set(805,-532,48);laptopStand.rotation.y=.28;root.add(laptopStand);
    box(laptopStand,30,25,10,0,0,0,aluminum);
    box(laptopStand,120,3,36,0,12,11,metal);

    // Keyboard keys are drawn in a single local plane; the entire assembly tilts
    // together, so rows, spacebar and laptop trackpad keep correct perspective.
    function keyboard(x,y,width,height,laptop=false,angle=0,parent=root,z=100) {
      const g=new THREE.Group();g.position.set(x,-y,z);g.rotation.set(-1.18,0,angle);parent.add(g);
      box(g,width,height,3,0,0,0,aluminum,2);
      const c=document.createElement('canvas');c.width=1000;c.height=laptop?650:340;
      const k=c.getContext('2d');k.fillStyle='#33383b';k.fillRect(0,0,c.width,c.height);
      const rows=['ESC  1  2  3  4  5  6  7  8  9  0  −  =  ⌫','TAB  Q  W  E  R  T  Y  U  I  O  P  [  ]','CAPS  A  S  D  F  G  H  J  K  L  ;  ENTER','SHIFT  Z  X  C  V  B  N  M  ,  .  /  SHIFT'];
      rows.forEach((row,r)=>row.split('  ').forEach((label,col)=>{
        const xx=24+col*67, yy=18+r*58;
        k.fillStyle=r===0&&col===0?'#b8a033':'#14191c';k.beginPath();k.roundRect(xx,yy,59,48,5);k.fill();
        k.fillStyle='#c5cbce';k.font='16px Arial';k.fillText(label,xx+7,yy+29);
      }));
      for(const [xx,ww,label] of [[24,85,'ctrl'],[119,85,'alt'],[214,390,''],[614,85,'cmd'],[709,85,'alt'],[804,130,'◀  ▼  ▶']]){
        k.fillStyle='#14191c';k.beginPath();k.roundRect(xx,255,ww,48,5);k.fill();k.fillStyle='#c5cbce';k.fillText(label,xx+10,284);
      }
      if(laptop){k.strokeStyle='#666d71';k.lineWidth=3;k.beginPath();k.roundRect(305,355,390,245,12);k.stroke();}
      const tex=keep(new THREE.CanvasTexture(c));tex.colorSpace=THREE.SRGBColorSpace;
      const face=new THREE.Mesh(keep(new THREE.PlaneGeometry(width-3,height-3)),keep(new THREE.MeshBasicMaterial({map:tex,color:'#b7b7b7',toneMapped:false})));
      face.position.z=1.6;g.add(face);
    }
    const matte=keep(new THREE.MeshBasicMaterial({color:'#171a1c',toneMapped:false}));
    const mat=box(root,320,100,1.5,1150,548,72,matte,4);mat.rotation.x=-1.24;
    keyboard(1105,548,185,63);
    keyboard(0,22,181,113,true,0,laptop,54);
    const mouse=new THREE.Mesh(keep(new THREE.SphereGeometry(1,24,16)),metal);
    mouse.scale.set(13,7,21);mouse.position.set(1268,-548,104);root.add(mouse);
    box(root,2,2,8,1268,542,122,aluminum,.5);
    // Soft contact shadows, held in the same photo coordinate system as devices.
    const shadowCanvas=document.createElement('canvas');shadowCanvas.width=128;shadowCanvas.height=64;
    const shadowCtx=shadowCanvas.getContext('2d');
    const fade=shadowCtx.createRadialGradient(64,32,3,64,32,62);fade.addColorStop(0,'#00000075');fade.addColorStop(1,'#00000000');
    shadowCtx.fillStyle=fade;shadowCtx.fillRect(0,0,128,64);
    const shadowTexture=keep(new THREE.CanvasTexture(shadowCanvas));
    const shadowMaterial=keep(new THREE.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false,toneMapped:false}));
    for(const [x,y,w,h] of [[790,545,205,18],[1110,542,130,14],[1418,545,105,14],[995,547,108,12]]){
      const shadow=new THREE.Mesh(keep(new THREE.PlaneGeometry(w,h)),shadowMaterial);shadow.position.set(x,-y,-10);root.add(shadow);
    }
    scene.add(new THREE.HemisphereLight('#d7e0e4','#4a3320',2.1));
    const keyLight=new THREE.DirectionalLight('#ffe0ad',3);keyLight.position.set(-400,900,1000);scene.add(keyLight);
    const pmrem=new THREE.PMREMGenerator(renderer), room=new RoomEnvironment(), env=pmrem.fromScene(room,.04);scene.environment=env.texture;room.dispose();
    let dead=false,raf=0,last=-1,photoReady=false;
    const photo=new Image(), mobilePhoto=new Image(), site=new Image(),motion=matchMedia('(prefers-reduced-motion: reduce)');
    const plateTexture=keep(new THREE.Texture(photo));plateTexture.colorSpace=THREE.SRGBColorSpace;
    const plate=new THREE.Mesh(keep(new THREE.PlaneGeometry(ROOM_W,ROOM_H)),keep(new THREE.MeshBasicMaterial({map:plateTexture,toneMapped:false})));
    plate.position.set(ROOM_W/2,-ROOM_H/2,-60);root.add(plate);
    const mobileTexture=keep(new THREE.Texture(mobilePhoto));mobileTexture.colorSpace=THREE.SRGBColorSpace;
    const mobilePlate=new THREE.Mesh(keep(new THREE.PlaneGeometry(1,1)),keep(new THREE.MeshBasicMaterial({map:mobileTexture,toneMapped:false})));
    mobilePlate.position.z=-80;mobilePlate.visible=false;scene.add(mobilePlate);
    function render() {
      raf=0;if(dead||document.hidden||!inputs.current.active)return;
      const {width:w,height:h,top,bottom}=mount.getBoundingClientRect();if(!w||!h||bottom<=0||top>=innerHeight)return;
      const {progress:p,exitProgress:exit}=inputs.current, mobile=w<=680;
      const zoom=motion.matches?1:1+easeRange(p,0,4)*.018+easeRange(exit,0,1)*.025;
      const scale=(mobile?w/1030:w/ROOM_W)*zoom;
      const left=mobile?w*.5-1170*scale:w-ROOM_W*scale;
      const mobileReady=mobilePhoto.complete&&mobilePhoto.naturalWidth>0;
      const mobileScale=mobileReady?Math.max(w/mobilePhoto.naturalWidth,h/mobilePhoto.naturalHeight):1;
      const y=mobile&&mobileReady?590*mobileScale-545*scale:mobile?65-150*scale:(h-ROOM_H*scale)/2;
      mobilePlate.visible=mobile&&mobileReady;plate.visible=!mobilePlate.visible;
      if(mobilePlate.visible){
        const pw=mobilePhoto.naturalWidth*mobileScale,ph=mobilePhoto.naturalHeight*mobileScale;
        mobilePlate.scale.set(pw,ph,1);mobilePlate.position.set(w/2,-ph/2,-80);
      }
      root.scale.setScalar(scale);root.position.set(left,-y,0);
      camera.right=w;camera.bottom=-h;camera.updateProjectionMatrix();if(renderer.domElement.width!==Math.floor(w*renderer.getPixelRatio())||renderer.domElement.height!==Math.floor(h*renderer.getPixelRatio()))renderer.setSize(w,h,false);
      if(last!==p){displays.forEach(({ctx,texture,kind})=>{paintDisplay(ctx,kind,p,site);texture.needsUpdate=true;});last=p;}
      if(photoReady){renderer.render(scene,camera);renderer.domElement.dataset.rendered='true';renderer.domElement.dataset.chapter=String(Math.min(4,Math.floor(p)));}
    }
    function draw(){if(!dead&&!raf)raf=requestAnimationFrame(render);}
    photo.onload=()=>{if(dead)return;photoReady=true;plateTexture.needsUpdate=true;draw();};photo.src=`${base}website/developer-studio-v2.webp`;
    mobilePhoto.onload=()=>{if(dead)return;mobileTexture.needsUpdate=true;draw();};
    mobilePhoto.src=`${base}website/developer-studio-mobile.webp`;
    site.onload=()=>{last=-1;draw();};site.src=`${base}northline-auto-optimized.webp`;
    const resize=new ResizeObserver(draw),visible=new IntersectionObserver(draw);resize.observe(mount);visible.observe(mount);
    document.addEventListener('visibilitychange',draw);motion.addEventListener('change',draw);
    const lost=e=>{e.preventDefault();mount.dataset.fallback='true';renderer.domElement.style.display='none';};
    const restored=()=>{delete mount.dataset.fallback;renderer.domElement.style.display='';last=-1;draw();};
    renderer.domElement.addEventListener('webglcontextlost',lost);renderer.domElement.addEventListener('webglcontextrestored',restored);
    controls.current={draw};draw();
    return()=>{dead=true;cancelAnimationFrame(raf);photo.onload=null;mobilePhoto.onload=null;site.onload=null;resize.disconnect();visible.disconnect();document.removeEventListener('visibilitychange',draw);motion.removeEventListener('change',draw);renderer.domElement.removeEventListener('webglcontextlost',lost);renderer.domElement.removeEventListener('webglcontextrestored',restored);resources.forEach(r=>r.dispose());env.dispose();pmrem.dispose();renderer.dispose();renderer.domElement.remove();controls.current=null;};
  },[]);
  return <div ref={mountRef} className="website-workstation" style={{"--website-room":`url(${base}website/developer-studio-v2.webp)`,"--website-room-mobile":`url(${base}website/developer-studio-mobile.webp)`}}>
    <img className="website-workstation__fallback" src={`${base}northline-auto-optimized.webp`} alt="" />
  </div>;
}
