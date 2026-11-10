import { lazy, Suspense, useEffect, useRef, useState } from "react";
import ClosingChapter from "./ClosingChapter";
import FeaturedProjectsChapter from "./FeaturedProjectsChapter";
import ThreeDInteractiveBenefits from "./ThreeDInteractiveBenefits";
import StudioSpatialTransition from "./StudioSpatialTransition";
import MotionDesignBenefits from "./MotionDesignBenefits";
import StudioMotionTransition from "./StudioMotionTransition";
import BrandIdentityBenefits from "./BrandIdentityBenefits";
import StudioGlassTransition from "./StudioGlassTransition";
import WebsiteBenefits from "./WebsiteBenefits";
import StudioVacuum from "./StudioVacuum";
import StudioHeroRealtime from "./StudioHeroRealtime";
import StudioIntroduction from "./StudioIntroduction";
import WhatIDo from "./WhatIDo";
import StudioVortex from "./StudioVortex";
import WhyChooseUs from "./WhyChooseUs";
import StudioCollision from "./StudioCollision";
import { trustFrame } from "./studioTrust";
import "./StudioTrust.css";
import { smoothRange, getEntranceReveal } from "./studioEntrance";
import { installJourneyScroll } from "./studioScrollController";
import { clamp01, easeRange, monitorFrame } from "./studioMonitor";
import "./StudioJourney.css";

const StudioGalleryTransition = lazy(() => import("./StudioGalleryTransition"));

const imageRoot = `${import.meta.env.BASE_URL}images/`;

const WORKBENCH_START = 1.25;
const WORKBENCH_SCROLL = (3.35 - WORKBENCH_START) / 2;
const SPATIAL_END = 4.8;

function getSpatialProgress(scrollSteps) {
  const steps = Math.max(0, scrollSteps);
  const extra = Math.min(
    Math.max(steps - WORKBENCH_START, 0),
    WORKBENCH_SCROLL,
  );
  return Math.min(SPATIAL_END, steps + extra);
}

