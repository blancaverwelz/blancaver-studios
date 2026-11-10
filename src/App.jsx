import { lazy, Suspense, useLayoutEffect, useRef } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import AmbientVoidBackground from './components/AmbientVoidBackground'
import Home from './pages/Home'

const Projects = lazy(() => import('./pages/Projects'))
const Toolkit = lazy(() => import('./pages/Toolkit'))
const Contact = lazy(() => import('./pages/Contact'))

// Size the scene before first paint, even while the browser controls are expanded.
function usePortraitScreenHeight() {
  useLayoutEffect(() => {
    const portrait = matchMedia("(pointer: coarse) and (orientation: portrait)");
    const style = document.documentElement.style;
    function sync() {
      if (portrait.matches && window.screen.height > 0) {
        style.setProperty("--portrait-screen-height", window.screen.height + "px");
      } else {
        style.removeProperty("--portrait-screen-height");
      }
    }
    sync();
    portrait.addEventListener("change", sync);
    window.addEventListener("resize", sync);
    return () => {
      portrait.removeEventListener("change", sync);
      window.removeEventListener("resize", sync);
      style.removeProperty("--portrait-screen-height");
    };
  }, []);
}

function ScrollManager() {
  const { pathname, search, hash, key } = useLocation()
  const isFirstRender = useRef(true)
  const lastHandledLocation = useRef(null)

  useLayoutEffect(() => {
    const previousRestoration = window.history.scrollRestoration
    window.history.scrollRestoration = 'manual'

    return () => {
      window.history.scrollRestoration = previousRestoration
    }
  }, [])

  useLayoutEffect(() => {
    const locationId = `${key}:${pathname}${search}${hash}`
    if (lastHandledLocation.current === locationId) return

    lastHandledLocation.current = locationId

    const navigationEntry = performance.getEntriesByType('navigation')[0]
    const isReload = isFirstRender.current && navigationEntry?.type === 'reload'
    isFirstRender.current = false

    // A reload and every route without a fragment start at the top. Temporarily
    // disable CSS smooth scrolling so scroll observers see the final position
    // when their effects initialize.
    if (!hash || isReload) {
      const root = document.documentElement
      const previousBehavior = root.style.scrollBehavior
      root.style.scrollBehavior = 'auto'
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
      root.style.scrollBehavior = previousBehavior
      return
    }

    // Preserve section links after React has committed the destination route.
    const target = document.getElementById(decodeURIComponent(hash.slice(1)))
    target?.scrollIntoView()
  }, [pathname, search, hash, key])

  return null
}

export default function App() {
  usePortraitScreenHeight();
  return (
    <div className="page-bg">
      <AmbientVoidBackground />
      <Navbar />
      <Suspense fallback={<main className="min-h-screen px-5 pt-32 text-white/70" role="status">Loading page…</main>}>
        <ScrollManager />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/toolkit" element={<Toolkit />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </Suspense>
    </div>
  )
}
