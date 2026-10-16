import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Captions,
  Focus,
  ListOrdered,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react";

const benefits = [
  {
    icon: Focus,
    title: "Put the focus where it matters",
    description:
      "A moving headline or an animated offer can draw attention to what’s new—whether it’s a seasonal menu, a salon opening, or a service you’ve just added.",
  },
  {
    icon: ListOrdered,
    title: "Make the unfamiliar easier to follow",
    description:
      "Show a process in a few clear steps. An auto shop could explain what happens during a vehicle inspection, helping customers know what to expect before booking.",
  },
  {
    icon: Captions,
    title: "Get your message across without sound",
    description:
      "Combine readable text with simple movement so your message still makes sense on a muted social feed or a screen inside your shop.",
  },
];

const sandwichImage = `${import.meta.env.BASE_URL}images/noon-chicken-sandwich.png`;

function MotionPreview() {
  const frameRef = useRef(null);
  const sandwichRef = useRef(null);
  const headlineRef = useRef(null);
  const detailsRef = useRef(null);
  const progressRef = useRef(null);
  const animationsRef = useRef([]);
  const [playback, setPlayback] = useState("ready");

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");

    let observer;
    let disposed = false;

    function clearAnimations() {
      animationsRef.current.forEach((animation) => {
        animation.onfinish = null;
        animation.cancel();
      });
      animationsRef.current = [];
    }

    function setup() {
      observer?.disconnect();
      clearAnimations();

      if (preference.matches) {
        setPlayback("reduced");
        return;
      }

      setPlayback("ready");

      const entranceOptions = {
        duration: 900,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        fill: "both",
      };

      const sandwich = sandwichRef.current.animate(
        [
          { opacity: 0, transform: "translateX(50px) scale(0.94)" },
          { opacity: 1, transform: "translateX(0) scale(1)" },
        ],
        { ...entranceOptions, delay: 200 },
      );

      const headline = headlineRef.current.animate(
        [
          { opacity: 0, transform: "translateY(22px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        { ...entranceOptions, delay: 900 },
      );

      const details = detailsRef.current.animate(
        [
          { opacity: 0, transform: "translateY(12px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        { ...entranceOptions, delay: 1300 },
      );

      const progress = progressRef.current.animate(
        [{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }],
        {
          duration: 5000,
          easing: "linear",
          fill: "both",
        },
      );

      const animations = [sandwich, headline, details, progress];

      animations.forEach((animation) => {
        animation.pause();
        animation.currentTime = 0;
      });

      animationsRef.current = animations;

      progress.onfinish = () => {
        if (!disposed) setPlayback("finished");
      };

      observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return;

          animations.forEach((animation) => animation.play());
          setPlayback("playing");
          observer.disconnect();
        },
        { threshold: 0.4 },
      );

      observer.observe(frameRef.current);
    }

    setup();
    preference.addEventListener("change", setup);

    return () => {
      disposed = true;
      observer?.disconnect();
      preference.removeEventListener("change", setup);
      clearAnimations();
    };
  }, []);

  function togglePlayback() {
    if (playback === "playing") {
      animationsRef.current.forEach((animation) => animation.pause());
      setPlayback("paused");
      return;
    }

    animationsRef.current.forEach((animation) => {
      if (playback === "finished") animation.currentTime = 0;
      animation.play();
    });

    setPlayback("playing");
  }

  const controlLabel =
    playback === "playing"
      ? "Pause animation"
      : playback === "finished"
        ? "Replay animation"
        : "Play animation";

  const ControlIcon =
    playback === "playing" ? Pause : playback === "finished" ? RotateCcw : Play;

  return (
    <figure className="min-w-0">
      <div
        ref={frameRef}
        className="overflow-hidden rounded-sm border border-white/20"
      >
        <div
          role="img"
          aria-label="NOON & CO. lunch promotion: crispy chicken sandwich, served weekdays from 11 AM to 2 PM."
          className="relative isolate aspect-[16/10] overflow-hidden bg-[#7A160E] sm:aspect-[16/9]"
        >
          {/* Animated artwork is described by the accessible label above. */}
          <div aria-hidden="true">
            <div className="absolute inset-x-[6%] top-[8%] z-20 flex items-center gap-4">
              <span className="shrink-0 text-[clamp(10px,1.1vw,14px)] font-bold tracking-[0.08em] text-[#FFF4DE]">
                NOON &amp; CO.
              </span>
              <span className="h-px flex-1 bg-[#FFF4DE]/50" />
            </div>

            <img
              ref={sandwichRef}
              src={sandwichImage}
              alt=""
              width={1536}
              height={1024}
              loading="lazy"
              decoding="async"
              className="absolute -right-[16%] bottom-[-2%] z-0 w-[78%] max-w-none"
            />

            <div
              ref={headlineRef}
              className="absolute top-[17%] left-[6%] z-10 text-[clamp(42px,6vw,86px)] leading-[1.08] font-extrabold tracking-normal text-[#FFF4DE]"
            >
              Lunch,
              <br />
              sorted.
            </div>

            <div
              ref={detailsRef}
              className="absolute bottom-[9%] left-[6%] z-20 w-[53%] border-t border-[#FFF4DE]/65 pt-3"
            >
              <p className="text-[clamp(9px,1.05vw,14px)] leading-snug font-bold tracking-[0.06em] text-[#FFF4DE]">
                CRISPY CHICKEN SANDWICH
              </p>
              <p className="mt-2 text-[clamp(9px,1.05vw,14px)] leading-snug font-bold tracking-[0.06em] text-[#FFD301]">
                WEEKDAYS · 11 AM–2 PM
              </p>
            </div>
          </div>
        </div>

        <div className="flex min-h-14 items-center gap-4 bg-[#160907] px-4">
          {playback === "reduced" ? (
            <span className="py-3 text-xs text-white/65">
              Still preview · reduced motion
            </span>
          ) : (
            <>
              <button
                type="button"
                onClick={togglePlayback}
                disabled={playback === "ready"}
                aria-label={controlLabel}
                className="inline-flex min-h-11 min-w-11 items-center justify-center text-white transition-colors hover:text-[#FFD301] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD301] disabled:opacity-40"
              >
                <ControlIcon aria-hidden="true" size={18} />
              </button>

              <div
                aria-hidden="true"
                className="h-0.5 flex-1 overflow-hidden bg-white/25"
              >
                <div
                  ref={progressRef}
                  className="h-full origin-left bg-[#FFD301]"
                />
              </div>
            </>
          )}
        </div>
      </div>

      <figcaption className="mt-3 text-xs leading-relaxed tracking-wide text-white/40">
        NOON &amp; CO. — illustrative motion design concept.
      </figcaption>
    </figure>
  );
}

