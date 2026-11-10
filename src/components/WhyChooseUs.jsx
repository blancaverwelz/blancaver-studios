import { useLayoutEffect, useRef } from "react";
import { easeRange } from "./studioMonitor";
import { Link } from "react-router-dom";
import EmblemScene from "./EmblemScene";
import { trustFrame } from "./studioTrust";

export default function WhyChooseUs({
  journey = false,
  progress = 1,
  mobile = false,
  offsetX = 0,
  offsetY = 0,
  active = true,
  vacuum = 0,
  exitX = 0,
  exitY = 0,
}) {
  const sectionRef = useRef(null);
  const suction = easeRange(vacuum, 0.12, 0.64);
  // Measure untransformed layout coordinates, so reverse scroll/resize cannot drift.
  useLayoutEffect(() => {
    if (!journey) return;
    const section = sectionRef.current;
    const measure = () => {
      const stage = section.closest(".studio-journey__stage");
      const overflow = Math.max(0, section.offsetHeight - stage.clientHeight);
      section.querySelectorAll("[data-vacuum]").forEach((el) => {
        let x = 0,
          y = 0,
          node = el;
        while (node && node !== section) {
          x += node.offsetLeft;
          y += node.offsetTop;
          node = node.offsetParent;
        }
        el.style.transformOrigin = `${stage.clientWidth / 2 - x}px ${stage.clientHeight / 2 + overflow - y}px`;
      });
    };
    const observer = new ResizeObserver(measure);
    observer.observe(section);
    measure();
    return () => observer.disconnect();
  }, [journey]);
  const sucked = {
    transform: `rotate(${-95 * suction}deg) scale(${1 - suction * 0.98})`,
    opacity: 1 - easeRange(vacuum, 0.4, 0.64),
    filter: `blur(${suction * 2}px)`,
  };
  const frame = trustFrame(progress, mobile);
  const center = easeRange(vacuum, 0, 0.25);
  const transform = journey
    ? `translate(${offsetX * (1 - frame.settle) + exitX * center}px, ${offsetY * (1 - frame.settle) + exitY * center}px) scale(${(1 + 0.12 * (1 - frame.settle)) * (1 - easeRange(vacuum, 0.5, 0.72) * 0.96)})`
    : undefined;
  return (
    <section
      ref={sectionRef}
      style={{ position: "relative" }}
      id="studio-trust"
      className={
        journey
          ? "trust-chapter"
          : "relative w-full bg-[#05060a] px-5 py-16 sm:px-8 sm:py-24"
      }
    >
      <div
        className={
          journey
            ? "trust-chapter__grid"
            : "mx-auto grid max-w-7xl items-stretch gap-12 lg:grid-cols-2 lg:gap-16"
        }
      >
        <div
          className={
            journey ? "trust-emblem-slot" : "relative flex min-w-0"
          }
        >
          <div className={journey ? "trust-emblem-anchor" : undefined}>
            <div
              className={journey ? "trust-emblem-motion" : undefined}
              style={journey ? { transform, opacity: frame.emblem } : undefined}
            >
              <EmblemScene
                journey={journey}
                progress={frame.emblemProgress}
                active={active}
                vacuum={vacuum}
              />
            </div>
          </div>
        </div>

        <div
          data-vacuum
          className="trust-chapter__copy"
          style={
            journey
              ? {
                  ...sucked,
                  opacity: frame.copy * sucked.opacity,
                  transform: `translateY(${24 * (1 - frame.copy)}px) ${sucked.transform}`,
                }
              : undefined
          }
        >
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-[0.25em] text-[var(--color-neon-teal)] uppercase">
            Why Choose Blancaver Studios
            <span aria-hidden>↗</span>
          </p>
          <h2 id="studio-trust-heading" tabIndex={-1} className="text-white">
            Where Your Vision Meets <span>Next-Gen Execution</span>
          </h2>

          <div className="mt-10 space-y-8">
            <div className="border-t border-white/10 pt-6">
              <h4 className="text-base font-bold text-white sm:text-lg">
                Fast, Focused Development
              </h4>
              <p className="mt-2 text-sm leading-relaxed text-white/50 sm:text-[17px]">
                Every project moves from idea to working app without unnecessary
                delays or bloated processes.
              </p>
            </div>

            <div className="border-t border-white/10 pt-6">
              <h4 className="text-base font-bold text-white sm:text-lg">
                Direct Collaboration, Real Results
              </h4>
              <p className="mt-2 text-sm leading-relaxed text-white/50 sm:text-[17px]">
                You work directly with the builder — no middlemen, no
                lost-in-translation briefs.
              </p>
            </div>
          </div>

          <Link to="/contact" className="why-choose-cta">
            Start a Project
          </Link>
        </div>
      </div>
    </section>
  );
}
