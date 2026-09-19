# Fretwork

A personal guitar catalogue for recording, browsing, searching, and updating the instruments you own. Sign in with Supabase Auth; the catalogue lives in Postgres (with photos in Storage) so the same rack is available on every device.

**Hosting note:** [captainjacs.com](https://captainjacs.com) stays on Lodgify. Deploy this app on Vercel (or a future subdomain). Do not point the root domain at this project.

## Features

- Email/password and magic-link sign-in; unauthenticated visitors cannot see or change guitars
- Collection grid or list with photo (or placeholder), make, model, year, and type
- Add and edit forms covering identity, specs, purchase details, notes, and photos
- Detail view with the full record, photo gallery, edit, and delete
- Search across make, model, serial, and notes; filter by make and type
- Empty state that invites you to add the first guitar
- Delete confirmation
- Cloud persistence (Supabase). Optional one-time import from a previous IndexedDB copy in this browser

## Configure Supabase

The app talks to your existing project with the **anon** key only. Row Level Security keeps each signed-in user on their own rows. Never commit `.env` files or service role keys.

### 1. Apply the SQL

In the Supabase dashboard open **SQL Editor → New query**, paste the full contents of [`supabase/migrations/20260919120000_guitars_and_photos.sql`](supabase/migrations/20260919120000_guitars_and_photos.sql), and click **Run**.

That script creates:

- `public.guitars` with fields matching the app model, plus `user_id`
- RLS policies so authenticated users can only `SELECT` / `INSERT` / `UPDATE` / `DELETE` their own rows (`auth.uid() = user_id`)
- A private Storage bucket `guitar-photos` with matching policies (object paths start with `{user_id}/`)

If you use the Supabase CLI and the project is linked, you can instead run `supabase db push`.

### 2. Auth settings

Under **Authentication → Providers → Email**, enable Email. Password sign-in and magic links both work.

New projects often have **Confirm email** turned on. Until a user clicks the confirmation link, they will not get a session after sign-up. For a private personal app you can disable confirmations, or leave them on and use the link from the inbox (and check spam). Add this site’s URL under **Authentication → URL Configuration → Redirect URLs** (local Vite origin and the Vercel URL).

### 3. Env vars

Copy the example file and fill in the Project URL and anon (or publishable) key from **Project Settings → API**:

```bash
cp .env.example .env.local
```

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Do not put the service role key in the client. `.env.local` is gitignored.

## Run locally

Requires Node.js 20+.

```bash
npm install
cp .env.example .env.local   # then edit the two VITE_ values
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`). Sign in (or create an account), then add guitars as before.

If this browser still has guitars from the old IndexedDB catalogue, a banner offers a one-time import into your cloud account.

### Other commands

```bash
npm test          # unit tests for search/filter and row mapping
npm run build     # production build
npm run preview   # serve the production build
```

Vite inlines `VITE_*` variables at build time, so restart `npm run dev` after changing `.env.local`.

## Deploy on Vercel

1. Push this repo to GitHub.
2. In Vercel, **Add New → Project** and import the GitHub repo.
3. Framework preset: Vite. Build command `npm run build`, output `dist`.
4. Set environment variables **before** the first production build:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy. Add the resulting `*.vercel.app` origin (and any future subdomain) to Supabase **Redirect URLs**.
6. Leave [captainjacs.com](https://captainjacs.com) on Lodgify. Use the Vercel URL, or later a subdomain such as `fretwork.captainjacs.com`, not the root domain.

## Data

Each guitar row is scoped by `user_id` (references `auth.users`). Photos are compressed in the browser, uploaded to the private `guitar-photos` bucket, and loaded with short-lived signed URLs. Clearing this site’s data only signs you out locally; the catalogue remains in Supabase.
