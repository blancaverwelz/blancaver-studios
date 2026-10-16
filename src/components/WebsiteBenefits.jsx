import { Link } from "react-router-dom";
import { ArrowUpRight, Clock, KeyRound, ShieldCheck } from "lucide-react";
import ScrollReveal from "./ScrollReveal";

const benefits = [
  {
    icon: ShieldCheck,
    title: "Build Trust",
    description:
      "Before they call or visit, most people look a business up. A clear site builds trust in seconds.",
  },
  {
    icon: KeyRound,
    title: "You own it",
    description:
      "Social pages and listings rent you space, and their rules and reach can change overnight. A website is yours.",
  },
  {
    icon: Clock,
    title: "It works while you're closed",
    description:
      "Services, prices, photos, and a contact or booking button are there at any hour, so you answer fewer repeat questions.",
  },
];

const previewImage = `${import.meta.env.BASE_URL}images/northline-auto.png`;

export default function WebsiteBenefits() {
  return (
    <section
      id="web-design-development"
      aria-labelledby="website-benefits-heading"
      className="relative w-full scroll-mt-24 bg-[var(--color-void)] px-5 py-20 sm:px-8 sm:py-24 lg:py-28"
    >
      <div className="mx-auto max-w-7xl">
        {/* Introduction and example website */}
        <ScrollReveal className="grid items-center gap-12 lg:grid-cols-2 lg:gap-14">
          <div className="min-w-0">
            <p className="mb-6 flex items-center gap-3 text-[10px] leading-relaxed font-semibold tracking-[0.22em] text-white/70 uppercase sm:text-xs">
              <span
                aria-hidden="true"
                className="h-px w-7 shrink-0 bg-[#ffd301]"
              />
              Built for Businesses Ready to Grow
            </p>

            <h2
              id="website-benefits-heading"
              className="text-4xl leading-[1.06] font-extrabold tracking-[-0.045em] text-white sm:text-5xl xl:text-6xl"
            >
              Why Does Your Business Need a{" "}
              <span className="text-[var(--color-neon-teal)]">Website?</span>
            </h2>

            <p className="mt-7 max-w-xl text-base leading-relaxed text-white/65 sm:mt-8 sm:text-lg">
              Social media is a great place to connect with customers, but your
              business deserves a home of its own. A professional website helps
              you build trust, showcase what you do, and make it easier for
              potential customers to choose you.
            </p>
          </div>

          <figure className="min-w-0">
            <div className="overflow-hidden rounded-sm border border-white/20 bg-[#141414]">
              <img
                src={previewImage}
                alt="Concept website for NORTHLINE AUTO, featuring automotive services and a clear booking call to action."
                width={1200}
                height={840}
                loading="lazy"
                decoding="async"
                className="block h-auto w-full"
              />
            </div>

            <figcaption className="mt-3 text-xs leading-relaxed tracking-wide text-white/40">
              NORTHLINE AUTO — illustrative website concept.
            </figcaption>
          </figure>
        </ScrollReveal>

        {/* Three business benefits */}
        <div className="mt-14 border-y border-white/15 py-8 sm:mt-16 sm:py-10">
          <ul className="grid gap-8 md:grid-cols-3 md:gap-0">
            {benefits.map(({ icon: Icon, title, description }, index) => (
              <ScrollReveal
                as="li"
                delay={index * 90}
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
                  className="mt-0.5 shrink-0 text-[#ffd301]"
                />

                <div className="min-w-0">
                  <h3 className="text-sm leading-snug font-bold tracking-[0.025em] text-white uppercase lg:text-base">
                    {title}
                  </h3>

                  <p className="mt-3 text-sm leading-relaxed text-white/60 lg:text-base">
                    {description}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </ul>
        </div>

        {/* Closing statement and contact CTA */}
        <ScrollReveal className="mt-10 flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
          <div className="max-w-3xl">
            <h3 className="text-2xl leading-tight font-bold tracking-[-0.025em] text-white sm:text-3xl">
              Your Business Deserves More Than a Social Media Page.
            </h3>

            <p className="mt-3 text-base leading-relaxed text-white/60 sm:text-lg">
              Build an online presence that works as hard as you do.
            </p>
          </div>

          <Link
            to="/contact"
            className="group inline-flex min-h-14 w-full shrink-0 items-center justify-center gap-3 rounded-sm bg-[var(--color-neon-teal)] px-6 py-4 text-sm font-bold tracking-[0.025em] text-[var(--color-void)] uppercase transition-colors hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-neon-teal)] sm:w-auto"
          >
            Let's Build What's Next
            <ArrowUpRight
              aria-hidden="true"
              size={20}
              strokeWidth={2}
              className="transition-transform motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:-translate-y-0.5 motion-reduce:transition-none"
            />
          </Link>
        </ScrollReveal>
      </div>
    </section>
  );
}
