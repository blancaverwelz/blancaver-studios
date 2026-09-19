import HeroBanner from '../components/HeroBanner'
import ProjectGrid from '../components/ProjectGrid'

const heroImage = `${import.meta.env.BASE_URL}images/hero-projects.jpg`

export default function Projects() {
  return (
    <main>
      <div className="relative">
        <HeroBanner
          image={heroImage}
          titleLines={['ALL PROJECTS']}
          subtitle="Blancaver Studios"
          animateTitle={false}
          align="center"
        />
        <div className="section-fade section-fade--out" aria-hidden />
      </div>
      <ProjectGrid />
      <footer className="border-t border-white/5 py-8 text-center text-xs text-white/30">
        © 2026 Blancaver Studios
      </footer>
    </main>
  )
}
