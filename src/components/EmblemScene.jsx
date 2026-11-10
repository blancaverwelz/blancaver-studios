import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import glyphContour from "../assets/emblem/glyph_contour.json";
import normalMapUrl from "../assets/emblem/emblem_normal_map.png?url";

const GLOW_COLOR = new THREE.Color("#FFD301");
const ARC_COLOR = new THREE.Color("#FFD301").lerp(
  new THREE.Color("#FFFFFF"),
  0.35,
);

// Ring geometry, in the same normalized units glyph_contour.json is in (glyph's
// longest dimension is 2.0, max radial extent from center is ~1.03). These radii
// and the UV constants below were measured directly from emblem_normal_map.png
// (connected-component isolation of the glyph silhouette vs. the ring band, at
// 1008x1024px, ~347.5px per normalized unit) rather than guessed, so the ring's
// proportions and the glyph's rune-mark detail line up with the source art.
const RING_INNER_RADIUS = 1.095;
const RING_OUTER_RADIUS = 1.233;
const RING_THICKNESS = 0.12;
const GLYPH_THICKNESS = 0.12;

const IMG_WIDTH = 1008;
const IMG_HEIGHT = 1024;
const PX_PER_UNIT = 347.5;
const GLYPH_CENTER_PX = [489.5, 513.0];
const RING_CENTER_PX = [503.5, 513.0];

const SPIN_TURNS = 2;
const SPIN_DURATION = 2.1;
const CHARGE_DURATION = 1.3;
const GLOW_FADE_DURATION = 0.9;

function easeOutCubic(x) {
  return 1 - Math.pow(1 - x, 3);
}

// Maps object-space (x, y) into UV space using the glyph's or ring's own measured
// pixel center in the source normal map, so each mesh samples the exact region of
// the texture that corresponds to its own silhouette.
function applyPlanarUV(geometry, centerPx) {
  const pos = geometry.attributes.position;
  const uv = new Float32Array(pos.count * 2);
  const su = PX_PER_UNIT / IMG_WIDTH;
  const sv = PX_PER_UNIT / IMG_HEIGHT;
  const u0 = centerPx[0] / IMG_WIDTH;
  const v0 = 1 - centerPx[1] / IMG_HEIGHT;
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2] = u0 + pos.getX(i) * su;
    uv[i * 2 + 1] = v0 + pos.getY(i) * sv;
  }
  geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
}

function buildGlyphGeometry() {
  const points = glyphContour.points;
  const shape = new THREE.Shape();
  shape.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) {
    shape.lineTo(points[i][0], points[i][1]);
  }
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: GLYPH_THICKNESS,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.015,
    bevelSegments: 2,
    curveSegments: 1,
  });
  geo.center();
  applyPlanarUV(geo, GLYPH_CENTER_PX);
  return geo;
}

function buildRingGeometry() {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, RING_OUTER_RADIUS, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absarc(0, 0, RING_INNER_RADIUS, 0, Math.PI * 2, true);
  shape.holes.push(hole);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: RING_THICKNESS,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 2,
    curveSegments: 64,
  });
  geo.center();
  applyPlanarUV(geo, RING_CENTER_PX);
  return geo;
}

function buildMetalMaterial(normalMap) {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color("#14161c"),
    metalness: 0.8,
    roughness: 0.42,
    envMapIntensity: 1.1,
    normalMap,
  });
}

// Soft breathing glow ring just outside the metal ring's outer edge — a steady
// "lip" of light around the whole ring rather than a highlight traveling around
// its circumference. uIntensity fades it in during the reveal phase; uBreath
// drives the slow pulsing brightness once settled.
function buildGlowLip() {
  const inner = RING_OUTER_RADIUS - 0.1;
  const outer = RING_OUTER_RADIUS + 0.2;
  const geo = new THREE.RingGeometry(inner, outer, 96, 1);
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uIntensity: { value: 0 },
      uBreath: { value: 0 },
      uColor: { value: GLOW_COLOR },
      uInner: { value: inner },
      uOuter: { value: outer },
    },
    vertexShader: `
      varying vec2 vPos;
      void main() {
        vPos = position.xy;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uIntensity;
      uniform float uBreath;
      uniform vec3 uColor;
      uniform float uInner;
      uniform float uOuter;
      varying vec2 vPos;
      void main() {
        float r = length(vPos);
        float fade = 1.0 - smoothstep(uInner, uOuter, r);
        float a = fade * uIntensity * (0.5 + 0.5 * uBreath);
        gl_FragColor = vec4(uColor, a);
      }
    `,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.z = RING_THICKNESS * 0.5 + 0.03;
  return mesh;
}

