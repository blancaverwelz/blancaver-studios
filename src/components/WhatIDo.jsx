import { services } from "../data/services";
import ServicesScene from "./ServicesScene";

export default function WhatIDo() {
  return (
    <section className="relative mx-auto max-w-5xl px-5 py-24 sm:px-8 sm:py-32">
      {/* Single continuous void backdrop: heading, floating shapes, and hint
          text all live inside this one wrapper (see .services-void in
          index.css) instead of the heading sitting outside a separate
          boxed "stage" card. */}
      <div className="services-void">
        <div className="text-center mb-14">
          <span className="text-xs font-semibold tracking-[0.3em] text-[var(--color-neon-teal)] uppercase">
            What We Do
          </span>
          <h2 className="mt-5 text-[clamp(2.25rem,6vw,4.25rem)] leading-[1.02] font-extrabold tracking-[-0.03em] text-white">
            Tailoring unique solutions for your next breakthrough.
          </h2>
        </div>

        <ServicesScene services={services} />
      </div>
    </section>
  );
}
