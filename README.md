# Astrape

Next.js (App Router) + TypeScript + Tailwind + Supabase.

## Run it locally

```
npm install
cp .env.local.example .env.local   # then fill in your real Supabase URL + anon key
npm run dev
```

Open http://localhost:3000

## Wire up the contact form

The form on `/contact` inserts a row into a `contact_submissions` table via
Supabase. In your Supabase project's SQL editor, run:

```sql
create table contact_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  business text,
  email text not null,
  site text,
  message text not null,
  created_at timestamptz default now()
);

alter table contact_submissions enable row level security;

create policy "Anyone can submit"
  on contact_submissions for insert
  to anon
  with check (true);
```

That policy allows anonymous inserts (so the public form works) but not
reads — you'll read submissions from the Supabase dashboard, or from a
future logged-in admin view.

Then put your project's URL and anon key into `.env.local` (see
`.env.local.example`).

## Deploy

Push this to a GitHub repo, then import it in Vercel. Add the two
`NEXT_PUBLIC_SUPABASE_*` env vars in the Vercel project settings
(same values as `.env.local`). Vercel builds and deploys automatically
from there.

## Structure

- `app/` — one folder per page (route), App Router style
- `components/Nav.tsx` / `Footer.tsx` — shared across the plain pages
- `components/LightningHero.tsx` — the homepage's animated intro + hero,
  a client component (it needs the browser canvas API)
- `components/ContactForm.tsx` — the contact form, a client component
- `lib/supabase.ts` — the Supabase browser client

## Notes

- The homepage intro plays once per browser tab (via `sessionStorage`).
  Open a new tab, or clear session storage, to see it replay while testing.
- Reduced-motion is respected — visitors with that OS setting skip
  straight to the finished state, no flashing.
- There's an "Effects on/off" toggle in the homepage nav for anyone who'd
  rather turn the lightning off entirely.
