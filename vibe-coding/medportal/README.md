# MedPortal

MedPortal is a modern healthcare patient portal built with Next.js 14, the App Router, Prisma, PostgreSQL, shadcn/ui components, and Tailwind CSS. It includes authentication via NextAuth.js, role-specific dashboards, notifications, secure messaging, and CRUD-ready API routes for the entire clinical data model.

## Getting started

1. Install dependencies:
   ```bash
   pnpm install
   # or npm/yarn
   ```
2. Copy environment variables and point to a Postgres database:
   ```bash
   cp .env.example .env
   ```
   Be sure to set `DATABASE_URL`, `NEXTAUTH_URL`, and `NEXTAUTH_SECRET`.
3. Generate Prisma client, apply the schema, and seed demo users for every role:
   ```bash
   npx prisma generate
   npx prisma db push
   npx prisma db seed
   ```
4. Start the dev server:
   ```bash
   pnpm dev
   ```

Visit `http://localhost:3000` for the marketing site and `http://localhost:3000/dashboard` for the authenticated portal. Sign in with any of the seeded credentials:

| Role | Email | Password |
| --- | --- | --- |
| Patient | `avery.johnson@medportal.com` | `patient123` |
| Doctor | `dr.patel@medportal.com` | `doctor123` |
| Nurse | `nurse.james@medportal.com` | `nurse123` |
| Lab Technician | `lab.snow@medportal.com` | `lab123` |
| Admin | `admin@medportal.com` | `admin123` |

## Platform highlights

- **NextAuth.js credentials** provider with middleware-protected dashboard routes, session-aware layouts, and role data surfaced via `getServerSession`.
- **Role-based dashboards** for Patients, Doctors, Nurses, Lab Technicians, and Admins covering booking, care plans, vitals, lab queues, referrals, and analytics.
- **Prisma ORM schema** for users, patients, staff, referrals, appointments (recurrence + waitlist), medical records, prescriptions + refills, vitals, lab orders/results with attachments, share links, audit logs, and bulk import jobs.
- **RESTful CRUD APIs** under `app/api/*` implementing role-guarded `GET/POST/PATCH/DELETE` handlers for legacy and advanced workflows.
- **Notifications + messaging** components so users receive appointment reminders, lab alerts, prescription updates, referral tasks, and secure chats.
- **shadcn/ui + Tailwind CSS** powering a cohesive blue/white medical design on landing, login, dashboards, and management utilities.

## Advanced workflows

1. **Referral system** – doctors create/share specialist referrals with tracked status in UI plus `/api/referrals`.
2. **Prescription refill workflow** – patients request refills, doctors approve/deny (with reasons) via `/api/refill-requests`.
3. **Lab uploads + release** – lab techs attach PDFs/images, doctors annotate and release results, patients see only released results (`/api/lab-results/upload`).
4. **Appointment enhancements** – recurring visits, waitlist + auto offers, reschedule requests, and blocked slots managed through `/api/appointments/*`.
5. **Medical record sharing** – patients issue expiring share links to summaries (`/api/share-links`).
6. **Audit log** – every sensitive access recorded and visible to admins (`/api/audit-logs` + dashboard card).
7. **Bulk import** – admins spin up CSV onboarding jobs with progress + error tracking (`/api/bulk-imports`).
8. **Global search** – role-aware search UI + API covering patients, doctors, and records with filters (`/api/search`).

Customize styles in `app/globals.css`, extend UI components in `components/`, or adjust mock UI data inside `lib/data.ts` while the Prisma layer handles persistence.
