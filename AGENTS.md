# AGENTS.md — MeetPilot engineering guide

## Purpose

MeetPilot is a scheduling workspace for independent professionals. It provides a
public booking page, a host dashboard, an appointment API, and the database
contract needed to make booking concurrency-safe.

Use this file as the working agreement for any agent or contributor changing
this repository. Keep changes small, purposeful, and aligned with the product
and data-safety rules below.

## Product we are building

MeetPilot is a polished scheduling workspace for independent professionals:
consultants, coaches, freelancers, and small service businesses. A host sets
their availability and meeting types, shares a booking link, and lets invitees
book a time without the back-and-forth of email.

The product should feel calm, credible, and quick to use. A visitor must be
able to understand the meeting, choose a valid local-time slot, enter their
details, and receive a confirmation. A host must be able to manage the working
hours, meeting types, calendar, and booking page from one workspace.

### Primary users

| User | Goal | Main surfaces |
| --- | --- | --- |
| Host | Offer time, prevent conflicts, and manage their schedule | Dashboard, event types, availability, calendar, booking-page settings |
| Invitee | Book the right meeting at a convenient time | Public `/book/[slug]` page, confirmation, cancellation/reschedule links |
| Operator | Keep the service secure, reliable, and supportable | Supabase, migrations, logs, notifications, and operational tooling |

### Core user journey

1. A host signs up with Supabase Auth and receives an application profile.
2. The host creates a public booking page, event types, availability rules, and
   optional exceptions to their regular hours.
3. The host shares their `/book/[slug]` link.
4. The invitee sees only slots that meet the event duration, buffers, minimum
   notice, host availability, and connected-calendar busy time.
5. The invitee submits their name, email, time zone, and optional note.
6. MeetPilot atomically creates the appointment and notification jobs. The
   database rejects any concurrent overlapping confirmed appointment.
7. The host and invitee receive confirmation; the provider calendar event is
   created or synced. Secure links let the invitee cancel or reschedule.

### Product scope

**Foundation now**

- Supabase Auth, profiles, RLS, and tenant-safe host data.
- Supabase SQL migrations for the scheduling data model.
- Public booking pages, host dashboard, event types, availability, and a
  validated booking API.
- Accurate scheduling logic with UTC persistence and local-time display.
- Atomic booking writes, conflict protection, and queued notifications.

**Next integrations**

- Supabase Auth screens and middleware for protected host routes.
- Data-backed booking pages and dashboards, replacing the scaffold's sample
  slots, sample appointments, and placeholder event-type ID.
- Availability service combining weekly rules, date overrides, and calendar
  free/busy data with DST-aware conversion.
- Inngest and Resend for durable, idempotent confirmation delivery.
- Google Calendar first, then Outlook, using encrypted refresh tokens.
- Cancellation and rescheduling flows that safely release or replace slots.

**Before production launch**

- Rate limiting and abuse protection on public booking routes.
- Audit events, monitoring/error reporting, analytics, and support/policy pages.
- Accessible, keyboard-tested booking flows and end-to-end coverage for the
  critical sign-up, availability, booking, cancellation, and rescheduling paths.

### Product boundaries

- MeetPilot is a scheduling product, not a general-purpose CRM, video
  conferencing service, or payment processor.
- Calendar providers are sources of busy time and destinations for confirmed
  events; they must not become a route for exposing private provider data.
- A fast-looking UI must never show a bookable slot that bypasses the final
  database conflict safeguard.
- Product convenience never overrides tenancy, authentication, RLS, or secret
  handling requirements.

### Definition of a working booking flow

A booking flow is complete only when it:

1. Uses real Supabase-backed host, event-type, and availability data.
2. Displays times in the invitee's IANA time zone while persisting UTC instants.
3. Revalidates availability immediately before the atomic database write.
4. Returns a clear conflict response when a slot is taken concurrently.
5. Creates idempotent notification work for both host and invitee.
6. Does not expose service-role credentials, provider tokens, private calendar
   details, or another host's data.

## Stack and layout

- Next.js 15 (App Router), React 19, TypeScript (strict), and Tailwind CSS.
- Supabase for Auth, PostgreSQL, Row Level Security (RLS), and SQL migrations.
- Vitest covers pure scheduling logic.

| Location | Responsibility |
| --- | --- |
| `app/` | Pages, layouts, global styles, and route handlers |
| `app/api/bookings/route.ts` | Public booking request validation and persistence |
| `components/` | Reusable booking and dashboard UI |
| `lib/supabase/` | Server-only Supabase clients |
| `lib/scheduling/` | Pure availability/slot-generation logic and unit tests |
| `supabase/migrations/` | Versioned SQL migrations, including booking-overlap protection |
| `emails/` | Transactional email templates |
| `scripts/` | Local development helpers |

