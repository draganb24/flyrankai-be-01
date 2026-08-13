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
//   { bookUrls: string[], nextPageUrl: string|null }
function parseCataloguePage(html, pageUrl) {
  const $ = load(html);
  const bookUrls = [];
  // Each product pod's title link points to the book detail page.
  $("article.product_pod h3 a").each((_, el) => {
    const rel = $(el).attr("href");
    if (rel) bookUrls.push(new URL(rel, pageUrl).href); // absolute, tool-resolved
  });

  let nextPageUrl = null;
  const next = $("li.next a").first();
  const nextRel = next.attr("href");
  if (nextRel) nextPageUrl = new URL(nextRel, pageUrl).href; // follow site's own link

  return { bookUrls, nextPageUrl };
}

// Returns { cataloguePages, discovered, uniqueUrls, bookUrls }.
// Caches each catalogue page; only live fetches incur the politeness delay.
export async function discoverBookUrls(force = false) {
  const seen = new Set();
  const bookUrls = [];
  let cataloguePages = 0;
  let discovered = 0;
  let currentUrl = CATALOGUE_PAGE_1_URL;

  while (currentUrl && cataloguePages < MAX_CATALOGUE_PAGES) {
    const cachePath = `cache/catalogue-${cataloguePages + 1}.html`;
    const { html, fromCache } = await fetchHtml({
      url: currentUrl,
      cachePath,
      userAgent: USER_AGENT,
      timeoutMs: REQUEST_TIMEOUT_MS,
      force,
    });

    // Wait between REAL requests only — cached reads never touch the site.
    if (!fromCache && currentUrl !== CATALOGUE_PAGE_1_URL) {
      await sleep(REQUEST_DELAY_MS);
    }

    const { bookUrls: pageBooks, nextPageUrl } = parseCataloguePage(
      html,
      currentUrl,
    );
    cataloguePages += 1;
    discovered += pageBooks.length;
    for (const u of pageBooks) {
      if (!seen.has(u)) {
        seen.add(u);
        bookUrls.push(u);
      }
    }
    currentUrl = nextPageUrl;
  }

  return { cataloguePages, discovered, uniqueUrls: seen.size, bookUrls };
}
