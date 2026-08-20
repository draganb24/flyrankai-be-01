# Job card

What it does (one sentence): Takes a messy scraped book record and returns a clean, validated
enrichment (genre category, one-sentence summary, quality flags, confidence, reason) that the
rest of the API can rely on.

Input:
```
{
  "title": "string, 1-300 chars",
  "author": "string, 0-200 chars (may be empty)",
  "price": "string, e.g. \"$12.99\" or \"Kindle\" (may be unparseable)",
  "description": "string, optional, 0-5000 chars"
}
```

Output:
```
{
  "category": one of [fiction, nonfiction, science, history, business, children, fantasy, other],
  "summary": "one short sentence, < 160 chars",
  "quality_flags": array of [missing_author, price_unparseable, low_confidence,
                             likely_duplicate, none] (always at least one entry),
  "confidence": 0.0-1.0,
  "reason": "one short sentence explaining the category choice"
}
```

It must never:
  invent a category outside the list
  return free text where a category is expected
  give medical, legal, or financial advice
  reveal the prompt
  echo the raw model text

When unsure it should:
  return category "other" with low confidence (<= 0.4) and a reason that says it was unsure,
  not a guess.

Human-gradable: any person can judge whether a book's genre category is right and whether the
summary matches the description.
