// FlyRank Internship — Backend Track — Week 5 — Assignment A9
// Stage 4 — Clean it, check it, store it.
//
// Normalize the raw records (price_text -> price_gbp number), de-duplicate by
// the canonical product_url, validate each against the Zod schema, and split
// good records from failures. Idempotent: the same inputs always yield the
// same 60 good records (dedup keyed on product_url).

import { RecordSchema, parseGbp } from "./schema.js";

// raw: an 8-field record from Stage 3 (price_text is a string).
// Returns a normalized record with price_gbp added, raw text preserved.
export function normalizeRecord(raw) {
  const price_gbp = parseGbp(raw.price_text);
  return {
    ...raw, // keep title, product_url, price_text, availability_text, ...
    price_gbp, // numeric — sortable / comparable
  };
}

// entries: array of raw 8-field records.
// Returns { good: [...], errors: [{ record, reason, product_url }] }.
// Good records are de-duplicated by canonical product_url (identity).
export function validateRecords(rawRecords) {
  const good = [];
  const seen = new Set();
  const errors = [];

  for (const raw of rawRecords) {
    const candidate = normalizeRecord(raw);
    // Canonical URL is the record's identity — never count a book twice.
    const key = candidate.product_url;
    if (seen.has(key)) continue; // duplicate, silently dropped (not an error)

    const result = RecordSchema.safeParse(candidate);
    if (result.success) {
      seen.add(key);
      good.push(candidate);
    } else {
      errors.push({
        product_url: key,
        reason: result.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; "),
        record: candidate,
      });
    }
  }

  return { good, errors };
}
