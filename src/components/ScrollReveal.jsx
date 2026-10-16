import { useEffect, useRef } from "react";

export default function ScrollReveal({
  children,
  as: Tag = "div",
  variant = "fade-up",
  delay = 0,
  className = "",
  ...props
}) {
  const elementRef = useRef(null);

  useEffect(() => {
    const element = elementRef.current;

    if (!element || !element.animate || !("IntersectionObserver" in window)) {
      return;
    }

    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");

    // Content stays visible when reduced motion is enabled.
    if (preference.matches) return;

    const isImageReveal = variant === "image";

    const keyframes = isImageReveal
      ? [{ clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)" }]
      : [
          { opacity: 0, transform: "translateY(40px)" },
          { opacity: 1, transform: "translateY(0)" },
        ];

    const animation = element.animate(keyframes, {
      duration: isImageReveal ? 1000 : 800,
      delay,
      easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      fill: "both",
    });

    animation.pause();
    animation.currentTime = 0;

    let revealed = false;

    function reveal() {
      if (revealed) return;
      revealed = true;
      observer.disconnect();
      animation.play();
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) reveal();
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -100px 0px",
      },
    );

    observer.observe(element);

    // Remove animation styles afterward so interactive children
    // aren't left inside a transformed or clipped container.
    animation.onfinish = () => animation.cancel();

    function showImmediately() {
      revealed = true;
      observer.disconnect();
      animation.cancel();
    }

    function handlePreferenceChange(event) {
      if (event.matches) showImmediately();
    }

    // Keyboard navigation should never land on hidden content.
    element.addEventListener("focusin", showImmediately);
    preference.addEventListener("change", handlePreferenceChange);

    return () => {
      observer.disconnect();
      animation.onfinish = null;
      animation.cancel();
      element.removeEventListener("focusin", showImmediately);
      preference.removeEventListener("change", handlePreferenceChange);
    };
  }, [variant, delay]);

  return (
    <Tag ref={elementRef} className={className} {...props}>
      {children}
    </Tag>
  );
}
