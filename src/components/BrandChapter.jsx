import { serviceHeadings } from "./serviceHeadings";
import "./ServiceHeadings.css";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { easeRange } from "./studioMonitor";
import "./BrandChapter.css";

const StudioBrandEnvironment = lazy(() => import("./StudioBrandEnvironment"));
const images = `${import.meta.env.BASE_URL}images/`;

export default function BrandChapter({
  benefits,
  progress,
  active,
  preload,
  exitProgress = 0,
}) {
  const root = useRef(null);
  const [near, setNear] = useState(false);
  const [heights, setHeights] = useState({
    viewport: 0,
    intro: 0,
    board: 0,
    closing: 0,
  });
  useEffect(() => {
    if (preload || active) setNear(true);
  }, [preload, active]);
  useEffect(() => {
    const element = root.current;
    const measure = () => {
      const next = { viewport: element.clientHeight };
      for (const name of ["intro", "board", "closing"])
        next[name] = element.querySelector(
          `[data-brand-panel="${name}"]`,
        ).scrollHeight;
      setHeights((previous) =>
        Object.keys(next).every((key) => next[key] === previous[key])
          ? previous
          : next,
      );
    };
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    element
      .querySelectorAll(".brand-chapter__panel")
      .forEach((el) => observer.observe(el));
    measure();
    return () => observer.disconnect();
  }, []);
  const intro = 1 - easeRange(progress, 0.7, 1.05);
  const board =
    easeRange(progress, 0.75, 1.05) * (1 - easeRange(progress, 4.05, 4.4));
  const closing = easeRange(progress, 4.35, 4.75);
  const finish = easeRange(progress, 5, 5.4);
  const panelStyle = (name, opacity, reading) => ({
    opacity,
    visibility: opacity > 0 ? "visible" : "hidden",
    transform: `translateY(${-Math.max(0, heights[name] - heights.viewport) * reading}px)`,
  });
  return (
    <section
      ref={root}
      id="brand-identity"
      className="brand-chapter"
      style={{ "--brand-exit-copy": 1 - easeRange(exitProgress, 0, 0.28) }}
      aria-labelledby="brand-identity-benefits-heading"
    >
      <div className="brand-chapter__room" aria-hidden="true">
        {near && (
          <Suspense fallback={null}>
            <StudioBrandEnvironment
              progress={progress}
              active={active}
              exitProgress={exitProgress}
            />
          </Suspense>
        )}
      </div>
      <div className="brand-chapter__scrim" aria-hidden="true" />
      <article
        data-brand-panel="intro"
        className="brand-chapter__panel brand-chapter__intro"
        style={panelStyle("intro", intro, easeRange(progress, 0.2, 0.65))}
        inert={progress >= 1.05}
        aria-hidden={progress >= 1.05}
      >
        <p className="brand-chapter__eyebrow">
          Make every first impression feel like you
        </p>
        <h2
          className="service-heading"
          id="brand-identity-benefits-heading"
          tabIndex={-1}
        >
          {serviceHeadings.brand.intro}
        </h2>
        <p className="brand-chapter__body">
          Your brand identity is how your business looks—from your logo and
          colors to the type on your signs. Bringing these details together
          helps customers recognize you, whether they pass your shop or find you
          online.
        </p>
        <div className="brand-chapter__footnote">
          A LOGO. A LANGUAGE. A LASTING IMPRESSION.{" "}
          <span aria-hidden="true">↓</span>
        </div>
      </article>
      <article
        data-brand-panel="board"
        className="brand-chapter__panel brand-chapter__board"
        style={panelStyle("board", board, easeRange(progress, 2.8, 4.05))}
        inert={progress < 0.75 || progress >= 4.4}
        aria-hidden={progress < 0.75 || progress >= 4.4}
      >
        <header>
          <p className="brand-chapter__eyebrow">
            The identity, coming together
          </p>
          <h3 className="service-heading">{serviceHeadings.brand.board}</h3>
        </header>
        <ol className="brand-chapter__benefits">
          {benefits.map(({ title, description }, i) => {
            const reveal = easeRange(
              progress,
              0.85 + i * 0.85,
              1.25 + i * 0.85,
            );
            return (
              <li
                key={title}
                style={{
                  opacity: reveal,
                  transform: `translateX(${(1 - reveal) * -24}px)`,
                  visibility: reveal > 0 ? "visible" : "hidden",
                }}
                aria-hidden={reveal === 0}
              >
                <span className="brand-chapter__number" aria-hidden="true">
                  0{i + 1}
                </span>
                <div>
                  <span className="brand-chapter__category">
                    {["Recognition", "Character", "Consistency"][i]}
                  </span>
                  <h4>{title}</h4>
                  <p>{description}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </article>
      <article
        data-brand-panel="closing"
        className="brand-chapter__panel brand-chapter__closing"
        style={panelStyle("closing", closing, easeRange(progress, 5.35, 6.2))}
        inert={progress < 4.35}
        aria-hidden={progress < 4.35}
      >
        <div className="brand-chapter__application">
          <p className="brand-chapter__eyebrow">
            From the design room to the real world
          </p>
          <figure>
            <img
              src={`${images}marlow-salon-optimized.webp`}
              srcSet={`${images}marlow-salon-optimized-640.webp 640w, ${images}marlow-salon-optimized-960.webp 960w, ${images}marlow-salon-optimized.webp 1536w`}
              sizes="(max-width:680px) 88vw, 55vw"
              width="1536"
              height="1024"
              alt="Marlow Salon identity concept: coordinated facade signage, logo and mobile appointment booking."
              loading="lazy"
              decoding="async"
            />
            <figcaption>
              MARLOW SALON <span>Illustrative brand identity concept</span>
            </figcaption>
          </figure>
        </div>
        <div
          className="brand-chapter__closing-copy"
          style={{
            opacity: finish,
            transform: `translateY(${(1 - finish) * 20}px)`,
            visibility: finish > 0 ? "visible" : "hidden",
          }}
          inert={finish < 0.99}
          aria-hidden={finish === 0}
        >
          <h3 className="service-heading">{serviceHeadings.brand.closing}</h3>
          <p className="brand-chapter__body">
            If you’re opening a business or your materials no longer feel
            consistent, a clear visual identity can help bring everything
            together.
          </p>
          <Link to="/contact" className="brand-chapter__cta">
            Let’s Shape Your Brand{" "}
          </Link>
        </div>
      </article>
      <div className="brand-chapter__progress" aria-hidden="true">
        <span>
          {progress < 0.8
            ? "ENTER THE BRAND STUDIO"
            : progress < 4.35
              ? "RECOGNITION / CHARACTER / CONSISTENCY"
              : "IDENTITY, IN EVERY DETAIL"}
        </span>
        <i>
          <b style={{ transform: `scaleX(${Math.min(1, progress / 6.25)})` }} />
        </i>
      </div>
    </section>
  );
}
