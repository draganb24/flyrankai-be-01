// FlyRank Internship — Backend Track — Week 5 — Assignment A9
// Stage 2 — Find all three pages.
//
// Parse the cached catalogue pages with Cheerio, collect every book link as an
// ABSOLUTE url (URL tooling, never string gluing), follow the site's own "next"
// link, and de-duplicate. Cached reads need no delay; live fetches wait.

import { load } from "cheerio";
import { fetchHtml } from "./fetch.js";
import {
  USER_AGENT,
  CATALOGUE_PAGE_1_URL,
  REQUEST_TIMEOUT_MS,
  REQUEST_DELAY_MS,
  MAX_CATALOGUE_PAGES,
} from "./config.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Given the HTML of one catalogue page and its absolute url, return:
//   { bookEntries: [{ url, sourcePage }], nextPageUrl: string|null }
function parseCataloguePage(html, pageUrl) {
  const $ = load(html);
  const bookEntries = [];
  // Each product pod's title link points to the book detail page.
  $("article.product_pod h3 a").each((_, el) => {
    const rel = $(el).attr("href");
    if (rel) {
      const url = new URL(rel, pageUrl).href; // absolute, tool-resolved
      bookEntries.push({ url, sourcePage: pageUrl });
    }
  });

  let nextPageUrl = null;
  const next = $("li.next a").first();
  const nextRel = next.attr("href");
  if (nextRel) nextPageUrl = new URL(nextRel, pageUrl).href; // follow site's own link

  return { bookEntries, nextPageUrl };
}

// Returns { cataloguePages, discovered, uniqueUrls, bookUrls, entries }.
// Caches each catalogue page; only live fetches incur the politeness delay.
export async function discoverBookUrls(force = false) {
  const seen = new Set();
  const entries = [];
  const bookUrls = [];
  let cataloguePages = 0;
  let discovered = 0;
  let currentUrl = CATALOGUE_PAGE_1_URL;
  let prevLive = false;

  while (currentUrl && cataloguePages < MAX_CATALOGUE_PAGES) {
    if (prevLive) await sleep(REQUEST_DELAY_MS); // gap before a live fetch
    const cachePath = `cache/catalogue-${cataloguePages + 1}.html`;
    const { html, fromCache } = await fetchHtml({
      url: currentUrl,
      cachePath,
      userAgent: USER_AGENT,
      timeoutMs: REQUEST_TIMEOUT_MS,
      force,
    });
    prevLive = !fromCache;

    const { bookEntries, nextPageUrl } = parseCataloguePage(html, currentUrl);
    cataloguePages += 1;
    discovered += bookEntries.length;
    for (const e of bookEntries) {
      if (!seen.has(e.url)) {
        seen.add(e.url);
        entries.push(e);
        bookUrls.push(e.url);
      }
    }
    currentUrl = nextPageUrl;
  }

  return { cataloguePages, discovered, uniqueUrls: seen.size, bookUrls, entries };
}
