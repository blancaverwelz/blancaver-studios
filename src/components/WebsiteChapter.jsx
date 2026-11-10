import { serviceHeadings } from "./serviceHeadings";
import "./ServiceHeadings.css";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { easeRange } from "./studioMonitor";
import "./WebsiteChapter.css";

const StudioWebEnvironment = lazy(() => import("./StudioWebEnvironment"));

export default function WebsiteChapter({
  benefits,
  progress,
  active,
  preload,
  exitProgress = 0,
}) {
  const mount = useRef(null);
  const [near, setNear] = useState(false);
  // The room is requested only near this chapter, not during the exterior reveal.
  useEffect(() => {
    if (active || preload) setNear(true);
  }, [active, preload]);
  const [viewportHeight, setViewportHeight] = useState(0);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) =>
      setViewportHeight(entry.contentRect.height),
    );
    observer.observe(mount.current);
    return () => observer.disconnect();
  }, []);
  const current = Math.min(4, Math.floor(progress));
  const style = (index) => {
    const local = progress - index;
    const opacity =
      easeRange(local, 0, 0.2) *
      (index === 4 ? 1 : 1 - easeRange(local, 0.82, 1));
    return {
      opacity,
      visibility:
        local >= 0 && (index === 4 || local <= 1) ? "visible" : "hidden",
      transform: `translateY(${(1 - easeRange(local, 0, 0.2)) * 24}px)`,
    };
  };
  // Tall copy can be read without clipping at short viewport heights or zoom.
  useEffect(() => {
    const panel = mount.current?.querySelector(`[data-panel="${current}"]`);
    if (!panel) return;
    const overflow = Math.max(
      0,
      panel.scrollHeight - mount.current.clientHeight,
    );
    panel.style.marginTop = `${-overflow * easeRange(progress - current, 0.25, 0.78)}px`;
  }, [progress, current, viewportHeight]);
  return (
    <section
      ref={mount}
      id="web-design-development"
      aria-labelledby="website-benefits-heading"
      className="website-chapter"
      style={{ "--website-exit-copy": 1 - easeRange(exitProgress, 0, 0.22) }}
    >
      <div className="website-chapter__environment" aria-hidden="true">
        {near && (
          <Suspense fallback={null}>
            <StudioWebEnvironment
              progress={progress}
              active={active}
              exitProgress={exitProgress}
            />
          </Suspense>
        )}
      </div>
      <div className="website-chapter__shade" aria-hidden="true" />
      <article
        data-panel="0"
        className="website-chapter__panel"
        style={style(0)}
        inert={current !== 0}
        aria-hidden={current !== 0}
      >
        <p className="website-chapter__eyebrow">
          Built for businesses ready to grow
        </p>
        <h2
          className="service-heading"
          id="website-benefits-heading"
          tabIndex={-1}
        >
          {serviceHeadings.website.intro}
        </h2>
        <p className="website-chapter__body">
          Social media is a great place to connect with customers, but your
          business deserves a home of its own. A professional website helps you
          build trust, showcase what you do, and make it easier for potential
          customers to choose you.
        </p>
        <span className="website-chapter__prompt">
          SCROLL TO DISCOVER <span aria-hidden="true">↓</span>
        </span>
      </article>
      {benefits.map(({ title, description }, i) => (
        <article
          key={title}
          data-panel={i + 1}
          className="website-chapter__panel"
          style={style(i + 1)}
          inert={current !== i + 1}
          aria-hidden={current !== i + 1}
        >
          <h3 className="service-heading">
            {serviceHeadings.website.benefits[i]}
          </h3>
          <p className="website-chapter__body">{description}</p>
          <div className="website-chapter__detail" aria-hidden="true">
            {
              [
                "CREDIBILITY / FIRST IMPRESSIONS",
                "YOUR BRAND / YOUR SPACE",
                "SERVICES / INQUIRIES / BOOKINGS",
              ][i]
            }
          </div>
        </article>
      ))}
      <article
        data-panel="4"
        className="website-chapter__panel website-chapter__panel--closing"
        style={style(4)}
        inert={current !== 4}
        aria-hidden={current !== 4}
      >
        <div>
          <p className="website-chapter__eyebrow">Build what comes next</p>
          <h3 className="service-heading">{serviceHeadings.website.closing}</h3>
          <p className="website-chapter__body">
            Build an online presence that works as hard{" "}
            <span className="website-chapter__closing-tail">as you do.</span>
          </p>
          <Link className="website-chapter__cta" to="/contact">
            Let’s Build Your Website
          </Link>
        </div>
        <span className="sr-only">
          NORTHLINE AUTO — illustrative website concept, shown on desktop,
          tablet, and phone. Expert care. Every mile. Services, maintenance,
          repairs, and a booking demonstration.
        </span>
      </article>
      <div
        className="website-chapter__navigation"
        aria-label="Website benefits chapters"
      >
        {[
          "Introduction",
          "Build trust",
          "Ownership",
          "Always available",
          "Build what’s next",
        ].map((label, i) => (
          <span key={label} aria-current={current === i ? "step" : undefined}>
            <b>{String(i).padStart(2, "0")}</b>
            <span>{label}</span>
          </span>
        ))}
      </div>
    </section>
  );
}
