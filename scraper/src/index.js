// FlyRank Internship — Backend Track — Week 5 — Assignment A9
// The polite scraper (JavaScript lane)
//
// Stage 0 — classify the target BEFORE collecting anything.
// This entry file records the target classification and performs a one-time,
// polite check of the site's robots.txt. No catalogue fetching happens yet
// (that is Stage 1+).

// TODO: replace with the real public repo URL once published.
const REPO_URL = "https://github.com/<your-username>/<your-repo>";
const USER_AGENT = `FlyRankInternshipA9/1.0 (+${REPO_URL})`;
const TARGET_BASE = "https://books.toscrape.com";
const ROBOTS_URL = `${TARGET_BASE}/robots.txt`;

// Target classification — the "who / why / how much / what" recorded in README.
export const classification = {
  site: TARGET_BASE,
  why: "Public scraping sandbox built for practice (toscrape.com).",
  scope: "First 3 catalogue pages only -> 60 book detail pages.",
  collects: [
    "title",
    "product_url",
    "price_text",
    "availability_text",
    "rating_text",
    "description",
    "source_page",
    "fetched_at",
    "price_gbp",
  ],
  appropriateBecause:
    "Sanctioned sandbox, tiny bounded scope, public catalogue data, polite fetching.",
};

async function checkRobots(url, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: controller.signal,
    });
    return { url, status: res.status, ok: res.ok };
  } catch (err) {
    return {
      url,
      status: null,
      ok: false,
      error: err.name === "AbortError" ? "timeout" : err.message,
    };
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  console.log("== FlyRank A9 — The Polite Scraper ==");
  console.log("Stage 0: classify the scraping target\n");
  console.log("Target site :", classification.site);
  console.log("Scope        :", classification.scope);
  console.log("Collects     :", classification.collects.join(", "));

  console.log("\n-- robots.txt check --");
  const r = await checkRobots(ROBOTS_URL);
  if (r.status === 404) {
    console.log("robots.txt -> HTTP 404 (no robots file found)");
  } else if (r.ok) {
    console.log(`robots.txt -> HTTP ${r.status} (present)`);
  } else {
    console.log(`robots.txt -> ${r.error ?? "HTTP " + r.status}`);
  }

  console.log("\nPledge: I will not reuse this code on another site without");
  console.log("        checking its rules and terms first.");
}

main();
