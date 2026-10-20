# Fretwork

A personal catalogue of guitars and amps: record them, browse and search, track sale status and CAD values, and import or export a CSV backup. Sign in with Supabase Auth; the catalogue lives in Postgres (with photos in Storage) so the same rack is available on every device.

**Hosting note:** [captainjacs.com](https://captainjacs.com) stays on Lodgify. Deploy this app on Vercel (or a future subdomain). Do not point the root domain at this project.

## Features

- Email/password and magic-link sign-in; unauthenticated visitors cannot see or change items
- Guitars and amps in one catalogue. Guitar-only fields (type, strings, pickups) stay off amp records
- Status (For sale, Keeping, TBD, Sold), with sold date and sold price kept when an item is sold
- List price, floor price, value range, quantity, details, and insurance figures (low, high, replacement text, basis, confidence), shown in CAD
- Collection grid or list with photo (or placeholder), name, year, and status
- Search across make, model, serial, details, and notes; filter by kind, status, make, and guitar type
- Running totals for the current filtered view: insurance value and for-sale list value, in CAD
- Import CSV (preview, row count, insurance-total rows skipped) and export CSV of the whole collection
- Notes keep long text and turn http(s) links into real links
- Empty state, delete confirmation, and per-item photo upload
- Cloud persistence (Supabase). Optional one-time import from a previous IndexedDB copy in this browser
- Clear setup errors when `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` is missing or malformed, and a network-failure message that points at `.env.local`

## Configure Supabase

The app talks to your existing project with the **anon** key only. Row Level Security keeps each signed-in user on their own rows. Never commit `.env` files or service role keys.

### 1. Apply the SQL

In the Supabase dashboard open **SQL Editor → New query**, paste each script below, and click **Run**. Run them in order. Both are safe to re-run.

1. [`supabase/migrations/20260919120000_guitars_and_photos.sql`](supabase/migrations/20260919120000_guitars_and_photos.sql) — creates `public.guitars`, owner-only RLS (`auth.uid() = user_id` for select, insert, update, and delete), and the private `guitar-photos` bucket.
2. [`supabase/migrations/20261018120000_inventory_guitars_and_amps.sql`](supabase/migrations/20261018120000_inventory_guitars_and_amps.sql) — adds guitar/amp kind, sale status, CAD price and insurance columns, quantity, details, and sold date/price. Existing rows become guitars with status Keeping. RLS stays owner-scoped; the new columns use the same row policies.

If the first script is already applied, you only need to paste and run the second one. Until that second script has been run, saving or importing inventory will fail with a message that names the file.

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

The URL is the project origin from the API settings (`https://<project-ref>.supabase.co`). The app trims whitespace and strips a trailing slash. Do not include `/rest/v1` or a query string.

`VITE_SUPABASE_ANON_KEY` accepts either the classic anon JWT (it starts with `eyJ`) or the newer publishable key (it starts with `sb_publishable_`). Do not put the service role key or an `sb_secret_` key in the client. `.env.local` is gitignored.

If a variable is missing or malformed, the app stays on a setup screen and names that variable. A sign-in error of **Failed to fetch** means the browser could not reach the project: check both values in `.env.local`, then restart the dev server. Vite only reads env files when it starts.

## Run locally

Requires Node.js 20+.

```bash
npm install
cp .env.example .env.local   # then edit the two VITE_ values
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`). Sign in (or create an account), then add guitars and amps, or import a CSV.

If this browser still has guitars from the old IndexedDB catalogue, a banner offers a one-time import into your cloud account.

## Inventory CSV

On the rack, **Import CSV** reads a spreadsheet export and shows a preview and a count before anything is saved. **Export CSV** downloads the whole collection as a backup (not just the filtered view).

The importer expects a header row. These columns are mapped (extra columns are ignored):

| Column | Record |
| --- | --- |
| Item | Catalogue name (also split into make, model, and a year when that is obvious) |
| Category | `Guitars` / `Guitar` or `Amps` / `Amp` |
| Details | Details |
| Qty | Quantity (blank becomes 1) |
| List Price CAD, Floor Price CAD | List and floor prices |
| Value Range CAD | Value range text |
| Status (normalized) | For sale, Keeping, TBD, or Sold. The raw Status column is used only when this one is blank |
| Notes | Notes (long text and links are kept) |
| Insurance Low CAD, Insurance High CAD | Insurance low and high |
| Insurance / Replacement Value CAD | Insurance / replacement text |
| Insurance Basis, Insurance Confidence | Basis and confidence |
| Sold Date, Sold Price CAD | Kept when status is Sold |
| Make, Model, Year, Serial Number, Type, and the other export columns | Used on a round-trip so a backup restores the structured fields |

A row whose Item cell starts with `INSURANCE TOTAL` is skipped, as are blank item rows. Photos are not part of the CSV. After import, open each item and add photos with the existing uploader.

Import inserts new rows on the signed-in account. It does not update or delete existing items, so importing the same file twice creates duplicates. Export, then delete in the app, if you need to start over.

Do not commit a personal inventory CSV (or any `.env` file) to the repo. Keep the spreadsheet as a local file and upload it through Import CSV.

### Apply this on an existing project

1. Paste [`supabase/migrations/20261018120000_inventory_guitars_and_amps.sql`](supabase/migrations/20261018120000_inventory_guitars_and_amps.sql) into the Supabase SQL editor and run it.
2. Confirm `.env.local` has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, then restart `npm run dev`.
3. Sign in.
4. On the rack, choose **Import CSV**, check the preview count, and import.
5. Add photos on each item afterwards. Use the status and kind filters; the totals under the filters follow the current view and are in CAD.

### Other commands

```bash
npm test          # unit tests for search, CSV import, totals, and Supabase config checks
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

Each row is scoped by `user_id` (references `auth.users`) and lives in `public.guitars`, which now holds both guitars (`item_kind = guitar`) and amps (`item_kind = amp`). Money fields are CAD. Insurance totals on the rack use the insurance high figure when it is set, otherwise the low figure, multiplied by quantity. For-sale list value sums list price times quantity for items whose status is For sale in the current filtered view.

Photos are compressed in the browser, uploaded to the private `guitar-photos` bucket, and loaded with short-lived signed URLs. Clearing this site’s data only signs you out locally; the catalogue remains in Supabase.
