// FlyRank Internship — Backend Track — Week 5 — Assignment A9
// Stage 1 — Fetch once, cache once.
//
// Download the first catalogue page politely, cache it locally, and prove it
// arrived. A re-run must read the cache instead of hitting the site again.

import { fetchHtml } from "./fetch.js";
import {
  USER_AGENT,
  CATALOGUE_PAGE_1_URL,
  CATALOGUE_PAGE_1_CACHE,
  REQUEST_TIMEOUT_MS,
} from "./config.js";

async function main() {
  console.log("== FlyRank A9 — The Polite Scraper ==");
  console.log("Stage 1: fetch and cache HTML\n");

  const { html, fromCache, bytes } = await fetchHtml({
    url: CATALOGUE_PAGE_1_URL,
    cachePath: CATALOGUE_PAGE_1_CACHE,
    userAgent: USER_AGENT,
    timeoutMs: REQUEST_TIMEOUT_MS,
  });

  if (fromCache) {
    console.log("CACHE HIT  <- read cache/catalogue-page-1.html (no network)");
  } else {
    console.log("FETCH      -> saved cache/catalogue-page-1.html");
  }
  console.log(`response size = ${bytes} bytes (${html.length} chars)`);
}

main().catch((err) => {
  console.error(`Stage 1 failed: ${err.message}`);
  process.exit(1);
});
