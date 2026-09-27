import type { Appointment, BlockedDate, BusinessHour } from './types'

export interface Slot {
  start: Date
  end: Date
  label: string
}

export interface GenerateSlotsOptions {
  /** The selected day (time portion is ignored). */
  date: Date
  businessHours: BusinessHour[]
  /** Duration of the selected service in minutes. */
  durationMinutes: number
  slotIntervalMinutes: number
  bookingNoticeHours: number
  blockedDates: BlockedDate[]
  /** Existing appointments for the selected date (any status except cancelled is blocking). */
  appointments: Pick<Appointment, 'start_time' | 'end_time' | 'status'>[]
  /** Defaults to now. Inject for tests. */
  now?: Date
}

/** "2026-09-27" in local time. */
export function toLocalDateString(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Parse "HH:MM:SS" (or "HH:MM") into [hours, minutes]. */
function parseTime(t: string): [number, number] {
  const [h = '0', m = '0'] = t.split(':')
  return [parseInt(h, 10), parseInt(m, 10)]
}

/** Combine a calendar date with a "HH:MM:SS" time into a real local Date. */
export function combineDateAndTime(date: Date, time: string): Date {
  const [h, m] = parseTime(time)
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, m, 0, 0)
}

/** Format a Date as "HH:MM:SS" for Supabase time columns. */
export function toTimeString(d: Date): string {
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${h}:${m}:00`
}

function formatLabel(d: Date): string {
  let h = d.getHours()
  const m = d.getMinutes()
  const ampm = h >= 12 ? 'PM' : 'AM'
  h = h % 12
  if (h === 0) h = 12
  return `${h}:${String(m).padStart(2, '0')} ${ampm}`
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && aEnd > bStart
}

export function generateSlots(opts: GenerateSlotsOptions): Slot[] {
  try {
    const {
      date,
      businessHours,
      durationMinutes,
      slotIntervalMinutes,
      bookingNoticeHours,
      blockedDates,
      appointments,
    } = opts
    const now = opts.now ?? new Date()

    // ---- Required inputs guard (do not calculate if missing/invalid) ----
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      console.error('Slot generation skipped: selectedDate is missing or invalid.')
      return []
    }
    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
      console.error('Slot generation skipped: service duration_minutes is missing or invalid.')
      return []
    }
    if (!Array.isArray(businessHours) || !Array.isArray(blockedDates) || !Array.isArray(appointments)) {
      console.error('Slot generation skipped: business_hours / blocked_dates / appointments not loaded.')
      return []
    }

    const dayKey = toLocalDateString(date)

    // Blocked date? (blocked_dates.blocked_date)
    if (blockedDates.some((b) => b.blocked_date === dayKey)) return []

    // Open on this weekday? (business_hours.weekday / is_open / start_time / end_time)
    const hours = businessHours.find((h) => h.weekday === date.getDay())
    if (!hours || !hours.is_open) return []

    const openAt = combineDateAndTime(date, hours.start_time)
    const closeAt = combineDateAndTime(date, hours.end_time)
    if (!(openAt instanceof Date) || isNaN(openAt.getTime())) {
      console.error('Slot generation failed: business_hours.start_time is invalid:', hours.start_time)
      return []
    }
    if (!(closeAt instanceof Date) || isNaN(closeAt.getTime())) {
      console.error('Slot generation failed: business_hours.end_time is invalid:', hours.end_time)
      return []
    }
    if (closeAt <= openAt) {
      console.error('Slot generation failed: business_hours end_time is not after start_time.')
      return []
    }

    const earliest = new Date(now.getTime() + bookingNoticeHours * 60 * 60 * 1000)

    const step = Math.max(5, slotIntervalMinutes)
    const durationMs = Math.max(5, durationMinutes) * 60 * 1000

    // Normalize existing appointments for this date into Date ranges.
    // Only appointments.status !== 'cancelled' block slots.
    // Overlap rule: new_start < existing_end AND new_end > existing_start
    const busy = appointments
      .filter((a) => a.status !== 'cancelled')
      .map((a) => ({
        start: combineDateAndTime(date, a.start_time),
        end: combineDateAndTime(date, a.end_time),
      }))
      .filter((r) => !isNaN(r.start.getTime()) && !isNaN(r.end.getTime()))

    const slots: Slot[] = []
    const cursor = new Date(openAt.getTime())

    while (cursor.getTime() + durationMs <= closeAt.getTime()) {
      const slotStart = new Date(cursor.getTime())
      const slotEnd = new Date(cursor.getTime() + durationMs)

      const afterNotice = slotStart >= earliest
      const free = !busy.some((b) => overlaps(slotStart, slotEnd, b.start, b.end))

      if (afterNotice && free) {
        slots.push({ start: slotStart, end: slotEnd, label: formatLabel(slotStart) })
      }
      cursor.setMinutes(cursor.getMinutes() + step)
    }

    return slots
  } catch (err) {
    console.error('Slot generation failed:', err instanceof Error ? err.message : err)
    return []
  }
}

/** True when a day can accept bookings (open + not blocked + not in the past). */
export function isBookableDay(
  date: Date,
  businessHours: BusinessHour[],
  blockedDates: BlockedDate[],
  now: Date = new Date()
): boolean {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  if (day < today) return false
  if (blockedDates.some((b) => b.blocked_date === toLocalDateString(day))) return false
  const hours = businessHours.find((h) => h.weekday === day.getDay())
  return !!hours?.is_open
}
