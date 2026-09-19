import HeroBanner from '../components/HeroBanner'
import ToolkitContent from '../components/ToolkitContent'

const heroImage = `${import.meta.env.BASE_URL}images/hero-projects.jpg`

export default function Toolkit() {
  return (
    <main>
      <div className="relative">
        <HeroBanner
          image={heroImage}
          titleLines={['Blancaver Studios', 'Tool Kit']}
          animateTitle={false}
          align="center"
        />
        <div className="section-fade section-fade--out" aria-hidden />
      </div>
      <ToolkitContent />
      <footer className="border-t border-white/5 py-8 text-center text-xs text-white/30">
        © 2026 Blancaver Studios
      </footer>
    </main>
  )
}
