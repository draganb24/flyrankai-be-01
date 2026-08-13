// FlyRank Internship — Backend Track — Week 5 — Assignment A9
// Stage 5 — Survive failures, report the run.
// (depends on Stage 1 cache + Stage 2 discovery + Stage 3 extraction +
//  Stage 4 normalization + schema + report)

import { writeFile, mkdir } from "node:fs/promises";
import { discoverBookUrls } from "./discover.js";
import { extractBookRecords } from "./extract.js";
import { validateRecords } from "./normalize.js";
import { buildReport } from "./report.js";

// One deliberately broken URL, injected to PROVE the run survives a bad page.
// It points at a non-existent host so it fails fast locally — we never hammer
// the real site to test failure.
const FAKE_BAD_ENTRY = {
  url: "https://invalid.invalid-local-test/this-page-does-not-exist/index.html",
  sourcePage: "https://books.toscrape.com/catalogue/page-1.html",
};

async function main() {
  const startedAt = new Date();
  console.log("== FlyRank A9 — The Polite Scraper ==");
  console.log("Stage 5: survive failures, report the run\n");

  const { cataloguePages, entries } = await discoverBookUrls();
  // Inject the fake bad page so we exercise the failure path.
  const allEntries = [...entries, FAKE_BAD_ENTRY];

  const { records: rawRecords, failures, liveFetches, cacheHits } =
    await extractBookRecords(allEntries);
  const { good, errors } = validateRecords(rawRecords);

  await mkdir("output", { recursive: true });
  await writeFile("output/books.json", JSON.stringify(good, null, 2), "utf8");
  await writeFile(
    "output/errors.json",
    JSON.stringify([...errors, ...failures.map((f) => ({ product_url: f.url, reason: f.reason }))], null, 2),
    "utf8",
  );

  const endedAt = new Date();
  const report = buildReport({
    startedAt,
    endedAt,
    cataloguePages,
    liveFetches,
    cacheHits,
    validRecords: good.length,
    invalidRecords: errors.length,
    failedPages: failures.length,
  });
  await writeFile("output/run-report.json", JSON.stringify(report, null, 2), "utf8");

  console.log(`catalogue_pages=${report.catalogue_pages}`);
  console.log(`good_records=${report.valid_records}`);
  console.log(`invalid_records=${report.invalid_records}`);
  console.log(`failed_pages=${report.failed_pages}`);

  if (failures.length) {
    console.log("skipped (logged):");
    for (const f of failures) console.log(`  - ${f.url} :: ${f.reason}`);
  }
  console.log(`\nwrote output/books.json, output/errors.json, output/run-report.json`);
  console.log(`run duration: ${report.duration_ms} ms`);
}

main().catch((err) => {
  console.error(`Stage 5 failed: ${err.message}`);
  process.exit(1);
});
