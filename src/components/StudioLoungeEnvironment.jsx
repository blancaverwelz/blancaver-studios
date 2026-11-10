import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createLoungeSculpture } from "./lounge/sculpture";
import { lightLounge } from "./lounge/lighting";
import { easeRange } from "./studioMonitor";

const base = `${import.meta.env.BASE_URL}images/closing/`;

export default function StudioLoungeEnvironment({ entrance = 1, active }) {
  const mount = useRef(null),
    layer = useRef(null),
    input = useRef({ entrance, active }),
    api = useRef(null);
  useEffect(() => {
    input.current = { entrance, active };
    api.current?.draw();
  }, [entrance, active]);
  useEffect(() => {
    const host = mount.current,
      surface = layer.current;
    const photo = surface.querySelector("img");
    const reduced = matchMedia("(prefers-reduced-motion: reduce)"),
      fine = matchMedia("(pointer: fine)");
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "low-power",
      });
    } catch {
      return;
    } // The photograph remains available without WebGL.
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
    renderer.setClearColor(0, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.9;
    Object.assign(renderer.domElement.style, {
      position: "absolute",
      inset: "0",
      display: "block",
      width: "100%",
      height: "100%",
      zIndex: "1",
    });
    host.appendChild(renderer.domElement);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 2000);
    const pitch = 0.17;
    camera.position.set(0, 800 * Math.sin(pitch), 800 * Math.cos(pitch));
    camera.lookAt(0, 0, 0);
    const sculpture = createLoungeSculpture();
    scene.add(sculpture.root);
    const lighting = lightLounge(scene, renderer);
    let raf = 0,
      dead = false,
      inView = true,
      lost = false,
      last = 0,
      angle = 0.3,
      px = 0,
      py = 0,
      tx = 0,
      ty = 0;
    function draw() {
      if (!dead && !raf) raf = requestAnimationFrame(render);
    }
    function render(now) {
      raf = 0;
      if (dead || lost || !input.current.active || document.hidden || !inView) {
        last = 0;
        return;
      }
      const w = host.clientWidth,
        h = host.clientHeight;
      if (!w || !h) return;
      const mobile = w <= 680,
        source = mobile
          ? { w: 900, h: 1600, x: 0.56, y: 0.375 }
          : { w: 1600, h: 900, x: 0.7, y: 0.68 };
      const scale = Math.max(w / source.w, h / source.h);
      const overflowX = w - source.w * scale;
      const positionX =
        !mobile && overflowX < 0
          ? THREE.MathUtils.clamp(
              (w * 0.72 - source.w * source.x * scale) / overflowX,
              0,
              1,
            )
          : 0.5;
      const x = overflowX * positionX + source.w * source.x * scale,
        y = (h - source.h * scale) / 2 + source.h * source.y * scale;
      photo.style.objectPosition =
        `${positionX * 100}% 50%`;
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
      last = now;
      if (!reduced.matches) angle += dt * (mobile ? 0.12 : 0.18);
      sculpture.pose(angle);
      const units = scale * (mobile ? 1.1 : 1.2);
      camera.left = -x / units;
      camera.right = (w - x) / units;
      camera.top = y / units;
      camera.bottom = (y - h) / units;
      camera.updateProjectionMatrix();
      px += (tx - px) * 0.07;
      py += (ty - py) * 0.07;
      const zoom = reduced.matches
        ? 1
        : 1.025 + 0.025 * easeRange(input.current.entrance, 0.32, 1);
      surface.style.transform = `translate3d(${reduced.matches ? 0 : px}px,${reduced.matches ? 0 : py}px,0) scale(${zoom})`;
      renderer.render(scene, camera);
      renderer.domElement.dataset.rendered = "true";
      if (!reduced.matches) draw();
    }
    function resize() {
      const w = host.clientWidth,
        h = host.clientHeight;
      if (w && h) {
        renderer.setSize(w, h, false);
      }
      draw();
    }
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    const intersection = new IntersectionObserver((entries) => {
      inView = entries[0].isIntersecting;
      draw();
    });
    intersection.observe(host);
    function pointer(e) {
      if (!fine.matches || reduced.matches || host.clientWidth <= 680) return;
      const r = host.getBoundingClientRect();
      tx =
        THREE.MathUtils.clamp((e.clientX - r.left) / r.width - 0.5, -0.5, 0.5) *
        5;
      ty =
        THREE.MathUtils.clamp((e.clientY - r.top) / r.height - 0.5, -0.5, 0.5) *
        3;
      draw();
    }
    function preference() {
      tx = ty = px = py = 0;
      draw();
    }
    const onLost = (e) => {
      e.preventDefault();
      lost = true;
      cancelAnimationFrame(raf);
      raf = 0;
    };
    const onRestored = () => {
      lighting.refresh();
      lost = false;
      draw();
    };
    window.addEventListener("pointermove", pointer, { passive: true });
    document.addEventListener("visibilitychange", draw);
    reduced.addEventListener("change", preference);
    renderer.domElement.addEventListener("webglcontextlost", onLost);
    renderer.domElement.addEventListener("webglcontextrestored", onRestored);
    api.current = { draw };
    resize();
    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      observer.disconnect();
      intersection.disconnect();
      window.removeEventListener("pointermove", pointer);
      document.removeEventListener("visibilitychange", draw);
      reduced.removeEventListener("change", preference);
      renderer.domElement.removeEventListener("webglcontextlost", onLost);
      renderer.domElement.removeEventListener(
        "webglcontextrestored",
        onRestored,
      );
      sculpture.dispose();
      lighting.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      api.current = null;
    };
  }, []);
  const fill = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
  };
  return (
    <div className="closing-lounge" style={{ ...fill, overflow: "hidden" }}>
      <div ref={layer} className="closing-lounge__layer" style={fill}>
        <picture style={{ ...fill, display: "block" }}>
          <source
            media="(max-width: 680px)"
            srcSet={`${base}studio-lounge-v2-mobile.webp`}
          />
          <img
            src={`${base}studio-lounge-v2.webp`}
            alt=""
            decoding="async"
            style={{
              ...fill,
              display: "block",
              maxWidth: "none",
              maxHeight: "none",
              objectFit: "cover",
              objectPosition: "center",
            }}
          />
        </picture>
        <div
          ref={mount}
          className="closing-lounge__sculpture"
          style={{ ...fill, zIndex: 1, pointerEvents: "none" }}
        />
      </div>
    </div>
  );
}