// Progressively-revealed, flickering emissive tube tracing the ring's circumference —
// the "electrical discharge climbing the ring" read for the charge phase.
function buildChargeArc() {
  const radius = (RING_INNER_RADIUS + RING_OUTER_RADIUS) / 2;
  const segments = 64;
  const curvePoints = [];
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    curvePoints.push(
      new THREE.Vector3(
        Math.cos(a) * radius,
        Math.sin(a) * radius,
        RING_THICKNESS * 0.5 + 0.02,
      ),
    );
  }
  const curve = new THREE.CatmullRomCurve3(curvePoints);
  const geo = new THREE.TubeGeometry(curve, 128, 0.025, 6, false);
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uColor: { value: ARC_COLOR },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uProgress;
      uniform vec3 uColor;
      varying vec2 vUv;
      float hash(float n) { return fract(sin(n) * 43758.5453); }
      void main() {
        float head = uProgress;
        float reveal = smoothstep(head, head - 0.08, vUv.x);
        float flicker = hash(floor(uTime * 24.0) + floor(vUv.x * 30.0));
        float edgeGlow = smoothstep(0.0, 1.0, 1.0 - abs(vUv.y - 0.5) * 2.0);
        float a = reveal * edgeGlow * (0.6 + 0.4 * flicker);
        gl_FragColor = vec4(uColor, a);
      }
    `,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.renderOrder = 10;
  return mesh;
}

// Continuous ambient debris — small angular low-poly rocks, not soft round points.
// Runs independent of the phase state machine, idle and settled alike.
function buildAmbientDebris(count = 180) {
  const geo = new THREE.TetrahedronGeometry(0.018);
  const mat = new THREE.MeshStandardMaterial({
    color: "#E8C766",
    metalness: 0.6,
    roughness: 0.4,
  });
  const mesh = new THREE.InstancedMesh(geo, mat, count);
  const seeds = [];
  const dummy = new THREE.Object3D();
  for (let i = 0; i < count; i++) {
    const r = 2 + Math.random() * 3.4;
    const theta = Math.random() * Math.PI * 2;
    const y = -2.2 + Math.random() * 4.4;
    seeds.push({
      baseX: Math.cos(theta) * r,
      baseY: y,
      baseZ: Math.sin(theta) * r,
      seed: Math.random() * 100,
      rotSpeed: 0.3 + Math.random() * 0.6,
    });
    dummy.position.set(Math.cos(theta) * r, y, Math.sin(theta) * r);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }
  mesh.userData.seeds = seeds;
  return mesh;
}

function updateAmbientDebris(mesh, t, spread = 1) {
  const dummy = new THREE.Object3D();
  const seeds = mesh.userData.seeds;
  for (let i = 0; i < seeds.length; i++) {
    const s = seeds[i];
    dummy.position.set(
      s.baseX + Math.sin(t * 0.15 + s.seed) * 0.25,
      s.baseY * spread + Math.sin(t * 0.1 + s.seed * 1.6) * 0.2,
      s.baseZ + Math.cos(t * 0.13 + s.seed * 0.7) * 0.25,
    );
    dummy.rotation.set(t * s.rotSpeed, t * s.rotSpeed * 0.7, s.seed);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
}

// Short-lived sparks tied specifically to the charge phase, scattering outward from
// the ring's circumference. Separate pool/timing from the ambient debris above.
function buildSparks(count = 60) {
  const positions = new Float32Array(count * 3);
  const angles = new Float32Array(count);
  const seeds = new Float32Array(count);
  const radius = (RING_INNER_RADIUS + RING_OUTER_RADIUS) / 2;
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    angles[i] = a;
    seeds[i] = Math.random();
    positions[i * 3] = Math.cos(a) * radius;
    positions[i * 3 + 1] = Math.sin(a) * radius;
    positions[i * 3 + 2] = RING_THICKNESS * 0.5;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("aAngle", new THREE.BufferAttribute(angles, 1));
  geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));

  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uElapsed: { value: 0 },
      uActive: { value: 0 },
      uColor: { value: ARC_COLOR },
      uRadius: { value: radius },
    },
    vertexShader: `
      attribute float aAngle;
      attribute float aSeed;
      uniform float uElapsed;
      uniform float uRadius;
      varying float vAlpha;
      void main() {
        float life = fract(uElapsed * 0.6 + aSeed);
        float outward = life * (0.6 + aSeed * 0.8);
        vec3 p = vec3(cos(aAngle) * (uRadius + outward), sin(aAngle) * (uRadius + outward), position.z);
        vAlpha = 1.0 - smoothstep(0.0, 1.0, life);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = (6.0 / -mv.z) * (0.5 + 0.5 * aSeed);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      uniform float uActive;
      uniform vec3 uColor;
      varying float vAlpha;
      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float d = length(uv);
        float a = smoothstep(0.5, 0.0, d) * vAlpha * uActive;
        gl_FragColor = vec4(uColor, a);
      }
    `,
  });
  return new THREE.Points(geo, mat);
}

// Journey emblem height before the void was stretched to the copy column.
// The emblem keeps this pixel size; extra height only adds void and particle room.
function emblemBaseHeight() {
  const h = window.innerHeight;
  return window.innerWidth <= 680
    ? Math.min(310, Math.max(220, h * 0.34))
    : Math.min(520, Math.max(300, h * 0.52));
}

export default function EmblemScene({
  journey = false,
  progress = 1,
  active = true,
  vacuum = 0,
}) {
  const controlsRef = useRef(null);
  const inputsRef = useRef({ journey, progress, active, vacuum });
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    inputsRef.current = { journey, progress, active, vacuum };
    controlsRef.current?.sync();
  }, [journey, progress, active, vacuum]);
  const mountRef = useRef(null);
  const sectionRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reducedMotion = motionQuery.matches;
    let visible = false,
      disposed = false,
      rafId = null,
      previous = null,
      time = 0;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0.3, 9.5);
    camera.lookAt(0, -0.3, 0);

    let spread = 1;
    function fitCamera(width, height) {
      const base = inputsRef.current.journey ? emblemBaseHeight() : height;
      const ratio = Math.max(1, height / base);
      camera.aspect = width / height;
      camera.zoom = 1 / ratio;
      spread = ratio;
      camera.updateProjectionMatrix();
    }

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    } catch {
      setUnavailable(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const key = new THREE.DirectionalLight(0xffffff, 2.4);
    key.position.set(3, 4, 5);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x88aaff, 1.1);
    rim.position.set(-4, -2, -3);
    scene.add(rim);
    const fill = new THREE.DirectionalLight(0xffe9b0, 0.8);
    fill.position.set(-2, 3, 6);
    scene.add(fill);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const environment = pmremGenerator.fromScene(room, 0.04);
    scene.environment = environment.texture;
    room.dispose();

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(1, 1),
      0.45,
      0.25,
      0.78,
    );
    composer.addPass(bloomPass);
    composer.addPass(new OutputPass());

    const textureLoader = new THREE.TextureLoader();
    const normalMap = textureLoader.load(normalMapUrl, () => sync());
    normalMap.colorSpace = THREE.NoColorSpace;

    const glyphGeo = buildGlyphGeometry();
    const glyphMat = buildMetalMaterial(normalMap);
    const glyphMesh = new THREE.Mesh(glyphGeo, glyphMat);
    scene.add(glyphMesh);
    const glyphOutline = new THREE.Mesh(
      glyphGeo.clone(),
      new THREE.MeshBasicMaterial({
        color: GLOW_COLOR,
        side: THREE.BackSide,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    );

    glyphOutline.scale.setScalar(1.015);
    scene.add(glyphOutline);

    const ringGeo = buildRingGeometry();
    const ringMat = buildMetalMaterial(normalMap);
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    const ringPivot = new THREE.Group();
    ringPivot.add(ringMesh);
    scene.add(ringPivot);

    const glowLip = buildGlowLip();
    ringPivot.add(glowLip);

    const chargeArc = buildChargeArc();
    ringPivot.add(chargeArc);

    const debris = buildAmbientDebris();
    scene.add(debris);

    const sparks = buildSparks();
    ringPivot.add(sparks);

    // The authored geometry, texture, lighting, bloom and pixel ratio are unchanged.
    // Only the clock/lifecycle and scroll sampling differ in journey mode.
    function sampleSequence(value, ambientTime) {
      const duration = SPIN_DURATION + CHARGE_DURATION + GLOW_FADE_DURATION;
      const elapsed = Math.max(0, Math.min(1, value)) * duration;
      const spin = Math.min(1, elapsed / SPIN_DURATION);
      const charge = THREE.MathUtils.clamp(
        (elapsed - SPIN_DURATION) / CHARGE_DURATION,
        0,
        1,
      );
      const glow = THREE.MathUtils.clamp(
        (elapsed - SPIN_DURATION - CHARGE_DURATION) / GLOW_FADE_DURATION,
        0,
        1,
      );
      ringPivot.rotation.y =
        spin === 1 ? 0 : easeOutCubic(spin) * Math.PI * 2 * SPIN_TURNS;
      chargeArc.material.uniforms.uProgress.value = charge;
      chargeArc.material.uniforms.uTime.value = elapsed;
      chargeArc.material.opacity = 1 - glow;
      sparks.material.uniforms.uActive.value = charge > 0 ? 1 - glow : 0;
      sparks.material.uniforms.uElapsed.value = Math.max(
        0,
        elapsed - SPIN_DURATION,
      );
      const glowStrength = 0.6;

      glowLip.material.uniforms.uIntensity.value = inputsRef.current.journey
        ? Math.max(glow * glowStrength, 0.5 * (1 - spin))
        : glow * glowStrength;
      glowLip.material.uniforms.uBreath.value = reducedMotion
        ? 0.75
        : 0.5 + 0.5 * Math.sin(ambientTime * 0.7);
      glyphOutline.material.opacity = glow * 0.25;
      updateAmbientDebris(debris, reducedMotion ? 0 : ambientTime, spread);
    }
    function render() {
      const input = inputsRef.current;
      const duration = SPIN_DURATION + CHARGE_DURATION + GLOW_FADE_DURATION;
      const value = reducedMotion
        ? 1
        : input.journey
          ? input.progress
          : Math.min(1, time / duration);
      // During the reveal, particles are sampled from scroll too; settled breathing stays live.
      sampleSequence(
        value,
        input.journey && value < 1 ? value * duration : time,
      );
      if (!reducedMotion && input.vacuum > 0) {
        const pull = Math.min(1, input.vacuum / .65);
        ringPivot.rotation.y += pull * pull * Math.PI * 14;
        ringPivot.rotation.z = pull * Math.PI * 2;
        glowLip.material.uniforms.uIntensity.value += Math.sin(pull * Math.PI) * .8;
      } else ringPivot.rotation.z = 0;
      composer.render();
    }
    function stop() {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = null;
      previous = null;
    }
    function animate(now) {
      rafId = null;
      if (disposed || !visible || document.hidden || !inputsRef.current.active)
        return;
      if (previous !== null) time += Math.min((now - previous) / 1000, 0.05);
      previous = now;
      render();
      const input = inputsRef.current;
      if (!reducedMotion && (!input.journey || input.progress >= 1))
        rafId = requestAnimationFrame(animate);
    }
    function sync() {
      if (disposed) return;

      const rect = mount.getBoundingClientRect();
      visible =
        rect.width > 0 &&
        rect.height > 0 &&
        rect.bottom > 0 &&
        rect.top < window.innerHeight &&
        rect.right > 0 &&
        rect.left < window.innerWidth;

      if (!visible || document.hidden || !inputsRef.current.active) {
        stop();
        return;
      }

      const width = mount.clientWidth;
      const height = mount.clientHeight;
      const size = renderer.getSize(new THREE.Vector2());

      if (
        size.x !== width ||
        size.y !== height ||
        camera.aspect !== width / height
      ) {
        fitCamera(width, height);
        renderer.setSize(width, height);
        composer.setSize(width, height);
      }

      const input = inputsRef.current;
      if (reducedMotion || (input.journey && input.progress < 1)) {
        stop();
      }

      if (rafId === null) {
        rafId = requestAnimationFrame(animate);
      }
    }
    function motionChange() {
      reducedMotion = motionQuery.matches;
      sync();
    }
    controlsRef.current = { sync };
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        sync();
      },
      { threshold: 0 },
    );
    observer.observe(sectionRef.current);
    document.addEventListener("visibilitychange", sync);
    motionQuery.addEventListener("change", motionChange);

    function handleResize() {
      const { clientWidth, clientHeight } = mount;
      if (!clientWidth || !clientHeight) return;
      fitCamera(clientWidth, clientHeight);
      renderer.setSize(clientWidth, clientHeight);
      composer.setSize(clientWidth, clientHeight);
      sync();
    }
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(mount);
    handleResize();

    return () => {
      disposed = true;
      controlsRef.current = null;
      stop();
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      motionQuery.removeEventListener("change", motionChange);
      resizeObserver.disconnect();
      pmremGenerator.dispose();
      environment.dispose();
      bloomPass.dispose();
      renderer.dispose();
      composer.dispose();
      normalMap.dispose();
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material))
            obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
      if (mount.contains(renderer.domElement))
        mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={sectionRef}
      className={
        journey
          ? "trust-emblem-scene"
          : "relative aspect-[4/5] w-full overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]"
      }
      aria-hidden="true"
    >
      {unavailable && (
        <div className="trust-emblem-fallback">BLANCAVER STUDIOS</div>
      )}
      <div ref={mountRef} className="relative h-full w-full overflow-hidden" />
    </div>
  );
}
