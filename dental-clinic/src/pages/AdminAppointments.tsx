import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { PageHead, StatusBadge, EmptyState } from '../components/admin/ui'
import {
  APPOINTMENT_STATUSES,
  type Appointment,
  type AppointmentStatus,
} from '../lib/types'

type Filter = 'all' | AppointmentStatus

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')
  const [dateFilter, setDateFilter] = useState<string>('')
  const [updating, setUpdating] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    const { data, error: err } = await supabase
      .from('appointments')
      .select('*, services(name)')
      .order('appointment_date', { ascending: false })
      .order('start_time', { ascending: false })
    if (!err) setAppointments((data ?? []) as Appointment[])
    else setError(err.message)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    let list = filter === 'all' ? appointments : appointments.filter((a) => a.status === filter)
    if (dateFilter) {
      list = list.filter((a) => a.appointment_date === dateFilter)
    }
    return list
  }, [appointments, filter, dateFilter])

  const updateStatus = async (id: string, status: AppointmentStatus) => {
    setUpdating(id)
    setError(null)
    const { error: err } = await supabase.from('appointments').update({ status }).eq('id', id)
    if (err) {
      setError(err.message)
    } else {
      setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)))
    }
    setUpdating(null)
  }

  const fmtDate = (iso: string) => {
    const [y, m, d] = iso.split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <>
      <PageHead title="Appointments" sub="Review booking requests and manage their status." />

      {error && <div className="form-error">{error}</div>}

      <div className="panel">
        <div className="panel-head" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div className="filter-bar">
            {(['all', ...APPOINTMENT_STATUSES] as Filter[]).map((f) => (
              <button
                key={f}
                className={`filter-chip${filter === f ? ' active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="date"
              className="input"
              style={{ width: 160, padding: '8px 10px', fontSize: '0.85rem' }}
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              aria-label="Filter by date"
            />
            {dateFilter && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setDateFilter('')}
              >
                Clear
              </button>
            )}
          </div>
          <span className="muted" style={{ fontSize: '0.85rem' }}>
            {filtered.length} appointment{filtered.length === 1 ? '' : 's'}
          </span>
        </div>

        {loading ? (
          <div className="empty-state">
            <div className="spinner" />
            <p>Loading appointments…</p>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="📭"
            title="No appointments found"
            text={
              filter === 'all'
                ? 'Booking requests from your website will appear here.'
                : `No ${filter} appointments.`
            }
          />
        ) : (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Service</th>
                  <th>Date &amp; time</th>
                  <th>Notes</th>
                  <th>Status</th>
                  <th>Change status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <div className="cell-main">{a.full_name}</div>
                      <div className="cell-sub">{a.email}</div>
                      <div className="cell-sub">{a.phone}</div>
                    </td>
                    <td>{a.services?.name ?? '—'}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div className="cell-main">{fmtDate(a.appointment_date)}</div>
                      <div className="cell-sub">
                        {a.start_time.slice(0, 5)} – {a.end_time.slice(0, 5)}
                      </div>
                    </td>
                    <td style={{ maxWidth: 220 }}>
                      <div className="cell-sub" title={a.notes ?? ''}>
                        {a.notes ? (a.notes.length > 60 ? a.notes.slice(0, 60) + '…' : a.notes) : '—'}
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={a.status} />
                    </td>
                    <td>
                      <select
                        className="select"
                        style={{ width: 140, padding: '8px 10px', fontSize: '0.85rem' }}
                        value={a.status}
                        disabled={updating === a.id}
                        onChange={(e) => updateStatus(a.id, e.target.value as AppointmentStatus)}
                        aria-label={`Change status for ${a.full_name}`}
                      >
                        {APPOINTMENT_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