export default function MotionDesignBenefits() {
  return (
    <section
      id="motion-design"
      aria-labelledby="motion-design-benefits-heading"
      className="relative w-full scroll-mt-24 bg-[var(--color-void)] px-5 py-20 sm:px-8 sm:py-24 lg:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-14">
          <div className="min-w-0">
            <p className="mb-6 flex items-center gap-3 text-[10px] leading-relaxed font-semibold tracking-[0.22em] text-white/70 uppercase sm:text-xs">
              <span
                aria-hidden="true"
                className="h-px w-7 shrink-0 bg-[var(--color-neon-teal)]"
              />
              Give Your Message a Little Movement.
            </p>

            <h2
              id="motion-design-benefits-heading"
              className="text-4xl leading-[1.06] font-extrabold tracking-[-0.045em] text-white sm:text-5xl xl:text-6xl"
            >
              Make Your Message Clear with{" "}
              <span className="text-[var(--color-neon-teal)]">
                Motion Design.
              </span>
            </h2>

            <p className="mt-7 max-w-xl text-base leading-relaxed text-white/65 sm:mt-8 sm:text-lg">
              Motion design brings text, images, and graphics to life through
              animation. From a restaurant’s weekly special to a short guide to
              your services, it helps you show people what matters, one moment
              at a time.
            </p>
          </div>

          <MotionPreview />
        </div>

        <div className="mt-14 border-y border-white/15 py-8 sm:mt-16 sm:py-10">
          <ul className="grid gap-8 md:grid-cols-3 md:gap-0">
            {benefits.map(({ icon: Icon, title, description }, index) => (
              <li
                key={title}
                className={`flex min-w-0 items-start gap-4 ${
                  index > 0
                    ? "border-t border-white/15 pt-8 md:border-t-0 md:border-l md:pt-0 md:pl-6 lg:pl-8"
                    : ""
                } ${index < benefits.length - 1 ? "md:pr-6 lg:pr-8" : ""}`}
              >
                <Icon
                  aria-hidden="true"
                  size={32}
                  strokeWidth={1.5}
                  className="mt-0.5 shrink-0 text-[var(--color-neon-teal)]"
                />

                <div className="min-w-0">
                  <h3 className="text-lg leading-snug font-bold tracking-[-0.015em] text-white">
                    {title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/60 lg:text-base">
                    {description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-10 flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
          <div className="max-w-3xl">
            <h3 className="text-2xl leading-tight font-bold tracking-[-0.025em] text-white sm:text-3xl">
              Have Something Worth Showing?
            </h3>

            <p className="mt-3 text-base leading-relaxed text-white/60 sm:text-lg">
              When an offer needs a little attention or a service needs
              explaining, a short animation can help. Sometimes, a still image
              is all you need.
            </p>
          </div>

          <Link
            to="/contact"
            className="group inline-flex min-h-14 w-full shrink-0 items-center justify-center gap-3 rounded-sm bg-[var(--color-neon-teal)] px-6 py-4 text-sm font-bold tracking-[0.025em] text-[var(--color-void)] uppercase transition-colors hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-neon-teal)] sm:w-auto"
          >
            <span>
              Let’s Put Your
              <br />
              Message in Motion
            </span>
            <ArrowUpRight
              aria-hidden="true"
              size={20}
              strokeWidth={2}
              className="transition-transform motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:-translate-y-0.5 motion-reduce:transition-none"
            />
          </Link>
        </div>
      </div>
    </section>
  );
}
