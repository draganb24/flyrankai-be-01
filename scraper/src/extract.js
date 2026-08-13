// FlyRank Internship — Backend Track — Week 5 — Assignment A9
// Stage 3 — Extract the raw records.
//
// For every book detail page (fetched + cached with the same politeness as
// Stage 1), pull the eight raw fields, AIMED AT THE PRODUCT AREA of the page.
// Optional fields that are missing on the page become null — never invented.

import { load } from "cheerio";
import { fetchHtml } from "./fetch.js";
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
  // Aim at the product area, not the whole document.
  const $main = $("article.product_page .product_main");

  const title = trimOrNull($main.find("h1").first().text());
  const price_text = trimOrNull($main.find("p.price_color").first().text());
  const availability_text = trimOrNull(
    $main.find("p.availability").first().text(),
  );

  // Rating is encoded in the star-rating element's class (e.g. "Three").
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

// entries: [{ url, sourcePage }]. Returns { records, liveFetches, cacheHits }.
export async function extractBookRecords(entries, force = false) {
  const records = [];
  let liveFetches = 0;
  let cacheHits = 0;
  let prevLive = false;

  for (const { url, sourcePage } of entries) {
    if (prevLive) await sleep(REQUEST_DELAY_MS); // >=500ms between live requests
    const cachePath = `cache/book-${slugOf(url)}.html`;
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

    const fetchedAt = new Date().toISOString();
    records.push(parseBookPage(html, url, sourcePage, fetchedAt));
  }

  return { records, liveFetches, cacheHits };
}
