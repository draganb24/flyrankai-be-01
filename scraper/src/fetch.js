// FlyRank Internship — Backend Track — Week 5 — Assignment A9
// Stage 1+ shared helper: fetch an HTML page POLITELY and cache it locally.
//
// Rules enforced here (the foundation every later stage reuses):
//   1. Honest User-Agent that names who we are (+ repo link).
//   2. Abort timeout — never wait forever.
//   3. Strict 200-only acceptance — anything else is a failed fetch, not HTML.
//   4. Local file cache — re-runs read the saved copy and never re-hit the site.
//   5. Retry ONCE on transient failure (timeout or 5xx). Never retry 404/403 —
//      those are permanent "no", and a polite robot does not ask twice.

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
//   fromCache=false -> fetched live (after at most one retry), then cached
export async function fetchHtml({
  url,
  cachePath,
  userAgent,
  timeoutMs = 8000,
  force = false,
  retryDelayMs = 1000,
}) {
  if (!force && existsSync(cachePath)) {
    const html = await readFile(cachePath, "utf8");
    return { html, fromCache: true, bytes: Buffer.byteLength(html), status: 200 };
  }

  const attempt = async () => {
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
      throw new FetchError(`Non-200 status ${res.status} for ${url}`, {
        status: res.status,
      });
    }
    return res;
  };

  let res;
  try {
    res = await attempt(); // first try
  } catch (err) {
    // Retry ONLY on transient failures: timeout (no status) or 5xx server errors.
    // Do NOT retry 404 (missing) or 403 (forbidden) — asking again is impolite.
    const transient = err.status === null || (err.status >= 500 && err.status < 600);
    if (!transient) throw err;
    await new Promise((r) => setTimeout(r, retryDelayMs));
    res = await attempt(); // one retry, then give up
  }

  const html = await res.text();
  await mkdir(dirname(cachePath), { recursive: true });
  await writeFile(cachePath, html, "utf8");
  return { html, fromCache: false, bytes: Buffer.byteLength(html), status: 200 };
}
