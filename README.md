# MeetPilot

MeetPilot is a Next.js scheduling workspace for independent professionals. This starter is based on the supplied PRD and provides the core user-facing flows plus a production-oriented database contract.

## Included in this scaffold

- Public, responsive booking page at `/book/alex-morgan` with local-time display and client-side confirmation state.
- Host workspace with overview, visual week calendar, availability controls, and event-type management.
- Supabase/PostgreSQL schema and versioned migration for users, booking pages, event types, availability, connections, appointments, and notifications.
- A Supabase migration containing a PostgreSQL exclusion constraint that prevents concurrent overlapping confirmed appointments per host.
- Slot-generation utility with coverage for minimum notice and buffers.
- Validated booking endpoint that creates an appointment and idempotent notification rows in one transaction.
- A React Email-compatible confirmation template and clearly marked hooks for Inngest, Resend, and calendar providers.

## Get started

1. Install Node.js 20.9+ and the [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started).
2. Create or link a Supabase project, then copy `.env.example` to `.env.local` and set the Supabase URL, anon key, and server-only service-role key.
3. Install packages with `npm install`.
4. Apply [`supabase/migrations/20260723000000_initial_schema.sql`](supabase/migrations/20260723000000_initial_schema.sql) using `npm run db:reset` locally or `npm run db:push` for a linked project.
5. Run `npm run dev`, then open `http://localhost:3000`.

## Important wiring still required before launch

The visual scaffold intentionally uses a sample profile (`alex-morgan`) and displayed sample slots. Replace these with data-backed queries and complete the following integrations:

1. **Authentication and tenancy:** add Supabase Auth middleware, associate `users.id` with `auth.users.id`, and apply the RLS policies described in the PRD.
2. **Availability:** fetch rules and overrides, convert host-local working windows to UTC with a DST-aware library, read busy blocks through the provider interface, and feed those intervals to `generateSlots`.
3. **Booking endpoint:** call that availability service immediately before insert. The exclusion constraint remains the final race-condition safeguard.
4. **Notifications:** use Inngest to consume queued notification rows, render the email template, send through Resend using a deterministic idempotency key, and record retry state.
5. **Calendar connections:** encrypt refresh tokens using `TOKEN_ENCRYPTION_KEY`; implement Google free/busy + event creation first, then Outlook behind the same provider interface.
6. **Operational hardening:** rate limit the public endpoint, add secure cancellation/rescheduling routes, audit events, Sentry/PostHog, Playwright coverage, accessibility review, and policy/support pages.

## Project map

```text
app/                    Pages and route handlers
components/             Reusable host and invitee UI
lib/supabase/           Server-only Supabase clients
lib/scheduling/         Pure scheduling logic and tests
supabase/migrations/    Versioned PostgreSQL schema migrations
emails/                 Transactional email components
```

## Design decisions

Times are persisted as `timestamptz` (UTC) while each invitee time zone is retained. Booking status is part of the overlap constraint, so cancelled appointments free their former times. The migration enables RLS and creates application profiles from Supabase Auth users. Provider secrets do not belong in the browser or database plaintext; calendar tokens must be encrypted before insert.
