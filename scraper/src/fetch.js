// FlyRank Internship — Backend Track — Week 5 — Assignment A9
// Stage 1+ shared helper: fetch an HTML page POLITELY and cache it locally.
//
// Rules enforced here (the foundation every later stage reuses):
//   1. Honest User-Agent that names who we are (+ repo link).
//   2. Abort timeout — never wait forever.
//   3. Strict 200-only acceptance — anything else is a failed fetch, not HTML.
//   4. Local file cache — re-runs read the saved copy and never re-hit the site.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { existsSync } from "node:fs";

export class FetchError extends Error {
  constructor(message, { status = null, cause = null } = {}) {
    super(message);
    this.name = "FetchError";
    this.status = status;
    this.cause = cause;
  }
}

// Returns { html, fromCache, bytes, status }.
//   fromCache=true  -> read from cachePath (no network)
//   fromCache=false -> fetched live, then written to cachePath
export async function fetchHtml({
  url,
  cachePath,
  userAgent,
  timeoutMs = 8000,
  force = false,
}) {
  if (!force && existsSync(cachePath)) {
    const html = await readFile(cachePath, "utf8");
    return { html, fromCache: true, bytes: Buffer.byteLength(html), status: 200 };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let res;
  try {
    res = await fetch(url, {
      headers: { "User-Agent": userAgent },
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    const timedOut = err.name === "AbortError";
    throw new FetchError(
      timedOut
        ? `Timeout after ${timeoutMs}ms for ${url}`
        : `Network error for ${url}: ${err.message}`,
      { cause: err },
    );
  }
  clearTimeout(timer);

  // Check status BEFORE doing anything else — only 200 is a page we may parse.
  if (res.status !== 200) {
    throw new FetchError(`Non-200 status ${res.status} for ${url}`, { status: res.status });
  }

  const html = await res.text();
  await mkdir(dirname(cachePath), { recursive: true });
  await writeFile(cachePath, html, "utf8");
  return { html, fromCache: false, bytes: Buffer.byteLength(html), status: 200 };
}
