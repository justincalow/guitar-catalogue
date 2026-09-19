# Fretwork

A personal guitar catalogue for recording, browsing, searching, and updating the instruments you own. Everything stays on your machine — no account, no cloud backend.

## Features

- Collection grid or list with photo (or placeholder), make, model, year, and type
- Add and edit forms covering identity, specs, purchase details, notes, and photos
- Detail view with the full record, photo gallery, edit, and delete
- Search across make, model, serial, and notes; filter by make and type
- Empty state that invites you to add the first guitar
- Delete confirmation
- Persistence in IndexedDB (survives reloads)

## Run locally

Requires Node.js 20+.

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`).

### Other commands

```bash
npm test          # unit tests for search/filter
npm run build     # production build
npm run preview   # serve the production build
```

## Data

Guitars and photos are stored in the browser with IndexedDB (database name `FretworkCatalogue`). Clearing site data for this origin will remove the catalogue. Photos are compressed locally before they are saved.
