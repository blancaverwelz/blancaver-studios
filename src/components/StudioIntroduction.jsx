import { memo, useEffect, useRef } from "react";
import "./StudioIntroduction.css";

const imageRoot = `${import.meta.env.BASE_URL}images/`;

function StudioIntroduction({ eager = false }) {
  const sectionRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motion.matches || !("IntersectionObserver" in window)) return;
    // Content is visible without JS. Only the decorative background animates.
    const observer = new IntersectionObserver(
      ([entry]) => {
        section.classList.toggle("is-in-view", entry.isIntersecting);
      },
      { threshold: 0.12 },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="studio-introduction"
      className="studio-introduction"
      aria-labelledby="studio-introduction-heading"
    >
      <picture className="studio-introduction__image" aria-hidden="true">
        <source
          media="(max-width: 767px)"
          srcSet={`${imageRoot}studio-interior-small.webp`}
          width="1024"
          height="1536"
        />
        <img
          src={`${imageRoot}studio-interior.webp`}
          width="1536"
          height="1024"
          alt=""
          loading={eager ? "eager" : "lazy"}
          decoding="async"
        />
      </picture>
      <div className="studio-introduction__content">
        <p className="studio-introduction__eyebrow">
          Welcome to Blancaver Studios
        </p>
        <h2 id="studio-introduction-heading" tabIndex={-1}>
          Create <br className="studio-introduction__title-break" />
          what’s <span>next.</span>
        </h2>
        <p className="studio-introduction__lead">
          Building Premium Digital Experiences
        </p>
        <p className="studio-introduction__description">
          Blancaver Studios creates premium digital experiences powered by
          AI-assisted development. We build web apps, interactive 3D websites,
          and immersive web experiences that combine thoughtful design, rapid
          iteration, and real product strategy—from initial concept through
          deployment.
        </p>
        <a className="studio-introduction__link" href="#studio-services">
          Explore what we do <span aria-hidden="true">↓</span>
        </a>
      </div>
    </section>
  );
}

export default memo(StudioIntroduction);
