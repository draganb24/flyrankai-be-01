# The Polite Scraper — FlyRank Internship · Backend Track · Week 5 · Assignment A9

A small, polite scraping pipeline built in **JavaScript (Node.js)**. It downloads the
first three catalogue pages of Books to Scrape, visits all 60 book pages, turns messy
HTML into clean, schema-checked JSON, survives a broken page, and ends every run with
an honest report.

> **Lane:** JavaScript — Node.js 20+, built-in `fetch`, **Cheerio**, **Zod**. No browser,
> no database, no credit card. The *only* site this code touches is a public practice
> sandbox that exists for exactly this.

---

## Target classification (Stage 0)

- **Which site:** `https://books.toscrape.com` — a catalogue of books, used *only* as a
  practice target.
- **Why this site:** It is a public **sandbox** built so people can learn scraping. The
  parent site (https://toscrape.com) describes it as *"a safe place for beginners
  learning web scraping and for developers validating their scraping technologies."*
  That statement is the permission this assignment needs — and it is the *only* kind of
  site this code touches.
- **How much:** The **first 3 catalogue pages only** (`page-1.html`, then follow the
  site's own "next" link to page 2 and page 3). That yields exactly **60** book detail
  pages. The whole site is *not* crawled.
- **What data we collect (per book):** `title`, `product_url` (absolute, canonical),
  `price_text` (e.g. `£51.77`), `availability_text`, `rating_text` (e.g. `Three`),
  `description` (may be `null`), `source_page`, `fetched_at`, plus a normalized
  `price_gbp` (a number). No personal data, no login, no paywalled content.
- **Why this is appropriate here:** The target is an explicitly sanctioned sandbox, the
  scope is tiny and bounded (3 pages / 60 records), all data is public catalogue
  metadata already present in the page HTML, and the pipeline is polite (identifying
  user-agent, a 500 ms delay between real requests, timeouts, and a local cache so the
  site is hit minimally). This is exactly the use case the site was built for.

### Robots check (Stage 0)

- Requested `https://books.toscrape.com/robots.txt` once.
- Result: **HTTP 404 — "no robots file found."**
- A missing `robots.txt` is *not* permission; it is just a missing file. Read alongside
  the site's own statement that it is a scraping sandbox, we proceed within the minimal,
  public scope described above.

> **I will not reuse this code on another site without checking its rules and terms first.**

---

## Run it (a stranger, in under 5 minutes)

**Prerequisites:** [Node.js](https://nodejs.org) 20 or newer.

```bash
git clone https://github.com/draganb24/flyrankai-be-01
cd flyrankai-be-01/scraper
npm install          # installs cheerio + zod
npm start            # fetch + extract + validate + write output/
```

`npm start` runs `node src/index.js`. On the first run it fetches the 3 catalogue pages
and 60 book pages (with polite delays) and caches them; every later run reads the cache,
so reruns are fast and gentle on the site.

**Outputs** (written to `scraper/output/`):

| file              | contents                                                                 |
|-------------------|--------------------------------------------------------------------------|
| `books.json`      | the 60 validated, de-duplicated records                                  |
| `errors.json`     | records/URLs that failed validation or fetching, with a reason           |
| `run-report.json` | honest counts: duration, pages fetched, cache hits, valid/invalid/failed |

**Reproduce the failure-proofing** (Stage 5 checkpoint) without touching the real site:

```bash
node src/index.js --with-bad-page   # injects one fake, non-existent URL
# -> still finishes, books.json keeps 60 good records, run-report.json failed_pages=1
```

---

## Record schema (Stage 4)

Defined with **Zod** in `src/schema.js` (`.strict()` — no stray fields allowed):

| field               | type               | required | notes                                             |
|---------------------|--------------------|----------|---------------------------------------------------|
| `title`             | string             | yes      | book title                                        |
| `product_url`       | string (https URL) | yes      | **canonical identity** — used to de-duplicate     |
| `price_text`        | string             | yes      | raw, e.g. `"£51.77"`                              |
| `price_gbp`         | number             | yes      | normalized from `price_text`, sortable/comparable |
| `availability_text` | string             | yes      | e.g. `"In stock (22 available)"`                  |
| `rating_text`       | string             | yes      | e.g. `"Three"` (from the star-rating class)       |
| `description`       | string \| `null`   | optional | `null` when the page has none — never invented    |
| `source_page`       | string (https URL) | yes      | the catalogue page it was found on (provenance)   |
| `fetched_at`        | string             | yes      | ISO timestamp of this run (provenance)            |

Validation runs *before* storage: a record that fails is sent to `errors.json` with the
reason and never reaches `books.json`.

---

## Politeness rules

| rule         | value                                                                     | where                                        |
|--------------|---------------------------------------------------------------------------|----------------------------------------------|
| User-Agent   | `FlyRankInternshipA9/1.0 (+https://github.com/draganb24/flyrankai-be-01)` | `src/config.js` → `fetch.js`                 |
| Timeout      | 8 s per request (abort, never hang)                                       | `src/config.js` → `fetch.js`                 |
| Delay        | ≥ 500 ms between *real* requests; cached reads skip it                    | `src/config.js` → `discover.js`/`extract.js` |
| Cache        | every fetched page saved to `cache/`; reruns read it                      | `src/fetch.js`                               |
| Status check | only HTTP 200 is parsed; 404/403 are not retried                          | `src/fetch.js`                               |
| Retry        | one retry on transient failure (timeout / 5xx) **only**                   | `src/fetch.js`                               |
| Scope        | first 3 catalogue pages, ≤ 60 books                                       | `src/config.js` `MAX_CATALOGUE_PAGES`        |

---

## Why this assignment needed no browser

The data is already in the HTML the server sends in its initial response, so a headless
browser would only add startup cost, memory, and fragility — plain HTTP + Cheerio is
faster, deterministic, and enough.

---

## One honest limitation

This scraper reads the page HTML as it is *today*; if Books to Scrape changes its markup
(the class names inside `article.product_page`, the `next`-link location, or the price
format), the selectors in `src/extract.js` would need updating. The Zod schema and the
`errors.json`/`run-report.json` outputs are what make such breakage *visible* rather
than silent — but the selectors themselves are not self-healing.

---

## Project layout

```
scraper/
  src/
    config.js    # constants: UA, URLs, politeness knobs, page cap
    fetch.js     # polite fetch + cache + retry-once (timeout/5xx only)
    discover.js  # Stage 2: 3 catalogue pages, absolute URLs, dedup
    extract.js   # Stage 3+5: parse product area, isolate per-page failures
    normalize.js # Stage 4: price_text -> price_gbp, validate vs schema
    schema.js    # Stage 4: Zod record schema
    report.js    # Stage 5: build the run report
    index.js     # entry point (npm start)
  cache/         # fetched HTML (git-ignored)
  output/        # books.json, errors.json, run-report.json (sample committed)
  package.json
  .gitignore
  README.md
```

---

## Honest run report (proof)

Captured from a clean local run (`npm start`, all pages served from cache):

```json
{
  "started_at": "2026-08-13T14:05:15.604Z",
  "ended_at": "2026-08-13T14:05:16.246Z",
  "duration_ms": 642,
  "catalogue_pages": 3,
  "pages_fetched": 0,
  "cache_hits": 60,
  "valid_records": 60,
  "invalid_records": 0,
  "failed_pages": 0
}
```

(A `--with-bad-page` run reports `failed_pages: 1` while `valid_records` stays 60 — the
run finishes and the good records survive.)

---

## Ethics note

This code was written for a sanctioned practice sandbox and follows a minimal, public
scope. In general: **use an official API when one exists** — scraping should be a last
resort, not a reflex. **Never bypass logins, paywalls, or access blocks**, and **collect
only what you need** (here: public catalogue metadata, nothing personal). Always identify
yourself with an honest user-agent, rate-limit your requests, and respect a site's
`robots.txt` and terms. When in doubt, ask the site owner or don't scrape it.
