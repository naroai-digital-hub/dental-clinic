import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Modal, PageHead, EmptyState } from '../components/admin/ui'
import type { Service } from '../lib/types'

interface ServiceForm {
  name: string
  description: string
  duration_minutes: number
  price: number
  is_active: boolean
}

const EMPTY_FORM: ServiceForm = {
  name: '',
  description: '',
  duration_minutes: 30,
  price: 0,
  is_active: true,
}

export default function AdminServices() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Service | null>(null)
  const [form, setForm] = useState<ServiceForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<Service | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const load = async () => {
    setLoading(true)
    const { data, error: err } = await supabase
      .from('services')
      .select('*')
      .order('name')
    if (!err) setServices((data ?? []) as Service[])
    else setError(err.message)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const openAdd = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setError(null)
    setModalOpen(true)
  }

  const openEdit = (s: Service) => {
    setEditing(s)
    setForm({
      name: s.name,
      description: s.description ?? '',
      duration_minutes: s.duration_minutes,
      price: Number(s.price),
      is_active: s.is_active,
    })
    setError(null)
    setModalOpen(true)
  }

  const save = async () => {
    setError(null)
    if (!form.name.trim()) return setError('Service name is required.')
    if (form.duration_minutes < 5) return setError('Duration must be at least 5 minutes.')
    if (form.price < 0) return setError('Price cannot be negative.')

    setSaving(true)
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      duration_minutes: Math.round(form.duration_minutes),
      price: form.price,
      is_active: form.is_active,
    }

    if (editing) {
      const { error: err } = await supabase.from('services').update(payload).eq('id', editing.id)
      if (err) setError(err.message)
      else {
        setServices((prev) => prev.map((s) => (s.id === editing.id ? { ...s, ...payload, description: payload.description } : s)))
        setModalOpen(false)
      }
    } else {
      const { data, error: err } = await supabase.from('services').insert(payload).select().single()
      if (err) setError(err.message)
      else {
        setServices((prev) => [...prev, data as Service].sort((a, b) => a.name.localeCompare(b.name)))
        setModalOpen(false)
      }
    }
    setSaving(false)
  }

  const toggleActive = async (s: Service) => {
    setToggling(s.id)
    setError(null)
    const { error: err } = await supabase
      .from('services')
      .update({ is_active: !s.is_active })
      .eq('id', s.id)
    if (err) {
      setError(err.message)
    } else {
      setServices((prev) => prev.map((x) => (x.id === s.id ? { ...x, is_active: !x.is_active } : x)))
    }
    setToggling(null)
  }

  const confirmDelete = async () => {
    if (!deleting) return
    setDeleteBusy(true)
    setError(null)
    const { error: err } = await supabase.from('services').delete().eq('id', deleting.id)
    setDeleteBusy(false)
    if (err) {
      // Likely blocked by appointments referencing this service
      setError(
        err.message.includes('foreign key') || err.message.includes('violates')
          ? `Cannot delete "${deleting.name}" because existing appointments reference it. Deactivate it instead.`
          : err.message
      )
      setDeleting(null)
      return
    }
    setServices((prev) => prev.filter((s) => s.id !== deleting.id))
    setDeleting(null)
  }

  const set = <K extends keyof ServiceForm>(key: K, value: ServiceForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  return (
    <>
      <PageHead
        title="Services"
        sub="Add, edit, activate or deactivate treatments. Active services appear on the booking page instantly."
        actions={
          <button className="btn btn-primary btn-sm" onClick={openAdd}>
            + Add service
          </button>
        }
      />

      {error && !modalOpen && <div className="form-error">{error}</div>}

      <div className="panel">
        {loading ? (
          <div className="empty-state">
            <div className="spinner" />
            <p>Loading services…</p>
          </div>
        ) : services.length === 0 ? (
          <EmptyState
            icon="🦷"
            title="No services yet"
            text="Add your first treatment to start accepting online bookings."
          />
        ) : (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Duration</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {services.map((s) => (
                  <tr key={s.id} style={{ opacity: s.is_active ? 1 : 0.62 }}>
                    <td>
                      <div className="cell-main">{s.name}</div>
                      <div className="cell-sub" style={{ maxWidth: 380 }}>
                        {s.description ?? '—'}
                      </div>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>{s.duration_minutes} min</td>
                    <td style={{ whiteSpace: 'nowrap', fontWeight: 700 }}>
                      {Number(s.price) > 0 ? `$${Number(s.price)}` : 'Free'}
                    </td>
                    <td>
                      <span className={`badge badge-${s.is_active ? 'active' : 'inactive'}`}>
                        {s.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button className="icon-btn" onClick={() => openEdit(s)}>
                          Edit
                        </button>
                        <button
                          className="icon-btn"
                          disabled={toggling === s.id}
                          onClick={() => toggleActive(s)}
                        >
                          {s.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          className="icon-btn danger"
                          onClick={() => setDeleting(s)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <Modal
          title={editing ? 'Edit service' : 'Add new service'}
          onClose={() => setModalOpen(false)}
          footer={
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => setModalOpen(false)} disabled={saving}>
                Cancel
              </button>
              <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>
                {saving ? 'Saving…' : editing ? 'Save changes' : 'Add service'}
              </button>
            </>
          }
        >
          {error && <div className="form-error">{error}</div>}
          <div className="field">
            <label htmlFor="svc-name">Service name *</label>
            <input
              id="svc-name"
              className="input"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="e.g. Professional Teeth Cleaning"
            />
          </div>
          <div className="field">
            <label htmlFor="svc-desc">Description</label>
            <textarea
              id="svc-desc"
              className="textarea"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="What does this treatment include?"
            />
          </div>
          <div className="form-grid-2">
            <div className="field">
              <label htmlFor="svc-duration">Duration (minutes) *</label>
              <input
                id="svc-duration"
                className="input"
                type="number"
                min={5}
                step={5}
                value={form.duration_minutes}
                onChange={(e) => set('duration_minutes', Number(e.target.value))}
              />
            </div>
            <div className="field">
              <label htmlFor="svc-price">Price (USD)</label>
              <input
                id="svc-price"
                className="input"
                type="number"
                min={0}
                step={1}
                value={form.price}
                onChange={(e) => set('price', Number(e.target.value))}
              />
              <span className="form-hint">Use 0 for a free consultation.</span>
            </div>
          </div>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => set('is_active', e.target.checked)}
            />
            Active — show on the public booking page
          </label>
        </Modal>
      )}

      {deleting && (
        <Modal
          title="Delete service"
          onClose={() => setDeleting(null)}
          footer={
            <>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setDeleting(null)}
                disabled={deleteBusy}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary btn-sm"
                style={{ background: '#dc2626' }}
                onClick={confirmDelete}
                disabled={deleteBusy}
              >
                {deleteBusy ? 'Deleting…' : 'Delete permanently'}
              </button>
            </>
          }
        >
          <p style={{ margin: '0 0 8px', color: '#334155' }}>
            Delete <b>{deleting.name}</b>? This cannot be undone.
          </p>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b' }}>
            If any appointments reference this service, the delete will be
            blocked — deactivate it instead to hide it from booking.
          </p>
        </Modal>
      )}
    </>
  )
}
