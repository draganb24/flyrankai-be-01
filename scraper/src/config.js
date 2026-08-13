// FlyRank Internship — Backend Track — Week 5 — Assignment A9
// Shared constants. Edit REPO_URL before publishing (Stage 6).

// TODO: replace with the real public repo URL once published.
export const REPO_URL = "https://github.com/<your-username>/<your-repo>";

// Polite, honest User-Agent — a site owner can trace us back to this assignment.
export const USER_AGENT = `FlyRankInternshipA9/1.0 (+${REPO_URL})`;

// The only site this assignment touches — a public scraping sandbox.
export const SITE_BASE = "https://books.toscrape.com";

// First catalogue page (the entry the later stages follow "next" from).
export const CATALOGUE_PAGE_1_URL = `${SITE_BASE}/catalogue/page-1.html`;

// Cache location for the first catalogue page (Stage 1).
export const CATALOGUE_PAGE_1_CACHE = "cache/catalogue-page-1.html";

// Politeness knobs.
export const REQUEST_TIMEOUT_MS = 8000; // give up after a few seconds
export const REQUEST_DELAY_MS = 500; // min gap between real requests (Stage 2+)
