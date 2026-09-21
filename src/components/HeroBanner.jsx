import { useEffect, useMemo, useRef, useState } from 'react'

const RAIN_COUNT = 80

function AnimatedTitle({ lines, animate, align = 'left' }) {
  const [visible, setVisible] = useState(() => new Set())
  // Persist random order across StrictMode remount so letters don't re-shuffle mid-animation
  const orderRef = useRef(null)

  const letters = useMemo(() => {
    const items = []
    lines.forEach((line, lineIndex) => {
      ;[...line].forEach((char, charIndex) => {
        items.push({
          key: `${lineIndex}-${charIndex}`,
          char,
          lineIndex,
          charIndex,
        })
      })
    })
    return items
  }, [lines])

  useEffect(() => {
    if (!animate) {
      setVisible(new Set(letters.map((l) => l.key)))
      return
    }

    if (!orderRef.current) {
      orderRef.current = [...letters].sort(() => Math.random() - 0.5)
    }

    const order = orderRef.current
    const timers = []
    const already = new Set()

    order.forEach((letter, i) => {
      const delay = 140 + i * 75 + Math.random() * 40
      timers.push(
        setTimeout(() => {
          setVisible((prev) => {
            if (prev.has(letter.key)) return prev
            const next = new Set(prev)
            next.add(letter.key)
            return next
          })
          already.add(letter.key)
        }, delay),
      )
    })

    return () => timers.forEach(clearTimeout)
  }, [animate, letters])

  const alignClass = align === 'center' ? 'items-center text-center' : 'items-start text-left'

  return (
    <div className={`flex flex-col gap-2 sm:gap-3 select-none ${alignClass}`}>
      {lines.map((line, lineIndex) => {
        const isMulti = lines.length > 1
        // Primary brand line first (e.g. Blancaver); following lines slightly smaller (e.g. Studios)
        const isPrimary = !isMulti || lineIndex === 0
        const isSecondary = isMulti && lineIndex > 0
        return (
          <div key={lineIndex} className={`flex flex-col ${alignClass}`}>
            {isSecondary && (
              <div
                className={`mb-2 h-px w-14 bg-white/90 sm:mb-3 sm:w-20 ${align === 'center' ? 'mx-auto' : ''}`}
                aria-hidden
              />
            )}
            <span
              className={
                isPrimary && isMulti
                  ? 'text-4xl font-extrabold tracking-[0.12em] text-white sm:text-6xl md:text-7xl lg:text-8xl'
                  : isPrimary
                    ? 'text-4xl font-extrabold tracking-[0.18em] text-white sm:text-5xl md:text-6xl lg:text-7xl'
                    : 'text-2xl font-bold tracking-[0.2em] text-white sm:text-4xl md:text-5xl lg:text-6xl'
              }
            >
              {(() => {
                // Group letters into per-word, non-breaking chunks so the
                // browser can only wrap at real word boundaries (a real
                // space) instead of between any two letter spans, which
                // was causing single trailing letters (e.g. the "s" in
                // "Studios") to orphan onto their own line on mobile.
                let charIndex = 0
                const words = line.split(' ')
                const rendered = []
                words.forEach((word, wordIndex) => {
                  rendered.push(
                    <span key={`w-${wordIndex}`} className="inline-block whitespace-nowrap">
                      {[...word].map((char) => {
                        const key = `${lineIndex}-${charIndex}`
                        charIndex += 1
                        return (
                          <span
                            key={key}
                            className={`letter ${visible.has(key) ? 'is-visible' : ''}`}
                          >
                            {char}
                          </span>
                        )
                      })}
                    </span>,
                  )
                  if (wordIndex < words.length - 1) {
                    charIndex += 1 // account for the space in the flattened key sequence
                    rendered.push(' ')
                  }
                })
                return rendered
              })()}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function Rain() {
  const drops = useMemo(
    () =>
      Array.from({ length: RAIN_COUNT }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        height: `${12 + Math.random() * 28}px`,
        duration: `${0.6 + Math.random() * 0.9}s`,
        delay: `${Math.random() * 2.5}s`,
        opacity: 0.25 + Math.random() * 0.55,
      })),
    [],
  )

  return (
    <div className="rain-layer absolute inset-0 z-[2]" aria-hidden>
      {drops.map((d) => (
        <span
          key={d.id}
          className="rain-drop"
          style={{
            left: d.left,
            height: d.height,
            opacity: d.opacity,
            animationDuration: d.duration,
            animationDelay: d.delay,
          }}
        />
      ))}
    </div>
  )
}

/**
 * Full-width cinematic hero banner.
 * @param {'left'|'center'|'mid-left'} [align]
 */
export default function HeroBanner({
  image,
  titleLines = ['Blancaver', 'STUDIOS'],
  animateTitle = false,
  subtitle,
  tagline,
  mobileTitleLower = false,
  align = 'left',
  /**
   * Background position strategy for the hero image.
   * - default: center on all sizes
   * - figure-right: keep subject on the right for mobile/tablet; center on desktop (lg+)
   */
  imageFocus = 'default',
  /**
   * Optional custom content to render in place of the default eyebrow +
   * AnimatedTitle block (used by pages like Contact that need a richer
   * hero layout). When omitted, behavior is unchanged.
   */
  children,
}) {
  const isCenter = align === 'center'
  const isMidLeft = align === 'mid-left'
  const focusClass =
    imageFocus === 'figure-right' ? 'hero-focus-figure-right' : ''

  return (
    <section
      className={`relative w-full overflow-hidden ${
        children
          ? 'min-h-[640px] sm:min-h-[680px]'
          : 'h-[70vh] min-h-[420px] sm:h-[78vh] sm:min-h-[520px]'
      }`}
    >
      {/* Base image + city light flicker */}
      <div
        className={`hero-lights absolute inset-0 bg-cover bg-center bg-no-repeat ${focusClass}`}
        style={{ backgroundImage: `url(${image})` }}
      />

      {/* Height / atmospheric fog */}
      <div className="hero-fog absolute inset-0 z-[1]" aria-hidden />

      {/* Animated rain */}
      <Rain />

      {/* Vignette: clear top → dark bottom scrim for text + blend into next section */}
      <div
        className="pointer-events-none absolute inset-0 z-[3]"
        style={{
          background:
            'linear-gradient(to bottom, transparent 0%, transparent 30%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.72) 72%, rgba(5,6,10,0.94) 88%, #05060a 100%)',
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 z-[3]"
        style={{
          background:
            'radial-gradient(ellipse 90% 80% at 50% 45%, transparent 40%, rgba(0,0,0,0.45) 100%)',
        }}
        aria-hidden
      />

      {/* Title block */}
      <div
        className={`absolute inset-0 z-[4] flex ${
          children
            ? isCenter
              ? 'items-start justify-center'
              : 'items-start justify-start'
            : isCenter
              ? 'items-center justify-center'
              : isMidLeft
                ? 'items-center justify-start'
                : 'items-end'
        }`}
      >
        <div
          className={`w-full max-w-7xl px-5 sm:px-8 ${
            children
              ? `pt-24 pb-10 sm:pt-28 sm:pb-14 md:pt-32 ${
                  isCenter ? 'mx-auto text-center' : 'mx-auto pl-6 sm:pl-12 md:pl-16 lg:pl-20'
                }`
              : isCenter
                ? 'mx-auto text-center'
                : isMidLeft
                  ? `mx-auto ${
    mobileTitleLower ? 'translate-y-32 sm:translate-y-0' : '-translate-y-6'
  } pl-6 sm:-translate-y-10 sm:pl-12 md:pl-16 lg:pl-20`
                  : 'mx-auto pb-14 sm:pb-20'
          }`}
        >
          {children ? (
            children
          ) : (
            <>
              {subtitle && (
                <p
                  className={`mb-3 text-xs font-medium tracking-[0.25em] text-white/60 uppercase ${
                    isCenter ? 'text-center' : ''
                  }`}
                >
                  {subtitle}
                </p>
              )}
              <AnimatedTitle
  lines={titleLines}
  animate={animateTitle}
  align={isCenter ? 'center' : 'left'}
/>

{tagline && (
  <p
    className={`mt-5 text-sm font-medium tracking-[0.12em] text-[#FFD301] sm:mt-6 sm:text-base ${
      isCenter ? 'text-center' : ''
    }`}
  >
    {tagline}
  </p>
)}
            </>
          )}
        </div>
      </div>
    </section>
  )
}
