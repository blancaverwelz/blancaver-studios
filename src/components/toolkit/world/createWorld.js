import {
  ACESFilmicToneMapping, Color, DirectionalLight, HalfFloatType, PCFSoftShadowMap, PerspectiveCamera, PointLight, Scene,
  SpotLight, Vector2, Vector3, WebGLRenderTarget, WebGLRenderer,
} from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { createEnvironment } from "./environment";
import { projectFaces } from "./layout";
import { createMaterials, disposeMaterials } from "./materials";
import { buildScene } from "./scenes";
import { LEVEL_IDLE, PULSE_LIGHT, SELECT_LIGHT, TILT_LABELS } from "./tuning";

const MAX_DPR = { desktop: 1.5, mobile: 2 }; // phones are 2–3× density; lower caps look soft

// Real-time film-look scene: PBR hardware, frosted transmission glass, IBL,
// shaded pulse conduits with real light spill, bloom and MSAA. All hardware is
// procedural; the accessible logo buttons are HTML projected from 3D positions.
export function createWorld({ canvas, sceneId, mobile, onLayout }) {
  const renderer = new WebGLRenderer({ canvas, antialias: false, powerPreference: "high-performance" });
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;

  const mats = createMaterials();
  const ctx = buildScene(sceneId, mats, mobile);
  const envTarget = createEnvironment(renderer, ctx.environment);
  const selectCfg = { ...SELECT_LIGHT, ...ctx.selectLight };
  const pulseCfg = { ...PULSE_LIGHT, ...ctx.pulseLight };

  const scene = new Scene();
  scene.background = new Color(ctx.background);
  scene.environment = envTarget.texture;
  scene.environmentIntensity = 1.0;
  if (ctx.fog) scene.fog = ctx.fog;
  scene.add(ctx.root);

  const camera = new PerspectiveCamera(ctx.camera.fov, 2.6, 0.1, 140);
  camera.position.set(...ctx.camera.pos);
  const target = new Vector3(...ctx.camera.target);
  camera.lookAt(target);

  // Lighting: warm key with soft shadows, cool rim, two travelling pulse lights,
  // and one selection light that follows the active module.
  const key = new SpotLight(0xffe2b8, 1500, 80, 0.7, 0.9, 2);
  key.position.set(-9, 14, 12);
  key.target.position.copy(target);
  key.castShadow = !ctx.noShadow;
  key.shadow.mapSize.set(1536, 1536);
  key.shadow.bias = -0.0004;
  key.shadow.radius = 5;
  const rim = new DirectionalLight(0xa9c2ff, 0.5);
  const fill = new DirectionalLight(0xffe8c8, 0.55);
  fill.position.set(2, 6, 14);
  rim.position.set(8, 6, -12);
  const pulseLights = Array.from({ length: pulseCfg.count }, () => new PointLight(pulseCfg.color, 0, pulseCfg.distance, 2));
  const selectLight = new PointLight(selectCfg.color, 0, selectCfg.distance, 2);
  scene.add(key, key.target, rim, fill, ...pulseLights, selectLight);

  const composer = new EffectComposer(
    renderer,
    new WebGLRenderTarget(2, 2, { type: HalfFloatType, samples: 4 }),
  );
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new Vector2(2, 2), mobile ? 0.3 : 0.38, 0.45, 1.0);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  let selected = null;
  let hover = null;
  let animate = false;
  let time = 0;
  let last = 0;
  let raf = 0;
  const levels = {};
  const moduleIds = Object.keys(ctx.modules);
  moduleIds.forEach((id) => (levels[id] = 0));

  const size = { w: 1, h: 1 };
  const tilt = TILT_LABELS[mobile ? "mobile" : "desktop"];
  const project = () => onLayout?.(projectFaces(ctx.modules, camera, size, tilt));

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    size.w = Math.max(2, Math.round(rect.width));
    size.h = Math.max(2, Math.round(rect.height));
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR[mobile ? "mobile" : "desktop"]);
    renderer.setPixelRatio(dpr);
    renderer.setSize(size.w, size.h, false);
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    composer.setPixelRatio(dpr);
    composer.setSize(size.w, size.h);
    camera.aspect = size.w / size.h;
    camera.updateProjectionMatrix();
    camera.lookAt(target);
    camera.updateMatrixWorld();
    project();
  }

  function step(dt) {
    if (animate) time += dt;
    ctx.charges(selected ?? moduleIds[0]);
    const pulses = [];
    for (const c of ctx.conduits) {
      c.update(time, dt, animate);
      if (c.pulse) pulses.push(c.pulse);
    }
    ctx.update?.(time, dt, animate);
    pulses.sort((a, b) => b.power - a.power);
    pulseLights.forEach((l, i) => {
      const p = pulses[i];
      if (p) {
        l.position.copy(p.pos);
        l.position.y += pulseCfg.lift;
        l.intensity += (pulseCfg.intensity * p.power - l.intensity) * Math.min(1, dt * pulseCfg.response);
      } else {
        l.intensity *= Math.max(0, 1 - dt * 8);
      }
    });
    for (const id of moduleIds) {
      const goal = id === selected ? 1 : id === hover ? 0.5 : LEVEL_IDLE;
      levels[id] += (goal - levels[id]) * Math.min(1, dt * 6);
      ctx.modules[id].setLevel(levels[id]);
    }
    const sel = selected && ctx.modules[selected];
    if (sel) {
      sel.group.getWorldPosition(selectLight.position);
      selectLight.position.x += selectCfg.offset[0];
      selectLight.position.y += selectCfg.offset[1];
      selectLight.position.z += selectCfg.offset[2];
      selectLight.intensity += (selectCfg.intensity - selectLight.intensity) * Math.min(1, dt * selectCfg.response);
    }
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt);
    composer.render();
    raf = requestAnimationFrame(frame);
  }

  const observer = new ResizeObserver(() => {
    resize();
    if (!raf) renderOnce();
  });
  observer.observe(canvas.parentElement);

  function renderOnce() {
    step(0.5);
    composer.render();
  }
  resize();
  renderOnce();

  return {
    setSelected(id) {
      selected = id;
      if (!raf) renderOnce();
    },
    setHover(id) {
      hover = id;
      if (!raf) renderOnce();
    },
    setRunning(run, animated) {
      animate = animated;
      if (run && !raf) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      } else if (!run && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
        renderOnce();
      }
    },
    dispose() {
      cancelAnimationFrame(raf);
      raf = 0;
      observer.disconnect();
      scene.traverse((o) => {
        o.geometry?.dispose();
        [o.material].flat().forEach((m) => m?.dispose());
      });
      ctx.disposables.forEach((d) => d.dispose());
      disposeMaterials(mats);
      envTarget.dispose();
      composer.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
