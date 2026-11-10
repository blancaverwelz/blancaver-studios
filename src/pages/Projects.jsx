import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { projects } from "../data/projects";
import ScrollReveal from "../components/ScrollReveal";
import "./Projects.css";

const Hall = lazy(() => import("../components/WorkGalleryScene"));

function ArchitecturalView() {
  const root = useRef(null);
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setEntered(true);
      },
      { rootMargin: "120px" },
    );
    observer.observe(root.current);
    return () => {
      observer.disconnect();
    };
  }, []);
  return (
    <div ref={root} className="work-architecture" aria-hidden="true">
      <div className="work-architecture__fallback">
        <i />
        <i />
        <i />
        <i />
        <i />
      </div>
      {entered && (
        <Suspense fallback={null}>
          <Hall />
        </Suspense>
      )}
    </div>
  );
}

function Exhibit({ project, index, prominent }) {
  return (
    <ScrollReveal
      className={`work-exhibit${prominent ? " work-exhibit--prominent" : ""}`}
    >
      <article>
        <a
          href={project.link}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Explore ${project.title} (opens in a new tab)`}
        >
          <div className="work-exhibit__light" aria-hidden="true" />
          <div className="work-exhibit__frame">
            <img
              src={project.thumbnail}
              srcSet={project.thumbnailSrcSet}
              sizes="(min-width: 1280px) 650px, (min-width: 768px) 50vw, 92vw"
              alt={project.title}
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className="work-exhibit__plaque">
            <span className="work-exhibit__number" aria-hidden="true">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div>
              <p>{project.category}</p>
              <h4>{project.title}</h4>
            </div>
            <ArrowUpRight size={22} strokeWidth={1.5} aria-hidden="true" />
          </div>
        </a>
      </article>
    </ScrollReveal>
  );
}

export default function Projects() {
  const groups = [
    projects.slice(0, 2),
    projects.slice(2, 5),
    projects.slice(5),
  ].filter((group) => group.length);
  return (
    <main className="work-gallery">
      <header className="work-gallery__hero">
        <ArchitecturalView />
        <div className="work-gallery__hero-shade" aria-hidden="true" />
        <div className="work-gallery__intro">
          <h1>
            Our <em>Work.</em>
          </h1>
          <p className="work-gallery__description">
            Ideas made tangible.
            <br />
            Digital experiences built to be explored.
          </p>
          <a className="work-gallery__browse" href="#work-collection">
            Explore the collection <span aria-hidden="true">↓</span>
          </a>
        </div>
        <div className="work-gallery__hero-caption" aria-hidden="true">
          <span>THE STUDIO GALLERY</span>
        </div>
      </header>

      <section
        id="work-collection"
        aria-labelledby="work-collection-heading"
        className="work-gallery__collection"
      >
        <div className="work-gallery__collection-head">
          <h2 id="work-collection-heading">The collection</h2>
          <p>Explore at your own pace. Projects open in a new tab.</p>
        </div>
        {groups.length ? (
          groups.map((group, bay) => (
            <div className={`work-bay work-bay--${bay + 1}`} key={bay}>
              <div className="work-bay__marker" aria-hidden="true">
                <span>GALLERY / {String(bay + 1).padStart(2, "0")}</span>
              </div>
              <div className="work-bay__exhibits">
                {group.map((project) => (
                  <Exhibit
                    project={project}
                    index={projects.indexOf(project)}
                    prominent={bay !== 1}
                    key={project.id}
                  />
                ))}
              </div>
            </div>
          ))
        ) : (
          <p className="work-gallery__empty">New projects are on the way.</p>
        )}
      </section>

      <section
        className="work-gallery__ending"
        aria-labelledby="work-contact-heading"
      >
        <picture className="work-gallery__ending-image" aria-hidden="true">
          <source
            media="(max-width: 767px)"
            srcSet={`${import.meta.env.BASE_URL}images/work-gallery/studio-lounge-mobile.webp`}
          />
          <img
            src={`${import.meta.env.BASE_URL}images/work-gallery/studio-lounge-desktop.webp`}
            alt=""
            loading="lazy"
            decoding="async"
          />
        </picture>
        <div className="work-gallery__ending-shade" aria-hidden="true" />
        <div className="work-gallery__ending-copy">
          <p className="work-gallery__eyebrow">Beyond the collection</p>
          <h2 id="work-contact-heading">
            What could we
            <br />
            <em>create for you?</em>
          </h2>
          <p>
            Have something in mind? Let’s talk about what your business needs
            and what we can create together.
          </p>
          <Link className="work-gallery__contact" to="/contact">
            Start a Conversation
          </Link>
        </div>
        <footer className="site-copyright">
          © {new Date().getFullYear()} Blancaver Studios
        </footer>
      </section>
    </main>
  );
}
