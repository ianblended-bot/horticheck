# HortiCheck

A mobile-first quality assessment (QA) tool for horticultural site visits — rate zones across seven condition categories, flag photos, track replacements, and generate a PDF report.

## What this is

- **QA module**: fully working — visit setup, zone-by-zone assessment, auto-generated narrative summaries, photo annotation/flagging, replacements tracking, PDF export, and a submit/lock workflow.
- **SA, RA, Pest ID, PlantScore**: placeholder tabs for future modules.
- **Storage**: all data (assessments, photos, reports) is saved locally in the browser using IndexedDB. Nothing leaves your device. Each device/browser has its own separate data — there's no sync between devices yet.

## Running locally

```bash
npm install
npm run dev
```

This starts a local dev server (usually at `http://localhost:5173`). Open it in your browser to use the app.

## Building for production

```bash
npm run build
```

This creates an optimized build in the `dist/` folder.

## Deploying to Vercel

1. Push this repo to GitHub (see below).
2. Go to [vercel.com](https://vercel.com), click **Add New → Project**, and import this GitHub repo.
3. Vercel will auto-detect the Vite project — the default build settings (`npm run build`, output directory `dist`) are correct. Click **Deploy**.
4. Once deployed, you'll get a live URL (e.g. `horticheck.vercel.app`). Every time you push new code to GitHub, Vercel automatically rebuilds and updates the live site.

## Pushing to GitHub

If this is a fresh local copy that hasn't been pushed yet:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/ianblended-bot/horticheck.git
git push -u origin main
```

## Notes on data storage

- Data is stored in IndexedDB, a database built into the browser. It persists between sessions on the same device/browser, but is **not** shared across devices.
- If you clear your browser data/cache, saved QA records will be lost.
- A future upgrade path (e.g. Supabase) would allow syncing data across devices and, eventually, multi-user access — this can be added without a rewrite of the UI.
