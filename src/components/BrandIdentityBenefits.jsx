import { Link } from "react-router-dom";
import { ArrowUpRight, LayoutTemplate, ScanEye, Store } from "lucide-react";

const benefits = [
  {
    icon: ScanEye,
    title: "Look familiar everywhere",
    description:
      "Use a consistent look across your storefront, social posts, and printed materials, so customers can connect what they see online with the business down the street.",
  },
  {
    icon: Store,
    title: "Give the right first impression",
    description:
      "A relaxed neighborhood salon and a precision-focused auto shop shouldn’t look the same. Your design can give people a sense of what to expect before they step inside.",
  },
  {
    icon: LayoutTemplate,
    title: "Make everyday design easier",
    description:
      "With your logo, colors, fonts, and simple guidelines ready to use, you don’t have to start from scratch every time you need a menu, flyer, or service list.",
  },
];

const previewImage = `${import.meta.env.BASE_URL}images/marlow-salon.png`;

export default function BrandIdentityBenefits() {
  return (
    <section
      id="brand-identity"
      aria-labelledby="brand-identity-benefits-heading"
      className="relative w-full scroll-mt-24 bg-[var(--color-void)] px-5 py-20 sm:px-8 sm:py-24 lg:py-28"
    >
      <div className="mx-auto max-w-7xl">
        {/* Introduction on the right; brand preview on the left */}
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-14">
          <div className="min-w-0 lg:col-start-2 lg:row-start-1">
            <p className="mb-6 flex items-center gap-3 text-[10px] leading-relaxed font-semibold tracking-[0.22em] text-white/70 uppercase sm:text-xs">
              <span
                aria-hidden="true"
                className="h-px w-7 shrink-0 bg-[var(--color-neon-teal)]"
              />
              Make Every First Impression Feel Like You.
            </p>

            <h2
              id="brand-identity-benefits-heading"
              className="text-4xl leading-[1.06] font-extrabold tracking-[-0.045em] text-white sm:text-5xl xl:text-6xl"
            >
              Make Your Business Recognizable with a Clear{" "}
              <span className="text-[var(--color-neon-teal)]">
                Brand Identity.
              </span>
            </h2>

            <p className="mt-7 max-w-xl text-base leading-relaxed text-white/65 sm:mt-8 sm:text-lg">
              Your brand identity is how your business looks—from your logo and
              colors to the type on your signs. Bringing these details together
              helps customers recognize you, whether they pass your shop or find
              you online.
            </p>
          </div>

          <figure className="min-w-0 lg:col-start-1 lg:row-start-1">
            <div className="overflow-hidden rounded-sm border border-white/20 bg-[#141414]">
              <img
                src={previewImage}
                alt="Marlow Salon brand identity concept showing a matching storefront sign, appointment cards, and social media post."
                width={1592}
                height={990}
                loading="lazy"
                decoding="async"
                className="block h-auto w-full"
              />
            </div>

            <figcaption className="mt-3 text-xs leading-relaxed tracking-wide text-white/40">
              MARLOW SALON — illustrative brand identity concept.
            </figcaption>
          </figure>
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
              Give Your Business a Look That Fits.
            </h3>

            <p className="mt-3 text-base leading-relaxed text-white/60 sm:text-lg">
              If you’re opening a business or your materials no longer feel
              consistent, a clear visual identity can help bring everything
              together.
            </p>
          </div>

          <Link
            to="/contact"
            className="group inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-sm bg-[var(--color-neon-teal)] px-6 py-4 text-sm font-bold tracking-[0.025em] text-[var(--color-void)] uppercase transition-colors hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-neon-teal)] sm:w-auto sm:justify-self-start lg:col-start-1 lg:row-start-1"
          >
            Let’s Talk About Your Brand
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
