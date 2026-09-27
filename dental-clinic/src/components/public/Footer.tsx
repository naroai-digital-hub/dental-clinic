import type { ClinicSettings } from '../../lib/types'

interface FooterProps {
  settings: ClinicSettings | null
}

export default function Footer({ settings }: FooterProps) {
  const name = settings?.clinic_name ?? 'Bright Smile Dental Clinic'

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="brand">
              <span className="brand-mark" aria-hidden>
                🦷
              </span>
              {name}
            </div>
            <p>
              Modern, gentle dental care for the whole family. Book your visit
              online in under a minute.
            </p>
          </div>
          <div>
            <h4>Clinic</h4>
            <ul>
              <li>
                <a href="#services" onClick={(e) => { e.preventDefault(); scrollTo('services') }}>
                  Services
                </a>
              </li>
              <li>
                <a href="#about" onClick={(e) => { e.preventDefault(); scrollTo('about') }}>
                  About us
                </a>
              </li>
              <li>
                <a href="#booking" onClick={(e) => { e.preventDefault(); scrollTo('booking') }}>
                  Book appointment
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4>Contact</h4>
            <ul>
              {settings?.clinic_phone && <li>📞 {settings.clinic_phone}</li>}
              {settings?.clinic_email && <li>✉️ {settings.clinic_email}</li>}
              {settings?.clinic_address && <li>📍 {settings.clinic_address}</li>}
            </ul>
          </div>
          <div>
            <h4>Patient care</h4>
            <ul>
              <li>Checkups &amp; cleaning</li>
              <li>Cosmetic dentistry</li>
              <li>Emergency consultations</li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} {name}. All rights reserved.</span>
          <span>Gentle dentistry, honest pricing.</span>
        </div>
      </div>
    </footer>
  )
}
