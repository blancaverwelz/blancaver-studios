import HeroBanner from '../components/HeroBanner'
import BrandBanner from '../components/BrandBanner'
import ProjectSlider from '../components/ProjectSlider'
import AboutSection from '../components/AboutSection'
import WhatIDo from '../components/WhatIDo'
import WhyChooseUs from '../components/WhyChooseUs'

const heroImage = `${import.meta.env.BASE_URL}images/hero-home.jpg`

export default function Home() {
  return (
    <main className="home-sections">
      <div className="section-block">
        <HeroBanner
          image={heroImage}
          titleLines={['Blancaver', 'Studios']}
          animateTitle
          align="mid-left"
          imageFocus="figure-right"
        />
        <div className="section-fade section-fade--out" aria-hidden />
      </div>

      <div className="section-block">
        <BrandBanner />
      </div>

      <div className="section-block">
        <div className="section-fade section-fade--in" aria-hidden />
        <ProjectSlider />
      </div>

      <AboutSection />
      <WhatIDo />
      <WhyChooseUs />

      <footer className="border-t border-white/5 py-8 text-center text-xs text-white/30">
        © 2026 Blancaver Studios
      </footer>
    </main>
  )
}
