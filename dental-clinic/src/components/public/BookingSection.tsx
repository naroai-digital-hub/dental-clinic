import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { IMAGES, serviceImage } from '../../lib/images'
import {
  combineDateAndTime,
  generateSlots,
  isBookableDay,
  toLocalDateString,
  toTimeString,
  type Slot,
} from '../../lib/availability'
import type {
  Appointment,
  BlockedDate,
  BusinessHour,
  ClinicSettings,
  Service,
} from '../../lib/types'

interface BookingSectionProps {
  preselectedServiceId: string | null
  onPreselectedConsumed: () => void
}

const STEPS = [
  { n: 1, title: 'Choose service', sub: 'What do you need?' },
  { n: 2, title: 'Pick date & time', sub: 'Find a slot that suits you' },
  { n: 3, title: 'Your details', sub: 'How do we reach you?' },
  { n: 4, title: 'Confirmed', sub: 'We look forward to seeing you' },
]

const DOW = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function formatLongDate(d: Date): string {
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function BookingSection({ preselectedServiceId, onPreselectedConsumed }: BookingSectionProps) {
  const [step, setStep] = useState(1)
  const [services, setServices] = useState<Service[]>([])
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([])
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([])
  const [settings, setSettings] = useState<ClinicSettings | null>(null)
  const [loadingData, setLoadingData] = useState(true)

  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [monthCursor, setMonthCursor] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [slots, setSlots] = useState<Slot[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmation, setConfirmation] = useState<{
    serviceName: string
    date: Date
    slot: Slot
  } | null>(null)

  const selectedService = useMemo(
    () => services.find((s) => s.id === selectedServiceId) ?? null,
    [services, selectedServiceId]
  )

  // ---- Load reference data ----
  useEffect(() => {
    let mounted = true
    Promise.all([
      supabase.from('services').select('*').eq('is_active', true).order('name'),
      supabase.from('business_hours').select('*').order('weekday'),
      supabase.from('blocked_dates').select('*'),
      supabase.from('clinic_settings').select('*').limit(1).maybeSingle(),
    ]).then(([svc, hours, blocked, cfg]) => {
      if (!mounted) return
      if (!svc.error) setServices((svc.data ?? []) as Service[])
      if (!hours.error) setBusinessHours((hours.data ?? []) as BusinessHour[])
      if (!blocked.error) setBlockedDates((blocked.data ?? []) as BlockedDate[])
      if (!cfg.error && cfg.data) setSettings(cfg.data as ClinicSettings)
      setLoadingData(false)
    })
    return () => {
      mounted = false
    }
  }, [])

  // ---- Preselected service from the Services section ----
  useEffect(() => {
    if (preselectedServiceId) {
      setSelectedServiceId(preselectedServiceId)
      setSelectedDate(null)
      setSelectedSlot(null)
      setConfirmation(null)
      setStep(2)
      onPreselectedConsumed()
    }
  }, [preselectedServiceId, onPreselectedConsumed])

  // ---- State rules: reset availableSlots + selectedTime when service changes ----
  useEffect(() => {
    setSlots([])
    setSelectedSlot(null)
  }, [selectedServiceId])

  // ---- Load slots when date/service changes ----
  useEffect(() => {
    // Do not calculate slots if required inputs are missing
    if (step !== 2 || !selectedDate || !selectedService) {
      setSlots([])
      return
    }
    // Only active services are bookable (services.is_active)
    if (!selectedService.is_active) {
      setSlots([])
      return
    }
    let mounted = true
    setSlotsLoading(true)
    setError(null)
    const dayKey = toLocalDateString(selectedDate)

    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('appointments')
          .select('start_time, end_time, status')
          .eq('appointment_date', dayKey)
        if (!mounted) return
        if (error) {
          console.error('Failed to load appointments for availability:', error.message)
          setSlots([])
        } else {
          try {
            const existing = (data ?? []) as Pick<Appointment, 'start_time' | 'end_time' | 'status'>[]
            const generated = generateSlots({
              date: selectedDate,
              businessHours,
              durationMinutes: selectedService.duration_minutes,
              slotIntervalMinutes: settings?.slot_interval_minutes ?? 30,
              bookingNoticeHours: settings?.booking_notice_hours ?? 2,
              blockedDates,
              appointments: existing,
            })
            setSlots(generated)
          } catch (genErr) {
            console.error('Slot generation failed:', genErr instanceof Error ? genErr.message : genErr)
            setSlots([])
          }
        }
      } catch (err) {
        if (!mounted) return
        console.error('Slot availability check failed:', err instanceof Error ? err.message : err)
        setSlots([])
      } finally {
        if (mounted) setSlotsLoading(false)
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [step, selectedDate, selectedService, businessHours, blockedDates, settings])

  // ---- Calendar cells ----
  const calCells = useMemo(() => {
    const y = monthCursor.getFullYear()
    const m = monthCursor.getMonth()
    const first = new Date(y, m, 1)
    const daysInMonth = new Date(y, m + 1, 0).getDate()
    const cells: (Date | null)[] = []
    for (let i = 0; i < first.getDay(); i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(y, m, d))
    return cells
  }, [monthCursor])

  const today = new Date()
  const canGoPrev =
    monthCursor.getFullYear() > today.getFullYear() ||
    (monthCursor.getFullYear() === today.getFullYear() && monthCursor.getMonth() > today.getMonth())

  const submit = async () => {
    setError(null)
    if (!selectedService || !selectedDate || !selectedSlot) {
      setError('Please complete all booking steps first.')
      return
    }
    // Time safety: only proceed with real Date objects
    if (
      !(selectedSlot.start instanceof Date) ||
      isNaN(selectedSlot.start.getTime()) ||
      !(selectedSlot.end instanceof Date) ||
      isNaN(selectedSlot.end.getTime())
    ) {
      setError('The selected time is no longer valid. Please pick another slot.')
      return
    }
    if (!fullName.trim()) return setError('Please enter your full name.')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      return setError('Please enter a valid email address.')
    if (!phone.trim()) return setError('Please enter your phone number.')

    setSubmitting(true)
    try {
      // Exact schema only: full_name, email, phone, service_id,
      // appointment_date, start_time, end_time, status, notes
      const { error: insertError } = await supabase.from('appointments').insert({
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        service_id: selectedService.id,
        appointment_date: toLocalDateString(selectedDate),
        start_time: toTimeString(selectedSlot.start),
        end_time: toTimeString(selectedSlot.end),
        status: 'pending',
        notes: notes.trim() || null,
      })

      if (insertError) {
        console.error('Booking insert failed:', insertError.message)
        setError('We could not submit your request. Please try again or call the clinic directly.')
        return
      }

      // Success — the new appointment is now in Supabase and will be
      // excluded from future slot calculations via the overlap rule.
      setConfirmation({ serviceName: selectedService.name, date: selectedDate, slot: selectedSlot })
      setStep(4)
    } catch (err) {
      console.error('Booking submit failed:', err instanceof Error ? err.message : err)
      setError('Something went wrong while submitting. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const reset = () => {
    setStep(1)
    setSelectedServiceId(null)
    setSelectedDate(null)
    setSelectedSlot(null)
    setFullName('')
    setEmail('')
    setPhone('')
    setNotes('')
    setError(null)
    setConfirmation(null)
  }

  const stepState = (n: number) =>
    n < step || (step === 4 && n <= 3) ? 'done' : n === step ? 'active' : ''

  return (
    <section className="section booking" id="booking">
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: 44 }}>
          <span className="eyebrow" style={{ justifyContent: 'center' }}>
            Book Online
          </span>
          <h2 className="h-section" style={{ marginTop: 12 }}>
            Schedule your visit in minutes
          </h2>
          <p className="lead" style={{ maxWidth: 560, margin: '12px auto 0' }}>
            Choose your treatment, pick a time that works for you, and we will
            confirm your appointment shortly.
          </p>
        </div>

        <div className="booking-shell">
          <aside className="booking-side">
            <img className="bg" src={IMAGES.bookingAccent} alt="" aria-hidden />
            <div>
              <span className="eyebrow" style={{ color: '#fff' }}>
                Easy booking
              </span>
              <h3>Your smile, scheduled</h3>
              <p>
                Real-time availability, instant request, and a friendly
                confirmation from our care team.
              </p>
            </div>
            <div className="steps">
              {STEPS.map((s) => (
                <div className={`step-row ${stepState(s.n)}`} key={s.n}>
                  <span className="step-num">{stepState(s.n) === 'done' ? '✓' : s.n}</span>
                  <div>
                    <b>{s.title}</b>
                    <span>{s.sub}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="contact">
              <b>Prefer to call?</b>
              {settings?.clinic_phone ?? 'Call the clinic directly'}
              <br />
              {settings?.clinic_email ?? ''}
            </div>
          </aside>

          <div className="booking-main">
            {loadingData ? (
              <div className="empty-state">
                <div className="spinner" />
                <p>Preparing the booking calendar…</p>
              </div>
            ) : (
              <>
                {error && <div className="form-error">{error}</div>}

                {step === 1 && (
                  <div className="booking-pane">
                    <h3>Which treatment do you need?</h3>
                    <p>Select a service to see available appointment times.</p>
                    <div className="pick-service">
                      {services.map((s) => (
                        <button
                          key={s.id}
                          className={`pick-service-card${selectedServiceId === s.id ? ' selected' : ''}`}
                          onClick={() => setSelectedServiceId(s.id)}
                        >
                          <img src={serviceImage(s.name)} alt="" loading="lazy" />
                          <span className="info">
                            <b>{s.name}</b>
                            <span>
                              {s.duration_minutes} min
                              {s.description ? ` · ${s.description.slice(0, 72)}${s.description.length > 72 ? '…' : ''}` : ''}
                            </span>
                          </span>
                          <span className="price">
                            {s.price > 0 ? `$${Number(s.price)}` : 'Free'}
                          </span>
                        </button>
                      ))}
                    </div>
                    {services.length === 0 && (
                      <div className="empty-state">
                        <div className="big">🦷</div>
                        <b>No services available right now</b>
                        <p>Please call the clinic and we will help you directly.</p>
                      </div>
                    )}
                    <div className="booking-actions">
                      <span />
                      <button
                        className="btn btn-primary"
                        disabled={!selectedServiceId}
                        onClick={() => {
                          setSelectedDate(null)
                          setSelectedSlot(null)
                          setStep(2)
                        }}
                      >
                        Continue →
                      </button>
                    </div>
                  </div>
                )}

                {step === 2 && selectedService && (
                  <div className="booking-pane">
                    <h3>Pick a date &amp; time</h3>
                    <p>
                      {selectedService.name} · {selectedService.duration_minutes} minutes
                    </p>

                    <div className="cal-head">
                      <b>
                        {MONTHS[monthCursor.getMonth()]} {monthCursor.getFullYear()}
                      </b>
                      <div className="cal-nav">
                        <button disabled={!canGoPrev} onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1))} aria-label="Previous month">
                          ‹
                        </button>
                        <button onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1))} aria-label="Next month">
                          ›
                        </button>
                      </div>
                    </div>
                    <div className="cal-grid">
                      {DOW.map((d) => (
                        <div className="cal-dow" key={d}>
                          {d}
                        </div>
                      ))}
                      <CalendarDays
                        cells={calCells}
                        businessHours={businessHours}
                        blockedDates={blockedDates}
                        selectedDate={selectedDate}
                        onSelect={(d) => {
                          setSelectedDate(d)
                          setSelectedSlot(null)
                        }}
                      />
                    </div>

                    {selectedDate && (
                      <>
                        <h4 style={{ margin: '6px 0 12px', fontSize: '1rem', fontWeight: 800 }}>
                          Available times — {formatLongDate(selectedDate)}
                        </h4>
                        {slotsLoading ? (
                          <div className="empty-state" style={{ padding: 24 }}>
                            <div className="spinner" />
                            <p>Checking availability…</p>
                          </div>
                        ) : slots.length === 0 ? (
                          <div className="empty-state" style={{ padding: 24 }}>
                            <div className="big">📅</div>
                            <b>No available times this day</b>
                            <p>Try another date — new slots open up regularly.</p>
                          </div>
                        ) : (
                          <div className="slot-grid">
                            {slots.map((slot) => (
                              <button
                                key={slot.start.getTime()}
                                className={`slot${selectedSlot?.start.getTime() === slot.start.getTime() ? ' selected' : ''}`}
                                onClick={() => setSelectedSlot(slot)}
                              >
                                {slot.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    )}

                    <div className="booking-actions">
                      <button className="btn btn-ghost" onClick={() => setStep(1)}>
                        ← Back
                      </button>
                      <button
                        className="btn btn-primary"
                        disabled={!selectedDate || !selectedSlot}
                        onClick={() => setStep(3)}
                      >
                        Continue →
                      </button>
                    </div>
                  </div>
                )}

                {step === 3 && selectedService && selectedDate && selectedSlot && (
                  <div className="booking-pane">
                    <h3>Your details</h3>
                    <p>We will use this information to confirm your appointment.</p>

                    <div className="summary-box">
                      <div className="summary-row">
                        <span>Service</span>
                        <b>{selectedService.name}</b>
                      </div>
                      <div className="summary-row">
                        <span>Date</span>
                        <b>{formatLongDate(selectedDate)}</b>
                      </div>
                      <div className="summary-row">
                        <span>Time</span>
                        <b>
                          {selectedSlot.label} –{' '}
                          {combineDateAndTime(selectedDate, toTimeString(selectedSlot.end)).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                        </b>
                      </div>
                      <div className="summary-row">
                        <span>Duration</span>
                        <b>{selectedService.duration_minutes} minutes</b>
                      </div>
                    </div>

                    <div className="form-grid-2">
                      <div className="field">
                        <label htmlFor="bk-name">Full name *</label>
                        <input
                          id="bk-name"
                          className="input"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Jane Cooper"
                          autoComplete="name"
                        />
                      </div>
                      <div className="field">
                        <label htmlFor="bk-phone">Phone *</label>
                        <input
                          id="bk-phone"
                          className="input"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+1 (555) 000-0000"
                          autoComplete="tel"
                        />
                      </div>
                    </div>
                    <div className="field">
                      <label htmlFor="bk-email">Email *</label>
                      <input
                        id="bk-email"
                        className="input"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="jane@example.com"
                        autoComplete="email"
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="bk-notes">Notes <span className="muted">(optional)</span></label>
                      <textarea
                        id="bk-notes"
                        className="textarea"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Anything we should know before your visit? Symptoms, preferences, questions…"
                      />
                    </div>

                    <div className="booking-actions">
                      <button className="btn btn-ghost" onClick={() => setStep(2)} disabled={submitting}>
                        ← Back
                      </button>
                      <button className="btn btn-primary" onClick={submit} disabled={submitting}>
                        {submitting ? 'Sending request…' : 'Confirm appointment request'}
                      </button>
                    </div>
                  </div>
                )}

                {step === 4 && confirmation && (
                  <div className="booking-pane">
                    <div className="success-wrap">
                      <div className="success-icon">✓</div>
                      <h3>Request received!</h3>
                      <p>
                        Thank you — your appointment request has been sent. Our
                        care team will confirm it shortly by phone or email.
                      </p>
                      <div className="summary-box" style={{ textAlign: 'left' }}>
                        <div className="summary-row">
                          <span>Service</span>
                          <b>{confirmation.serviceName}</b>
                        </div>
                        <div className="summary-row">
                          <span>Date</span>
                          <b>{formatLongDate(confirmation.date)}</b>
                        </div>
                        <div className="summary-row">
                          <span>Time</span>
                          <b>{confirmation.slot.label}</b>
                        </div>
                        <div className="summary-row">
                          <span>Patient</span>
                          <b>{fullName}</b>
                        </div>
                      </div>
                      <button className="btn btn-outline" onClick={reset}>
                        Book another appointment
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function CalendarDays({
  cells,
  businessHours,
  blockedDates,
  selectedDate,
  onSelect,
}: {
  cells: (Date | null)[]
  businessHours: BusinessHour[]
  blockedDates: BlockedDate[]
  selectedDate: Date | null
  onSelect: (d: Date) => void
}) {
  const todayKey = toLocalDateString(new Date())
  return (
    <>
      {cells.map((date, i) => {
        if (date === null) return <span key={`blank-${i}`} />
        const bookable = isBookableDay(date, businessHours, blockedDates)
        const isSelected =
          selectedDate !== null && toLocalDateString(selectedDate) === toLocalDateString(date)
        const isToday = toLocalDateString(date) === todayKey
        return (
          <button
            key={date.getTime()}
            className={`cal-day${isSelected ? ' selected' : ''}${isToday ? ' today' : ''}`}
            disabled={!bookable}
            onClick={() => onSelect(date)}
            aria-label={date.toDateString()}
          >
            {date.getDate()}
          </button>
        )
      })}
    </>
  )
}
