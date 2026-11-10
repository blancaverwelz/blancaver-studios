import { serviceHeadings } from "./serviceHeadings";
import "./ServiceHeadings.css";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { easeRange } from "./studioMonitor";
import "./SpatialChapter.css";
const Lab = lazy(() => import("./StudioSpatialEnvironment"));
const Workbench = lazy(() => import("./SpatialWorkbench"));
const modes = [
  ["inspect", "Inspect"],
  ["compare", "Compare"],
  ["context", "In Context"],
];
export default function SpatialChapter({
  benefits,
  progress: p,
  entrance,
  active,
  preload,
  exitProgress = 0,
}) {
  const root = useRef(null),
    buttons = useRef([]);
  const [near, setNear] = useState(false),
    [mode, setMode] = useState(0),
    [sizes, setSizes] = useState({});
  useEffect(() => {
    if (active || preload) setNear(true);
  }, [active, preload]);
  useEffect(() => {
    const el = root.current,
      measure = () => {
        const next = { viewport: el.clientHeight };
        el.querySelectorAll("[data-spatial-panel]").forEach((n) => {
          next[n.dataset.spatialPanel] = n.scrollHeight;
        });
        setSizes((old) =>
          Object.keys(next).every((k) => next[k] === old[k]) ? old : next,
        );
      };
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    el.querySelectorAll("[data-spatial-panel]").forEach((n) => ro.observe(n));
    measure();
    return () => ro.disconnect();
  }, []);
  const intro = 1 - easeRange(p, 0.75, 1.05),
    bench = easeRange(p, 0.95, 1.25),
    closing = easeRange(p, 3.35, 3.7);
  const style = (name, opacity, reading) => ({
    opacity,
    visibility: opacity > 0 ? "visible" : "hidden",
    transform: `translateY(${-Math.max(0, (sizes[name] || 0) - (sizes.viewport || 0)) * reading}px)`,
  });
  function select(i) {
    setMode(i);
  }
  function keys(event) {
    let next = mode;
    if (event.key === "ArrowRight") next = (mode + 1) % 3;
    else if (event.key === "ArrowLeft") next = (mode + 2) % 3;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = 2;
    else return;
    event.preventDefault();
    select(next);
    buttons.current[next]?.focus();
  }
  return (
    <section
      ref={root}
      className="spatial-chapter"
      style={{ "--spatial-copy-opacity": 1 - easeRange(exitProgress, 0, 0.2) }}
      id="3d-interactive"
      aria-labelledby="three-d-interactive-benefits-heading"
    >
      <div className="spatial-chapter__room" aria-hidden="true">
        {near && active && (
          <Suspense fallback={null}>
            <Lab
              progress={p}
              entrance={entrance}
              exitProgress={exitProgress}
              active={active}
            />
          </Suspense>
        )}
      </div>
      <div className="spatial-chapter__shade" aria-hidden="true" />
      <article
        data-spatial-panel="intro"
        className="spatial-chapter__panel spatial-chapter__intro"
        style={style("intro", intro, easeRange(p, 0.15, 0.7))}
        inert={!active || intro < 0.95}
        aria-hidden={!active || intro < 0.95}
      >
        <p className="spatial-chapter__eyebrow">
          Give customers more to explore
        </p>
        <h2
          className="service-heading"
          id="three-d-interactive-benefits-heading"
          tabIndex={-1}
        >
          {serviceHeadings.spatial.intro}
        </h2>
        <p>
          3D visuals can show a product or space from angles a single photo
          can’t. Interactive features let customers take control—rotating an
          item, comparing finishes, or exploring details at their own pace.
        </p>
        <span className="spatial-chapter__cue">
          SCROLL TO APPROACH THE WORKBENCH <span aria-hidden="true">↓</span>
        </span>
      </article>
      <article
        data-spatial-panel="workbench"
        className="spatial-chapter__panel spatial-chapter__workbench"
        style={style("workbench", bench, easeRange(p, 1.5, 3.1))}
        inert={!active || bench < 0.95}
        aria-hidden={!active || bench < 0.95}
      >
        <div className="spatial-chapter__explanation">
          <div
            className="spatial-chapter__benefit"
            style={{
              opacity: 1 - closing,
              visibility: closing < 1 ? "visible" : "hidden",
            }}
            inert={closing > 0.05}
            aria-hidden={closing > 0.05}
          >
            <p className="spatial-chapter__eyebrow">Choose a way to explore</p>
            <div
              id="spatial-benefit"
              role="tabpanel"
              aria-labelledby={`spatial-mode-${mode}`}
              tabIndex={0}
            >
              <h3 className="service-heading">
                {serviceHeadings.spatial.benefits[mode]}
              </h3>
              <p>{benefits[mode].description}</p>
            </div>
            <p className="spatial-chapter__note">
              Try a mode, or keep scrolling. There’s nothing to complete.
            </p>
          </div>
          <div
            className="spatial-chapter__closing"
            style={{
              opacity: closing,
              visibility: closing > 0 ? "visible" : "hidden",
            }}
            inert={closing < 0.95}
            aria-hidden={closing < 0.95}
          >
            <p className="spatial-chapter__eyebrow">
              From seeing to understanding
            </p>
            <h3 className="service-heading">
              {serviceHeadings.spatial.closing}
            </h3>
            <p>
              If shape, space, or customization matters to what you sell, 3D and
              interaction may help customers understand their options. For
              simpler offers, clear photos may be enough.
            </p>
            <Link to="/contact" className="spatial-chapter__cta">
              Explore 3D Experiences
            </Link>
          </div>
        </div>
        <div className="spatial-chapter__station">
          <div
            className="spatial-chapter__modes"
            role="tablist"
            aria-label="Explore the chair"
            onKeyDown={keys}
          >
            {modes.map(([id, label], i) => (
              <button
                ref={(el) => {
                  buttons.current[i] = el;
                }}
                type="button"
                role="tab"
                id={`spatial-mode-${i}`}
                aria-controls="spatial-benefit"
                aria-selected={mode === i}
                tabIndex={mode === i ? 0 : -1}
                key={id}
                onClick={() => select(i)}
              >
                {label}
              </button>
            ))}
          </div>
          {near && (
            <Suspense
              fallback={
                <div className="spatial-chapter__loading" role="status">
                  Preparing the workbench…
                </div>
              }
            >
              <Workbench
                mode={modes[mode][0]}
                active={active && bench > 0.95}
              />
            </Suspense>
          )}
        </div>
      </article>
      <div className="spatial-chapter__footer" aria-hidden="true">
        <span>
          {p < 1
            ? "00 / ENTER THE LAB"
            : p < 3.35
              ? "01 / EXPLORE AT YOUR PACE"
              : "02 / THE POSSIBILITIES"}
        </span>
        <i>
          <b style={{ transform: `scaleX(${Math.min(1, p / 4.8)})` }} />
        </i>
      </div>
    </section>
  );
}
