import { useCallback, useEffect, useRef, useState } from "react";
import { TOOLS } from "../../data/toolkit";
import ToolButton from "./ToolButton";
import ToolLogo from "./ToolLogo";
import { useMotionPaused } from "./motionContext";
import { useIsMobile, useNearViewport, usePrefersReducedMotion } from "./useSceneActivity";

export default function ToolScene({ scene, index }) {
  const rootRef = useRef(null);
  const mountRef = useRef(null);
  const toolsRef = useRef(null);
  const worldRef = useRef(null);
  const mobile = useIsMobile();
  const reduced = usePrefersReducedMotion();
  const paused = useMotionPaused();
  const mounted = useNearViewport(rootRef, "1400px");
  const active = useNearViewport(rootRef, "80px");
  const [selected, setSelected] = useState(scene.groups[0].tools[0]);
  const [status, setStatus] = useState("idle");
  const titleId = `toolkit-${scene.id}`;
  const tool = TOOLS[selected];
  const number = String(index + 1).padStart(2, "0");

  // Apply projected 3D face positions to the label buttons (no React re-render).
  const applyLayout = useCallback((items) => {
    const root = toolsRef.current;
    if (!root) return;
    for (const { id, x, y, w, rot } of items) {
      const el = root.querySelector(`[data-tool="${id}"]`);
      if (!el) continue;
      el.style.setProperty("--x", `${x}%`);
      el.style.setProperty("--y", `${y}%`);
      el.style.setProperty("--w", `${Math.max(w, 52).toFixed(1)}px`);
      el.style.setProperty("--rot", `${rot.toFixed(1)}deg`);
    }
  }, []);

  // The WebGL world exists only while the scene is within ~1400px of the viewport.
  useEffect(() => {
    if (!mounted) return undefined;
    let cancelled = false;
    let canvas = null;
    (async () => {
      try {
        const { createWorld } = await import("./world/createWorld");
        if (cancelled) return;
        canvas = document.createElement("canvas");
        mountRef.current.appendChild(canvas);
        worldRef.current = createWorld({ canvas, sceneId: scene.id, mobile, onLayout: applyLayout });
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus("fallback");
      }
    })();
    return () => {
      cancelled = true;
      worldRef.current?.dispose();
      worldRef.current = null;
      canvas?.remove();
      setStatus("idle");
    };
  }, [mounted, scene.id, mobile, applyLayout]);

  useEffect(() => {
    worldRef.current?.setSelected(selected);
  }, [selected, status]);

  useEffect(() => {
    worldRef.current?.setRunning(active, active && !paused && !reduced);
  }, [active, paused, reduced, status]);

  const hover = useCallback((id) => worldRef.current?.setHover(id), []);

  return (
    <section
      ref={rootRef}
      className={`tk-scene tk-scene--${scene.id} tk-scene--copy-${scene.copySide}`}
      aria-labelledby={titleId}
    >
      <div className="tk-scene__copy">
        <span className="tk-scene__number" aria-hidden="true">{number}</span>
        <h2 id={titleId}>{scene.title}</h2>
        <p className="tk-scene__tagline">{scene.tagline}</p>
        <div className="tk-detail" aria-live="polite">
          <ToolLogo tool={tool} />
          <p>
            <strong>{tool.name}</strong>
            <span>{tool.role}</span>
          </p>
        </div>
      </div>

      <div className="tk-scene__stage" data-world={status}>
        <div ref={mountRef} className="tk-world" aria-hidden="true" />
        <div className="tk-scene__shade" aria-hidden="true" />
        <div ref={toolsRef} className="tk-scene__tools">
          {scene.groups.map((group) => (
            <ul key={group.label} className="tk-group" aria-label={group.label}>
              {group.tools.map((id) => (
                <ToolButton key={id} id={id} tool={TOOLS[id]} selected={selected === id} onSelect={setSelected} onHover={hover} />
              ))}
            </ul>
          ))}
        </div>
      </div>
    </section>
  );
}
