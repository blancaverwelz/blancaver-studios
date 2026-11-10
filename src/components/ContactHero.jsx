import { lazy, Suspense } from "react";
import ContactSection from "./ContactSection";

const ContactScene = lazy(() => import("./ContactScene"));

export default function ContactHero() {
  return (
    <section className="contact-hero" aria-labelledby="contact-form-heading">
      <picture className="contact-hero__image" aria-hidden="true">
        <source
          media="(max-width: 767px), (max-aspect-ratio: 17/20)"
          srcSet={`${import.meta.env.BASE_URL}images/contact/project-studio-mobile.webp`}
        />
        <img
          src={`${import.meta.env.BASE_URL}images/contact/project-studio-desktop.webp`}
          alt=""
          fetchPriority="high"
        />
      </picture>
      <Suspense fallback={null}>
        <ContactScene />
      </Suspense>
      <div className="contact-hero__shade" aria-hidden="true" />
      <ContactSection />
      <footer className="site-copyright site-copyright--overlay">
        © {new Date().getFullYear()} Blancaver Studios
      </footer>
    </section>
  );
}
