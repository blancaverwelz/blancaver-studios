import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { easeRange } from "./studioMonitor";

// Existing journey switches rooms at .72–.79. The solid passage wall covers
// that entire interval; the door opening is reached only after the switch.
export default function StudioGlassTransition({ progress }) {
  const mountRef = useRef(null),
    controls = useRef(null),
    value = useRef(progress);
  const [fallback, setFallback] = useState(false);
  useEffect(() => {
    value.current = progress;
    controls.current?.draw();
  }, [progress]);
  const visible = progress > 0 && progress < 1;
  useEffect(() => {
    if (!visible) return;
    const mount = mountRef.current,
      motion = matchMedia("(prefers-reduced-motion: reduce)");
    if (motion.matches) return;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "low-power",
      });
    } catch {
      setFallback(true);
      return;
    }
    setFallback(false);
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.85;
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);
    Object.assign(renderer.domElement.style, {
      position: "absolute",
      inset: "0",
      width: "100%",
      height: "100%",
    });
    const scene = new THREE.Scene(),
      camera = new THREE.PerspectiveCamera(48, 1, 0.05, 100);
    const resources = [];
    const keep = (r) => (resources.push(r), r);
    const charcoal = keep(
      new THREE.MeshStandardMaterial({
        color: "#523a33",
        roughness: 0.82,
      }),
    );
    const metal = keep(
      new THREE.MeshStandardMaterial({
        color: "#998b5c",
        roughness: 0.45,
        metalness: 0.45,
      }),
    );
    const c = document.createElement("canvas");
    c.width = 128;
    c.height = 512;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#513523";
    ctx.fillRect(0, 0, 128, 512);
    for (let i = 0; i < 128; i++) {
      ctx.strokeStyle = `rgba(160,111,67,${0.12 + 0.1 * Math.sin(i * 2.7)})`;
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.bezierCurveTo(i + 4, 180, i - 3, 350, i, 512);
      ctx.stroke();
    }
    const texture = keep(new THREE.CanvasTexture(c));
    texture.colorSpace = THREE.SRGBColorSpace;
    const wood = keep(
      new THREE.MeshStandardMaterial({ map: texture, roughness: 0.6 }),
    );
    const warm = keep(
      new THREE.MeshStandardMaterial({
        color: "#ffe5b5",
        emissive: "#ffcf84",
        emissiveIntensity: 1.4,
      }),
    );
    function box(w, h, d, x, y, z, material) {
      const mesh = new THREE.Mesh(
        keep(new THREE.BoxGeometry(w, h, d)),
        material,
      );
      mesh.position.set(x, y, z);
      scene.add(mesh);
    }
    // Shorter wall: starts at -5 and ends at the doorway at 16.
    box(21, 30, 1, 5.5, 0, 0, charcoal);
    box(20, 30, 1, 30, 0, 0, charcoal); // doorway ends at 20
    box(4, 12, 1, 18, 9.5, 0, charcoal);
    box(4, 12, 1, 18, -9.5, 0, charcoal);
    for (const x of [16, 20]) {
      box(0.22, 7.2, 1.8, x, 0, -0.3, wood);
      box(0.055, 7.2, 0.1, x + (x === 16 ? -0.15 : 0.15), 0, 0.56, metal);
      box(0.025, 6.8, 0.035, x + (x === 16 ? 0.13 : -0.13), 0, -0.1, warm);
    }
    box(4.2, 0.22, 1.8, 18, 3.5, -0.3, wood);
    box(0.18, 30, 1.2, -5, 0, 0.1, wood);
    // Subtle panel seams give the passing wall tangible scale and depth.
    for (const x of [0, 6, 12]) {
      box(0.015, 30, 0.025, x, 0, 0.515, metal);
    }
    scene.add(new THREE.HemisphereLight("#dce6ed", "#312319", 1.2));
    const key = new THREE.DirectionalLight("#ffe1b5", 2);
    key.position.set(-4, 7, 8);
    scene.add(key);
    let dead = false,
      raf = 0;
    function render() {
      raf = 0;
      if (dead || document.hidden || motion.matches) return;
      const w = mount.clientWidth,
        h = mount.clientHeight;
      if (!w || !h) return;
      const p = value.current,
        narrow = w <= 680;
      // On mobile the narrow field of view needs a shorter lateral approach.
      const start = narrow ? -9 : -17;
      const arrival = easeRange(p, 0.08, 0.56);
      const x =
        start +
        (0 - start) * arrival +
        8 * easeRange(p, 0.56, 0.8) +
        10 * easeRange(p, 0.8, 0.94);
      const forward = easeRange(p, 0.91, 1);
      const z = (narrow ? 7 : 9) * (1 - forward) + 0.56 * forward;
      camera.position.set(x, 0, z);
      camera.lookAt(x, 0, -4);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      if (
        renderer.domElement.width !==
          Math.floor(w * renderer.getPixelRatio()) ||
        renderer.domElement.height !== Math.floor(h * renderer.getPixelRatio())
      )
        renderer.setSize(w, h, false);
      renderer.render(scene, camera);
      renderer.domElement.dataset.progress = String(p);
    }
    function draw() {
      if (!dead && !raf) raf = requestAnimationFrame(render);
    }
    const resize = new ResizeObserver(draw);
    resize.observe(mount);
    document.addEventListener("visibilitychange", draw);
    const preference = () => {
      renderer.domElement.style.display = motion.matches ? "none" : "";
      draw();
    };
    motion.addEventListener("change", preference);
    const lost = (e) => {
      e.preventDefault();
      setFallback(true);
    };
    renderer.domElement.addEventListener("webglcontextlost", lost);
    controls.current = { draw };
    draw();
    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      resize.disconnect();
      document.removeEventListener("visibilitychange", draw);
      motion.removeEventListener("change", preference);
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      resources.forEach((r) => r.dispose());
      renderer.dispose();
      renderer.domElement.remove();
      controls.current = null;
    };
  }, [visible]);
  if (!visible) return null;
  const cover =
    easeRange(progress, 0.1, 0.56) * (1 - easeRange(progress, 0.8, 1));
  return (
    <div
      ref={mountRef}
      className="studio-glass-transition"
      aria-hidden="true"
      style={{ background: "transparent", overflow: "hidden" }}
    >
      {fallback && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "#20252a",
            transform: `translateX(${progress < 0.7 ? (1 - cover) * 110 : -(1 - cover) * 110}%)`,
            borderRight: "12px solid #59402d",
          }}
        />
      )}
    </div>
  );
}
