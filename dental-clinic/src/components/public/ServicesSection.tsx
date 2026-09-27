import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { serviceImage } from '../../lib/images'
import type { Service } from '../../lib/types'

interface ServicesSectionProps {
  onBook: (serviceId: string) => void
}

function formatPrice(price: number): string {
  if (price <= 0) return 'Free consult'
  return `$${Number(price).toFixed(price % 1 === 0 ? 0 : 2)}`
}

export default function ServicesSection({ onBook }: ServicesSectionProps) {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('price', { ascending: true })
      .then(({ data, error }) => {
        if (!mounted) return
        if (error) console.error('Failed to load services:', error.message)
        setServices((data ?? []) as Service[])
        setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  return (
    <section className="section" id="services">
      <div className="container">
        <div className="services-head">
          <div>
            <span className="eyebrow">Our Services</span>
            <h2 className="h-section" style={{ marginTop: 12 }}>
              Complete dental care,
              <br />
              under one roof
            </h2>
          </div>
          <p className="lead" style={{ maxWidth: 380 }}>
            From preventive checkups to cosmetic treatments — every service is
            delivered with gentle hands and modern equipment.
          </p>
        </div>

        {loading ? (
          <div className="empty-state">
            <div className="spinner" />
            <p>Loading our services…</p>
          </div>
        ) : services.length === 0 ? (
          <div className="empty-state">
            <div className="big">🦷</div>
            <b>Services coming soon</b>
            <p>Please call the clinic for our current treatment menu.</p>
          </div>
        ) : (
          <div className="services-grid">
            {services.map((s) => (
              <article className="service-card" key={s.id}>
                <div className="service-img">
                  <img src={serviceImage(s.name)} alt={`${s.name} at the dental clinic`} loading="lazy" />
                  <span className="service-price">{formatPrice(s.price)}</span>
                </div>
                <div className="service-body">
                  <h3 className="h-card">{s.name}</h3>
                  <div className="service-meta">
                    <span>⏱ {s.duration_minutes} min</span>
                    <span>✓ Dentist supervised</span>
                  </div>
                  <p className="service-desc">{s.description}</p>
                  <button className="btn btn-outline btn-sm" onClick={() => onBook(s.id)}>
                    Book this service →
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
