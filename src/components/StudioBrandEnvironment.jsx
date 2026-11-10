import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RectAreaLightUniformsLib } from "three/addons/lights/RectAreaLightUniformsLib.js";
import { Reflector } from "three/addons/objects/Reflector.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { FXAAShader } from "three/addons/shaders/FXAAShader.js";
import { easeRange } from "./studioMonitor";

function grainTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext("2d"),
    pixels = ctx.createImageData(256, 256);
  let seed = 15139;
  for (let y = 0; y < 256; y++)
    for (let x = 0; x < 256; x++) {
      seed = (seed * 16807) % 2147483647;
      const v =
        155 +
        (seed / 2147483647 - 0.5) * 36 +
        Math.sin(x * 0.13 + Math.sin(y * 0.03)) * 8;
      const i = (y * 256 + x) * 4;
      pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = v;
      pixels.data[i + 3] = 255;
    }
  ctx.putImageData(pixels, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  return texture;
}

// Directional grain keeps walnut and brushed aluminum distinct from plaster.
function surfaceTexture(wood = false) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext("2d"),
    pixels = ctx.createImageData(512, 512);
  let seed = 9143;
  for (let y = 0; y < 512; y++)
    for (let x = 0; x < 512; x++) {
      seed = (seed * 16807) % 2147483647;
      const noise = seed / 2147483647 - 0.5;
      const grain =
        Math.sin(y * 0.49 + Math.sin(x * 0.012) * 3) +
        0.4 * Math.sin(y * 1.7 + x * 0.005);
      const v = wood
        ? grain * 9 + noise * 5
        : Math.sin(y * 2.8) * 9 + noise * 12;
      const i = (y * 512 + x) * 4;
      pixels.data[i] = (wood ? 111 : 165) + v;
      pixels.data[i + 1] = (wood ? 73 : 165) + v;
      pixels.data[i + 2] = (wood ? 46 : 165) + v;
      pixels.data[i + 3] = 255;
    }
  ctx.putImageData(pixels, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(wood ? 2 : 1, wood ? 3 : 6);
  if (wood) texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Typography and working proofs are supporting studio props, not a replacement logo.
function proofTexture(kind) {
  const canvas = document.createElement("canvas");
  canvas.width = 768;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#e5dfcb";
  ctx.fillRect(0, 0, 768, 512);
  ctx.fillStyle = "#544b38";
  ctx.font = "14px monospace";
  ctx.fillText("BLANCAVER / MARLOW SALON / IDENTITY STUDY", 32, 40);
  ctx.strokeStyle = "#b9af91";
  ctx.beginPath();
  ctx.moveTo(32, 60);
  ctx.lineTo(736, 60);
  ctx.stroke();
  if (kind === "type") {
    ctx.font = "68px Georgia, serif";
    ctx.fillStyle = "#342616";
    ctx.fillText("MARLOW", 35, 160);
    ctx.font = "46px Georgia, serif";
    ctx.fillText("Aa Bb Cc Dd Ee", 35, 235);
    ctx.font = "29px Georgia, serif";
    ctx.fillText("A quieter kind of confidence.", 35, 305);
    ctx.font = "15px monospace";
    ctx.fillStyle = "#716044";
    ctx.fillText("TYPOGRAPHY / HIERARCHY / SPACING", 35, 375);
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = ["#342616", "#7d7251", "#beac82", "#f1ead6"][i];
      ctx.fillRect(35 + i * 175, 410, 160, 65);
    }
  } else {
    ctx.strokeStyle = "#c9bfa2";
    ctx.lineWidth = 1;
    for (let i = 0; i < 14; i++) {
      ctx.beginPath();
      ctx.moveTo(36 + i * 52, 90);
      ctx.lineTo(36 + i * 52, 375);
      ctx.stroke();
    }
    for (let i = 0; i < 7; i++) {
      ctx.beginPath();
      ctx.moveTo(32, 90 + i * 47);
      ctx.lineTo(736, 90 + i * 47);
      ctx.stroke();
    }
    ctx.fillStyle = "#342616";
    ctx.font = "82px Georgia, serif";
    ctx.fillText("MARLOW", 115, 245);
    ctx.font = "22px sans-serif";
    ctx.fillText("S  A  L  O  N", 280, 292);
    ctx.font = "15px monospace";
    ctx.fillStyle = "#716044";
    ctx.fillText("WORDMARK / CLEAR SPACE / APPLICATION", 35, 435);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export default function StudioBrandEnvironment({
  progress,
  active,
  exitProgress = 0,
}) {
  const mountRef = useRef(null),
    controls = useRef(null),
    inputs = useRef({ progress, active, exitProgress });
  useEffect(() => {
    inputs.current = { progress, active, exitProgress };
    controls.current?.draw();
  }, [progress, active, exitProgress]);
  useEffect(() => {
    const mount = mountRef.current,
      mobile = window.innerWidth <= 680;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: false,
        powerPreference: "low-power",
      });
    } catch {
      return;
    }
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, mobile ? 1.15 : 1.5),
    );
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.92;
    renderer.shadowMap.enabled = !mobile;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#15191d");
    scene.fog = new THREE.FogExp2("#24282c", 0.009);
    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 80);
    const textures = [],
      targets = [],
      reveals = [];
    let disposed = false,
      raf = 0;
    const grain = grainTexture();
    textures.push(grain);
    const walnut = surfaceTexture(true),
      brushed = surfaceTexture();
    textures.push(walnut, brushed);
    const stone = new THREE.MeshStandardMaterial({
      color: "#34383d",
      roughness: 0.93,
      bumpMap: grain,
      bumpScale: 0.018,
    });
    const bronze = new THREE.MeshStandardMaterial({
      color: "#656b70",
      metalness: 0.85,
      roughness: 0.43,
      bumpMap: brushed,
      bumpScale: 0.004,
      envMapIntensity: 0.55,
    });
    const dark = new THREE.MeshStandardMaterial({
      color: "#171c21",
      metalness: 0.4,
      roughness: 0.62,
    });
    const wood = new THREE.MeshStandardMaterial({
      color: "#9c826c",
      roughness: 0.56,
      map: walnut,
      bumpMap: walnut,
      bumpScale: 0.009,
    });
    const paper = new THREE.MeshStandardMaterial({
      color: "#eee7d4",
      roughness: 0.92,
    });
    const floor = new THREE.MeshStandardMaterial({
      color: "#303235",
      metalness: 0.08,
      roughness: 0.67,
      bumpMap: grain,
      bumpScale: 0.012,
    });
    const practical = new THREE.MeshStandardMaterial({
      color: "#fff1d5",
      emissive: "#ffe0b0",
      emissiveIntensity: 1.8,
    });
    const accent = new THREE.MeshStandardMaterial({
      color: "#ffd301",
      emissive: "#ffd301",
      emissiveIntensity: 1.25,
    });
    const glass = new THREE.MeshPhysicalMaterial({
      color: "#dce3e7",
      metalness: 0,
      roughness: 0.19,
      transparent: true,
      opacity: 0.1,
      depthWrite: false,
    });
    function box(w, h, d, x, y, z, material = stone, rounded = false) {
      const geometry = rounded
        ? new RoundedBoxGeometry(w, h, d, 2, Math.min(w, h, d) * 0.12)
        : new THREE.BoxGeometry(w, h, d);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, y, z);
      mesh.castShadow =
        material !== practical && material !== accent && material !== glass;
      mesh.receiveShadow = true;
      scene.add(mesh);
      return mesh;
    }
    function board(w, h, x, y, z, texture, materialType = "physical") {
      const material =
        materialType === "screen"
          ? new THREE.MeshBasicMaterial({ map: texture, toneMapped: false })
          : new THREE.MeshStandardMaterial({
              map: texture,
              roughness: 0.7,
              metalness: 0.02,
            });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
      mesh.position.set(x, y, z);
      scene.add(mesh);
      return mesh;
    }
    box(26, 0.3, 32, 0, -0.2, -5, floor);
    box(26, 7.2, 0.5, 0, 3.5, -20, stone);
    box(0.5, 7.2, 32, -12.8, 3.5, -5, stone);
    box(0.5, 7.2, 32, 12.8, 3.5, -5, stone);
    box(26, 0.35, 32, 0, 7.2, -5, dark);
    for (let z = 8; z >= -18; z -= 6.5) {
      box(25, 0.4, 0.55, 0, 6.8, z, dark);
      for (const x of [-11.5, 11.5]) {
        box(0.6, 6.8, 0.8, x, 3.4, z, stone);
        box(0.05, 4.8, 0.06, x + (x < 0 ? 0.32 : -0.32), 3.6, z + 0.44, accent);
      }
    }
    // Walnut battens, brushed aluminum reveals and restrained practical lighting distinguish this room.
    for (let i = 0; i < 28; i++)
      box(0.11, 6.4, 0.13, -10.7 + i * 0.8, 3.4, -19.7, wood);
    for (let z = 8; z > -20; z -= 4) box(25, 0.008, 0.018, 0, -0.035, z, dark);
    for (const x of [-8, -4, 0, 4, 8])
      box(0.018, 0.008, 30, x, -0.035, -5, dark);
    // Suspended task-light rectangle above the presentation table.
    for (const x of [-2, 6.5]) {
      box(0.1, 0.1, 6, x, 5.2, -4, bronze);
      box(0.04, 0.03, 5.8, x, 5.13, -4, practical);
    }
    for (const z of [-1, -7]) {
      box(8.6, 0.1, 0.1, 2.25, 5.2, z, bronze);
      box(8.4, 0.03, 0.04, 2.25, 5.13, z, practical);
    }
    for (const x of [-2, 6.5])
      for (const z of [-1, -7]) box(0.018, 1.9, 0.018, x, 6.2, z, dark);
    // Actual Marlow source artwork supplies consistent facade, logo and digital applications.
    const loader = new THREE.TextureLoader();
    let artwork = [];
    const source = loader.load(
      `${import.meta.env.BASE_URL}images/marlow-salon-optimized-960.webp`,
      (texture) => {
        if (disposed) {
          texture.dispose();
          return;
        }
        artwork.forEach((tex) => {
          tex.image = texture.image;
          tex.needsUpdate = true;
        });
        draw();
      },
      undefined,
      () => draw(),
    );
    source.colorSpace = THREE.SRGBColorSpace;
    textures.push(source);
    function crop(repeatX, repeatY, offsetX, offsetY) {
      const tex = source.clone();
      tex.repeat.set(repeatX, repeatY);
      tex.offset.set(offsetX, offsetY);
      textures.push(tex);
      return tex;
    }
    const facade = crop(0.636, 1, 0, 0),
      logo = crop(0.362, 0.399, 0.638, 0.601),
      digital = crop(0.362, 0.598, 0.638, 0);
    artwork = [facade, logo, digital];
    const art = [
      { x: -5.8, w: 4.8, h: 5.0, texture: facade },
      { x: 0.3, w: 5.6, h: 4.1, texture: logo },
      { x: 6.7, w: 3.8, h: 4.2, texture: digital },
    ];
    art.forEach((item, index) => {
      const frame = box(
        item.w + 0.22,
        item.h + 0.22,
        0.17,
        item.x,
        3.4,
        -19.25,
        bronze,
        true,
      );
      const panel = board(
        item.w,
        item.h,
        item.x,
        3.4,
        -19.15,
        item.texture,
        "screen",
      );
      panel.material.transparent = true;
      panel.material.opacity = 0.28;
      const lamp = box(
        item.w + 0.45,
        0.045,
        0.08,
        item.x,
        3.4 + item.h / 2 + 0.3,
        -18.9,
        practical.clone(),
      );
      reveals.push({ panel, lamp, frame, index });
    });
    // Central tactile worktable: printed sheets, thick material swatches, stationery, rulers.
    box(8.8, 0.18, 3.2, 2.2, 1.12, -4, wood, true);
    for (const x of [-1.3, 5.7]) {
      box(0.24, 1.03, 2.4, x, 0.52, -4, bronze);
      box(1.1, 0.08, 2.7, x, 0.05, -4, dark);
    }
    const proofs = [proofTexture("type"), proofTexture("grid")];
    textures.push(...proofs);
    for (let i = 0; i < 3; i++) {
      box(1.6, 0.025 + i * 0.007, 1.12, -0.5 + i * 2.1, 1.23, -4.3, paper);
      const sheet = board(
        1.55,
        1.03,
        -0.5 + i * 2.1,
        1.252 + i * 0.008,
        -4.3,
        proofs[i % 2],
      );
      sheet.rotation.x = -Math.PI / 2;
      sheet.rotation.z = (i - 1) * 0.07;
    }
    for (let i = 0; i < 5; i++) {
      const material = new THREE.MeshStandardMaterial({
        color: ["#2e362c", "#766e4d", "#ad9871", "#d1c5a1", "#e7dfcb"][i],
        roughness: 0.45 + i * 0.1,
      });
      box(
        0.58,
        0.055,
        0.75,
        0.4 + i * 0.55,
        1.26 + i * 0.007,
        -2.94,
        material,
        true,
      );
    }
    for (let i = 0; i < 6; i++)
      box(0.8, 0.012, 0.45, 5.45, 1.25 + i * 0.013, -4.1, paper);
    box(1.9, 0.018, 0.12, -1, 1.25, -2.8, bronze);
    // Glazed study boards on slim feet; the wordmark grid uses the existing brand name.
    for (let i = 0; i < 2; i++) {
      const x = -6.1 + i * 4.8;
      box(3.9, 2.8, 0.045, x, 3.0, -10.6, glass);
      for (const dx of [-2, 2]) {
        box(0.045, 3.6, 0.045, x + dx, 2.3, -10.6, bronze);
        box(0.65, 0.04, 0.75, x + dx, 0.5, -10.6, dark);
      }
      board(3.5, 2.33, x, 3.1, -10.55, proofs[i]);
    }
    // Material library, open shelves and thick bound identity manuals.
    for (const x of [9, 12]) box(0.08, 3.4, 1.1, x, 1.7, -7, bronze);
    for (let y = 0.4; y < 3.7; y += 0.8) {
      box(3.1, 0.06, 1.1, 10.5, y, -7, wood);
      for (let i = 0; i < 7; i++)
        box(
          0.19,
          0.52 + (i % 3) * 0.06,
          0.65,
          9.4 + i * 0.35,
          y + 0.3,
          -7,
          i % 2 ? paper : dark,
        );
    }
    const hemisphere = new THREE.HemisphereLight("#dce6ed", "#302922", 0.7);
    scene.add(hemisphere);
    // Broad daylight from the left, balanced by the suspended warm task light.
    RectAreaLightUniformsLib.init();
    const daylight = new THREE.RectAreaLight("#e5edf2", 1.8, 10, 5);
    daylight.position.set(-10.5, 5, -4);
    daylight.lookAt(2, 1.5, -9);
    scene.add(daylight);
    const key = new THREE.SpotLight("#ffe4c3", 340, 38, 1.05, 1, 1.8);
    key.position.set(5, 6.5, 1);
    key.target.position.set(2, 0.7, -6);
    key.castShadow = !mobile;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.bias = -0.00012;
    key.shadow.normalBias = 0.018;
    key.shadow.radius = 4;
    scene.add(key, key.target);
    const galleryLight = new THREE.PointLight("#ffe5c8", 65, 18, 1.8);
    galleryLight.position.set(2, 5.7, -15);
    scene.add(galleryLight);
    const cool = new THREE.PointLight("#dce8ef", 40, 18, 1.8);
    cool.position.set(-7, 5.5, -3);
    scene.add(cool);
    const pmrem = new THREE.PMREMGenerator(renderer),
      room = new RoomEnvironment();
    const environment = pmrem.fromScene(room, 0.04);
    scene.environment = environment.texture;
    scene.environmentIntensity = 0.28;
    room.dispose();
    pmrem.dispose();
    targets.push(environment);
    let reflection;
    if (!mobile) {
      reflection = new Reflector(new THREE.PlaneGeometry(25, 30), {
        textureWidth: 512,
        textureHeight: 512,
        color: 0x45494d,
        clipBias: 0.004,
      });
      reflection.rotation.x = -Math.PI / 2;
      reflection.position.set(0, -0.025, -5);
      reflection.material.transparent = true;
      reflection.material.depthWrite = false;
      reflection.material.fragmentShader =
        reflection.material.fragmentShader.replace(
          "gl_FragColor = vec4( blendOverlay( base.rgb, color ), 1.0 );",
          "gl_FragColor = vec4( blendOverlay( base.rgb, color ), 0.045 );",
        );
      scene.add(reflection);
    }
    // Merge only static meshes. Individual presentation materials remain scroll-controlled.
    scene.updateMatrixWorld(true);
    const batches = new Map();
    scene.children.forEach((object) => {
      if (!object.isMesh || object === reflection) return;
      const group = batches.get(object.material) || [];
      group.push(object);
      batches.set(object.material, group);
    });
    batches.forEach((objects, material) => {
      if (objects.length < 2) return;
      const copies = objects.map((object) =>
        object.geometry.clone().applyMatrix4(object.matrixWorld),
      );
      // Rounded boxes use non-indexed geometry; normalize mixed batches before merging.
      const normalized = copies.map((geometry) =>
        geometry.index ? geometry.toNonIndexed() : geometry,
      );
      const merged = mergeGeometries(normalized);
      new Set([...copies, ...normalized]).forEach((geometry) =>
        geometry.dispose(),
      );
      if (!merged) return;
      const mesh = new THREE.Mesh(merged, material);
      mesh.castShadow = objects.some((object) => object.castShadow);
      mesh.receiveShadow = true;
      scene.add(mesh);
      const originals = new Set(objects.map((object) => object.geometry));
      objects.forEach((object) => scene.remove(object));
      originals.forEach((geometry) => geometry.dispose());
    });
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.1, 0.35, 1.3);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
    const aa = new ShaderPass(FXAAShader);
    composer.addPass(aa);
    function render() {
      raf = 0;
      if (disposed || document.hidden || !inputs.current.active) return;
      const rect = mount.getBoundingClientRect();
      if (
        !rect.width ||
        !rect.height ||
        rect.bottom <= 0 ||
        rect.top >= innerHeight
      )
        return;
      const p = inputs.current.progress,
        narrow = rect.width <= 680,
        drift = easeRange(p, 0.4, 4.9);
      camera.position.set(
        narrow ? 3.2 : 7.4 - drift * 4.2,
        narrow ? 3.6 : 3.7,
        narrow ? 10 : 10 - drift * 1.5,
      );
      camera.position.x +=
        easeRange(inputs.current.exitProgress, 0, 0.5) * (narrow ? 1.2 : 3.5);
      camera.lookAt(narrow ? 1 : -0.5 + drift * 1.3, narrow ? 1.2 : 2.7, -13);
      reveals.forEach(({ panel, lamp, index }) => {
        const intensity = easeRange(
          p,
          0.85 + index * 0.85,
          1.25 + index * 0.85,
        );
        panel.material.opacity = 0.28 + intensity * 0.72;
        lamp.material.emissiveIntensity = 0.9 + intensity * 0.9;
      });
      composer.render();
      renderer.domElement.dataset.rendered = "true";
    }
    function draw() {
      if (!disposed && !raf) raf = requestAnimationFrame(render);
    }
    function resize() {
      const w = mount.clientWidth,
        h = mount.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h);
      composer.setSize(w, h);
      const ratio = renderer.getPixelRatio();
      aa.uniforms.resolution.value.set(1 / (w * ratio), 1 / (h * ratio));
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      draw();
    }
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    const intersection = new IntersectionObserver(draw);
    intersection.observe(mount);
    document.addEventListener("visibilitychange", draw);
    const lost = (event) => {
      event.preventDefault();
      cancelAnimationFrame(raf);
      raf = 0;
    };
    renderer.domElement.addEventListener("webglcontextlost", lost);
    renderer.domElement.addEventListener("webglcontextrestored", draw);
    controls.current = { draw };
    resize();
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      controls.current = null;
      observer.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", draw);
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      renderer.domElement.removeEventListener("webglcontextrestored", draw);
      const geometries = new Set(),
        materials = new Set();
      scene.traverse((object) => {
        if (object.geometry) geometries.add(object.geometry);
        if (object.material) materials.add(object.material);
      });
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      textures.forEach((texture) => texture.dispose());
      targets.forEach((target) => target.dispose());
      reflection?.getRenderTarget().dispose();
      bloom.dispose();
      aa.dispose();
      composer.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);
  return <div ref={mountRef} />;
}
