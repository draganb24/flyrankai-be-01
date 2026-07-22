import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

function rowToTask(row) {
    return {
        id: (row.id),
        title: (row.title),
        done: row.done === 1
    };
}

export function findAll() {
    const rows = db.prepare('SELECT id, title, done FROM tasks ORDER BY id').all();
    return rows.map(rowToTask);
}

export function rawFindAll() {
    return db.prepare('SELECT * FROM tasks').all();
}

export function rawFindById(id) {
    return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
}

export function findById(id) {
    const row = db.prepare('SELECT id, title, done FROM tasks WHERE id = ?').get(id);
    return row ? rowToTask(row) : undefined;
}

export function create(title) {
    const info = db.prepare('INSERT INTO tasks (title, done) VALUES (?, ?)').run(title, 0);
    const created = findById(Number(info.lastInsertRowid));
    return (created);
}

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

export function remove(id) {
    const info = db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
    return info.changes > 0;
}

export function reset() {
    db.prepare('DELETE FROM tasks').run();
    seedIfEmpty();
}
