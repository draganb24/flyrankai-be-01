# The Polite Scraper — FlyRank Internship · Backend Track · Week 5 · Assignment A9

A small, polite scraping pipeline built in **JavaScript (Node.js)**. It downloads the
first three catalogue pages of Books to Scrape, visits all 60 book pages, turns messy
HTML into clean, schema-checked JSON, survives a broken page, and ends every run with
an honest report.

> **Lane:** JavaScript — Node.js 20+, built-in `fetch`, Cheerio, Zod. No browser, no
> database, no credit card. The *only* site this code touches is a public practice
> sandbox that exists for exactly this.

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

## Robots check (Stage 0)

- Requested `https://books.toscrape.com/robots.txt` once.
- Result: **HTTP 404 — "no robots file found."**
- A missing `robots.txt` is *not* permission; it is just a missing file. Read alongside
  the site's own statement that it is a scraping sandbox, we proceed within the minimal,
  public scope described above.

> **I will not reuse this code on another site without checking its rules and terms first.**

---
*Sections for the run command, record schema, politeness rules, ethics note, and a real
run report are filled in as the stages progress.*
