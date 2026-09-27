-- ============================================================
-- Dental Clinic Booking Platform — Supabase schema
-- Run this in the Supabase SQL editor (or via the CLI).
-- ============================================================

-- ---------- Tables ----------

create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  duration_minutes integer not null default 30,
  price numeric not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text not null,
  service_id uuid references services(id) on delete set null,
  appointment_date date not null,
  start_time time not null,
  end_time time not null,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists business_hours (
  id uuid primary key default gen_random_uuid(),
  weekday integer not null unique check (weekday between 0 and 6),
  is_open boolean not null default true,
  start_time time not null default '09:00',
  end_time time not null default '17:00'
);

create table if not exists blocked_dates (
  id uuid primary key default gen_random_uuid(),
  blocked_date date not null unique,
  reason text,
  created_at timestamptz not null default now()
);

create table if not exists clinic_settings (
  id uuid primary key default gen_random_uuid(),
  clinic_name text not null default 'Bright Smile Dental Clinic',
  clinic_email text,
  clinic_phone text,
  clinic_address text,
  slot_interval_minutes integer not null default 30,
  booking_notice_hours integer not null default 2,
  created_at timestamptz not null default now()
);

create table if not exists admin_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  created_at timestamptz not null default now()
);

-- ---------- Seed data ----------

insert into business_hours (weekday, is_open, start_time, end_time) values
  (0, false, '09:00', '17:00'),
  (1, true,  '09:00', '17:00'),
  (2, true,  '09:00', '17:00'),
  (3, true,  '09:00', '17:00'),
  (4, true,  '09:00', '17:00'),
  (5, true,  '09:00', '17:00'),
  (6, true,  '09:00', '13:00')
on conflict (weekday) do nothing;

insert into clinic_settings
  (clinic_name, clinic_email, clinic_phone, clinic_address, slot_interval_minutes, booking_notice_hours)
values
  ('Bright Smile Dental Clinic', 'hello@brightsmiledental.com', '+1 (555) 234-5678',
   '123 Wellness Avenue, Springfield', 30, 2)
on conflict do nothing;

insert into services (name, description, duration_minutes, price, is_active) values
  ('Dental Checkup',
   'A complete oral health examination including digital X-rays review, gum health assessment, and a personalized care plan from your dentist.',
   30, 49, true),
  ('Professional Teeth Cleaning',
   'Gentle scaling and polishing to remove plaque and tartar, leaving your teeth smooth, fresh, and healthy.',
   45, 89, true),
  ('Teeth Whitening',
   'Professional in-office whitening treatment for a naturally brighter smile, performed safely under dental supervision.',
   60, 199, true),
  ('Tooth Filling',
   'Tooth-colored composite fillings that repair cavities and restore your tooth''s natural look and strength.',
   45, 129, true),
  ('Emergency Consultation',
   'Same-day priority assessment for toothache, chipped teeth, or urgent dental concerns. We will relieve your discomfort first.',
   30, 59, true),
  ('Cosmetic Smile Consultation',
   'A one-on-one consultation with our cosmetic dentist to explore veneers, bonding, and smile design options tailored to you.',
   45, 0, true)
on conflict do nothing;

-- ---------- Row Level Security ----------

alter table services enable row level security;
alter table appointments enable row level security;
alter table business_hours enable row level security;
alter table blocked_dates enable row level security;
alter table clinic_settings enable row level security;
alter table admin_users enable row level security;

-- Public (anon) read access for booking flow
create policy "anon read active services"
  on services for select to anon using (true);

create policy "anon read business hours"
  on business_hours for select to anon using (true);

create policy "anon read blocked dates"
  on blocked_dates for select to anon using (true);

create policy "anon read clinic settings"
  on clinic_settings for select to anon using (true);

-- Anon can read upcoming appointments to compute availability,
-- and can insert new appointment requests.
-- NOTE: for a production clinic, tighten this (e.g. a SECURITY DEFINER
-- RPC that returns only occupied time ranges) so patient details
-- are not publicly readable.
create policy "anon read appointments for availability"
  on appointments for select to anon using (true);

create policy "anon insert appointments"
  on appointments for insert to anon with check (true);

-- Authenticated users (the signed-in admin via the anon key) get full access
create policy "authenticated full access services"
  on services for all to authenticated using (true) with check (true);

create policy "authenticated full access appointments"
  on appointments for all to authenticated using (true) with check (true);

create policy "authenticated full access business_hours"
  on business_hours for all to authenticated using (true) with check (true);

create policy "authenticated full access blocked_dates"
  on blocked_dates for all to authenticated using (true) with check (true);

create policy "authenticated full access clinic_settings"
  on clinic_settings for all to authenticated using (true) with check (true);

-- Admin users table: readable by authenticated users so the app can
-- verify admin access via admin_users.user_id
create policy "authenticated read admin_users"
  on admin_users for select to authenticated using (true);

-- Helpful indexes
create index if not exists idx_appointments_date
  on appointments (appointment_date);
create index if not exists idx_appointments_service
  on appointments (service_id);
create index if not exists idx_admin_users_user_id
  on admin_users (user_id);
