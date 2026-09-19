function CodeGraphic() {
  return (
    <div className="about-graphic">
      <div className="about-graphic-glow" aria-hidden />
      <div className="about-graphic-border-glow" aria-hidden />
      <svg
        viewBox="0 0 400 400"
        className="about-graphic-svg"
        aria-hidden
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="aboutGradA" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--color-neon-teal)" />
            <stop offset="100%" stopColor="var(--color-neon-pink)" />
          </linearGradient>
        </defs>
        <rect
          x="20"
          y="20"
          width="360"
          height="360"
          rx="28"
          fill="rgba(255,255,255,0.03)"
          stroke="url(#aboutGradA)"
          strokeOpacity="0.4"
          strokeWidth="1.5"
        />
        <g className="about-orbit-wrap">
          <ellipse
            cx="200"
            cy="200"
            rx="120"
            ry="120"
            fill="none"
            stroke="rgba(255,211,1,0.18)"
            strokeWidth="1"
            strokeDasharray="2 6"
          />
          <circle r="3" fill="var(--color-neon-teal)" className="about-orbit-particle">
            <animateMotion
              dur="12s"
              repeatCount="indefinite"
              path="M 320,200 A 120,120 0 1,1 319.9,200"
            />
          </circle>
        </g>
        <g
          stroke="url(#aboutGradA)"
          strokeWidth="1.5"
          fill="none"
          opacity="0.85"
          className="about-chevron-left"
        >
          <path d="M120 130 L70 200 L120 270" />
        </g>
        <g
          stroke="url(#aboutGradA)"
          strokeWidth="1.5"
          fill="none"
          opacity="0.85"
          className="about-chevron-right"
        >
          <path d="M280 130 L330 200 L280 270" />
        </g>
        <g className="about-tick-wrap">
          <line x1="185" y1="120" x2="165" y2="280" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
        </g>
        <g className="about-pulse-dot">
          <circle cx="200" cy="200" r="6" fill="var(--color-neon-teal)" />
        </g>
        <g opacity="0.5" stroke="rgba(255,255,255,0.25)" strokeWidth="1">
          <line x1="60" y1="80" x2="60" y2="60" />
          <line x1="50" y1="70" x2="70" y2="70" />
          <line x1="340" y1="330" x2="340" y2="310" />
          <line x1="330" y1="320" x2="350" y2="320" />
        </g>
      </svg>
    </div>
  )
}

export default function AboutSection() {
  return (
    <section className="relative w-full bg-[#05060a] px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-[0.25em] text-[var(--color-neon-teal)] uppercase">
            About Blancaver Studios
            <span aria-hidden>↗</span>
          </p>
          <h2 className="text-3xl leading-tight font-extrabold text-white sm:text-4xl md:text-5xl">
            Building Premium Digital Experiences
          </h2>
          <div className="mt-6 flex gap-4 border-l-2 border-[var(--color-neon-teal)] pl-5">
            <p className="text-sm leading-relaxed text-white/60 sm:text-base">
              Blancaver Studios builds premium digital experiences through vibe coding—
              creating web apps, interactive 3D websites, and immersive web experiences with
              AI-powered development. From concept to deployment, every project blends
              rapid iteration, thoughtful design, and real product strategy to transform
              ambitious ideas into polished, high-performing digital products.
            </p>
          </div>
        </div>
        <CodeGraphic />
      </div>
    </section>
  )
}
