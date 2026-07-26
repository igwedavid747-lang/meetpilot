# MeetPilot contributor instructions

## Project

MeetPilot is a Next.js 15 application using React 19, TypeScript, Tailwind CSS,
and Supabase.

## Working conventions

- Keep changes focused and preserve existing user changes.
- Use TypeScript and follow the existing patterns in `app/`, `components/`, and `lib/`.
- Do not commit secrets or edit local `.env` files. Use `.env.example` when documenting required variables.
- Do not modify generated output or local logs, including `.next/`, `node_modules/`, and `*.log` files.
- Prefer small, accessible UI changes and preserve responsive behavior.

## Validation

Run the smallest relevant check after a change:

```bash
npm run test
npm run build
```

Use `npm run dev` for local development. If a check cannot run, state why in the handoff.

## Database

- Treat `supabase/migrations/` as the schema source of truth and add a migration for each persistent schema change.
- Treat migrations as production-impacting; review them carefully before applying.
- Do not run database-changing commands unless the task explicitly requires it.
