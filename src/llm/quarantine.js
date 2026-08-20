import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const QUARANTINE_PATH = path.join(ROOT, 'logs', 'quarantine.jsonl');

export function quarantine({ input, attempts, error, promptVersion }) {
  const entry = {
    ts: new Date().toISOString(),
    promptVersion,
    input,
    attempts,
    error: error instanceof Error ? error.message : String(error),
  };
  try {
    fs.mkdirSync(path.dirname(QUARANTINE_PATH), { recursive: true });
    fs.appendFileSync(QUARANTINE_PATH, JSON.stringify(entry) + '\n', 'utf8');
  } catch (logErr) {
    console.error('[quarantine] failed to write log:', logErr);
  }
}