function getDoorwayProgress(position, start, distance) {
  const scroll = clamp01((position - start) / distance);

  if (scroll < 0.5) return (scroll / 0.5) * 0.8;
  return 0.8 + ((scroll - 0.5) / 0.5) * 0.2;
}
export default function StudioJourney() {
  const rootRef = useRef(null),
    stageRef = useRef(null),
    introRef = useRef(null);
  const trustRef = useRef(null),
    websiteRef = useRef(null),
    brandRef = useRef(null),
    motionRef = useRef(null),
    spatialRef = useRef(null),
    galleryRef = useRef(null),
    closingRef = useRef(null);
  const metricsRef = useRef({
    entrance: 1,
    reading: 1,
    portal: 1,
    services: 1,
    overflow: 0,
  });
  const seekRef = useRef(() => {});
  const [enabled, setEnabled] = useState(false);
  const [view, setView] = useState({
    entrance: 0,
    portal: 0,
    reading: 0,
    service: 0,
    trust: 0,
    trustReading: 0,
    vacuum: 0,
    website: 0,
    doorway: 0,
    brand: 0,
    tracking: 0,
    motion: 0,
    lift: 0,
    spatial: 0,
    galleryEntry: 0,
    gallery: 0,
    loungeEntry: 0,
    closing: 0,
    exitX: 0,
    exitY: 0,
    originX: 0,
    originY: 0,
    offsetX: 0,
    offsetY: 0,
    width: 1536,
    height: 900,
  });

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setEnabled(!media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const root = rootRef.current,
      stage = stageRef.current;
    let frame = 0,
      hashFrame = 0,
      scrollController;
    const update = () => {
      frame = 0;
      const m = metricsRef.current;
      const position = Math.max(0, -root.getBoundingClientRect().top);
      const next = {
        entrance: clamp01(position / m.entrance),
        reading: Math.min(m.overflow, Math.max(0, position - m.entrance)),
        portal: clamp01((position - m.entrance - m.reading) / m.portal),
        service: Math.min(
          3,
          Math.floor(
            Math.max(0, position - m.entrance - m.reading - m.portal) /
              m.serviceStep,
          ),
        ),
        trust: clamp01((position - m.trustStart) / m.trustDistance),
        trustReading: Math.min(
          m.trustOverflow,
          Math.max(0, position - m.trustStart - m.trustDistance),
        ),
        vacuum: clamp01((position - m.vacuumStart) / m.vacuumDistance),
        website: Math.min(
          m.websiteDistance / m.websiteStep,
          Math.max(0, (position - m.websiteStart) / m.websiteStep),
        ),
        doorway: getDoorwayProgress(
          position,
          m.doorwayStart,
          m.doorwayDistance,
        ),
        brand: Math.min(
          6.25,
          Math.max(0, (position - m.brandStart) / m.brandStep),
        ),
        tracking: clamp01((position - m.trackingStart) / m.trackingDistance),
        motion: Math.min(
          6.5,
          Math.max(0, (position - m.motionStart) / m.motionStep),
        ),
        lift: clamp01((position - m.liftStart) / m.liftDistance),
        spatial: getSpatialProgress(
          (position - m.spatialStart) / m.spatialStep,
        ),
        galleryEntry: clamp01(
          (position - m.galleryEntryStart) / m.galleryEntryDistance,
        ),
        gallery: Math.min(
          m.galleryCount - 0.02,
          Math.max(0, (position - m.galleryStart) / m.galleryStep),
        ),
        loungeEntry: clamp01(
          (position - m.loungeEntryStart) / m.loungeEntryDistance,
        ),
        closing: clamp01((position - m.closingStart) / m.closingDistance),
        exitX: m.exitX,
        exitY: m.exitY,
        originX: m.originX,
        originY: m.originY,
        offsetX: m.offsetX,
        offsetY: m.offsetY,
        width: stage.clientWidth,
        height: stage.clientHeight,
      };
      // Ignore scrolling elsewhere once all journey values clamp.
      setView((previous) =>
        Object.keys(next).every((key) => previous[key] === next[key])
          ? previous
          : next,
      );
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const measure = () => {
      const height =
        stage.clientHeight - parseFloat(getComputedStyle(stage).paddingBottom);
      const mobile = window.innerWidth <= 680;
      const overflow = mobile
        ? 0
        : Math.max(0, introRef.current.scrollHeight - height);
      const entrance =
        Math.max(480, height) * (window.innerWidth < 768 ? 1.15 : 1.65);
      const reading = mobile ? 0 : overflow + height * 0.45;
      const portal = height * (mobile ? 1.55 : 2.0);
      const serviceStep = height * (mobile ? 0.45 : 0.8);
      const services = mobile ? serviceStep * 4 : height * 0.35;
      const trustStart = entrance + reading + portal + services;
      const trustDistance = height * (mobile ? 1.35 : 2.1);
      const trustOverflow = Math.max(
        0,
        trustRef.current.firstElementChild.offsetHeight - height,
      );
      const trustReading = trustOverflow + height * 0.7;
      const vacuumStart = trustStart + trustDistance + trustReading;
      const vacuumDistance = height * (mobile ? 1.35 : 1.85);
      const websiteStart = vacuumStart + vacuumDistance;
      const panelHeight = Math.max(
        height,
        ...Array.from(
          websiteRef.current.querySelectorAll(".website-chapter__panel"),
          (el) => el.scrollHeight,
        ),
      );
      const websiteStep = mobile
        ? height * 0.5 + Math.max(0, panelHeight - height)
        : Math.max(height * 1.15, panelHeight + height * 0.35);
      const closingPanel = websiteRef.current.querySelector('[data-panel="4"]');
      const needsReadingRoom = closingPanel.scrollHeight > height + 1;
      const closingEnd = needsReadingRoom ? 4.8 : 4.4;

      const websiteDistance = websiteStep * closingEnd;
      const doorwayStart = websiteStart + websiteDistance;
      const doorwayDistance = height * (mobile ? 0.95 : 0.256);
      const brandStart = doorwayStart + doorwayDistance;
      const brandPanelHeight = Math.max(
        height,
        ...Array.from(
          brandRef.current.querySelectorAll(".brand-chapter__panel"),
          (el) => el.scrollHeight,
        ),
      );
      const brandStep = Math.max(height * 0.85, brandPanelHeight * 0.8);
      const brandDistance = brandStep * 6.25;
      const trackingStart = brandStart + brandDistance;
      const trackingDistance = height * (mobile ? 1.15 : 1.8);
      const motionStart = trackingStart + trackingDistance;
      const motionPanelHeight = Math.max(
        height,
        ...Array.from(
          motionRef.current.querySelectorAll(".motion-chapter__panel"),
          (el) => el.scrollHeight,
        ),
      );
      const motionStep = Math.max(height, motionPanelHeight * 1.05);
      const motionDistance = motionStep * 6.5;
      const liftStart = motionStart + motionDistance;
      const liftDistance = height * (mobile ? 1.15 : 1.8);
      const spatialStart = liftStart + liftDistance;
      const spatialPanelHeight = Math.max(
        height,
        ...Array.from(
          spatialRef.current.querySelectorAll(".spatial-chapter__panel"),
          (el) => el.scrollHeight,
        ),
      );
      const spatialStep = Math.max(height, spatialPanelHeight * 1.05);
      const spatialDistance = spatialStep * (SPATIAL_END - WORKBENCH_SCROLL);
      const galleryEntryStart = spatialStart + spatialDistance;
      const galleryEntryDistance = height * (mobile ? 1.05 : 1.5);
      const galleryStart = galleryEntryStart + galleryEntryDistance;
      const galleryPanels = Array.from(
        galleryRef.current.querySelectorAll("[data-gallery-panel]"),
      );
      const galleryCount = galleryPanels.length;
      const galleryPanelHeight = Math.max(
        height,
        ...galleryPanels.map((el) => el.scrollHeight),
      );
      const galleryStep = Math.max(
        height * (mobile ? 1.1 : 1.35),
        galleryPanelHeight + height * 0.25,
      );
      const galleryDistance = galleryStep * galleryCount;
      const loungeEntryStart = galleryStart + galleryDistance;
      const loungeEntryDistance = height * (mobile ? 1.15 : 1.8);
      const closingStart = loungeEntryStart + loungeEntryDistance;
      const closingOverflow = Math.max(
        0,
        closingRef.current.querySelector("[data-closing-panel]").scrollHeight -
          height,
      );
      const closingDistance = Math.max(
        height * 1.8,
        closingOverflow + height * 1.3,
      );
      const serviceBounds = stage
        .querySelector(".services-stage")
        ?.getBoundingClientRect();
      const stageBounds = stage.getBoundingClientRect();
      const trustBounds = trustRef.current.getBoundingClientRect();
      const slot = trustRef.current
        .querySelector(".trust-emblem-anchor")
        ?.getBoundingClientRect();
      const originX = serviceBounds
        ? serviceBounds.left + serviceBounds.width / 2 - stageBounds.left
        : stage.clientWidth / 2;
      const originY = serviceBounds
        ? serviceBounds.top + serviceBounds.height / 2 - stageBounds.top
        : height / 2;
      const offsetX = slot
        ? originX - (slot.left + slot.width / 2 - trustBounds.left)
        : 0;
      const offsetY = slot
        ? originY - (slot.top + slot.height / 2 - trustBounds.top)
        : 0;
      const exitX = slot
        ? stage.clientWidth / 2 -
          (slot.left + slot.width / 2 - trustBounds.left)
        : 0;
      const exitY = slot
        ? height / 2 -
          (slot.top + slot.height / 2 - trustBounds.top) +
          trustOverflow
        : 0;
      metricsRef.current = {
        loungeEntryStart,
        loungeEntryDistance,
        closingStart,
        closingDistance,
        galleryEntryStart,
        galleryEntryDistance,
        galleryStart,
        galleryStep,
        galleryCount,
        galleryDistance,
        liftStart,
        liftDistance,
        spatialStart,
        spatialStep,
        spatialDistance,
        trackingStart,
        trackingDistance,
        motionStart,
        motionStep,
        motionDistance,
        doorwayStart,
        doorwayDistance,
        brandStart,
        brandStep,
        brandDistance,
        vacuumStart,
        vacuumDistance,
        websiteStart,
        websiteStep,
        websiteDistance,
        exitX,
        exitY,
        height,
        entrance,
        reading,
        portal,
        services,
        serviceStep,
        overflow,
        trustStart,
        trustDistance,
        trustOverflow,
        trustReading,
        originX,
        originY,
        offsetX,
        offsetY,
      };
      root.style.height = `${height + closingStart + closingDistance}px`;
      schedule();
    };
    const seek = (target, focus = false, index = 0) => {
      scrollController?.stop();
      const m = metricsRef.current;
      const offset =
        target === "studio-beginning"
          ? 0
          : target === "create-whats-next"
            ? m.closingStart + m.closingDistance * 0.62
            : target === "featured-projects"
              ? m.galleryStart +
                m.galleryStep *
                  (Math.min(m.galleryCount - 1, Math.max(0, index)) + 0.2)
              : target === "3d-interactive"
                ? m.spatialStart + m.spatialStep * 0.25
                : target === "motion-design"
                  ? m.motionStart + m.motionStep * 0.25
                  : target === "brand-identity"
                    ? m.brandStart + m.brandStep * 0.25
                    : target === "web-design-development"
                      ? m.websiteStart + m.websiteStep * 0.28
                      : target === "studio-trust"
                        ? m.trustStart + m.trustDistance
                        : target === "studio-introduction"
                          ? m.entrance
                          : m.entrance +
                            m.reading +
                            m.portal +
                            (window.innerWidth <= 680
                              ? index * m.serviceStep + 1
                              : 0);
      window.scrollTo({
        top: window.scrollY + root.getBoundingClientRect().top + offset,
        behavior: "instant",
      });
      update();
      if (focus)
        requestAnimationFrame(() =>
          (target === "studio-beginning"
            ? root.querySelector(".studio-hero__title h1")
            : document.getElementById(
                target === "create-whats-next"
                  ? "create-whats-next-heading"
                  : target === "featured-projects"
                    ? "featured-projects-heading"
                    : target === "3d-interactive"
                      ? "three-d-interactive-benefits-heading"
                      : target === "motion-design"
                        ? "motion-design-benefits-heading"
                        : target === "brand-identity"
                          ? "brand-identity-benefits-heading"
                          : target === "web-design-development"
                            ? "website-benefits-heading"
                            : `${target}-heading`,
              )
          )?.focus({ preventScroll: true }),
        );
    };
    seekRef.current = seek;
    const hash = () => {
      const target = window.location.hash.slice(1);
      if (
        target === "studio-beginning" ||
        target === "create-whats-next" ||
        target === "featured-projects" ||
        target === "studio-introduction" ||
        target === "studio-services" ||
        target === "studio-trust" ||
        target === "web-design-development" ||
        target === "brand-identity" ||
        target === "motion-design" ||
        target === "3d-interactive"
      ) {
        cancelAnimationFrame(hashFrame);
        hashFrame = requestAnimationFrame(() => seek(target));
      }
    };
    const click = (event) => {
      const anchor = event.target.closest?.(
        'a[href="#create-whats-next"],a[href="#studio-beginning"],a[href="#featured-projects"],a[href="#studio-services"],a[href="#studio-introduction"],a[href="#studio-trust"],a[href="#web-design-development"],a[href="#brand-identity"],a[href="#motion-design"],a[href="#3d-interactive"]',
      );
      if (
        !anchor ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey ||
        event.button !== 0
      )
        return;
      event.preventDefault();
      const target = anchor.hash.slice(1);
      window.history.pushState(null, "", anchor.hash);
      seek(target, true);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    observer.observe(introRef.current);
    observer.observe(trustRef.current);
    websiteRef.current
      .querySelectorAll(".website-chapter__panel")
      .forEach((el) => observer.observe(el));
    brandRef.current
      .querySelectorAll(".brand-chapter__panel")
      .forEach((el) => observer.observe(el));
    motionRef.current
      .querySelectorAll(".motion-chapter__panel")
      .forEach((el) => observer.observe(el));
    spatialRef.current
      .querySelectorAll(".spatial-chapter__panel")
      .forEach((el) => observer.observe(el));
    galleryRef.current
      .querySelectorAll("[data-gallery-panel]")
      .forEach((el) => observer.observe(el));
    const galleryMutation = new MutationObserver(measure);
    galleryMutation.observe(galleryRef.current, {
      childList: true,
      subtree: true,
    });
    observer.observe(closingRef.current.querySelector("[data-closing-panel]"));
    root
      .querySelector(".studio-hero__title h1")
      ?.setAttribute("tabindex", "-1");
    const serviceStage = stage.querySelector(".services-stage");
    if (serviceStage) observer.observe(serviceStage);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", measure);
    window.addEventListener("hashchange", hash);
    window.addEventListener("popstate", hash);
    root.addEventListener("click", click);
    scrollController = installJourneyScroll({
      root,
      stage,
      metrics: metricsRef,
      schedule,
    });
    measure();
    hash();
    return () => {
      observer.disconnect();
      galleryMutation.disconnect();
      cancelAnimationFrame(frame);
      cancelAnimationFrame(hashFrame);
      root.style.removeProperty("height");
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", measure);
      window.removeEventListener("hashchange", hash);
      window.removeEventListener("popstate", hash);
      root.removeEventListener("click", click);
      scrollController.destroy();
    };
  }, [enabled]);

  const reveal = getEntranceReveal(view.entrance);
  const portal = view.portal;
  const screen = monitorFrame(view.width, view.height, portal);
  const exit = enabled ? view.trust : 0;
  const mobile = view.width <= 680;
  const trust = trustFrame(exit, mobile);
  const servicesReady = !enabled || (portal >= 0.98 && exit === 0);
  const servicesActive = !enabled || (portal >= 0.98 && trust.services > 0);
  const trustReady = !enabled || (exit >= 0.98 && view.vacuum === 0);
  const websiteReady = !enabled || (view.vacuum >= 0.99 && view.doorway === 0);
  const brandReady = !enabled || (view.doorway >= 0.99 && view.tracking === 0);
  const motionReady = !enabled || (view.tracking >= 0.99 && view.lift === 0);
  const spatialReady =
    !enabled || (view.lift >= 0.99 && view.galleryEntry === 0);
  const galleryReady =
    !enabled || (view.galleryEntry >= 0.99 && view.loungeEntry === 0);
  const closingReady = !enabled || view.loungeEntry >= 0.99;
  const introReadable = !enabled || (reveal.readable && portal < 0.15);
  return (
    <div
      id="studio-beginning"
      ref={rootRef}
      className={`studio-journey${enabled ? " studio-journey--enabled" : ""}`}
      style={{
        "--interior-opacity": reveal.lobby,
        "--hero-opacity": 1 - reveal.lobby,
        "--intro-text-opacity": reveal.text * (1 - easeRange(portal, 0, 0.18)),
        "--intro-text-offset": `${(1 - reveal.text) * 8}px`,
        "--lobby-scale": reveal.zoom,
        "--intro-shade-opacity": 0.65 + 0.35 * reveal.text,
        "--hero-ui-opacity": 1 - smoothRange(view.entrance, 0.01, 0.15),
        "--reading-offset": `${-view.reading}px`,
        "--service-label-opacity": trust.labels,
        "--trust-backdrop": easeRange(
          exit,
          mobile ? 0.12 : 0.36,
          mobile ? 0.35 : 0.48,
        ),
        "--trust-reading-offset": `${-view.trustReading}px`,
      }}
    >
      <div ref={stageRef} className="studio-journey__stage">
        <div
          className="studio-journey__exterior"
          inert={enabled && view.entrance > 0.02}
          aria-hidden={enabled && view.entrance >= 0.6 ? true : undefined}
        >
          <StudioHeroRealtime
            progress={enabled ? view.entrance : 0}
            mobile={mobile}
          />
        </div>
        <div
          ref={introRef}
          className="studio-journey__interior"
          inert={!introReadable}
          aria-hidden={!introReadable ? true : undefined}
        >
          <StudioIntroduction eager={enabled} />
        </div>
        {enabled && (
          <div
            className="studio-monitor-photo"
            aria-hidden="true"
            style={{
              opacity: easeRange(portal, 0, 0.18),
              visibility: portal > 0 && portal < 0.95 ? "visible" : "hidden",
            }}
          >
            <img
              src={`${imageRoot}studio-interior.webp`}
              alt=""
              style={{ transform: screen.transform }}
            />
          </div>
        )}
        <div
          id="studio-services"
          className="studio-journey__services"
          inert={!servicesReady}
          aria-hidden={!servicesReady ? true : undefined}
          style={
            enabled
              ? {
                  clipPath: screen.clipPath,
                  opacity: trust.services,
                  visibility:
                    portal > 0.46 && trust.services > 0 ? "visible" : "hidden",
                }
              : undefined
          }
        >
          <div
            className="studio-journey__service-content"
            style={
              enabled ? { opacity: easeRange(portal, 0.84, 0.99) } : undefined
            }
          >
            <WhatIDo
              journey={enabled}
              scrollIndex={
                enabled && view.width <= 680 ? view.service : undefined
              }
              exitProgress={exit}
              active={servicesActive}
            />
          </div>
        </div>
        <div
          ref={trustRef}
          className="studio-journey__trust"
          inert={!trustReady}
          aria-hidden={!trustReady ? true : undefined}
          style={
            enabled
              ? {
                  visibility:
                    exit > 0 && view.vacuum < 0.72 ? "visible" : "hidden",
                }
              : undefined
          }
        >
          <WhyChooseUs
            journey={enabled}
            progress={enabled ? exit : 1}
            mobile={mobile}
            offsetX={view.offsetX}
            offsetY={view.offsetY}
            vacuum={enabled ? view.vacuum : 0}
            exitX={view.exitX}
            exitY={view.exitY}
            active={!enabled || (trust.emblem > 0 && view.vacuum < 0.72)}
          />
        </div>
        <div
          ref={websiteRef}
          className="studio-journey__website"
          inert={!websiteReady}
          aria-hidden={!websiteReady ? true : undefined}
          style={
            enabled
              ? {
                  opacity: easeRange(view.vacuum, 0.66, 1),
                  visibility:
                    view.vacuum > 0.64 && view.doorway < 0.79
                      ? "visible"
                      : "hidden",
                }
              : undefined
          }
        >
          <WebsiteBenefits
            journey={enabled}
            progress={view.website}
            preload={exit >= 0.9}
            exitProgress={view.doorway}
            active={!enabled || (view.vacuum > 0.55 && view.doorway < 0.79)}
          />
        </div>
        <div
          ref={brandRef}
          className="studio-journey__brand"
          inert={!brandReady}
          aria-hidden={!brandReady ? true : undefined}
          style={
            enabled
              ? {
                  opacity: view.doorway > 0.72 ? 1 : 0,
                  visibility:
                    view.doorway > 0.72 && view.tracking < 0.5
                      ? "visible"
                      : "hidden",
                }
              : undefined
          }
        >
          <BrandIdentityBenefits
            journey={enabled}
            progress={view.brand}
            preload={view.website >= 4.2}
            exitProgress={view.tracking}
            active={!enabled || (view.doorway > 0.69 && view.tracking < 0.5)}
          />
        </div>
        <div
          ref={motionRef}
          className="studio-journey__motion"
          inert={!motionReady}
          aria-hidden={!motionReady ? true : undefined}
          style={
            enabled
              ? {
                  opacity: view.tracking >= 0.5 && view.lift < 0.5 ? 1 : 0,
                  visibility:
                    view.tracking >= 0.5 && view.lift < 0.5
                      ? "visible"
                      : "hidden",
                }
              : undefined
          }
        >
          <MotionDesignBenefits
            journey={enabled}
            progress={view.motion}
            entrance={view.tracking}
            preload={view.brand >= 5}
            exitProgress={view.lift}
            active={!enabled || (view.tracking >= 0.5 && view.lift < 0.5)}
          />
        </div>
        <div
          ref={spatialRef}
          className="studio-journey__spatial"
          inert={!spatialReady}
          aria-hidden={!spatialReady ? true : undefined}
          style={
            enabled
              ? {
                  opacity: view.lift >= 0.5 && view.galleryEntry < 0.5 ? 1 : 0,
                  visibility:
                    view.lift >= 0.5 && view.galleryEntry < 0.5
                      ? "visible"
                      : "hidden",
                }
              : undefined
          }
        >
          <ThreeDInteractiveBenefits
            journey={enabled}
            progress={view.spatial}
            entrance={view.lift}
            preload={view.motion >= 5.5}
            exitProgress={view.galleryEntry}
            active={!enabled || (view.lift >= 0.5 && view.galleryEntry < 0.5)}
          />
        </div>
        <div
          ref={galleryRef}
          className="studio-journey__gallery"
          inert={!galleryReady}
          aria-hidden={!galleryReady || undefined}
          style={
            enabled
              ? {
                  visibility:
                    view.galleryEntry >= 0.5 && view.loungeEntry < 0.36
                      ? "visible"
                      : "hidden",
                }
              : undefined
          }
        >
          <FeaturedProjectsChapter
            journey={enabled}
            progress={view.gallery}
            entrance={view.galleryEntry}
            mobile={mobile}
            preload={view.spatial >= 3.5}
            exitProgress={view.loungeEntry}
            active={
              !enabled || (view.galleryEntry >= 0.5 && view.loungeEntry < 0.36)
            }
          />
        </div>
        <div
          ref={closingRef}
          className="studio-journey__closing"
          inert={!closingReady}
          aria-hidden={!closingReady || undefined}
          style={
            enabled
              ? { visibility: view.loungeEntry >= 0.32 ? "visible" : "hidden" }
              : undefined
          }
        >
          <ClosingChapter
            journey={enabled}
            progress={view.closing}
            entrance={view.loungeEntry}
            preload={view.gallery >= (mobile ? 5.5 : 1.8)}
            active={!enabled || view.loungeEntry >= 0.32}
            onRestart={() => {
              window.history.pushState(null, "", "#studio-beginning");
              if (enabled) seekRef.current("studio-beginning", true);
              else {
                window.scrollTo({ top: 0, behavior: "instant" });
                const title = rootRef.current.querySelector(
                  ".studio-hero__title h1",
                );
                title?.setAttribute("tabindex", "-1");
                title?.focus({ preventScroll: true });
              }
            }}
          />
        </div>
        {enabled && view.loungeEntry > 0 && view.loungeEntry < 1 && (
          <div
            className="closing-threshold"
            aria-hidden="true"
            style={{
              opacity:
                easeRange(view.loungeEntry, 0.12, 0.3) *
                (1 - easeRange(view.loungeEntry, 0.4, 0.62)),
            }}
          />
        )}
        {enabled && view.loungeEntry > 0 && !closingReady && (
          <button
            className="studio-journey__skip"
            onClick={() => seekRef.current("create-whats-next", true)}
          >
            Skip to What’s Next <span aria-hidden="true">↓</span>
          </button>
        )}
        {enabled && view.galleryEntry > 0 && view.galleryEntry < 1 && (
          <Suspense
            fallback={
              <div className="gallery-transition gallery-transition__cover" />
            }
          >
            <StudioGalleryTransition progress={view.galleryEntry} />
          </Suspense>
        )}
        {enabled && view.galleryEntry > 0 && view.galleryEntry < 0.99 && (
          <button
            className="studio-journey__skip"
            onClick={() => seekRef.current("featured-projects", true)}
          >
            Skip to Featured Projects <span aria-hidden="true">↓</span>
          </button>
        )}
        {enabled && <StudioSpatialTransition progress={view.lift} />}
        {enabled && view.lift > 0 && view.lift < 0.99 && (
          <button
            className="studio-journey__skip"
            onClick={() => seekRef.current("3d-interactive", true)}
          >
            Skip to 3D &amp; Interactive <span aria-hidden="true">↓</span>
          </button>
        )}
        {enabled && <StudioMotionTransition progress={view.tracking} />}
        {enabled && view.tracking > 0 && view.tracking < 0.99 && (
          <button
            className="studio-journey__skip"
            onClick={() => seekRef.current("motion-design", true)}
          >
            Skip to motion design <span aria-hidden="true">↓</span>
          </button>
        )}
        {enabled && <StudioGlassTransition progress={view.doorway} />}
        {enabled && <StudioVacuum progress={view.vacuum} mobile={mobile} />}
        {enabled && !mobile && (
          <StudioCollision
            progress={exit}
            x={view.originX}
            y={view.originY}
            width={view.width}
            height={view.height}
          />
        )}
        {enabled && (
          <StudioVortex
            frame={screen}
            image={`${imageRoot}studio-interior.webp`}
            progress={portal}
            mobile={view.width <= 680}
          />
        )}
        {enabled && view.entrance > 0 && !reveal.readable && (
          <button
            className="studio-journey__skip"
            onClick={() => seekRef.current("studio-introduction", true)}
          >
            Skip to introduction <span aria-hidden="true">↓</span>
          </button>
        )}
        {enabled && reveal.readable && portal > 0 && portal < 0.98 && (
          <button
            className="studio-journey__skip"
            onClick={() => seekRef.current("studio-services", true)}
          >
            Skip to services <span aria-hidden="true">↓</span>
          </button>
        )}
        {enabled && exit > 0 && exit < 0.98 && (
          <button
            className="studio-journey__skip"
            onClick={() => seekRef.current("studio-trust", true)}
          >
            Skip to why choose us <span aria-hidden="true">↓</span>
          </button>
        )}
        {enabled && view.vacuum > 0 && view.vacuum < 0.99 && (
          <button
            className="studio-journey__skip"
            onClick={() => seekRef.current("web-design-development", true)}
          >
            Skip to website benefits <span aria-hidden="true">↓</span>
          </button>
        )}
        {enabled && view.doorway > 0 && view.doorway < 0.99 && (
          <button
            className="studio-journey__skip"
            onClick={() => seekRef.current("brand-identity", true)}
          >
            Skip to brand identity <span aria-hidden="true">↓</span>
          </button>
        )}
      </div>
    </div>
  );
}
