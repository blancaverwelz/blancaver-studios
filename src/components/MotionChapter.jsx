import { serviceHeadings } from "./serviceHeadings";
import "./ServiceHeadings.css";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { easeRange } from "./studioMonitor";
import "./MotionChapter.css";
const Stage = lazy(() => import("./StudioMotionEnvironment"));
const labels = [
  "ESTABLISH",
  "ATTENTION",
  "EXPLANATION",
  "WITHOUT SOUND",
  "IN MOTION",
];

export default function MotionChapter({
  benefits,
  progress: p,
  entrance,
  active,
  preload,
  exitProgress = 0,
}) {
  const root = useRef(null);
  const [paused, setPaused] = useState(false);
  const [near, setNear] = useState(false);
  const [heights, setHeights] = useState({});
  useEffect(() => {
    if (active || preload) setNear(true);
  }, [active, preload]);
  useEffect(() => {
    const el = root.current;
    const measure = () => {
      const h = { viewport: el.clientHeight };
      el.querySelectorAll("[data-motion-panel]").forEach((n) => {
        h[n.dataset.motionPanel] = n.scrollHeight;
      });
      setHeights((old) =>
        Object.keys(h).every((k) => h[k] === old[k]) ? old : h,
      );
    };
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    el.querySelectorAll("[data-motion-panel]").forEach((n) =>
      observer.observe(n),
    );
    measure();
    return () => observer.disconnect();
  }, []);
  const panel = (name, start, end) => {
    const opacity =
      (start === 0 ? 1 : easeRange(p, start, start + 0.22)) *
      (end ? 1 - easeRange(p, end - 0.22, end) : 1);
    return {
      "data-motion-panel": name,
      className: `motion-chapter__panel motion-chapter__${name}`,
      inert: !active || opacity < 0.95,
      "aria-hidden": !active || opacity < 0.95,
      style: {
        opacity,
        visibility: opacity > 0 ? "visible" : "hidden",
        transform: `translateY(${-Math.max(0, (heights[name] || 0) - (heights.viewport || 0)) * easeRange(p, start + 0.3, end ? end - 0.25 : 6.4)}px)`,
      },
    };
  };
  const beat = p < 1 ? 0 : p < 2 ? 1 : p < 3 ? 2 : p < 4.1 ? 3 : 4;
  return (
    <section
      ref={root}
      id="motion-design"
      aria-labelledby="motion-design-benefits-heading"
      className="motion-chapter"
      style={{ "--motion-exit-copy": 1 - easeRange(exitProgress, 0, 0.25) }}
    >
      <div className="motion-chapter__room" aria-hidden="true">
        {near && exitProgress < 0.9 && (
          <Suspense fallback={null}>
            <Stage
              progress={p}
              entrance={entrance}
              active={active}
              exitProgress={exitProgress}
              paused={paused}
            />
          </Suspense>
        )}
      </div>
      <div className="motion-chapter__shade" aria-hidden="true" />
      <article {...panel("intro", 0, 1)}>
        <p className="motion-chapter__eyebrow">
          Give your message a little movement
        </p>
        <h2
          className="service-heading"
          id="motion-design-benefits-heading"
          tabIndex={-1}
        >
          {serviceHeadings.motion.intro}
        </h2>
        <p>
          Motion design brings text, images, and graphics to life through
          animation. From a restaurant’s weekly special to a short guide to your
          services, it helps you communicate ideas with clarity and impact.
        </p>
        <span className="motion-chapter__cue">
          SCROLL TO BUILD THE MESSAGE <b>↓</b>
        </span>
      </article>
      {benefits.map((b, i) => (
        <article
          key={b.title}
          {...panel(`benefit-${i}`, 1 + i, i === 2 ? 4.1 : 2 + i)}
        >
          <p className="motion-chapter__eyebrow">
            0{i + 1} / {labels[i + 1]}
          </p>
          <h3 className="service-heading">
            {serviceHeadings.motion.benefits[i]}
          </h3>
          <p>{b.description}</p>
          <div className="motion-chapter__note">
            {
              [
                "A clear focal point. A reason to look.",
                "A sequence people can follow.",
                "The whole message. Even on mute.",
              ][i]
            }
          </div>
        </article>
      ))}
      <article {...panel("closing", 4.1, null)}>
        <div className="motion-chapter__closing-copy">
          <p className="motion-chapter__eyebrow">The finished piece</p>
          <h3 className="service-heading">{serviceHeadings.motion.closing}</h3>
          <div
            style={{
              opacity: easeRange(p, 5, 5.35),
              visibility: p > 5 ? "visible" : "hidden",
            }}
            inert={p < 5.35}
            aria-hidden={p < 5.35}
          >
            <p>
              When an offer needs a little attention or a service needs
              explaining, a short animation can help. Sometimes, a still image
              is all you need.
            </p>
            <Link className="motion-chapter__cta" to="/contact">
              Launch your message
            </Link>
          </div>
        </div>
        <div className="motion-chapter__screen-caption">
          <span className="sr-only">
            Lunch, sorted. Crispy chicken sandwich. Weekdays, 11 AM–2 PM.
          </span>
        </div>
      </article>
      {active && p >= 4.55 && exitProgress < 0.25 && (
        <button
          className="motion-chapter__screen-control"
          type="button"
          onClick={() => setPaused((value) => !value)}
          aria-label={paused ? "Play animation" : "Pause animation"}
          aria-pressed={paused}
        >
          <span aria-hidden="true">{paused ? "▶" : "Ⅱ"}</span>
          {paused ? "Play" : "Pause"}
        </button>
      )}
      <div className="motion-chapter__timeline" aria-hidden="true">
        <span>
          0{beat} / {labels[beat]}
        </span>
        <i>
          <b style={{ transform: `scaleX(${Math.min(1, p / 6.5)})` }} />
        </i>
        <span>SCROLL TO DIRECT</span>
      </div>
    </section>
  );
}
