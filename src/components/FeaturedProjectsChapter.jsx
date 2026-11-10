import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { projects } from "../data/projects";
import { galleryFrame, galleryGroups } from "./gallerySequence";
import { easeRange } from "./studioMonitor";
import "./FeaturedProjectsChapter.css";

const Gallery = lazy(() => import("./StudioGalleryEnvironment"));

function Exhibit({ project }) {
  return (
    <article className="gallery-exhibit">
      <a
        href={project.link}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Open ${project.title} (new tab)`}
      >
        <div className="gallery-exhibit__image">
          <img
            src={project.thumbnail}
            srcSet={project.thumbnailSrcSet}
            sizes="(max-width:680px) 88vw, 40vw"
            alt={project.title}
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="gallery-exhibit__meta">
          <p>{project.category}</p>
          <div className="gallery-exhibit__title">
            <h4>{project.title}</h4>
            <span aria-hidden="true">↗</span>
          </div>
        </div>
      </a>
    </article>
  );
}

export default function FeaturedProjectsChapter({
  journey,
  progress = 0.2,
  entrance = 1,
  active = true,
  preload = false,
  mobile = false,
  exitProgress = 0,
}) {
  const root = useRef(null),
    heading = useRef(null),
    lastIndex = useRef(-1);
  const [near, setNear] = useState(false),
    [sizes, setSizes] = useState({});
  const groups = galleryGroups(projects, mobile),
    frame = galleryFrame(progress, groups.length);
  useEffect(() => {
    if (active || preload) {
      setNear(true);
      if (journey) {
        import("./StudioGalleryEnvironment");
        import("./StudioGalleryTransition");
      }
    }
  }, [active, preload, journey]);
  useEffect(() => {
    if (!journey) return;
    const el = root.current;
    const measure = () => {
      const next = { viewport: el.clientHeight };
      el.querySelectorAll("[data-gallery-panel]").forEach((panel) => {
        next[panel.dataset.galleryPanel] = panel.scrollHeight;
      });
      setSizes((old) =>
        JSON.stringify(old) === JSON.stringify(next) ? old : next,
      );
    };
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    el.querySelectorAll("[data-gallery-panel]").forEach((panel) =>
      observer.observe(panel),
    );
    measure();
    return () => observer.disconnect();
  }, [journey, mobile]);
  useEffect(() => {
    // Keep keyboard focus out of a bay that has just become inert.
    if (
      lastIndex.current !== frame.index &&
      root.current?.querySelector("[data-gallery-panel] :focus")
    )
      heading.current?.focus({ preventScroll: true });
    lastIndex.current = frame.index;
  }, [frame.index]);
  const readable = active && entrance >= 0.99 && exitProgress === 0;
  return (
    <section
      ref={root}
      style={{ "--gallery-exit-copy": 1 - easeRange(exitProgress, 0, 0.18) }}
      id="featured-projects"
      aria-labelledby="featured-projects-heading"
      className={`gallery-chapter${journey ? " gallery-chapter--journey" : ""}`}
    >
      {journey && (
        <>
          <div className="gallery-chapter__room" aria-hidden="true">
            {near && active && (
              <Suspense fallback={null}>
                <Gallery
                  progress={progress}
                  count={groups.length}
                  entrance={entrance}
                  exitProgress={exitProgress}
                  active={active}
                  mobile={mobile}
                />
              </Suspense>
            )}
          </div>
          <div className="gallery-chapter__shade" aria-hidden="true" />
        </>
      )}
      <header
        className="gallery-chapter__header"
        style={
          journey && (sizes[frame.index] || 0) > (sizes.viewport || Infinity)
            ? { opacity: 1 - easeRange(frame.local, 0.18, 0.4) }
            : undefined
        }
      >
        <h2 ref={heading} tabIndex={-1} id="featured-projects-heading">
          Featured <em>Projects</em>
        </h2>
        <p>Explore what we’ve built.</p>
      </header>
      <div className="gallery-chapter__exhibits">
        {(journey ? groups : [projects]).map((group, index) => {
          const visible = !journey || index === frame.index;
          const ready =
            !journey || (visible && readable && frame.opacity > 0.9);
          const offset =
            Math.max(0, (sizes[index] || 0) - (sizes.viewport || 0)) *
            easeRange(frame.local, 0.18, 0.68);
          return (
            <div
              key={journey ? `${mobile}-${index}` : "grid"}
              data-gallery-panel={index}
              className="gallery-chapter__panel"
              inert={!ready}
              aria-hidden={!ready || undefined}
              style={
                journey
                  ? {
                      visibility: visible ? "visible" : "hidden",
                      opacity: visible ? frame.opacity : 0,
                      transform: `translateY(${-offset}px)`,
                      "--gallery-columns": mobile ? 1 : 3,
                      "--gallery-count": group.length,
                    }
                  : undefined
              }
            >
              <div className="gallery-chapter__cards">
                {group.map((project) => (
                  <Exhibit key={project.id} project={project} />
                ))}
              </div>
              {(!journey || index === groups.length - 1) && (
                <Link className="gallery-chapter__all" to="/projects">
                  View All Projects
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
