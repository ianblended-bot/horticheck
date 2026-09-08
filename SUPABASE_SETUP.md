# HortiCheck — Supabase branch setup

This branch (`supabase`) connects HortiCheck to a cloud Supabase database
instead of local browser storage, enabling multi-device access with login.

## One-time setup

### 1. Run the database schema

Go to your Supabase project → **SQL Editor** → **New query**, paste the
entire contents of `supabase/schema.sql`, and click **Run**.

This creates the `records` and `plant_library` tables with row-level
security, so each logged-in user only ever sees their own data.

### 2. Confirm auth is enabled

Go to **Authentication → Providers** in the Supabase dashboard and make
sure **Email** is enabled (it is by default).

By default Supabase requires email confirmation before a new account can
log in. For personal/internal use, you can turn this off:
**Authentication → Providers → Email → toggle off "Confirm email"**.
Otherwise, after signing up you'll need to click a confirmation link sent
to your inbox before you can log in.

### 3. Deploy

Push this branch to GitHub. Vercel will automatically create a preview
deployment at its own URL (separate from your main `horticheck-three.vercel.app`),
so your existing local-only app keeps working untouched.

## Using the app

On first visit, sign up with an email and password. Once logged in, all
QA/SA records and Plant ID library entries are stored in Supabase and
sync across any device you log into.

## Migrating existing local data

If you have existing records in the local (IndexedDB) version of the app
that you want to bring across, use the export from the local app's
dashboard (see migration tool) and re-import via the Supabase version.
This is a one-time manual step — ask Claude to build the export/import
tool when you're ready to migrate real data.

## Notes

- Photos are still stored as base64 strings directly in the database (same
  as the local version) rather than in Supabase Storage. This keeps the
  migration simple for now; moving to Supabase Storage is a good next step
  if the database grows large, since Postgres row sizes are less efficient
  for binary data than dedicated file storage.
- Free tier Supabase projects pause after 7 days of inactivity — the first
  load after a pause takes 20-30 seconds while it wakes up.
