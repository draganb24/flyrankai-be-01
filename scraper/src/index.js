// FlyRank Internship — Backend Track — Week 5 — Assignment A9
// Stage 2 — Find all three pages (depends on Stage 1's cache helper).

import { discoverBookUrls } from "./discover.js";

async function main() {
  console.log("== FlyRank A9 — The Polite Scraper ==");
  console.log("Stage 2: discover three catalogue pages\n");

  const { cataloguePages, discovered, uniqueUrls, bookUrls } =
    await discoverBookUrls();

  console.log(`catalogue_pages=${cataloguePages}`);
  console.log(`discovered=${discovered}`);
  console.log(`unique_urls=${uniqueUrls}`);
  console.log(`sample: ${bookUrls[0]}`);
}

main().catch((err) => {
  console.error(`Stage 2 failed: ${err.message}`);
  process.exit(1);
});
