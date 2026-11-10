import { getJourneyWheelDelta, hasNestedScrollTarget } from "./studioWheel";

// Duration is a maximum-speed limit, not a forced animation: small gestures
// remain small, and reversing input immediately discards the forward queue.
export function journeyTransitionRanges(m) {
  const portalStart = m.entrance + m.reading;
  return [
    [0, m.entrance],
    [portalStart, portalStart + m.portal],
    [m.trustStart, m.trustStart + m.trustDistance],
    [m.vacuumStart, m.websiteStart],
    [m.doorwayStart, m.brandStart],
    [m.trackingStart, m.motionStart],
    [m.liftStart, m.spatialStart],
    [m.galleryEntryStart, m.galleryStart],
    [m.loungeEntryStart, m.closingStart],
  ];
}

export function advanceJourneyScroll(
  position,
  target,
  seconds,
  ranges,
  height,
  duration = 1.8,
) {
  const direction = Math.sign(target - position);
  if (!direction || seconds <= 0) return position;
  let remaining = seconds;
  // Split each frame at every phase boundary, so a large reading gesture
  // cannot jump across a cinematic interval in a single frame.
  for (let i = 0; i < 16 && remaining > 0.000001; i++) {
    const range = ranges.find(([a, b]) =>
      direction > 0
        ? position >= a && position < b
        : position > a && position <= b,
    );
    const speed = range ? (range[1] - range[0]) / duration : height * 4;
    const boundaries = ranges
      .flat()
      .filter((value) => direction * (value - position) > 0.00001);
    const boundary = boundaries.length
      ? direction > 0
        ? Math.min(...boundaries)
        : Math.max(...boundaries)
      : target;
    const distance = Math.min(
      Math.abs(target - position),
      Math.abs(boundary - position),
    );
    const travel = Math.min(distance, Math.max(1, speed) * remaining);
    position += direction * travel;
    remaining -= travel / Math.max(1, speed);
    if (Math.abs(target - position) < 0.00001) return target;
    if (travel < distance) break;
  }
  return position;
}

export function installJourneyScroll({ root, stage, metrics, schedule }) {
  let raf = 0,
    previousTime = null,
    target = null,
    expectedY = null;
  const position = () => -root.getBoundingClientRect().top;
  const end = () => metrics.current.closingStart + metrics.current.closingDistance;
  const stop = () => {
    cancelAnimationFrame(raf);
    raf = 0;
    previousTime = null;
    target = null;
    expectedY = null;
  };
  const tick = (now) => {
    raf = 0;
    if (target === null || document.hidden) {
      stop();
      return;
    }
    const current = position(),
      m = metrics.current;
    const dt = Math.min(
      0.04,
      previousTime === null ? 1 / 60 : (now - previousTime) / 1000,
    );
    previousTime = now;
    const gap = target - current;
    if (Math.abs(gap) < 0.75) {
      stop();
      return;
    }
    const easedTarget = current + gap * (1 - Math.exp(-dt / 0.075));
    const next = advanceJourneyScroll(
      current,
      easedTarget,
      dt,
      journeyTransitionRanges(m),
      m.height,
      innerWidth <= 680 ? 1.2 : 1.8,
    );
    const top = window.scrollY + root.getBoundingClientRect().top + next;
    window.scrollTo({ top, behavior: "instant" });
    expectedY = window.scrollY;
    schedule();
    // Rounding to integer scroll positions must not leave a perpetual RAF.
    if (Math.abs(target - position()) < 1 || Math.abs(next - current) < 0.4) {
      stop();
      return;
    }
    raf = requestAnimationFrame(tick);
  };
  const accept = (delta, eventTarget) => {
    const current = position(),
      total = end();
    if (
      current < -1 ||
      current > total + 1 ||
      (current <= 0 && delta < 0) ||
      (current >= total && delta > 0)
    ) {
      stop();
      return false;
    }
    if (hasNestedScrollTarget(eventTarget, stage, delta)) {
      stop();
      return false;
    }
    if (target === null || Math.sign(delta) !== Math.sign(target - current))
      target = current;
    // Keep the backlog short: a rapid wheel burst must not coast for seconds.
    const queue = metrics.current.height * 0.55;
    target = Math.max(
      0,
      Math.min(
        total,
        current + Math.max(-queue, Math.min(queue, target - current + delta)),
      ),
    );
    if (!raf) {
      previousTime = null;
      raf = requestAnimationFrame(tick);
    }
    return true;
  };
  const wheel = (event) => {
    if (event.defaultPrevented || !event.cancelable) return;
    const delta = getJourneyWheelDelta(
      event,
      innerHeight,
      parseFloat(getComputedStyle(stage).lineHeight) || 16,
    );
    if (delta && accept(delta, event.target)) event.preventDefault();
  };
  const externalScroll = () => {
    if (
      target !== null &&
      expectedY !== null &&
      Math.abs(window.scrollY - expectedY) > 2
    )
      stop();
  };
  const key = (event) => {
    if (
      [
        "ArrowUp",
        "ArrowDown",
        "PageUp",
        "PageDown",
        "Home",
        "End",
        " ",
        "Tab",
        "Escape",
      ].includes(event.key)
    )
      stop();
  };
  stage.addEventListener("wheel", wheel, { passive: false });
  window.addEventListener("scroll", externalScroll, { passive: true });
  window.addEventListener("keydown", key);
  window.addEventListener("resize", stop);
  document.addEventListener("visibilitychange", stop);
  return {
    stop,
    destroy() {
      stop();
      stage.removeEventListener("wheel", wheel);
      window.removeEventListener("scroll", externalScroll);
      window.removeEventListener("keydown", key);
      window.removeEventListener("resize", stop);
      document.removeEventListener("visibilitychange", stop);
    },
  };
}
