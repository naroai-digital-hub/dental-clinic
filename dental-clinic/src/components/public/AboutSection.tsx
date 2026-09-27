import { IMAGES } from '../../lib/images'

const POINTS = [
  {
    icon: '🛋️',
    title: 'Comfort-first visits',
    text: 'A calm environment, gentle techniques, and unhurried appointments designed around anxious patients.',
  },
  {
    icon: '🔬',
    title: 'Modern equipment',
    text: 'Digital imaging, precise diagnostics, and up-to-date treatment technology for safer, faster care.',
  },
  {
    icon: '🤝',
    title: 'Honest treatment plans',
    text: 'Clear explanations and transparent pricing before any treatment begins. No surprises, ever.',
  },
  {
    icon: '🧼',
    title: 'Strict hygiene standards',
    text: 'Hospital-grade sterilization and spotless treatment rooms for every single patient, every visit.',
  },
]

export default function AboutSection() {
  return (
    <section className="section about" id="about">
      <div className="container about-grid">
        <div className="about-visual">
          <div className="about-img-main">
            <img src={IMAGES.about} alt="Dentist consulting with a patient in a bright treatment room" loading="lazy" />
          </div>
          <div className="about-img-sub" aria-hidden>
            <img src={IMAGES.aboutDetail} alt="" loading="lazy" />
          </div>
          <div className="about-badge">
            <b>15+</b>
            <span>years of trusted care</span>
          </div>
        </div>

        <div className="about-copy">
          <span className="eyebrow">Why patients choose us</span>
          <h2 className="h-section">Dentistry that puts you at ease</h2>
          <p className="lead">
            Visiting the dentist should never feel stressful. Our team takes time
            to listen, explains every step, and treats you like a person —
            not a procedure.
          </p>
          <div className="about-points">
            {POINTS.map((p) => (
              <div className="about-point" key={p.title}>
                <span className="tick" aria-hidden>
                  {p.icon}
                </span>
                <div>
                  <b>{p.title}</b>
                  <p>{p.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
