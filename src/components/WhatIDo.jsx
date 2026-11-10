import { memo } from "react";
import { services } from "../data/services";
import ServicesScene from "./ServicesScene";

function WhatIDo({
  journey = false,
  scrollIndex,
  active = true,
  exitProgress = 0,
}) {
  return (
    <section
      className={`services-overview relative mx-auto max-w-5xl px-5 py-24 sm:px-8 sm:py-32${journey ? " services-overview--journey" : ""}`}
    >
      {/* Single continuous void backdrop: heading, floating shapes, and hint
          text all live inside this one wrapper (see .services-void in
          index.css) instead of the heading sitting outside a separate
          boxed "stage" card. */}
      <div className="services-void">
        <div className="text-center mb-14">
          <span className="services-void__eyebrow">What We Do</span>
          <h2 id="studio-services-heading" tabIndex={-1}>
            Tailoring unique <br />
            solutions for your
            <br />
            <span>next breakthrough</span>
          </h2>
        </div>

        <ServicesScene
          active={active}
          services={services}
          scrollIndex={scrollIndex}
          exitProgress={exitProgress}
        />
      </div>
    </section>
  );
}

export default memo(WhatIDo);
