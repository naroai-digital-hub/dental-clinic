import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { PageHead } from '../components/admin/ui'
import type { ClinicSettings } from '../lib/types'

interface SettingsForm {
  clinic_name: string
  clinic_email: string
  clinic_phone: string
  clinic_address: string
  slot_interval_minutes: number
  booking_notice_hours: number
}

export default function AdminSettings() {
  const [rowId, setRowId] = useState<string | null>(null)
  const [form, setForm] = useState<SettingsForm>({
    clinic_name: '',
    clinic_email: '',
    clinic_phone: '',
    clinic_address: '',
    slot_interval_minutes: 30,
    booking_notice_hours: 2,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    supabase
      .from('clinic_settings')
      .select('*')
      .limit(1)
      .maybeSingle()
      .then(({ data, error: err }) => {
        if (err) {
          setError(err.message)
        } else if (data) {
          const s = data as ClinicSettings
          setRowId(s.id)
          setForm({
            clinic_name: s.clinic_name,
            clinic_email: s.clinic_email ?? '',
            clinic_phone: s.clinic_phone ?? '',
            clinic_address: s.clinic_address ?? '',
            slot_interval_minutes: s.slot_interval_minutes,
            booking_notice_hours: s.booking_notice_hours,
          })
        }
        setLoading(false)
      })
  }, [])

  const set = <K extends keyof SettingsForm>(key: K, value: SettingsForm[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
    setSaved(false)
  }

  const save = async () => {
    setError(null)
    setSaved(false)
    if (!form.clinic_name.trim()) return setError('Clinic name is required.')
    if (form.slot_interval_minutes < 5)
      return setError('Slot interval must be at least 5 minutes.')
    if (form.booking_notice_hours < 0)
      return setError('Booking notice cannot be negative.')

    setSaving(true)
    const payload = {
      clinic_name: form.clinic_name.trim(),
      clinic_email: form.clinic_email.trim() || null,
      clinic_phone: form.clinic_phone.trim() || null,
      clinic_address: form.clinic_address.trim() || null,
      slot_interval_minutes: Math.round(form.slot_interval_minutes),
      booking_notice_hours: Math.round(form.booking_notice_hours),
    }

    try {
      if (rowId) {
        const { error: err } = await supabase.from('clinic_settings').update(payload).eq('id', rowId)
        if (err) throw err
      } else {
        const { data, error: err } = await supabase.from('clinic_settings').insert(payload).select().single()
        if (err) throw err
        setRowId((data as ClinicSettings).id)
      }
      setSaved(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save settings.')
    }
    setSaving(false)
  }

  return (
    <>
      <PageHead
        title="Clinic Settings"
        sub="Your clinic's public information and booking rules. Changes appear on the website immediately."
        actions={
          <button className="btn btn-primary btn-sm" onClick={save} disabled={saving || loading}>
            {saving ? 'Saving…' : 'Save settings'}
          </button>
        }
      />

      {error && <div className="form-error">{error}</div>}
      {saved && (
        <div className="form-error" style={{ background: 'var(--green-soft)', color: '#047857' }}>
          Settings saved — the public website now uses the updated information.
        </div>
      )}

      <div className="panel">
        <div className="panel-head">
          <h2>Clinic information</h2>
        </div>
        <div className="panel-body">
          {loading ? (
            <div className="empty-state">
              <div className="spinner" />
              <p>Loading settings…</p>
            </div>
          ) : (
            <>
              <div className="form-grid-2">
                <div className="field">
                  <label htmlFor="cs-name">Clinic name *</label>
                  <input
                    id="cs-name"
                    className="input"
                    value={form.clinic_name}
                    onChange={(e) => set('clinic_name', e.target.value)}
                    placeholder="Bright Smile Dental Clinic"
                  />
                </div>
                <div className="field">
                  <label htmlFor="cs-phone">Phone</label>
                  <input
                    id="cs-phone"
                    className="input"
                    value={form.clinic_phone}
                    onChange={(e) => set('clinic_phone', e.target.value)}
                    placeholder="+1 (555) 234-5678"
                  />
                </div>
              </div>
              <div className="form-grid-2">
                <div className="field">
                  <label htmlFor="cs-email">Email</label>
                  <input
                    id="cs-email"
                    className="input"
                    type="email"
                    value={form.clinic_email}
                    onChange={(e) => set('clinic_email', e.target.value)}
                    placeholder="hello@clinic.com"
                  />
                </div>
                <div className="field">
                  <label htmlFor="cs-address">Address</label>
                  <input
                    id="cs-address"
                    className="input"
                    value={form.clinic_address}
                    onChange={(e) => set('clinic_address', e.target.value)}
                    placeholder="123 Wellness Avenue, Springfield"
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>Booking rules</h2>
        </div>
        <div className="panel-body">
          <div className="form-grid-2">
            <div className="field">
              <label htmlFor="cs-interval">Slot interval (minutes)</label>
              <input
                id="cs-interval"
                className="input"
                type="number"
                min={5}
                step={5}
                value={form.slot_interval_minutes}
                onChange={(e) => set('slot_interval_minutes', Number(e.target.value))}
              />
              <span className="form-hint">
                Time between bookable start times — e.g. 30 offers 9:00, 9:30, 10:00…
              </span>
            </div>
            <div className="field">
              <label htmlFor="cs-notice">Booking notice (hours)</label>
              <input
                id="cs-notice"
                className="input"
                type="number"
                min={0}
                step={1}
                value={form.booking_notice_hours}
                onChange={(e) => set('booking_notice_hours', Number(e.target.value))}
              />
              <span className="form-hint">
                Minimum lead time before a slot can be booked.
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
