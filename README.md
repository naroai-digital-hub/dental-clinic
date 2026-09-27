# Bright Smile Dental Clinic — Booking Platform

A premium, production-ready dental clinic website with a real online booking
system and a secure admin dashboard.

**Stack:** React + TypeScript + Vite + Supabase (`@supabase/supabase-js`, `react-router-dom`)

---

## 1. Create the Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Open the **SQL Editor** in the Supabase dashboard.
3. Paste the entire contents of [`supabase/schema.sql`](supabase/schema.sql) and run it.

   This creates all tables (`services`, `appointments`, `business_hours`,
   `blocked_dates`, `clinic_settings`, `admin_users`), enables Row Level
   Security with public booking policies, and seeds:
   - 6 dental services (all active)
   - Business hours (Mon–Sat, Sun closed)
   - Default clinic settings

> **Security note:** the schema lets anonymous visitors read upcoming
> appointments so the booking calendar can compute free slots. For a live
> clinic, tighten this — e.g. replace it with a `SECURITY DEFINER` RPC that
> returns only occupied time ranges.

## 2. Create the admin user

1. In Supabase go to **Authentication → Users → Add user** and create a user
   (e.g. `admin@yourclinic.com`) with a strong password. Confirm the email.
2. Copy the new user's **UID**.
3. In the SQL Editor run:

   ```sql
   insert into admin_users (user_id) values ('PASTE_THE_UID_HERE');
   ```

Admin access is checked via `admin_users.user_id` against the authenticated
user's id — never by email.

## 3. Configure environment variables

Edit [`.env.local`](.env.local) and paste your project credentials
(**Project Settings → API**):

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-publishable-anon-key
```

> The app reads these via `import.meta.env` in `src/lib/supabase.ts`.
> Never hardcode keys in components.

## 4. Run the app

```bash
npm install
npm run dev
```

- Public website: http://localhost:5173/
- Admin login: http://localhost:5173/admin/login

## 5. Build for production

```bash
npm run build
```

The production bundle is emitted to `dist/`.

---

## Project structure

```
src/
  lib/
    supabase.ts      # Supabase client (env vars only)
    types.ts         # Shared DB types
    images.ts        # Curated dental imagery — swap URLs here to rebrand
    availability.ts  # Slot generation engine (business hours, blocked dates,
                     #   notice period, overlap detection)
  components/
    public/          # Navbar, Hero, ServicesSection, AboutSection,
                     # BookingSection (4-step flow), Footer
    admin/           # Sidebar, ProtectedRoute, shared UI (Modal, MetricCard…)
  pages/
    PublicHome.tsx
    AdminLogin.tsx
    AdminLayout.tsx
    AdminOverview.tsx / AdminAppointments.tsx / AdminServices.tsx
    AdminHours.tsx / AdminBlockedDates.tsx / AdminSettings.tsx
  App.tsx            # Routes: / , /admin/login , /admin/*
  index.css          # Premium design system (no CSS framework)
supabase/
  schema.sql         # Full database schema + RLS + seed data
```

## Booking & availability logic

`generateSlots()` in `src/lib/availability.ts`:

- Only generates slots inside `business_hours` for the selected weekday
- Skips `blocked_dates`
- Ignores `cancelled` appointments
- Enforces `clinic_settings.booking_notice_hours`
- Steps by `clinic_settings.slot_interval_minutes`
- Sizes each slot with the selected `services.duration_minutes`
- Overlap rule: `new_start < existing_end && new_end > existing_start`
- Dates/times are combined into real `Date` objects — never formatted strings —
  and stored as Supabase-compatible `date` / `time` values.
