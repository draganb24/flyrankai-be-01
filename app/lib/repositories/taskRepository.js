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
const DATA_DIR = path.join(__dirname, '..', '..', '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'tasks.db');

fs.mkdirSync(DATA_DIR, { recursive: true });
const db = new DatabaseSync(DB_PATH);

db.exec(`
    CREATE TABLE IF NOT EXISTS tasks
    (
        id
        INTEGER
        PRIMARY
        KEY,
        title
        TEXT
        NOT
        NULL,
        done
        INTEGER
        NOT
        NULL
        DEFAULT
        0
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
        [ 'Learn the repository pattern', 0 ],
        [ 'Build the service layer', 0 ],
        [ 'Ship the API', 1 ]
    ];
    for (const [ title, done ] of examples) {
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
        done: row.done === 1
    };
}

/** @returns {Record<string, unknown>[]} */
export function rawFindAll() {
    return db.prepare('SELECT * FROM tasks ORDER BY title').all();
}

/**
 * Aggregate counts in the database with `COUNT(*)` and `SUM(done)` — no rows
 * are pulled into JS to count. `done` is stored as 0/1, so `SUM(done)` is the
 * completed count; `total - done` is the open count.
 * @returns {{ total: number, done: number, open: number }}
 */
export function getStatsRaw() {
    const row = /** @type {{ total: number, done: number }} */ (
        db
            .prepare('SELECT COUNT(*) AS total, SUM(done) AS done FROM tasks')
            .get()
    );
    const total = Number(row.total);
    const done = Number(row.done);
    return { total, done, open: total - done };
}

/**
 * @param {string} term
 * @returns {Record<string, unknown>[]}
 */
export function searchRaw(term) {
    return db
        .prepare('SELECT * FROM tasks WHERE title LIKE ? ORDER BY title')
        .all(`%${ term }%`);
}

/**
 * @param {boolean} done
 * @returns {Record<string, unknown>[]}
 */
export function filterByDoneRaw(done) {
    return db
        .prepare('SELECT * FROM tasks WHERE done = ? ORDER BY title')
        .all(done ? 1 : 0);
}

/**
 * @param {string} term
 * @param {boolean} done
 * @returns {Record<string, unknown>[]}
 */
export function searchAndDoneRaw(term, done) {
    return db
        .prepare('SELECT * FROM tasks WHERE title LIKE ? AND done = ? ORDER BY title')
        .all(`%${ term }%`, done ? 1 : 0);
}

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
    const info = db.prepare('INSERT INTO tasks (title, done) VALUES (?, ?)').run(title, 0);
    const created = findById(Number(info.lastInsertRowid));
    return /** @type {Task} */ (created);
}

/**
 * Update one task with a partial patch. Runs a single parameterized statement:
 *   UPDATE tasks SET title = ?, done = ? WHERE id = ?
 * Untouched fields keep their current value. Missing id -> undefined (404).
 * @param {number} id
 * @param {{ title?: string, done?: boolean }} patch
 * @returns {Task | undefined}
 */
export function update(id, patch) {
    const existing = findById(id);
    if (!existing) return undefined;
    const title = typeof patch.title === 'string' ? patch.title : existing.title;
    const done = typeof patch.done === 'boolean' ? patch.done : existing.done;
    db.prepare('UPDATE tasks SET title = ?, done = ? WHERE id = ?').run(
        title,
        done ? 1 : 0,
        id
    );
    return findById(id);
}

/**
 * @param {number} id
 * @returns {boolean} true if a row was deleted
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
