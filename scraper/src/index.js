// FlyRank Internship — Backend Track — Week 5 — Assignment A9
// Stage 4 — Clean it, check it, store it.
// (depends on Stage 1 cache + Stage 2 discovery + Stage 3 extraction + schema)

import { writeFile, mkdir } from "node:fs/promises";
import { discoverBookUrls } from "./discover.js";
import { extractBookRecords } from "./extract.js";
import { validateRecords } from "./normalize.js";

async function main() {
  console.log("== FlyRank A9 — The Polite Scraper ==");
  console.log("Stage 4: validate normalized records\n");

  const { entries } = await discoverBookUrls();
  const { records: rawRecords } = await extractBookRecords(entries);

  const { good, errors } = validateRecords(rawRecords);

  await mkdir("output", { recursive: true });
  await writeFile("output/books.json", JSON.stringify(good, null, 2), "utf8");
  await writeFile(
    "output/errors.json",
    JSON.stringify(errors, null, 2),
    "utf8",
  );

  const allGbpNumbers = good.every(
    (r) => typeof r.price_gbp === "number" && !Number.isNaN(r.price_gbp),
  );
  const allHttps = good.every((r) => r.product_url.startsWith("https://"));

  console.log(`raw_records=${rawRecords.length}`);
  console.log(`good_records=${good.length}`);
  console.log(`errors=${errors.length}`);
  console.log(`all_price_gbp_numeric=${allGbpNumbers}`);
  console.log(`all_urls_https=${allHttps}`);
  console.log("wrote output/books.json and output/errors.json");
}

main().catch((err) => {
  console.error(`Stage 4 failed: ${err.message}`);
  process.exit(1);
});
