// FlyRank Internship — Backend Track — Week 5 — Assignment A9
// Stage 4 — The record schema (Zod).
//
// The shape of a FINISHED record: which fields are required, what type each is,
// and which are optional. `description` is optional (null when the page has none).
// `price_gbp` must be a real number a program can sort/compare. The raw text
// values (price_text, etc.) live side by side with the cleaned ones.

import { z } from "zod";

// "£51.77" (or "£51.77" with NBSP/whitespace) -> 51.77
function parseGbp(text) {
  if (typeof text !== "string") return NaN;
  // strip everything except digits, dot, minus — pound sign, NBSP, commas gone.
  const cleaned = text.replace(/[^0-9.]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : NaN;
}

export const RecordSchema = z
  .object({
    title: z.string().min(1),
    product_url: z.string().url().startsWith("https://"),
    price_text: z.string().min(1),
    price_gbp: z.number().finite().nonnegative(),
    availability_text: z.string().min(1),
    rating_text: z.string().min(1),
    description: z.string().nullable(),
    source_page: z.string().url().startsWith("https://"),
    fetched_at: z.string().min(1),
  })
  .strict(); // no stray fields allowed — keep the record shape honest

export { parseGbp };
