import { useLayoutEffect, useRef } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import AmbientVoidBackground from './components/AmbientVoidBackground'
import Home from './pages/Home'
import Projects from './pages/Projects'
import Toolkit from './pages/Toolkit'
import Contact from './pages/Contact'

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
  return (
    <div className="page-bg">
      <AmbientVoidBackground />
      <Navbar />
      <ScrollManager />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/toolkit" element={<Toolkit />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
    </div>
  )
}
