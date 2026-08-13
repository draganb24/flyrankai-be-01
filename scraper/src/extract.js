// FlyRank Internship — Backend Track — Week 5 — Assignment A9
// Stage 3 + Stage 5 — Extract the raw records.
//
// For every book detail page (fetched + cached with the same politeness as
// Stage 1), pull the eight raw fields, AIMED AT THE PRODUCT AREA of the page.
// Optional fields that are missing on the page become null — never invented.
//
// Stage 5: each page is handled SEPARATELY. A failed fetch (timeout, 5xx after
// retry, 404, 403) is logged and skipped — it never kills the run, and the
// other 59 pages still produce records.

import { load } from "cheerio";
import { fetchHtml, FetchError } from "./fetch.js";
import {
  USER_AGENT,
  REQUEST_TIMEOUT_MS,
  REQUEST_DELAY_MS,
} from "./config.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const trimOrNull = (s) => {
  const t = (s ?? "").trim();
  return t.length ? t : null;
};

// A book URL like .../catalogue/a-light-in-the-attic_1000/index.html -> slug.
function slugOf(url) {
  const parts = new URL(url).pathname.split("/").filter(Boolean);
  return parts.length >= 2 ? parts[parts.length - 2] : parts[parts.length - 1];
}

// Parse the product area of one detail page into the eight-field raw record.
function parseBookPage(html, productUrl, sourcePage, fetchedAt) {
  const $ = load(html);
  const $main = $("article.product_page .product_main"); // aim at product area

  const title = trimOrNull($main.find("h1").first().text());
  const price_text = trimOrNull($main.find("p.price_color").first().text());
  const availability_text = trimOrNull(
    $main.find("p.availability").first().text(),
  );

  let rating_text = null;
  const $rating = $main.find("p.star-rating").first();
  if ($rating.length) {
    const cls = ($rating.attr("class") || "").split(/\s+/);
    rating_text = cls.find((c) => c && c !== "star-rating") || null;
  }

  // Description is the <p> immediately after #product_description.
  // Some books have none -> store null, never invent text.
  let description = null;
  const $desc = $("#product_description");
  if ($desc.length) {
    const $p = $desc.next("p");
    if ($p.length) description = trimOrNull($p.text());
  }

  return {
    title,
    product_url: productUrl, // absolute canonical URL (provenance identity)
    price_text,
    availability_text,
    rating_text,
    description,
    source_page: sourcePage, // the catalogue page we found it on
    fetched_at: fetchedAt, // when we obtained it this run
  };
}

// entries: [{ url, sourcePage }].
// Returns { records, failures, liveFetches, cacheHits }.
//   records  : successfully fetched + parsed raw records
//   failures : [{ url, reason }] — one per page that could not be obtained
export async function extractBookRecords(entries, force = false) {
  const records = [];
  const failures = [];
  let liveFetches = 0;
  let cacheHits = 0;
  let prevLive = false;

  for (const { url, sourcePage } of entries) {
    if (prevLive) await sleep(REQUEST_DELAY_MS); // >=500ms between live requests
    const cachePath = `cache/book-${slugOf(url)}.html`;
    const fetchedAt = new Date().toISOString();
    try {
      const { html, fromCache } = await fetchHtml({
        url,
        cachePath,
        userAgent: USER_AGENT,
        timeoutMs: REQUEST_TIMEOUT_MS,
        force,
      });
      prevLive = !fromCache;
      if (fromCache) cacheHits += 1;
      else liveFetches += 1;
      records.push(parseBookPage(html, url, sourcePage, fetchedAt));
    } catch (err) {
      // A broken page is logged and skipped — the run continues.
      const reason =
        err instanceof FetchError
          ? `fetch failed (status ${err.status ?? "timeout/network"}): ${err.message}`
          : err.message;
      failures.push({ url, reason });
      prevLive = true; // a failed live attempt still counts as "was live"
    }
  }

  return { records, failures, liveFetches, cacheHits };
}
