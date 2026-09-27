import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Navbar from '../components/public/Navbar'
import Hero from '../components/public/Hero'
import ServicesSection from '../components/public/ServicesSection'
import AboutSection from '../components/public/AboutSection'
import BookingSection from '../components/public/BookingSection'
import Footer from '../components/public/Footer'
import type { ClinicSettings } from '../lib/types'

export default function PublicHome() {
  const [settings, setSettings] = useState<ClinicSettings | null>(null)
  const [preselectedServiceId, setPreselectedServiceId] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('clinic_settings')
      .select('*')
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setSettings(data as ClinicSettings)
      })
  }, [])

  const handleBook = useCallback((serviceId: string) => {
    setPreselectedServiceId(serviceId)
    // Wait a tick so the booking section can react, then scroll.
    setTimeout(() => {
      document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' })
    }, 60)
  }, [])

  const consumePreselected = useCallback(() => setPreselectedServiceId(null), [])

  const clinicName = settings?.clinic_name ?? 'Bright Smile Dental Clinic'

  return (
    <>
      <Navbar clinicName={clinicName} />
      <main>
        <Hero clinicName={clinicName} clinicPhone={settings?.clinic_phone ?? null} />
        <div className="trust-strip">
          <div className="container trust-inner">
            <div className="trust-item">
              <span className="dot">✓</span> Licensed dental professionals
            </div>
            <div className="trust-item">
              <span className="dot">✓</span> Transparent, upfront pricing
            </div>
            <div className="trust-item">
              <span className="dot">✓</span> Strict sterilization standards
            </div>
            <div className="trust-item">
              <span className="dot">✓</span> Online booking in minutes
            </div>
          </div>
        </div>
        <ServicesSection onBook={handleBook} />
        <AboutSection />
        <BookingSection
          preselectedServiceId={preselectedServiceId}
          onPreselectedConsumed={consumePreselected}
        />
      </main>
      <Footer settings={settings} />
    </>
  )
}
