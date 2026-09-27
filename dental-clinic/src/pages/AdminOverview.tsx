import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { toLocalDateString } from '../lib/availability'
import { MetricCard, PageHead, StatusBadge, EmptyState } from '../components/admin/ui'
import type { Appointment } from '../lib/types'

export default function AdminOverview() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    supabase
      .from('appointments')
      .select('*, services(name)')
      .order('appointment_date', { ascending: true })
      .order('start_time', { ascending: true })
      .then(({ data, error }) => {
        if (!mounted) return
        if (!error) setAppointments(data as Appointment[])
        setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  const todayKey = toLocalDateString(new Date())
  const todayAppointments = appointments.filter((a) => a.appointment_date === todayKey)
  const pending = appointments.filter((a) => a.status === 'pending')
  const upcomingConfirmed = appointments.filter(
    (a) => a.status === 'confirmed' && a.appointment_date >= todayKey
  )
  const completed = appointments.filter((a) => a.status === 'completed')

  const upcomingList = [...appointments]
    .filter(
      (a) =>
        (a.status === 'pending' || a.status === 'confirmed') &&
        a.appointment_date >= todayKey
    )
    .sort((a, b) =>
      (a.appointment_date + a.start_time).localeCompare(b.appointment_date + b.start_time)
    )
    .slice(0, 8)

  const fmtDate = (iso: string) => {
    const [y, m, d] = iso.split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }
  const fmtTime = (t: string) => t.slice(0, 5)

  return (
    <>
      <PageHead
        title="Overview"
        sub="A live snapshot of your clinic's schedule and services."
        actions={
          <Link to="/admin/appointments" className="btn btn-primary btn-sm">
            View all appointments
          </Link>
        }
      />

      {loading ? (
        <div className="empty-state">
          <div className="spinner" />
          <p>Loading dashboard…</p>
        </div>
      ) : (
        <>
          <div className="metrics">
            <MetricCard
              icon="📅"
              value={todayAppointments.length}
              label="Today's appointments"
              color="linear-gradient(90deg, #0d9488, #06b6d4)"
            />
            <MetricCard
              icon="⏳"
              value={pending.length}
              label="Pending requests"
              color="linear-gradient(90deg, #f59e0b, #fbbf24)"
            />
            <MetricCard
              icon="🚀"
              value={upcomingConfirmed.length}
              label="Upcoming confirmed"
              color="linear-gradient(90deg, #6366f1, #06b6d4)"
            />
            <MetricCard
              icon="✅"
              value={completed.length}
              label="Completed visits"
              color="linear-gradient(90deg, #10b981, #34d399)"
            />
          </div>

          <div className="panel">
            <div className="panel-head">
              <h2>Upcoming appointments</h2>
              <Link to="/admin/appointments" className="btn btn-ghost btn-sm">
                Manage →
              </Link>
            </div>
            {upcomingList.length === 0 ? (
              <EmptyState
                icon="🗓️"
                title="No upcoming appointments"
                text="New booking requests will appear here."
              />
            ) : (
              <div className="table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Service</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcomingList.map((a) => (
                      <tr key={a.id}>
                        <td>
                          <div className="cell-main">{a.full_name}</div>
                          <div className="cell-sub">{a.phone}</div>
                        </td>
                        <td>{a.services?.name ?? '—'}</td>
                        <td>{fmtDate(a.appointment_date)}</td>
                        <td>
                          {fmtTime(a.start_time)} – {fmtTime(a.end_time)}
                        </td>
                        <td>
                          <StatusBadge status={a.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {pending.length > 0 && (
            <div className="panel">
              <div className="panel-head">
                <h2>Needs your attention — {pending.length} pending</h2>
                <Link to="/admin/appointments" className="btn btn-ghost btn-sm">
                  Review →
                </Link>
              </div>
              <div className="panel-body" style={{ paddingTop: 16 }}>
                {pending.slice(0, 5).map((a) => (
                  <div
                    key={a.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 0',
                      borderBottom: '1px solid var(--slate-100)',
                    }}
                  >
                    <div>
                      <div className="cell-main">{a.full_name}</div>
                      <div className="cell-sub">
                        {a.services?.name ?? 'Service'} · {fmtDate(a.appointment_date)} ·{' '}
                        {fmtTime(a.start_time)}
                      </div>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </>
  )
}
