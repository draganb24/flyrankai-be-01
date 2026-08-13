// FlyRank Internship — Backend Track — Week 5 — Assignment A9
// Stage 5 — The run report.
//
// Honest numbers written at the end of every run. A scraper that reports
// nothing can fail silently for weeks; the report is how you notice.

export function buildReport({
  startedAt,
  endedAt,
  cataloguePages,
  liveFetches,
  cacheHits,
  validRecords,
  invalidRecords,
  failedPages,
}) {
  return {
    started_at: startedAt.toISOString(),
    ended_at: endedAt.toISOString(),
    duration_ms: endedAt.getTime() - startedAt.getTime(),
    catalogue_pages: cataloguePages,
    pages_fetched: liveFetches, // real requests to the site
    cache_hits: cacheHits, // served from local cache
    valid_records: validRecords,
    invalid_records: invalidRecords,
    failed_pages: failedPages, // pages that could not be fetched/parsed
  };
}
