import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

/* ------------------------------------------------------------------ */
/* "What I Do" 3D constellation scene.                                 */
/*                                                                     */
/* Vanilla Three.js (no R3F), matching the pattern in EmblemScene.jsx: */
/* a single mount-time useEffect drives scene setup, an internal RAF   */
/* loop, and full dispose-on-unmount cleanup. Desktop labels and the   */
/* mobile carousel are real React-rendered buttons; their per-frame    */
/* screen position is written directly to DOM refs inside the RAF      */
/* loop rather than through React state, so 60fps label tracking       */
/* doesn't trigger 60 renders/sec.                                     */
/*                                                                     */
/* The scene pauses its own RAF loop via IntersectionObserver when     */
/* scrolled out of view — this page already runs EmblemScene's WebGL   */
/* context above the fold, so a second context left running off-screen */
/* is the most likely way this section could tank frame rate.          */
/* ------------------------------------------------------------------ */

const MOBILE_BREAKPOINT = 680;

// Loose constellation layout, one slot per service, in the same order as
// services.js. Kept separate from service content so the data file only
// gains the optional `shape` field.
// Desktop layout and accent colors keyed by shape.
// Service order can change without changing an object's appearance.
const SERVICE_VISUALS = {
  gem: {
    // Web Design & Development — upper left
    position: new THREE.Vector3(-3.2, 1.5, 0.6),
    color: 0xffd301,
  },
  mark: {
    // Brand Identity — upper right
    position: new THREE.Vector3(2.8, 1.8, 0.3),
    color: 0x9e1a0f,
  },
  ribbon: {
    // Motion Design — lower left
    position: new THREE.Vector3(-2.8, -1.5, -1.0),
    color: 0x9e1a0f,
  },
  particles: {
    // 3D & Interactive — lower right
    position: new THREE.Vector3(2.6, -1.4, 1.0),
    color: 0xffd301,
  },
};

