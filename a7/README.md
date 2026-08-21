# A7 · Background Jobs — "the fast door"

A tiny Express + Inngest API that demonstrates the three ways work can start:

| Kind | How it starts | In this project |
|------|---------------|-----------------|
| Request/response | A client asks and waits | `GET /health`, `POST /reports`, `GET /reports/:id` |
| Background job (event) | A client asks, work happens later | `make-report` runs after `POST /reports` sends `report/requested` |
| Cron job (schedule) | Nobody asks; the clock starts it | `heartbeat` runs every minute on `* * * * *` |

The headline lesson: **a slow task does not belong inside the HTTP request.** The endpoint
returns in ~0.2s with a receipt (`202 Accepted`), and the 8-second report is built afterwards
by a background job. The client polls `GET /reports/:id` and sees `pending` → `done`
(eventual consistency). Every "we'll email you when it's ready" on the internet is this pattern.

## How to run it

You need **two terminals** running at the same time.

**Terminal 1 — the API**

```bash
cd a7
npm install
NODE_ENV=development INNGEST_DEV=1 PORT=3100 node server.mjs
# → A7 API ready on http://localhost:3100
```

**Terminal 2 — the Inngest Dev Server** (the dashboard that runs/retries/cron-schedules your jobs)

```bash
cd a7
npx --yes inngest-cli@latest dev -u http://localhost:3100/api/inngest
# → open http://localhost:8288
```

> Note: the Dev Server may print a different port if 8288 is taken — use whatever port it says.
> Keep both terminals open for the whole session.

## Endpoints

| Method | Path | Purpose | Returns |
|--------|------|---------|---------|
| GET | `/health` | Liveness check | `200 {"status":"ok"}` |
| POST | `/reports` | Order a report; kicks a background job | `202 {"id","status":"pending"}` |
| GET | `/reports/:id` | Poll report status | `200 {...,"status":"pending"|"done"}` or `404` |
| POST | `/api/inngest` | Inngest serve handler (internal) | — |

## Inngest functions

| Function | Trigger | What it does |
|----------|---------|--------------|
| `make-report` | event `report/requested` | Sleeps 8s (the "slow work"), builds the report, marks it `done`. Throws if `topic === "fail"` (demo retry). `retries: 2`. |
| `heartbeat` | cron `* * * * *` | Every minute, logs how many reports are `pending` / `done` / `failed`. No endpoint, no event — the clock is the only trigger. |
| `say-hello` | event `test/hello` | Stage 1 demo: sleeps 5s, returns "Hello from the background!". Invoke it from the dashboard. |
| `daily-digest` | cron `0 8 * * *` | Stage 4 reference cron (daily at 08:00). |
| `flaky-task` | event `demo/flaky` | Stage 3 reference: fails twice, succeeds on attempt 3. |

## Proof — order a report, then poll it

```bash
$ time curl -s -i -X POST http://localhost:3100/reports \
    -H "Content-Type: application/json" -d '{"topic":"cats"}'
HTTP/1.1 202 Accepted
{"id":"rep_1787333237876_5","status":"pending"}
real  0m0.233s          # ← fast, even though the work takes 8s

$ curl -s http://localhost:3100/reports/rep_1787333238062_6
{"id":"rep_1787333238062_6","topic":"cats","status":"pending","result":null,...}

# ~10s later
$ curl -s http://localhost:3100/reports/rep_1787333238062_6
{"id":"rep_1787333238062_6","topic":"cats","status":"done",
 "result":{"topic":"cats","headline":"Quarterly summary for \"cats\"","sections":5,...},...}
```

Unknown id → `404 {"error":"report not found"}`. Missing topic → `400 {"error":"topic is required"}`
(no event sent, no job created).

### Retries (Stage 3)

`POST /reports` with `{"topic":"fail"}` returns `202` instantly, then `make-report` throws
"The report oven is broken!" inside `build-report`. Inngest retries per `retries: 2`, so the run
is attempted 3 times (with backoff) and ends **Failed**. Confirmed in the dashboard — e.g. run
`01M0JNQJXT35WVMGM76A6K906V` shows status `FAILED`.

### Cron (Stage 4)

`heartbeat` fires every minute (`* * * * *`). The API log shows, each tick:

```
[heartbeat] reports — pending: 1, done: 1, failed: 0
```

The dashboard lists heartbeat runs one minute apart, all Completed — no request ever triggered them.

## Stage 3 & 4 sentences

- **Stage 3:** A missing `topic` is a *wrong input* — it is rejected immediately with `400` at the
  door and never retried; a transient failure (the `"fail"` oven) is a *wrong moment* — it is retried
  automatically with backoff, because only a wrong moment deserves a retry.
- **Stage 4:** To run the heartbeat every day at 08:00 use `0 8 * * *` (crontab.guru: "At 08:00 every day");
  to run it every Sunday at 22:00 use `0 22 * * 0` (day-of-week `0` = Sunday).

## Dashboard screenshots

- `dashboard-runs.png` — the Runs page: `heartbeat` cron runs (one per minute) plus `make-report` runs.
- `dashboard-make-report.png` — `make-report` runs near the top with Running / Completed statuses.

## Requirements

- Node.js 18+ (tested on Node 24)
- `npx` (ships with npm) for the Inngest Dev Server
- No API keys, no credit card — everything runs locally.