## Commands

Use npm; `package-lock.json` is the dependency lockfile.

```bash
npm install          # install dependencies
npm run dev          # start local development
npm run test         # run Vitest tests once
npm run test:watch   # run Vitest in watch mode
npm run build        # production build and type validation
```

Run the smallest relevant check after a change. At minimum, run `npm run test`
for scheduling changes and `npm run build` for cross-cutting, route, or UI
changes. State any check you could not run and why.

## TypeScript and React conventions

- Keep TypeScript strict; do not introduce `any`, suppress errors, or weaken
  `tsconfig.json` just to make a build pass.
- Use the `@/*` import alias for cross-folder imports.
- Default to Server Components. Add `"use client"` only where browser state,
  effects, or event handlers are needed.
- Keep browser-only dependencies and secrets out of server modules, and keep
  server-only dependencies out of client components.
- Prefer small components with explicit props. Keep scheduling/domain logic in
  `lib/` rather than burying it in a page or component.
- Preserve accessible semantics: real labels, keyboard-operable controls,
  focus-visible states, and `role="alert"` for surfaced form errors.
- Preserve responsive behavior and follow the existing Tailwind styling
  patterns. Avoid introducing a component library for one-off UI work.

## API and validation

- Route handlers must validate untrusted input with Zod before using it.
- Return stable, user-safe messages; do not expose database errors, tokens, or
  internal implementation details in HTTP responses.
- Use appropriate status codes: `400` invalid input, `404` unavailable
  resources, `409` stale/conflicting booking requests, and `503` missing
  required service configuration.
- Perform related booking writes inside one database transaction.
- Treat public routes as abuse-prone: preserve or add rate limiting and avoid
  costly work before validation when implementing production wiring.

## Scheduling invariants

These rules are product-critical. Do not weaken them without explicit approval.

- Persist appointment instants as PostgreSQL `timestamptz` values (UTC).
- Retain the invitee's IANA time-zone name separately for display and email.
- Convert host-local availability and DST-sensitive wall-clock times at the
  application boundary. `generateSlots` accepts already-UTC intervals.
- Account for duration, minimum notice, buffer-before, and buffer-after when
  offering a slot. Buffer time protects availability but is not part of the
  invitee-facing duration.
- Re-check availability immediately before inserting an appointment.
- The PostgreSQL exclusion constraint in `supabase/migrations/` is the
  final concurrency safeguard. A conflict with SQLSTATE `23P01` must become a
  user-facing `409` response, never a successful double booking.
- Cancelled appointments must no longer block their prior time. Do not change
  booking status semantics casually.

When changing `lib/scheduling/slots.ts`, add or update focused tests for the
affected edge cases (notice, buffers, boundaries, overlaps, and time handling).

## Database and migrations

- Treat `supabase/migrations/` as the schema source of truth. Add a new,
  timestamped SQL migration for every persistent schema change and review it
  before committing.
- Regenerate `lib/supabase/database.types.ts` with `npm run db:types` after
  applying a schema change, once the project is linked.
- Migrations can affect production data. Do not apply migrations, delete data,
  or run destructive database commands unless the task explicitly asks for it.
- Preserve foreign keys, indexes, unique constraints, and the appointment
  overlap constraint unless a deliberate migration replaces them.
- Treat `updated_at` handling and database defaults as part of the data
  contract; avoid silent schema drift.

## Security and configuration

- Never commit secrets or copy values from `.env.local` into source, tests,
  logs, screenshots, or messages. Document new variables in `.env.example`.
- `NEXT_PUBLIC_*` variables are exposed to the browser. Never put service-role
  keys, database credentials, token-encryption keys, or provider tokens there.
- Calendar refresh tokens must be encrypted with `TOKEN_ENCRYPTION_KEY` before
  being stored. Do not log decrypted credentials or provider responses that
  contain secrets.
- Keep authorization and tenancy checks server-side. Supabase Auth users map
  to `public.users`; preserve RLS policies and query or mutate only records
  belonging to the authenticated host.

## Repository hygiene

- Preserve existing user changes and avoid unrelated refactors.
- Do not edit generated or machine-local output: `.next/`, `node_modules/`,
  `coverage/`, `*.log`, or `*.tsbuildinfo`.
- Do not alter lockfiles unless dependencies genuinely change.
- Favor clear names and small, reviewable diffs over clever abstractions.
- Update `README.md` when a user-facing workflow, setup requirement, or
  architecture decision changes.

## Completion checklist

Before handing off a change:

1. Inspect the diff for unrelated edits and accidental secrets.
2. Add or update tests when behavior changes, especially booking or scheduling behavior.
3. Run the relevant validation command(s).
4. Briefly report the files changed, checks run, and any remaining limitation or manual follow-up.
