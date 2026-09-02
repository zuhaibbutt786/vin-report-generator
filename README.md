# VIN Vehicle Report Generator

A **personal, private** tool to decode a VIN, collect free public vehicle data, add your own inspection notes and photos, and generate a professional client-ready PDF report.

Designed for **static hosting on GitHub Pages** — no backend, no paid services, no database.

## Features

- VIN format + check-digit validation
- Official **NHTSA vPIC** factory decode (make, model, year, engine, plant, etc.)
- **NHTSA safety recalls** by Year / Make / Model
- Static **WMI** lookup for manufacturer / country / region
- Manual inspection fields, condition ratings, client details
- Local photo upload (stored only in the browser)
- Professional multi-page **PDF** generation (jsPDF)
- Report history stored in **LocalStorage**
- Configurable branding (name, company, contact, disclaimer)
- Fully static — works offline for previously saved reports

## Important data limitations

This tool **never invents** data.

It does **not** include:

- Ownership history
- Accident / damage records
- Title brands (salvage, flood, etc.)
- Odometer history
- Service records
- Auction history
- Insurance claims

Missing information does **not** mean the vehicle has a clean history.  
Always verify critical facts with official or paid sources when required.

## Tech stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS v4
- jsPDF + jspdf-autotable
- LocalStorage
- NHTSA public APIs (no keys required)

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Build static site

```bash
npm run build
```

Output is written to the `out/` directory (ready for GitHub Pages).

## Deploy to GitHub Pages

1. Go to repository **Settings → Pages**
2. Source: **GitHub Actions**
3. Push to `main` — the workflow builds with the correct `basePath` and deploys

Live URL:

```
https://zuhaibbutt786.github.io/vin-report-generator/
```

## Configuration (branding)

Open **Settings** in the app and fill in name, company, contact details, report title, footer, and disclaimer. All settings are stored locally in the browser.

## Privacy

- No accounts, no server-side storage of VINs or reports
- Everything stays in the user’s browser (LocalStorage)
- Photos are compressed client-side and never uploaded to a server

## License

MIT — use freely for personal and commercial client reports.
