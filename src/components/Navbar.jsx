import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'

const logoSrc = `${import.meta.env.BASE_URL}images/logo.jpg`

const links = [
  { to: '/projects', label: 'All Projects' },
  { to: '/toolkit', label: 'Toolkit' },
  { to: '/contact', label: 'Contact' },
]

export default function Navbar() {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)

  // Close the mobile menu on every route change, not just link taps —
  // covers back/forward navigation too.
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Lock background scroll while the mobile menu is open.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <header className="nav-glass">
      <nav className="relative mx-auto flex max-w-7xl items-center justify-between px-5 py-3 sm:px-8 sm:py-3.5">
        <Link
          to="/"
          aria-label="Blancaver Studios home"
          className="group inline-flex items-center gap-2.5 sm:gap-3 transition-opacity hover:opacity-85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70"
        >
          <img
            src={logoSrc}
            alt=""
            width={44}
            height={44}
            className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-white/25 shadow-md shadow-black/40 sm:h-10 sm:w-10"
          />
          <span className="whitespace-nowrap text-sm font-semibold tracking-[0.14em] text-white sm:text-base">
            Blancaver
          </span>
        </Link>

        {/* Desktop links — hidden below sm, where they don't fit alongside the logo */}
        <div className="hidden items-center gap-5 sm:flex sm:gap-8">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`nav-link text-sm font-medium tracking-wide text-white/90 sm:text-base ${
                pathname === link.to ? 'is-active' : ''
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-nav-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white/90 transition-colors hover:text-[var(--color-neon-teal)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70 sm:hidden"
        >
          {open ? <X size={22} strokeWidth={1.75} /> : <Menu size={22} strokeWidth={1.75} />}
        </button>
      </nav>

      {/* Mobile menu panel */}
      <div id="mobile-nav-menu" className={`mobile-nav-menu sm:hidden ${open ? 'is-open' : ''}`}>
        <div className="flex flex-col px-5 pb-5">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`mobile-nav-link ${pathname === link.to ? 'is-active' : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  )
}
