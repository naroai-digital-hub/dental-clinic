import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { PageHead, EmptyState } from '../components/admin/ui'
import { toLocalDateString } from '../lib/availability'
import type { BlockedDate } from '../lib/types'

export default function AdminBlockedDates() {
  const [dates, setDates] = useState<BlockedDate[]>([])
  const [loading, setLoading] = useState(true)
  const [newDate, setNewDate] = useState('')
  const [newReason, setNewReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [removing, setRemoving] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    const { data, error: err } = await supabase
      .from('blocked_dates')
      .select('*')
      .order('blocked_date', { ascending: true })
    if (!err) setDates((data ?? []) as BlockedDate[])
    else setError(err.message)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const add = async () => {
    setError(null)
    if (!newDate) return setError('Please choose a date to block.')
    setSaving(true)
    const { data, error: err } = await supabase
      .from('blocked_dates')
      .insert({ blocked_date: newDate, reason: newReason.trim() || null })
      .select()
      .single()
    setSaving(false)
    if (err) {
      setError(
        err.message.includes('duplicate')
          ? 'This date is already blocked.'
          : err.message
      )
      return
    }
    setDates((prev) =>
      [...prev, data as BlockedDate].sort((a, b) => a.blocked_date.localeCompare(b.blocked_date))
    )
    setNewDate('')
    setNewReason('')
  }

  const remove = async (id: string) => {
    setRemoving(id)
    const { error: err } = await supabase.from('blocked_dates').delete().eq('id', id)
    if (!err) setDates((prev) => prev.filter((d) => d.id !== id))
    setRemoving(null)
  }

  const fmtDate = (iso: string) => {
    const [y, m, d] = iso.split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const todayKey = toLocalDateString(new Date())
  const minDate = todayKey

  return (
    <>
      <PageHead
        title="Blocked Dates"
        sub="Close the online booking calendar for holidays, training days, or any other reason."
      />

      {error && <div className="form-error">{error}</div>}

      <div className="panel">
        <div className="panel-head">
          <h2>Block a new date</h2>
        </div>
        <div className="panel-body">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '200px 1fr auto',
              gap: 12,
              alignItems: 'end',
            }}
          >
            <div className="field" style={{ margin: 0 }}>
              <label htmlFor="bd-date">Date</label>
              <input
                id="bd-date"
                type="date"
                className="input"
                min={minDate}
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
              />
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label htmlFor="bd-reason">Reason <span className="muted">(optional)</span></label>
              <input
                id="bd-reason"
                className="input"
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
                placeholder="e.g. Public holiday, team training"
              />
            </div>
            <button className="btn btn-primary btn-sm" onClick={add} disabled={saving}>
              {saving ? 'Adding…' : '+ Block date'}
            </button>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>Blocked dates</h2>
          <span className="muted" style={{ fontSize: '0.85rem' }}>
            {dates.length} date{dates.length === 1 ? '' : 's'}
          </span>
        </div>
        <div className="panel-body" style={{ paddingTop: 8, paddingBottom: 8 }}>
          {loading ? (
            <div className="empty-state">
              <div className="spinner" />
              <p>Loading blocked dates…</p>
            </div>
          ) : dates.length === 0 ? (
            <EmptyState
              icon="🗓️"
              title="No blocked dates"
              text="The booking calendar is open on all working days."
            />
          ) : (
            dates.map((d) => {
              const past = d.blocked_date < todayKey
              return (
                <div className="blocked-row" key={d.id} style={{ opacity: past ? 0.55 : 1 }}>
                  <div>
                    <div className="blocked-date">
                      {fmtDate(d.blocked_date)}
                      {past && (
                        <span className="badge badge-inactive" style={{ marginLeft: 10 }}>
                          past
                        </span>
                      )}
                    </div>
                    <div className="blocked-reason">{d.reason || 'No reason given'}</div>
                  </div>
                  <button
                    className="icon-btn danger"
                    disabled={removing === d.id}
                    onClick={() => remove(d.id)}
                  >
                    {removing === d.id ? 'Removing…' : 'Remove'}
                  </button>
                </div>
              )
            })
          )}
        </div>
      </div>
    </>
  )
}
