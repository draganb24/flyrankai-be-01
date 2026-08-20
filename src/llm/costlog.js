import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const COSTLOG_PATH = path.join(ROOT, 'logs', 'cost-log.jsonl');

export function logCost(entry) {
  const line = {
    ts: new Date().toISOString(),
    ...entry,
  };
  try {
    fs.mkdirSync(path.dirname(COSTLOG_PATH), { recursive: true });
    fs.appendFileSync(COSTLOG_PATH, JSON.stringify(line) + '\n', 'utf8');
  } catch (logErr) {
    console.error('[costlog] failed to write:', logErr);
  }
  return line;
}
