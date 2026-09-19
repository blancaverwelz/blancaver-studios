import { useEffect } from 'react'
import HeroBanner from '../components/HeroBanner'
import ContactHero from '../components/ContactHero'
import ContactSection from '../components/ContactSection'

const heroImage = `${import.meta.env.BASE_URL}images/hero-projects.jpg`

export default function Contact() {
  // Fresh navigation here should always land on the hero, not wherever the
  // previous route's scroll position happened to be. Scoped to this page
  // only — no change to router/global scroll behavior.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

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
