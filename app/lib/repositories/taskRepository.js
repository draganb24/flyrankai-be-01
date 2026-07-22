import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * @typedef {Object} Task
 * @property {number} id
 * @property {string} title
 * @property {boolean} done
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// three levels up from app/lib/repositories is the repo root, where /data/ lives
const DATA_DIR = path.join(__dirname, '..', '..', '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'tasks.db');

fs.mkdirSync(DATA_DIR, { recursive: true });
const db = new DatabaseSync(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    done INTEGER NOT NULL DEFAULT 0
  )
`);

/**
 * Seed three examples, but only when the table is empty (count first, so the
 * examples never multiply on restart).
 * @returns {void}
 */
function seedIfEmpty() {
  const row = db.prepare('SELECT COUNT(*) AS c FROM tasks').get();
  const count = Number(row.c);
  if (count > 0) return;
  const insert = db.prepare('INSERT INTO tasks (title, done) VALUES (?, ?)');
  const examples = [
    ['Learn the repository pattern', 0],
    ['Build the service layer', 0],
    ['Ship the API', 1],
  ];
  for (const [title, done] of examples) {
    insert.run(title, done);
  }
}
seedIfEmpty();

/**
 * @param {Record<string, unknown>} row
 * @returns {Task}
 */
function rowToTask(row) {
  return {
    id: /** @type {number} */ (row.id),
    title: /** @type {string} */ (row.title),
    done: row.done === 1,
  };
}

/** @returns {Task[]} */
export function findAll() {
  const rows = db.prepare('SELECT id, title, done FROM tasks ORDER BY id').all();
  return rows.map(rowToTask);
}

// Raw pass-through: `SELECT * FROM tasks`, rows exactly as stored (done as 0/1).
/** @returns {Record<string, unknown>[]} */
export function rawFindAll() {
  return db.prepare('SELECT * FROM tasks').all();
}

// Raw single-row lookup: `?` is a parameterized placeholder — id bound
// separately, never concatenated into the SQL string (SQL-injection safe).
/**
 * @param {number} id
 * @returns {Record<string, unknown> | undefined}
 */
export function rawFindById(id) {
  return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
}

/**
 * @param {number} id
 * @returns {Task | undefined}
 */
export function findById(id) {
  const row = db.prepare('SELECT id, title, done FROM tasks WHERE id = ?').get(id);
  return row ? rowToTask(row) : undefined;
}

/**
 * @param {string} title
 * @returns {Task}
 */
export function create(title) {
  const info = db.prepare('INSERT INTO tasks (title, done) VALUES (?, 0)').run(title);
  const created = findById(Number(info.lastInsertRowid));
  return /** @type {Task} */ (created);
}

/**
 * @param {number} id
 * @param {{ title?: string, done?: boolean }} patch
 * @returns {Task | undefined}
 */
export function update(id, patch) {
  const existing = findById(id);
  if (!existing) return undefined;
  if (typeof patch.title === 'string') {
    db.prepare('UPDATE tasks SET title = ? WHERE id = ?').run(patch.title, id);
  }
  if (typeof patch.done === 'boolean') {
    db.prepare('UPDATE tasks SET done = ? WHERE id = ?').run(patch.done ? 1 : 0, id);
  }
  return findById(id);
}

/**
 * @param {number} id
 * @returns {boolean}
 */
export function remove(id) {
  const info = db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
  return info.changes > 0;
}

/** @returns {void} */
export function reset() {
  db.prepare('DELETE FROM tasks').run();
  seedIfEmpty();
}