function buildShape(shapeType, color) {
  const wrapper = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.22,
    metalness: 0.35,
    roughness: 0.25,
    flatShading: true,
    transparent: true,
    opacity: 0.92,
  });

  if (shapeType === "gem") {
    const geo = new THREE.IcosahedronGeometry(0.6, 0);
    const mesh = new THREE.Mesh(geo, mat);
    const edges = new THREE.EdgesGeometry(geo);
    mesh.add(
      new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.25,
        }),
      ),
    );
    wrapper.add(mesh);
  } else if (shapeType === "cube") {
    const geo = new THREE.BoxGeometry(0.82, 0.82, 0.82);
    const mesh = new THREE.Mesh(geo, mat);
    const edges = new THREE.EdgesGeometry(geo);
    mesh.add(
      new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.3,
        }),
      ),
    );
    wrapper.add(mesh);
  } else if (shapeType === "mark") {
    // Rubik's-cube wireframe: a 3x3x3 grid of small glass-style cubies
    // (translucent physical material, not a flat-fill mesh), each with a
    // white edge-line overlay so the grid itself reads clearly. Faces
    // alternate brand yellow/red by grid-parity, and each cubie gets a
    // randomized brightness multiplier (0.7-1.3x) so the cube doesn't
    // read as two flat colors.
    const cubieSize = 0.34;
    const gap = 0.05;
    const step = cubieSize + gap;
    const yellow = new THREE.Color(0xffd301);
    const red = new THREE.Color(0x9e1a0f);
    const cubieGeo = new THREE.BoxGeometry(cubieSize, cubieSize, cubieSize);
    const cubieEdges = new THREE.EdgesGeometry(cubieGeo);
    for (let xi = -1; xi <= 1; xi++) {
      for (let yi = -1; yi <= 1; yi++) {
        for (let zi = -1; zi <= 1; zi++) {
          const isYellow = (xi + yi + zi + 3) % 2 === 0;
          const brightness = 0.7 + Math.random() * 0.6;
          const cubieColor = (isYellow ? yellow : red)
            .clone()
            .multiplyScalar(brightness);
          const cubieMat = new THREE.MeshPhysicalMaterial({
            color: cubieColor,
            emissive: isYellow ? yellow : red,
            emissiveIntensity: 0.15,
            transparent: true,
            opacity: 0.35,
            roughness: 0.15,
            metalness: 0.05,
            transmission: 0.55,
            thickness: 0.3,
          });
          const cubie = new THREE.Mesh(cubieGeo, cubieMat);
          cubie.position.set(xi * step, yi * step, zi * step);
          cubie.add(
            new THREE.LineSegments(
              cubieEdges,
              new THREE.LineBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.4,
              }),
            ),
          );
          wrapper.add(cubie);
        }
      }
    }
  } else if (shapeType === "ribbon") {
    // Jarvis-style AI orb, rebuilt in-house to match this file's existing
    // buildShape() pattern (not the reference npm package, which is a
    // standalone R3F component with its own render loop — style/motion
    // reference only). A wireframe icosphere core plus three independently
    // tilted orbital rings, brand yellow/red instead of the reference's
    // default cyan. Ring meshes are tagged via userData.isOrbitRing so the
    // RAF loop (below) can spin each one on its own axis independently of
    // the wrapper's overall rotation, for a real "orbiting" read rather
    // than the whole orb just tumbling as one rigid piece.
    const coreGeo = new THREE.IcosahedronGeometry(0.32, 2);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0xffd301,
      emissive: 0xffd301,
      emissiveIntensity: 0.5,
      wireframe: true,
      transparent: true,
      opacity: 0.85,
    });
    wrapper.add(new THREE.Mesh(coreGeo, coreMat));

    const ringSpecs = [
      { radius: 0.55, tube: 0.012, color: 0xffd301, tiltX: 0.3, tiltY: 0 },
      { radius: 0.63, tube: 0.01, color: 0x9e1a0f, tiltX: -0.55, tiltY: 0.9 },
      { radius: 0.47, tube: 0.009, color: 0x9e1a0f, tiltX: 1.1, tiltY: -0.4 },
    ];
    ringSpecs.forEach((spec) => {
      const ringGeo = new THREE.TorusGeometry(spec.radius, spec.tube, 8, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: spec.color,
        transparent: true,
        opacity: 0.7,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = spec.tiltX;
      ring.rotation.y = spec.tiltY;
      ring.userData.isOrbitRing = true;
      wrapper.add(ring);
    });
  } else if (shapeType === "particles") {
    const count = 140;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 0.55 * Math.cbrt(Math.random());
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
      pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
      pos[i * 3 + 2] = r * Math.cos(ph);
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const pMat = new THREE.PointsMaterial({
      color,
      size: 0.045,
      transparent: true,
      opacity: 0.9,
    });
    wrapper.add(new THREE.Points(geo, pMat));
  }

  return wrapper;
}

