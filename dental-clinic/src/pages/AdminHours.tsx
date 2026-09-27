import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { PageHead } from '../components/admin/ui'
import { WEEKDAY_NAMES, type BusinessHour } from '../lib/types'

interface HourDraft {
  weekday: number
  is_open: boolean
  start_time: string // HH:MM for the time input
  end_time: string
}

const toInputTime = (t: string) => t.slice(0, 5)
const toDbTime = (t: string) => (t.length === 5 ? `${t}:00` : t)

export default function AdminHours() {
  const [drafts, setDrafts] = useState<HourDraft[]>([])
  const [existing, setExisting] = useState<BusinessHour[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    supabase
      .from('business_hours')
      .select('*')
      .order('weekday')
      .then(({ data, error: err }) => {
        if (err) {
          setError(err.message)
        } else {
          const rows = (data ?? []) as BusinessHour[]
          setExisting(rows)
          setDrafts(
            [0, 1, 2, 3, 4, 5, 6].map((weekday) => {
              const row = rows.find((r) => r.weekday === weekday)
              return {
                weekday,
                is_open: row?.is_open ?? weekday !== 0,
                start_time: toInputTime(row?.start_time ?? '09:00'),
                end_time: toInputTime(row?.end_time ?? '17:00'),
              }
            })
          )
        }
        setLoading(false)
      })
  }, [])

  const set = (weekday: number, patch: Partial<HourDraft>) => {
    setDrafts((prev) => prev.map((d) => (d.weekday === weekday ? { ...d, ...patch } : d)))
    setSaved(false)
  }

  const save = async () => {
    setError(null)
    setSaved(false)
    for (const d of drafts) {
      if (d.is_open && d.start_time >= d.end_time) {
        setError(`${WEEKDAY_NAMES[d.weekday]}: opening time must be before closing time.`)
        return
      }
    }
    setSaving(true)
    try {
      for (const d of drafts) {
        const row = existing.find((r) => r.weekday === d.weekday)
        const payload = {
          weekday: d.weekday,
          is_open: d.is_open,
          start_time: toDbTime(d.start_time),
          end_time: toDbTime(d.end_time),
        }
        if (row) {
          const { error: err } = await supabase.from('business_hours').update(payload).eq('id', row.id)
          if (err) throw err
        } else {
          const { error: err } = await supabase.from('business_hours').insert(payload)
          if (err) throw err
        }
      }
      const { data } = await supabase.from('business_hours').select('*').order('weekday')
      setExisting((data ?? []) as BusinessHour[])
      setSaved(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save business hours.')
    }
    setSaving(false)
  }

  return (
    <>
      <PageHead
        title="Business Hours"
        sub="Set opening days and hours. Changes apply to the booking calendar immediately."
        actions={
          <button className="btn btn-primary btn-sm" onClick={save} disabled={saving || loading}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        }
      />

      {error && <div className="form-error">{error}</div>}
      {saved && (
        <div
          className="form-error"
          style={{ background: 'var(--green-soft)', color: '#047857' }}
        >
          Business hours saved — the booking calendar now uses the new hours.
        </div>
      )}

      <div className="panel">
        <div className="panel-body" style={{ paddingTop: 8, paddingBottom: 8 }}>
          {loading ? (
            <div className="empty-state">
              <div className="spinner" />
              <p>Loading business hours…</p>
            </div>
          ) : (
            drafts.map((d) => (
              <div className={`hours-row${d.is_open ? '' : ' closed'}`} key={d.weekday}>
                <div className="day">{WEEKDAY_NAMES[d.weekday]}</div>
                <div className="hours-times">
                  <input
                    type="time"
                    className="input"
                    value={d.start_time}
                    disabled={!d.is_open}
                    onChange={(e) => set(d.weekday, { start_time: e.target.value })}
                    aria-label={`${WEEKDAY_NAMES[d.weekday]} opening time`}
                  />
                  <span className="muted">to</span>
                  <input
                    type="time"
                    className="input"
                    value={d.end_time}
                    disabled={!d.is_open}
                    onChange={(e) => set(d.weekday, { end_time: e.target.value })}
                    aria-label={`${WEEKDAY_NAMES[d.weekday]} closing time`}
                  />
                </div>
                <span className="muted" style={{ fontSize: '0.85rem' }}>
                  {d.is_open ? 'Open' : 'Closed'}
                </span>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={d.is_open}
                    onChange={(e) => set(d.weekday, { is_open: e.target.checked })}
                    aria-label={`Open on ${WEEKDAY_NAMES[d.weekday]}`}
                  />
                  <span className="track" />
                </label>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}
