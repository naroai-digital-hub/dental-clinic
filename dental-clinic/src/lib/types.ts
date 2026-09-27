export interface Service {
  id: string
  name: string
  description: string | null
  duration_minutes: number
  price: number
  is_active: boolean
  created_at: string
}

export interface Appointment {
  id: string
  full_name: string
  email: string
  phone: string
  service_id: string | null
  appointment_date: string // YYYY-MM-DD
  start_time: string // HH:MM:SS
  end_time: string // HH:MM:SS
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  notes: string | null
  created_at: string
  services?: { name: string } | null
}

export interface BusinessHour {
  id: string
  weekday: number // 0 = Sunday ... 6 = Saturday
  is_open: boolean
  start_time: string // HH:MM:SS
  end_time: string // HH:MM:SS
}

export interface BlockedDate {
  id: string
  blocked_date: string // YYYY-MM-DD
  reason: string | null
  created_at: string
}

export interface ClinicSettings {
  id: string
  clinic_name: string
  clinic_email: string | null
  clinic_phone: string | null
  clinic_address: string | null
  slot_interval_minutes: number
  booking_notice_hours: number
  created_at: string
}

export interface AdminUser {
  id: string
  user_id: string
  created_at: string
}

export type AppointmentStatus = Appointment['status']

export const APPOINTMENT_STATUSES: AppointmentStatus[] = [
  'pending',
  'confirmed',
  'cancelled',
  'completed',
]

export const WEEKDAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]
