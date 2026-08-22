# A8 · PDF Report Generator

Build the workshop's report pipeline from scratch: **query → render → store → serve**.
One SQL query turns rows into numbers, an HTML template turns numbers into a page, and a
headless browser prints that page to a real PDF. The API generates the report and hands it out
by link — no background jobs required.

This is the **JavaScript lane**: Node.js + Express + SQLite (`node:sqlite`) + Playwright.

## Stages
- **Stage 0** — setup: `GET /health` + Playwright/Chromium installed. ✅
- **Stage 1** — seed a small SQLite database with data. ✅
- **Stage 2** — one SQL aggregation query (`getReportData()`). ✅
- **Stage 3** — render the numbers into an HTML page, print to PDF with Playwright. ✅
- **Stage 4** — store the PDF on disk + path in DB; serve it by link. ✅
- Stage 5 — idempotency: asking twice makes one file, not two.
- Stage 6 — a clean API surface (order + download by id/link).
- Stage 7 — README + polish + ≥7 honest commits.

## When would you move this out of the request?
`POST /reports` runs the whole pipeline **in the request** and takes several seconds (a fresh
Chromium launch is the dominant cost). That is fine for one user clicking one button. You move it
out of the request — into a background job (the A7 pattern: enqueue, return 202 + a job id, poll
or webhook) — the moment reports get large, generation gets slower, or more than a handful of
users generate concurrently, because a multi-second synchronous request is fragile and holds the
user (and a server thread) hostage.

## Idempotency (Stage 5)
`POST /reports` is **idempotent per day**: if a report was already generated today, the endpoint
returns the existing one with `200` instead of regenerating (a double-click makes one file, not
two). Pass `{ "force": true }` to force a fresh report.

The same-request-twice check protects against **duplicate side effects from retries, double
clicks, and flaky networks** — the client may fire the request again, but the system only does the
work once. A real-world example where a missing check like this costs money: a "charge card" or
"send invoice" endpoint that isn't idempotent will **bill or email a customer twice** when they
double-click "Pay" or a timeout triggers a retry — duplicate charges, refunds, and support tickets
that erode trust and margin.

## Run it

```bash
cd a8
npm install
npx playwright install chromium   # one-time browser download
npm run seed                      # build report.db (200 orders)
npm start                         # http://localhost:3200
```

```bash
curl -i http://localhost:3200/health
# HTTP/1.1 200 OK
# {"status":"ok"}
```

### Generate + download a report (Stage 4)
```bash
curl -i -X POST http://localhost:3200/reports
# 201 -> {"id":"<uuid>","file":"/reports/<uuid>/file"}

curl http://localhost:3200/reports/<uuid>          # the row + file link
curl -o my-report.pdf http://localhost:3200/reports/<uuid>/file   # downloads the PDF
```

> Port `3200` by default — `3000` is the repo's root Next.js dev server and `3100` is `a7` on this machine.
> Override with `A8_PORT=xxxx npm start` if you need a different one.

## Layout
```
a8/
  server.mjs        Express app + report pipeline + serve-by-link routes
  report.mjs        getReportData() / getOrders() — the aggregation layer
  render.mjs        standalone HTML->PDF renderer (renderReport())
  seed.mjs          wipes + seeds report.db (safe to run twice)
  test-report.mjs   prints the report object as JSON (Stage 2 checkpoint)
  count.mjs         quick row-count helper
  package.json
  data/             SQLite file (gitignored)
  reports/          generated PDFs (gitignored)
```
