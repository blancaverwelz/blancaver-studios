import { Link } from "react-router-dom";
import { ArrowUpRight, Box, Rotate3d, SwatchBook } from "lucide-react";
import ChairPreview from "./ChairPreview";

const benefits = [
  {
    icon: Rotate3d,
    title: "Show the details that matter",
    description:
      "Let customers turn a product around and look closer. A furniture shop could show a chair’s shape, back, and finish before someone visits the showroom.",
  },
  {
    icon: SwatchBook,
    title: "Make options easier to compare",
    description:
      "Let people switch between colors or materials in the same view. An auto shop could show wheel finishes on a sample vehicle, helping customers explain the look they want.",
  },
  {
    icon: Box,
    title: "Help people picture the result",
    description:
      "Show a proposed space or custom piece before it exists. A contractor could use a 3D view to explain a renovation, giving customers something concrete to discuss.",
  },
];

export default function ThreeDInteractiveBenefits() {
  return (
    <section
      id="3d-interactive"
      aria-labelledby="three-d-interactive-benefits-heading"
      className="relative w-full scroll-mt-24 bg-[var(--color-void)] px-5 py-20 sm:px-8 sm:py-24 lg:py-28"
    >
      <div className="mx-auto max-w-7xl">
        {/* Introduction on the right; interactive viewer on the left */}
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-14">
          <div className="min-w-0 lg:col-start-2 lg:row-start-1">
            <p className="mb-6 flex items-center gap-3 text-[10px] leading-relaxed font-semibold tracking-[0.22em] text-white/70 uppercase sm:text-xs">
              <span
                aria-hidden="true"
                className="h-px w-7 shrink-0 bg-[var(--color-neon-teal)]"
              />
              Give Customers More to Explore.
            </p>

            <h2
              id="three-d-interactive-benefits-heading"
              className="text-4xl leading-[1.06] font-extrabold tracking-[-0.045em] text-white sm:text-5xl xl:text-6xl"
            >
              Show More of What You Offer with <br />
              <span className="text-[var(--color-neon-teal)]">
                3D &amp; Interactive
                <br />
                Experience.
              </span>
            </h2>

            <p className="mt-7 max-w-xl text-base leading-relaxed text-white/65 sm:mt-8 sm:text-lg">
              3D visuals can show a product or space from angles a single photo
              can’t. Interactive features let customers take control—rotating an
              item, comparing finishes, or exploring details at their own pace.
            </p>
          </div>

          <div className="min-w-0 lg:col-start-1 lg:row-start-1">
            <ChairPreview />
          </div>
        </div>

        {/* Three practical business benefits */}
        <div className="mt-14 border-y border-white/15 py-8 sm:mt-16 sm:py-10">
          <ul className="grid gap-8 md:grid-cols-3 md:gap-0">
            {benefits.map(({ icon: Icon, title, description }, index) => (
              <li
                key={title}
                className={`min-w-0 ${
                  index > 0
                    ? "border-t border-white/15 pt-8 md:border-t-0 md:border-l md:pt-0 md:pl-6 lg:pl-8"
                    : ""
                } ${index < benefits.length - 1 ? "md:pr-6 lg:pr-8" : ""}`}
              >
                <Icon
                  aria-hidden="true"
                  size={36}
                  strokeWidth={1.5}
                  className="mb-5 text-[var(--color-neon-teal)]"
                />

                <h3 className="text-lg leading-snug font-bold tracking-[-0.015em] text-white">
                  {title}
                </h3>

                <p className="mt-3 text-sm leading-relaxed text-white/60 lg:text-base">
                  {description}
                </p>
              </li>
            ))}
          </ul>
        </div>

        {/* Closing copy on the right; contact CTA on the left */}
        <div className="mt-10 grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
          <div className="min-w-0 lg:col-start-2 lg:row-start-1">
            <h3 className="text-2xl leading-tight font-bold tracking-[-0.025em] text-white sm:text-3xl">
              Some Things Make More Sense When You Can Explore Them.
            </h3>

            <p className="mt-3 text-base leading-relaxed text-white/60 sm:text-lg">
              If shape, space, or customization matters to what you sell, 3D and
              interaction may help customers understand their options. For
              simpler offers, clear photos may be enough.
            </p>
          </div>

          <Link
            to="/contact"
            className="group inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-sm bg-[var(--color-neon-teal)] px-6 py-4 text-sm font-bold tracking-[0.025em] text-[var(--color-void)] uppercase transition-colors hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-neon-teal)] sm:w-auto sm:justify-self-start lg:col-start-1 lg:row-start-1"
          >
            Let’s Explore the Possibilities
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
