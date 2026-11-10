import * as THREE from "three";
import { loadHeroAssets } from "./loadAssets.js";
import { createHeroCamera } from "./camera.js";
import { createHeroRenderer } from "./renderer.js";
import { prepareHeroMaterials } from "./materials.js";
import { applyHeroAtmosphere } from "./atmosphere.js";
import { createCreatureShadowPlacement } from "./creatureShadows.js";
import { createHeroLighting } from "./lighting.js";
import { createHeroCreatures } from "../heroCreatures.js";
import { assertActive, disposeScene, framePresented } from "./resources.js";

export async function createHeroRealtime({
  container, cameraUrl, envUrl, mobile = false, reducedMotion = false, signal,
  onProgress = () => {}, onReadyChange = () => {}, onError = () => {},
}) {
  const modelUrl = `${import.meta.env.BASE_URL}hero/studio-${mobile ? "mobile" : "desktop"}.glb`;
  const { gltf, hdr, cameraData } = await loadHeroAssets({ cameraUrl, modelUrl, envUrl, signal, onProgress });
  const scene = new THREE.Scene();
  scene.add(gltf.scene);
  const cameraController = createHeroCamera(cameraData, mobile);
  const { camera } = cameraController;
  let view, creatures, mixer, environment, materials;
  const environmentStrengths = new Map();
  let resizeObserver, intersectionObserver;
  let target = 0, time = 0, last = 0, raf = 0;
  let paused = false, interactive = true, disposed = false, visible = true, ready = false;
  let preparing = 0;
  const raycaster = new THREE.Raycaster();
  const duration = Math.max(0, ...gltf.animations.map((clip) => clip.duration));
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  function draw() {
    cameraController.seek(target);
    mixer.setTime(Math.min(target * duration, Math.max(0, duration - 0.00001)));
    creatures.setCamera(camera);
    creatures.update(time, reducedMotion);
    view.draw();
  }
  function loop(now) {
    raf = 0;
    if (!ready || disposed || document.hidden || !visible) return;
    if (last && !paused && !reducedMotion) time += Math.min((now - last) / 1000, 0.05);
    last = now;
    draw();
    if (!paused && !reducedMotion && interactive) raf = requestAnimationFrame(loop);
  }
  function wake() {
    if (!raf && ready && !disposed && visible && !document.hidden) {
      last = 0;
      raf = requestAnimationFrame(loop);
    }
  }
  function resize() {
    const rect = container.getBoundingClientRect();
    const width = Math.max(1, rect.width), height = Math.max(1, rect.height);
    cameraController.resize(width, height);
    view.resize(width, height);
    wake();
  }
  function pick(event) {
    if (!ready || !interactive || paused || reducedMotion) return;
    const rect = view.canvas.getBoundingClientRect();
    raycaster.setFromCamera(new THREE.Vector2((event.clientX - rect.left) / rect.width * 2 - 1, 1 - (event.clientY - rect.top) / rect.height * 2), camera);
    creatures.interact(raycaster, camera, gltf.scene);
    wake();
  }
  function onMotionChange(event) { reducedMotion = event.matches; wake(); }
  function onContextLost(event) {
    event.preventDefault();
    preparing++;
    ready = false;
    cancelAnimationFrame(raf); raf = 0;
    view.conceal(); onReadyChange(false);
  }
  async function prepareAndReveal() {
    const generation = ++preparing;
    ready = false;
    view.conceal();
    resize();
    cameraController.seek(target);
    await view.prepare();
    assertActive(signal);
    if (disposed || generation !== preparing) return;
    draw();
    await framePresented(signal);
    if (disposed || generation !== preparing) return;
    draw();
    await framePresented(signal);
    if (disposed || generation !== preparing) return;
    ready = true;
    view.reveal(); onReadyChange(true); wake();
  }
  function rebuildEnvironment() {
    const generator = new THREE.PMREMGenerator(view.renderer);
    let next;
    try { next = generator.fromEquirectangular(hdr); }
    finally { generator.dispose(); }
    const previous = environment;
    environment = next;
    scene.environment = environment.texture;
    scene.environmentIntensity = 0.10;
    for (const material of materials) {
      material.envMap = environment.texture;
      material.envMapIntensity = environmentStrengths.get(material) * 0.10;
      material.needsUpdate = true;
    }
    previous?.dispose();
  }
  function onContextRestored() {
    if (disposed) return;
    try { rebuildEnvironment(); }
    catch (error) { dispose(); onError(error); return; }
    prepareAndReveal().catch((error) => { if (!disposed) { dispose(); onError(error); } });
  }
  function dispose() {
    if (disposed) return;
    disposed = true; ready = false; preparing++;
    cancelAnimationFrame(raf);
    resizeObserver?.disconnect(); intersectionObserver?.disconnect();
    container.removeEventListener("pointerdown", pick);
    document.removeEventListener("visibilitychange", wake);
    motionQuery.removeEventListener("change", onMotionChange);
    view?.canvas.removeEventListener("webglcontextlost", onContextLost);
    view?.canvas.removeEventListener("webglcontextrestored", onContextRestored);
    signal?.removeEventListener("abort", dispose);
    mixer?.stopAllAction(); mixer?.uncacheRoot(gltf.scene);
    // Dispose every scene resource once, including creature materials/textures.
    disposeScene(scene);
    environment?.dispose(); hdr.dispose(); view?.dispose();
  }

  try {
    assertActive(signal);
    view = createHeroRenderer(container, scene, camera, mobile);
    signal?.addEventListener("abort", dispose, { once: true });
    materials = prepareHeroMaterials(gltf.scene, view.renderer, mobile);
    applyHeroAtmosphere(scene, materials);
    const { key } = createHeroLighting(scene, mobile);
    creatures = createHeroCreatures({ mobile, reflections: false, placeShadow: createCreatureShadowPlacement(key) });
    scene.add(creatures.root);
    mixer = new THREE.AnimationMixer(gltf.scene);
    const doorTracks = gltf.animations.flatMap((clip) => clip.tracks.filter((track) => /leaf_[LR]/i.test(track.name)));
    if (doorTracks.length) mixer.clipAction(new THREE.AnimationClip("Doors", duration, doorTracks)).play();
    for (const material of materials) environmentStrengths.set(material, material.envMapIntensity);
    rebuildEnvironment();
    onProgress(95);
    view.canvas.addEventListener("webglcontextlost", onContextLost);
    view.canvas.addEventListener("webglcontextrestored", onContextRestored);
    await prepareAndReveal();
    assertActive(signal);
    if (disposed) throw new DOMException("Aborted", "AbortError");
    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    intersectionObserver = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; wake(); });
    intersectionObserver.observe(container);
    container.addEventListener("pointerdown", pick);
    document.addEventListener("visibilitychange", wake);
    motionQuery.addEventListener("change", onMotionChange);
    onProgress(100);
  } catch (error) { dispose(); throw error; }

  return {
    setProgress(value) { target = THREE.MathUtils.clamp(value, 0, 1); wake(); },
    setInteractive(value) { interactive = value; creatures.setEnabled(value); wake(); },
    setPaused(value) { paused = value; wake(); },
    dispose,
  };
}
