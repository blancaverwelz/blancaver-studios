import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { easeRange } from "./studioMonitor";
import "./ClosingChapter.css";

const Lounge = lazy(() => import("./StudioLoungeEnvironment"));

export default function ClosingChapter({
  journey,
  progress = 1,
  entrance = 1,
  active = true,
  preload = false,
}) {
  const root = useRef(null),
    panel = useRef(null);
  const [overflow, setOverflow] = useState(0);
  useEffect(() => {
    if (journey && (active || preload)) import("./StudioLoungeEnvironment");
  }, [journey, active, preload]);
  useEffect(() => {
    if (!journey) return;
    const measure = () =>
      setOverflow(
        Math.max(0, panel.current.scrollHeight - Math.min(root.current.clientHeight, document.documentElement.clientHeight)),
      );
    const observer = new ResizeObserver(measure);
    observer.observe(root.current);
    observer.observe(panel.current);
    measure();
    return () => observer.disconnect();
  }, [journey]);
  const title = journey ? easeRange(progress, 0.05, 0.25) : 1;
  const copy = journey ? easeRange(progress, 0.19, 0.39) : 1;
  const action = journey ? easeRange(progress, 0.32, 0.5) : 1;
  const footer = journey ? easeRange(progress, 0.43, 0.6) : 1;
  const readable = !journey || (active && entrance >= 0.99);
  const stage = (opacity) => ({
    opacity,
    visibility: opacity > 0 ? "visible" : "hidden",
  });
  return (
    <section
      ref={root}
      id="create-whats-next"
      aria-labelledby="create-whats-next-heading"
      className={`closing-chapter${journey ? " closing-chapter--journey" : ""}`}
    >
      {journey && (
        <div className="closing-chapter__room" aria-hidden="true">
          {active && (
            <Suspense fallback={null}>
              <Lounge entrance={entrance} active={active} />
            </Suspense>
          )}
        </div>
      )}
      <div className="closing-chapter__shade" aria-hidden="true" />
      <div
        ref={panel}
        data-closing-panel
        className="closing-chapter__panel"
        style={
          journey
            ? {
                transform: `translateY(${-overflow * easeRange(progress, 0.57, 0.94)}px)`,
              }
            : undefined
        }
      >
        <div className="closing-chapter__invitation">
          <p
            className="closing-chapter__eyebrow"
            style={stage(journey ? easeRange(progress, 0, 0.12) : 1)}
          >
            Your Next Chapter
          </p>
          <h2
            id="create-whats-next-heading"
            tabIndex={-1}
            style={stage(title)}
            aria-hidden={!readable || title < 0.95}
          >
            Let’s Create
            <br />
            <em>What’s Next.</em>
          </h2>
          <p
            className="closing-chapter__copy"
            style={stage(copy)}
            aria-hidden={!readable || copy < 0.95}
          >
            A clearer identity. A stronger website. A more engaging experience.
            Let’s talk about what your business needs.
          </p>
          <div
            style={stage(action)}
            inert={!readable || action < 0.95}
            aria-hidden={!readable || action < 0.95}
          >
            <Link className="closing-chapter__cta" to="/contact">
              Start a Conversation{" "}
            </Link>
          </div>
        </div>
        <footer
          className="site-copyright"
          style={stage(footer)}
          aria-hidden={!readable || footer < 0.95}
        >
          © {new Date().getFullYear()} Blancaver Studios
        </footer>
      </div>
    </section>
  );
}
