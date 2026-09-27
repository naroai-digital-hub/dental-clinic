import { IMAGES } from '../../lib/images'

interface HeroProps {
  clinicName: string
  clinicPhone: string | null
}

export default function Hero({ clinicName, clinicPhone }: HeroProps) {
  const scrollToBooking = () =>
    document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' })
  const scrollToServices = () =>
    document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })

  return (
    <section className="hero" id="top">
      <div className="hero-bg" aria-hidden>
        <div
          className="hero-blob"
          style={{ width: 480, height: 480, background: '#a7f3d0', top: '-120px', right: '-80px' }}
        />
        <div
          className="hero-blob"
          style={{ width: 380, height: 380, background: '#bae6fd', bottom: '-100px', left: '-100px' }}
        />
      </div>

      <div className="container hero-grid">
        <div className="hero-copy">
          <span className="eyebrow">Modern Dental Care</span>
          <h1 className="h-display">
            A healthier smile starts with <span className="accent">gentle, expert care</span>
          </h1>
          <p className="lead">
            At {clinicName}, we combine modern dentistry with a calm, patient-first
            experience — from routine checkups to complete smile care.
          </p>
          <div className="hero-ctas">
            <button className="btn btn-primary" onClick={scrollToBooking}>
              Book Your Appointment
            </button>
            <button className="btn btn-outline" onClick={scrollToServices}>
              Explore Services
            </button>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <b>15+</b>
              <span>Years of dental care</span>
            </div>
            <div className="hero-stat">
              <b>12k+</b>
              <span>Happy patients</span>
            </div>
            <div className="hero-stat">
              <b>4.9★</b>
              <span>Patient rating</span>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-img-main">
            <img
              src={IMAGES.hero}
              alt="Modern dental treatment room at the clinic"
              loading="eager"
            />
          </div>
          <div className="hero-img-float" aria-hidden>
            <img src={IMAGES.heroSecondary} alt="" loading="lazy" />
          </div>
          <div className="hero-card-float">
            <span className="icon" aria-hidden>
              📅
            </span>
            <div>
              <b>Same-week visits</b>
              <span>{clinicPhone ?? 'Call us to book today'}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
