# A8 · PDF Report Generator

Build the workshop's report pipeline from scratch: **query → render → store → serve**.
One SQL query turns rows into numbers, an HTML template turns numbers into a page, and a
headless browser prints that page to a real PDF. The API generates the report and hands it out
by link — no background jobs required.

This is the **JavaScript lane**: Node.js + Express + SQLite (`node:sqlite`) + Playwright.

## Stages
- **Stage 0** — setup: `GET /health` + Playwright/Chromium installed. ✅
- Stage 1 — seed a small SQLite database with data.
- Stage 2 — one SQL aggregation query.
- Stage 3 — render the numbers into an HTML page, print to PDF with Playwright.
- Stage 4 — store the PDF on disk + path in DB; serve it by link.
- Stage 5 — idempotency: asking twice makes one file, not two.
- Stage 6 — a clean API surface (order + download by id/link).
- Stage 7 — README + polish + ≥7 honest commits.

## Run it

```bash
cd a8
npm install
npx playwright install chromium   # one-time browser download
npm start                         # http://localhost:3200
```

```bash
curl -i http://localhost:3200/health
# HTTP/1.1 200 OK
# {"status":"ok"}
```

> Port `3200` by default — `3000` is the repo's root Next.js dev server and `3100` is `a7` on this machine.
> Override with `A8_PORT=xxxx npm start` if you need a different one.

## Layout
```
a8/
  server.mjs        Express app (one endpoint per stage)
  package.json
  data/             SQLite file (gitignored)
  reports/          generated PDFs (gitignored)
```
