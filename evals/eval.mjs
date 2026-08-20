import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.EVAL_BASE_URL ?? 'http://localhost:3000';
const CASES_PATH = path.join(import.meta.dirname, 'cases.json');

const cases = JSON.parse(fs.readFileSync(CASES_PATH, 'utf8'));

let pass = 0;
const failures = [];

for (const c of cases) {
  let res;
  let status;
  try {
    const r = await fetch(`${BASE}/api/enrich`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(c.input),
    });
    status = r.status;
    res = await r.json();
  } catch (e) {
    failures.push({ id: c.id, status: 'request-error', got: `request failed: ${e.message}`, expect: c.expect });
    continue;
  }

  const gotCat = res?.category;
  let ok = gotCat === c.expect.category;
  if (ok && c.expect.min_confidence_below != null) {
    ok = typeof res?.confidence === 'number' && res.confidence < c.expect.min_confidence_below;
    if (!ok) {
      failures.push({
        id: c.id,
        status,
        got: `category=${gotCat} but confidence=${res?.confidence} (needed < ${c.expect.min_confidence_below})`,
        expect: c.expect,
      });
      continue;
    }
  }
  if (ok) {
    pass += 1;
  } else {
    failures.push({
      id: c.id,
      status,
      got: gotCat ?? res,
      expect: c.expect.category,
      note: c.note,
    });
  }
}

const total = cases.length;
const pct = Math.round((pass / total) * 100);
console.log(`\nEval result: ${pass}/${total} (${pct}%)`);
console.log(`Prompt version: enrich-v1   Date: ${new Date().toISOString().slice(0, 10)}`);
if (failures.length) {
  console.log('\nFailures:');
  for (const f of failures) console.log(`  #${f.id} [HTTP ${f.status ?? '?'}] got=${JSON.stringify(f.got)} expect=${JSON.stringify(f.expect)}`);
} else {
  console.log('All cases passed.');
}
process.exit(failures.length ? 1 : 0);
