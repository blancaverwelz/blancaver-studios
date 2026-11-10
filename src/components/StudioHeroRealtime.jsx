import { memo, useEffect, useRef, useState } from "react";
import "./StudioHero.css";
import { createHeroRealtime } from "./hero/createHeroRealtime.js";

const root = import.meta.env.BASE_URL;
const hero = `${root}hero/`;
const INTERACTIVE_UNTIL = 0.36; // creatures fly and react to clicks only while the street is still in view
// The lobby photo takes over between 40% and 60% of the entrance, as before. The rendered camera reaches the open
// doors at frame 192 of 240 (80% of the sequence), so the scroll is remapped to arrive there by 60%.
const DOOR_PROGRESS = 192 / 239;
const PHOTO_TAKEOVER = 0.6;
const sequenceProgress = (p) => Math.min(1, Math.max(0, p / PHOTO_TAKEOVER)) * DOOR_PROGRESS;

function StudioHeroRealtime({ progress = 0, mobile = false }) {
  const mountRef = useRef(null);
  const apiRef = useRef(null);
  const progressRef = useRef(progress);
  const [status, setStatus] = useState("Loading studio…");
  const [loadPercent, setLoadPercent] = useState(null);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);

  useEffect(() => {
    let alive = true, instance;
    const abortController = new AbortController();
    setStatus("Loading studio…");
    setLoadPercent(null);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    createHeroRealtime({
      container: mountRef.current,
      cameraUrl: `${hero}camera_frames.json`,
      envUrl: `${hero}hero_env_1k.hdr`,
      mobile,
      reducedMotion: reduced,
      signal: abortController.signal,
      onProgress: (value) => alive && setLoadPercent(value),
      onReadyChange: (ready) => { if (alive) setStatus(ready ? "" : "Loading studio…"); },
      onError: () => { if (alive) setStatus("The studio could not be loaded. Please refresh the page."); },
    })
      .then((h) => {
        if (!alive) return h.dispose();
        instance = apiRef.current = h;
        h.setProgress(sequenceProgress(progressRef.current));
        h.setInteractive(progressRef.current < INTERACTIVE_UNTIL);
        h.setPaused(pausedRef.current);
      })
      .catch(() => alive && setStatus("The studio could not be loaded. Please refresh the page."));
    return () => { alive = false; abortController.abort(); instance?.dispose(); apiRef.current = null; };
  }, [mobile]);

  useEffect(() => {
    progressRef.current = progress;
    apiRef.current?.setProgress(sequenceProgress(progress));
    apiRef.current?.setInteractive(progress < INTERACTIVE_UNTIL);
  }, [progress]);

  return (
    <section className="studio-hero" aria-label="Blancaver Studios exterior">
      <div
        ref={mountRef}
        className="studio-hero__scene"
        style={{ cursor: "default" }}
        role="img"
        aria-label="The Blancaver Studios building at dusk. Click the street or sky to attract the drones and mechanical crawlers. Click one to see it react."
      />
      <div className="studio-hero__shade" aria-hidden="true" />
      <div className="studio-hero__title">
        <h1>Blancaver Studios</h1>
        <span>A stronger presence starts here.</span>
      </div>
      <div className="studio-hero__controls">
        <span>Scroll to enter · Click to interact</span>
        <button
          type="button"
          aria-pressed={paused}
          onClick={() => {
            const next = !paused;
            pausedRef.current = next;
            setPaused(next);
            apiRef.current?.setPaused(next);
          }}
        >
          {paused ? "Resume motion" : "Pause motion"}
        </button>
      </div>
      {status && (
        <div className="studio-hero__status">
          {status === "Loading studio…" ? (
            <>
              <div className={`studio-loader${loadPercent === null ? " studio-loader--indeterminate" : ""}`} role="progressbar" aria-label="Studio download" aria-valuemin={0} aria-valuemax={100} aria-valuenow={loadPercent ?? undefined}>
                <svg viewBox="0 0 100 100" aria-hidden="true">
                  <circle className="studio-loader__track" cx="50" cy="50" r="44" />
                  <circle className="studio-loader__arc" cx="50" cy="50" r="44" pathLength="100" strokeDasharray="100" strokeDashoffset={100 - (loadPercent ?? 24)} />
                </svg>
                <span aria-hidden="true">{loadPercent === null ? "…" : `${loadPercent}%`}</span>
              </div>
              <p role="status">{status}</p>
            </>
          ) : (
            <p role="alert">{status}</p>
          )}
        </div>
      )}
    </section>
  );
}

export default memo(StudioHeroRealtime);
