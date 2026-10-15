import { useEffect, useRef, useState } from "react";
import { Monitor, Fingerprint, Clapperboard, Sparkles } from "lucide-react";

const services = [
  {
    icon: Monitor,
    title: "Web Design & Development",
    desc: "Distinctive, responsive websites designed and built to help your business grow.",
  },
  {
    icon: Fingerprint,
    title: "Brand Identity",
    desc: "Logos, visual systems, and brand guidelines.",
  },
  {
    icon: Clapperboard,
    title: "Motion Design",
    desc: "Animations and videos that bring ideas to life.",
  },
  {
    icon: Sparkles,
    title: "3D & Interactive",
    desc: "3D visuals, WebGL, and immersive digital interactions.",
  },
];

// Interactive row (desktop) / touch carousel (mobile). Cards stay a fixed
// height at all times — hover (desktop) or tap (any device) reveals the
// description via opacity/max-height only, never a height change.
//
// Active/locked state: clicking a card locks it (persistent glow); clicking
// the same card again — or anywhere outside the carousel — clears it.
// Hover stays independent of the lock, so un-locking a card the pointer is
// still resting on leaves its preview open until the pointer actually
// leaves. The outside-click check only fires for targets outside this
// carousel's own container, so it can never mistake an in-progress swipe
// (which targets elements inside the container) for a dismissal.
export default function ContactServices() {
  const containerRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  useEffect(() => {
    if (activeIndex === null) return undefined;

    // 'click' only fires on a completed interaction — a tap/click, not the
    // start of one. Browsers suppress the click event when a touch instead
    // turned into a scroll/swipe, so beginning a vertical page scroll or a
    // horizontal carousel swipe never triggers this, while an actual tap or
    // click elsewhere still does. No gesture library needed.
    function handleOutsideClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setActiveIndex(null);
      }
    }

    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, [activeIndex]);

  return (
    <div className="service-carousel" ref={containerRef}>
      {services.map(({ icon: Icon, title, desc }, i) => {
        const isActive = activeIndex === i;
        const isOpen = isActive || hoveredIndex === i;

        return (
          <button
            key={title}
            type="button"
            className={`service-card${isActive ? " is-active" : ""}${isOpen ? " is-open" : ""}`}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() =>
              setHoveredIndex((prev) => (prev === i ? null : prev))
            }
            onFocus={() => setHoveredIndex(i)}
            onBlur={() => setHoveredIndex((prev) => (prev === i ? null : prev))}
            onClick={() => setActiveIndex((prev) => (prev === i ? null : i))}
            aria-expanded={isOpen}
          >
            <span className="service-card-icon">
              <Icon size={18} strokeWidth={1.75} />
            </span>
            <p className="service-card-title">{title}</p>
            <p className="service-card-desc">{desc}</p>
          </button>
        );
      })}
    </div>
  );
}