export default function ServicesScene({ services }) {
  const stageRef = useRef(null);
  const canvasRef = useRef(null);
  const labelRefs = useRef([]);
  const dotRefs = useRef([]);
  const mNumRef = useRef(null);
  const mTitleRef = useRef(null);

  const initialIsMobile =
    typeof window !== "undefined" &&
    window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches;

  const [activeIndex, setActiveIndex] = useState(-1);
  const [mobileIndex, setMobileIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(initialIsMobile);
  const [hint, setHint] = useState(
    initialIsMobile
      ? "Swipe to browse · tap the shape to see details"
      : "Click a node to focus · move your cursor to explore the field",
  );

  // Mirrors of state for use inside the RAF loop's closures without going
  // through React re-renders or stale-closure bugs.
  const activeIndexRef = useRef(activeIndex);
  const mobileIndexRef = useRef(mobileIndex);
  const isMobileRef = useRef(isMobile);
  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);
  useEffect(() => {
    mobileIndexRef.current = mobileIndex;
  }, [mobileIndex]);
  useEffect(() => {
    isMobileRef.current = isMobile;
  }, [isMobile]);

  // Stable callback refs so the mount-time effect (which sets up DOM
  // listeners once) always calls the latest version of these handlers.
  const setActiveRef = useRef(() => {});
  const goMobileRef = useRef(() => {});

  setActiveRef.current = (i) => {
    setActiveIndex((prev) => (prev === i ? -1 : i));
  };
  goMobileRef.current = (i) => {
    setMobileIndex((i + services.length) % services.length);
    setActiveIndex(-1);
  };

  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);

    let W = stage.clientWidth || 1;
    let H = stage.clientHeight || 1;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x05060a, 0.045);

    const camera = new THREE.PerspectiveCamera(48, W / H, 0.1, 100);
    camera.position.set(0, 0, 9);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);

    scene.add(new THREE.AmbientLight(0x8899ff, 0.5));
    const key = new THREE.PointLight(0xffffff, 1.1, 20);
    key.position.set(3, 4, 6);
    scene.add(key);
    const rim = new THREE.PointLight(0xffd301, 0.8, 20);
    rim.position.set(-4, -2, 3);
    scene.add(rim);

    const group = new THREE.Group();
    scene.add(group);

    const shapes = services.map((svc, i) => {
      const visual = SERVICE_VISUALS[svc.shape];
      const wrapper = buildShape(svc.shape, visual.color);
      wrapper.position.copy(visual.position);
      wrapper.userData.serviceIndex = i;
      group.add(wrapper);
      const mats = [];
      // Stash each material's authored opacity/emissiveIntensity as its
      // "resting" baseline before the RAF loop's hover/active pulse touches
      // it. The pulse used to animate every material toward a single
      // hardcoded resting opacity (0.92) regardless of what it was built
      // with — harmless while every shape happened to use ~0.9, but the
      // rubik cubies are deliberately translucent (0.35) for the glass
      // look, so without this they'd drift opaque within about a second.
      wrapper.traverse((obj) => {
        if (obj.material) {
          obj.material.userData.baseOpacity = obj.material.opacity;
          if ("emissiveIntensity" in obj.material)
            obj.material.userData.baseEmissive = obj.material.emissiveIntensity;
          mats.push(obj.material);
        }
      });
      const orbitRings = wrapper.children.filter((c) => c.userData.isOrbitRing);
      return {
        wrapper,
        mats,
        orbitRings: orbitRings.length ? orbitRings : undefined,
        basePos: wrapper.position.clone(),
        spin: 0.15 + Math.random() * 0.15,
        offset: Math.random() * Math.PI * 2,
        shapeType: svc.shape,
      };
    });

    // Ambient dust.
    const particleCount = 200;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      pPos[i * 3] = (Math.random() - 0.5) * 14;
      pPos[i * 3 + 1] = (Math.random() - 0.5) * 8;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    const dustMat = new THREE.PointsMaterial({
      color: 0xffd301,
      size: 0.02,
      transparent: true,
      opacity: 0.3,
    });
    const dust = new THREE.Points(pGeo, dustMat);
    scene.add(dust);

    // Neural-firing effect: small glowing sparks travel between randomly
    // paired shapes along a gentle arc, looping continuously. A fixed pool
    // (not one spark per pair) keeps this cheap regardless of how often
    // pairs fire. Desktop only — pairing is only meaningful when more than
    // one shape is visible, and mobile shows exactly one at a time.
    const MAX_SPARKS = 2;
    const sparkGroup = new THREE.Group();
    scene.add(sparkGroup);
    const sparkPool = [];
    for (let i = 0; i < MAX_SPARKS; i++) {
      const sparkMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 8, 8),
        new THREE.MeshBasicMaterial({
          color: 0xffd301,
          transparent: true,
          opacity: 0,
        }),
      );
      sparkMesh.visible = false;
      sparkGroup.add(sparkMesh);

      const lineMesh = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(),
          new THREE.Vector3(),
          new THREE.Vector3(),
        ]),
        new THREE.LineBasicMaterial({
          color: 0xffd301,
          transparent: true,
          opacity: 0,
        }),
      );
      lineMesh.visible = false;
      sparkGroup.add(lineMesh);

      sparkPool.push({
        mesh: sparkMesh,
        line: lineMesh,
        active: false,
        progress: 0,
        duration: 1,
        curve: null,
      });
    }
    let sparkSpawnTimer = 1.2;
    function spawnSpark() {
      if (shapes.length < 2) return;
      const free = sparkPool.find((s) => !s.active);
      if (!free) return;
      const a = Math.floor(Math.random() * shapes.length);
      let b = Math.floor(Math.random() * shapes.length);
      while (b === a) b = Math.floor(Math.random() * shapes.length);
      const start = shapes[a].basePos.clone();
      const end = shapes[b].basePos.clone();
      const mid = start.clone().lerp(end, 0.5);
      mid.y += 0.6 + Math.random() * 0.4;
      free.curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      free.progress = 0;
      free.duration = 0.9 + Math.random() * 0.5;
      free.active = true;
      const color = Math.random() < 0.5 ? 0xffd301 : 0x9e1a0f;
      free.mesh.material.color.setHex(color);
      free.line.material.color.setHex(color);
      free.mesh.visible = true;
      free.line.visible = true;
    }

    let camTarget = new THREE.Vector3(0, 0, 9);
    let camLookAt = new THREE.Vector3(0, 0, 0);

    function applyCameraForState() {
      const mobile = isMobileRef.current;
      const active = activeIndexRef.current;
      if (active === -1) {
        if (!mobile) {
          camTarget.set(0, 0, 9);
          camLookAt.set(0, 0, 0);
        } else {
          camTarget.set(0, 0, 4.2);
          camLookAt.set(0, 0, 0);
        }
      } else if (!mobile) {
        const p = shapes[active].basePos;
        camTarget.set(p.x * 0.4, p.y * 0.4 + 0.6, p.z + 3.6);
        camLookAt.copy(p);
      } else {
        camTarget.set(0, 0.3, 3.1);
        camLookAt.set(0, 0, 0);
      }
    }

    function applyMode() {
      const mobile = mq.matches;
      isMobileRef.current = mobile;
      setIsMobile(mobile);
      if (mobile) {
        setHint("Swipe to browse · tap the shape to see details");
        canvas.style.cursor = "default";
      } else {
        setHint(
          "Click a node to focus · move your cursor to explore the field",
        );
      }
      setActiveIndex(-1);
      applyCameraForState();
    }

    mq.addEventListener("change", applyMode);
    applyMode();

    // Mouse parallax (desktop only); also raycasts on move to toggle the
    // canvas cursor to 'pointer' when hovering a clickable shape.
    const raycaster = new THREE.Raycaster();
    const hoverNdc = new THREE.Vector2();
    let mouseX = 0;
    let mouseY = 0;
    function handleMouseMove(e) {
      if (isMobileRef.current) return;
      const rect = stage.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseY = ((e.clientY - rect.top) / rect.height) * 2 - 1;

      const canvasRect = canvas.getBoundingClientRect();
      hoverNdc.x = ((e.clientX - canvasRect.left) / canvasRect.width) * 2 - 1;
      hoverNdc.y = -((e.clientY - canvasRect.top) / canvasRect.height) * 2 + 1;
      raycaster.setFromCamera(hoverNdc, camera);
      const hovering = raycaster.intersectObject(group, true).length > 0;
      canvas.style.cursor = hovering ? "pointer" : "default";
    }
    stage.addEventListener("mousemove", handleMouseMove);

    function handleMouseLeave() {
      canvas.style.cursor = "default";
    }
    stage.addEventListener("mouseleave", handleMouseLeave);

    // Tap current mobile shape to open its panel; on desktop, raycast to
    // find which shape (if any) was clicked and activate it the same way
    // its label does.
    const pointerNdc = new THREE.Vector2();
    function handleCanvasClick(e) {
      if (isMobileRef.current) {
        setActiveRef.current(mobileIndexRef.current);
        return;
      }
      const rect = canvas.getBoundingClientRect();
      pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointerNdc, camera);
      const hits = raycaster.intersectObject(group, true);
      if (hits.length === 0) return;
      let obj = hits[0].object;
      while (obj && obj.userData.serviceIndex === undefined) obj = obj.parent;
      if (obj) setActiveRef.current(obj.userData.serviceIndex);
    }
    canvas.addEventListener("click", handleCanvasClick);

    // Swipe.
    let touchStartX = null;
    function handleTouchStart(e) {
      if (isMobileRef.current) touchStartX = e.touches[0].clientX;
    }
    function handleTouchEnd(e) {
      if (!isMobileRef.current || touchStartX === null) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 40)
        goMobileRef.current(mobileIndexRef.current + (dx < 0 ? 1 : -1));
      touchStartX = null;
    }
    stage.addEventListener("touchstart", handleTouchStart, { passive: true });
    stage.addEventListener("touchend", handleTouchEnd, { passive: true });

    function handleKeyDown(e) {
      if (e.key === "Escape") setActiveRef.current(-1);
    }
    document.addEventListener("keydown", handleKeyDown);

    const vec = new THREE.Vector3();
    function updateLabelPositions() {
      shapes.forEach((s, i) => {
        const el = labelRefs.current[i];
        if (!el) return;
        vec.copy(s.wrapper.position);
        vec.project(camera);
        const x = (vec.x * 0.5 + 0.5) * W;
        const y = (-vec.y * 0.5 + 0.5) * H - 34;
        const scale = THREE.MathUtils.clamp(1 - vec.z * 0.3, 0.65, 1.1);
        el.style.transform = `translate(-50%, -100%) translate(${x}px, ${y}px) scale(${scale})`;
      });
    }

    const clock = new THREE.Clock();
    let rafId = null;
    let lastT = 0;

    function tick() {
      rafId = requestAnimationFrame(tick);
      const t = clock.getElapsedTime();
      const delta = Math.min(t - lastT, 0.1); // clamp so a resumed-from-paused tab doesn't jump
      lastT = t;
      const mobile = isMobileRef.current;
      const active = activeIndexRef.current;
      const mobileIdx = mobileIndexRef.current;

      shapes.forEach((s, i) => {
        const isCurrentMobile = mobile && i === mobileIdx;
        const visible = mobile ? isCurrentMobile : true;
        s.wrapper.visible = visible;

        // Mobile shows exactly one shape at a time, centered on the
        // camera's look-at target (the origin) instead of its normal
        // desktop scatter position. Any shape that isn't the current
        // mobile shape — including one just swiped away from, or every
        // shape once back on desktop — is restored to its scatter
        // position so desktop layout is unaffected.
        if (isCurrentMobile) {
          s.wrapper.position.set(0, 0, 0);
        } else {
          s.wrapper.position.copy(s.basePos);
        }

        if (!visible) return;

        if (!reduceMotion) {
          if (s.shapeType === "particles") {
            s.wrapper.rotation.y = t * 0.25 + s.offset;
          } else if (s.shapeType === "ribbon") {
            s.wrapper.rotation.x = t * s.spin * 0.3 + s.offset;
            s.wrapper.rotation.y = t * s.spin * 0.2 + s.offset;
            if (s.orbitRings) {
              s.orbitRings.forEach((ring, ri) => {
                ring.rotation.z = t * (0.4 + ri * 0.25) + s.offset;
              });
            }
          } else if (s.shapeType === "mark") {
            s.wrapper.rotation.y = t * s.spin * 0.6 + s.offset;
          } else {
            s.wrapper.rotation.x = t * s.spin * 0.4 + s.offset;
            s.wrapper.rotation.y = t * s.spin + s.offset;
          }
          if (!mobile)
            s.wrapper.position.y =
              s.basePos.y + Math.sin(t * 0.6 + s.offset) * 0.12;
        }

        const isActive = !mobile && i === active;
        const dimmed = !mobile && active !== -1 && i !== active;
        s.mats.forEach((m) => {
          // Resting-state targets read each material's own authored value
          // (stashed as baseOpacity/baseEmissive at build time) instead of
          // a single hardcoded default — see the comment where those are
          // captured, above.
          if ("emissiveIntensity" in m) {
            const baseEmissive = m.userData.baseEmissive ?? 0.22;
            const targetIntensity = isActive
              ? 0.55
              : dimmed
                ? 0.06
                : baseEmissive;
            m.emissiveIntensity +=
              (targetIntensity - m.emissiveIntensity) * 0.08;
          }
          const baseOpacity = m.userData.baseOpacity ?? 0.92;
          const targetOpacity = isActive ? 1 : dimmed ? 0.2 : baseOpacity;
          m.opacity += (targetOpacity - m.opacity) * 0.08;
        });
        // Increase the resting size of the two lighter-looking objects.
        const baseScale =
          s.shapeType === "ribbon"
            ? 1.35
            : s.shapeType === "particles"
              ? 1.3
              : 1;

        const targetScale = baseScale * (isActive ? 1.3 : 1);
        s.wrapper.scale.x += (targetScale - s.wrapper.scale.x) * 0.08;
        s.wrapper.scale.y += (targetScale - s.wrapper.scale.y) * 0.08;
        s.wrapper.scale.z += (targetScale - s.wrapper.scale.z) * 0.08;
      });

      if (!reduceMotion && !mobile) {
        group.rotation.y = mouseX * 0.12;
        group.rotation.x = mouseY * -0.08;
      }
      if (!reduceMotion) dust.rotation.y = t * 0.02;

      if (!mobile && !reduceMotion) {
        sparkSpawnTimer -= delta;
        if (sparkSpawnTimer <= 0) {
          spawnSpark();
          sparkSpawnTimer = 1.4 + Math.random() * 1.6;
        }
        sparkPool.forEach((s) => {
          if (!s.active) return;
          s.progress += delta / s.duration;
          if (s.progress >= 1) {
            s.active = false;
            s.mesh.visible = false;
            s.line.visible = false;
            return;
          }
          const pos = s.curve.getPoint(s.progress);
          s.mesh.position.copy(pos);
          const fadeIn = Math.min(s.progress / 0.15, 1);
          const fadeOut = Math.min((1 - s.progress) / 0.25, 1);
          const alpha = Math.min(fadeIn, fadeOut);
          s.mesh.material.opacity = alpha;
          s.line.material.opacity = alpha * 0.35;
          const trailStart = Math.max(s.progress - 0.12, 0);
          s.line.geometry.setFromPoints([
            s.curve.getPoint(trailStart),
            s.curve.getPoint((trailStart + s.progress) / 2),
            pos,
          ]);
        });
      } else {
        sparkPool.forEach((s) => {
          if (!s.active) return;
          s.active = false;
          s.mesh.visible = false;
          s.line.visible = false;
        });
      }

      applyCameraForState();
      const lerpSpeed = reduceMotion ? 1 : 0.07;
      camera.position.x += (camTarget.x - camera.position.x) * lerpSpeed;
      camera.position.y += (camTarget.y - camera.position.y) * lerpSpeed;
      camera.position.z += (camTarget.z - camera.position.z) * lerpSpeed;
      camera.lookAt(camLookAt);

      if (!mobile) updateLabelPositions();
      renderer.render(scene, camera);
    }

    function startLoop() {
      if (rafId === null) tick();
    }
    function stopLoop() {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    }

    // Pause the RAF loop entirely while the section is scrolled out of
    // view — the page already runs EmblemScene's WebGL context above the
    // fold, so an off-screen second context left animating is the likeliest
    // way this section could cost frame rate.
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) startLoop();
        else stopLoop();
      },
      { threshold: 0.01 },
    );
    intersectionObserver.observe(stage);
    startLoop();

    function handleResize() {
      W = stage.clientWidth || 1;
      H = stage.clientHeight || 1;
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      renderer.setSize(W, H);
    }
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(stage);

    return () => {
      stopLoop();
      mq.removeEventListener("change", applyMode);
      stage.removeEventListener("mousemove", handleMouseMove);
      stage.removeEventListener("mouseleave", handleMouseLeave);
      canvas.removeEventListener("click", handleCanvasClick);
      stage.removeEventListener("touchstart", handleTouchStart);
      stage.removeEventListener("touchend", handleTouchEnd);
      document.removeEventListener("keydown", handleKeyDown);
      intersectionObserver.disconnect();
      resizeObserver.disconnect();
      renderer.dispose();
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material))
            obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
    };
    // Mount-time setup only — `services` is a stable module-level import.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the mobile carousel's text/dots in sync via direct DOM writes
  // (mirrors label position updates) so React state stays the single
  // source of truth without extra re-renders.
  useEffect(() => {
    const svc = services[mobileIndex];
    if (mNumRef.current) mNumRef.current.textContent = svc.num;
    if (mTitleRef.current) mTitleRef.current.textContent = svc.title;
    dotRefs.current.forEach((d, idx) => {
      if (d) d.classList.toggle("active", idx === mobileIndex);
    });
  }, [mobileIndex, services]);

  return (
    <>
      <div className="services-stage" ref={stageRef}>
        <canvas className="services-canvas" ref={canvasRef} />

        <div className="services-labels" aria-hidden={isMobile}>
          {services.map((svc, i) => (
            <button
              key={svc.num}
              ref={(el) => {
                labelRefs.current[i] = el;
              }}
              type="button"
              className={`services-label${activeIndex === i ? " active" : ""}${activeIndex !== -1 && activeIndex !== i ? " dim" : ""}`}
              tabIndex={isMobile ? -1 : 0}
              aria-expanded={activeIndex === i}
              aria-label={`${svc.title}. Show details.`}
              onClick={() => setActiveRef.current(i)}
            >
              <span className="num">{svc.num}</span>
              <span className="title">{svc.title}</span>
            </button>
          ))}
        </div>

        <div className="services-mobile-bar" aria-hidden={!isMobile}>
          <div className="m-title-row">
            <button
              type="button"
              className="services-arrow-btn"
              tabIndex={isMobile ? 0 : -1}
              aria-label="Previous service"
              onClick={() => goMobileRef.current(mobileIndex - 1)}
            >
              &#8592;
            </button>
            <div className="services-m-text">
              <span className="num" ref={mNumRef}>
                {services[mobileIndex].num}
              </span>
              <span className="title" ref={mTitleRef}>
                {services[mobileIndex].title}
              </span>
            </div>
            <button
              type="button"
              className="services-arrow-btn"
              tabIndex={isMobile ? 0 : -1}
              aria-label="Next service"
              onClick={() => goMobileRef.current(mobileIndex + 1)}
            >
              &#8594;
            </button>
          </div>
          <div className="services-dots">
            {services.map((svc, i) => (
              <span
                key={svc.num}
                ref={(el) => {
                  dotRefs.current[i] = el;
                }}
                className={`services-dot${i === mobileIndex ? " active" : ""}`}
              />
            ))}
          </div>
        </div>

        <div className={`services-panel${activeIndex !== -1 ? " open" : ""}`}>
          {activeIndex !== -1 && (
            <>
              <div className="services-panel-top">
                <div>
                  <span className="services-panel-num">
                    {services[activeIndex].num}
                  </span>
                  <h3>{services[activeIndex].title}</h3>
                </div>
                <button
                  type="button"
                  className="services-close-btn"
                  aria-label="Close"
                  onClick={() => setActiveRef.current(-1)}
                >
                  &times;
                </button>
              </div>
              <p>{services[activeIndex].desc}</p>

              {services[activeIndex].benefitsId && (
                <a
                  href={`#${services[activeIndex].benefitsId}`}
                  aria-label={`Learn more about ${services[activeIndex].title}`}
                  className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--color-neon-teal)] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-neon-teal)]"
                >
                  Learn more
                  <span aria-hidden="true">↗</span>
                </a>
              )}
            </>
          )}
        </div>
      </div>
      <p className="services-hint">{hint}</p>
    </>
  );
}
