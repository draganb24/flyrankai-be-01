// FlyRank Internship — Backend Track — Week 5 — Assignment A9
// Stage 3 — Extract the raw records (depends on Stage 1 cache + Stage 2 discovery).

import { discoverBookUrls } from "./discover.js";
import { extractBookRecords } from "./extract.js";

async function main() {
  console.log("== FlyRank A9 — The Polite Scraper ==");
  console.log("Stage 3: extract book details\n");

  const { entries } = await discoverBookUrls();
  const { records, liveFetches, cacheHits } = await extractBookRecords(entries);

  console.log("---- one complete raw record ----");
  console.log(JSON.stringify(records[0], null, 2));
  console.log("----------------------------------");
  console.log(`detail_pages=${records.length}`);
  console.log(`live_fetches=${liveFetches} cache_hits=${cacheHits}`);
}

main().catch((err) => {
  console.error(`Stage 3 failed: ${err.message}`);
  process.exit(1);
});
