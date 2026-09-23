import HeroBanner from '../components/HeroBanner'
import ContactHero from '../components/ContactHero'
import ContactSection from '../components/ContactSection'

const heroImage = `${import.meta.env.BASE_URL}images/hero-projects.jpg`

export default function Contact() {
  return (
    <main>
      <div className="relative">
        <HeroBanner image={heroImage} align="mid-left" imageFocus="figure-right">
          <ContactHero />
        </HeroBanner>
        <div className="section-fade section-fade--out" aria-hidden />
      </div>

      <ContactSection />

      <footer className="border-t border-white/5 py-8 text-center text-xs text-white/30">
        © 2026 Blancaver Studios
      </footer>
    </main>
  )
}
