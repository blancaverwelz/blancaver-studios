import { useEffect, useState } from "react";

const MOBILE_QUERY = "(max-width: 760px)";
const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

function useMedia(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const sync = () => setMatches(mq.matches);
    mq.addEventListener("change", sync);
    sync();
    return () => mq.removeEventListener("change", sync);
  }, [query]);
  return matches;
}

export const useIsMobile = () => useMedia(MOBILE_QUERY);
export const usePrefersReducedMotion = () => useMedia(REDUCED_QUERY);

// True while the element is near the viewport and the tab is visible.
export function useNearViewport(ref, margin = "240px") {
  const [near, setNear] = useState(false);
  const [visible, setVisible] = useState(() => !document.hidden);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const observer = new IntersectionObserver(([entry]) => setNear(entry.isIntersecting), {
      rootMargin: margin,
    });
    observer.observe(el);
    const onVisibility = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [ref, margin]);
  return near && visible;
}
