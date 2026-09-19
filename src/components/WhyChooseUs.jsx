import { Link } from 'react-router-dom'
import EmblemScene from './EmblemScene'

export default function WhyChooseUs() {
  return (
    <section className="relative w-full bg-[#05060a] px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto grid max-w-7xl items-start gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="relative min-w-0 lg:min-w-[auto]">
          <EmblemScene />

          <Link
            to="/projects"
            className="why-choose-cta group absolute -bottom-6 right-4 flex w-[78%] max-w-xs flex-col gap-4 rounded-2xl bg-[var(--color-neon-teal)] p-6 shadow-xl shadow-black/40 transition-transform duration-300 hover:-translate-y-1 sm:right-8"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#05060a] text-lg text-white transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
              ↗
            </span>
            <span className="text-lg font-bold leading-snug text-[#05060a]">
              Custom Solutions Built Around Your Vision
            </span>
          </Link>
        </div>

        <div className="pt-2 lg:pt-4">
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-[0.25em] text-[var(--color-neon-teal)] uppercase">
            Why Choose Blancaver Studios
            <span aria-hidden>↗</span>
          </p>
          <h2 className="text-3xl leading-tight font-extrabold text-white sm:text-4xl md:text-5xl">
            Where Your Vision Meets Next-Gen Execution
          </h2>

          <div className="mt-10 space-y-8">
            <div className="border-t border-white/10 pt-6">
              <h3 className="text-base font-bold text-white sm:text-lg">
                Fast, Focused Development
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/50 sm:text-base">
                Every project moves from idea to working app without unnecessary
                delays or bloated processes.
              </p>
            </div>

            <div className="border-t border-white/10 pt-6">
              <h3 className="text-base font-bold text-white sm:text-lg">
                Direct Collaboration, Real Results
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/50 sm:text-base">
                You work directly with the builder — no middlemen, no
                lost-in-translation briefs.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
