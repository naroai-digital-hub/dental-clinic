import { useEffect, useState } from 'react'

interface NavbarProps {
  clinicName: string
}

export default function Navbar({ clinicName }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <header className={`nav${scrolled ? ' scrolled' : ''}`}>
      <div className="container nav-inner">
        <a
          className="brand"
          href="#top"
          onClick={(e) => {
            e.preventDefault()
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
        >
          <span className="brand-mark" aria-hidden>
            🦷
          </span>
          {clinicName}
        </a>
        <nav className="nav-links" aria-label="Primary">
          <a href="#services" onClick={(e) => { e.preventDefault(); scrollTo('services') }}>
            Services
          </a>
          <a href="#about" onClick={(e) => { e.preventDefault(); scrollTo('about') }}>
            About
          </a>
          <a href="#booking" onClick={(e) => { e.preventDefault(); scrollTo('booking') }}>
            Visit Us
          </a>
        </nav>
        <div className="nav-cta">
          <button className="btn btn-primary btn-sm" onClick={() => scrollTo('booking')}>
            Book Appointment
          </button>
        </div>
      </div>
    </header>
  )
}
