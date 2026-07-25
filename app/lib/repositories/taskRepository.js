import pg from 'pg';

/**
 * @typedef {Object} Task
 * @property {number} id
 * @property {string} title
 * @property {boolean} done
 */

const CONNECTION_STRING = process.env.DATABASE_URL;

const pool = new pg.Pool({ connectionString: CONNECTION_STRING });

pool
    .query(
        `CREATE TABLE IF NOT EXISTS tasks
         (
             id
             SERIAL
             PRIMARY
             KEY,
             title
             TEXT
             NOT
             NULL,
             done
             BOOLEAN
             NOT
             NULL
             DEFAULT
             false
         )`
    )
    .then(() => pool.query(
        'CREATE INDEX IF NOT EXISTS idx_tasks_done ON tasks (done)'
    ))
    .then(() => pool.query('SELECT COUNT(*)::int AS c FROM tasks'))
    .then(({ rows }) => {
        if (Number(rows[0].c) > 0) return;
        const examples = /** @type {Array<[string, boolean]>} */ ([
            [ 'Learn the repository pattern', false ],
            [ 'Build the service layer', false ],
            [ 'Ship the API', true ]
        ]);
        return pgFormatInsert(pool, examples);
    })
    .catch((err) => {
        console.error('[taskRepository] startup init failed:', err.message);
    });

/**
 * Seed the examples inside a single transaction.
 * @param {pg.Pool} pool
 * @param {Array<[string, boolean]>} examples
 * @returns {Promise<void>}
 */
async function pgFormatInsert(pool, examples) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        for (const [ title, done ] of examples) {
            await client.query('INSERT INTO tasks (title, done) VALUES ($1, $2)', [ title, done ]);
        }
        await client.query('COMMIT');
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}

/**
 * @param {Record<string, unknown>} row
 * @returns {Task}
 */
function rowToTask(row) {
    return {
        id: /** @type {number} */ (row.id),
        title: /** @type {string} */ (row.title),
        done: row.done === true
    };
}

/** @returns {Promise<Record<string, unknown>[]>} */
export async function rawFindAll() {
    const { rows } = await pool.query('SELECT * FROM tasks');
    return rows;
}

/**
 * Aggregate counts in the database with `COUNT(*)` and `SUM(done)` — no rows
 * are pulled into JS to count. `done` is stored as boolean, so `SUM(done)` is
 * the completed count; `total - done` is the open count.
 * @returns {Promise<{ total: number, done: number, open: number }>}
 */
export async function getStatsRaw() {
    const { rows } = await pool.query(
        'SELECT COUNT(*)::int AS total, COALESCE(SUM(done::int), 0)::int AS done FROM tasks'
    );
    const total = Number(rows[0].total);
    const done = Number(rows[0].done);
    return { total, done, open: total - done };
}

/**
 * @param {string} term
 * @returns {Promise<Record<string, unknown>[]>}
 */
export async function searchRaw(term) {
    const { rows } = await pool.query('SELECT * FROM tasks WHERE title ILIKE $1 ORDER BY title', [
        `%${ term }%`
    ]);
    return rows;
}

/**
 * @param {boolean} done
 * @returns {Promise<Record<string, unknown>[]>}
 */
export async function filterByDoneRaw(done) {
    const { rows } = await pool.query('SELECT * FROM tasks WHERE done = $1 ORDER BY title', [ done ]);
    return rows;
}

/**
 * @param {string} term
 * @param {boolean} done
 * @returns {Promise<Record<string, unknown>[]>}
 */
export async function searchAndDoneRaw(term, done) {
    const { rows } = await pool.query(
        'SELECT * FROM tasks WHERE title ILIKE $1 AND done = $2 ORDER BY title',
        [ `%${ term }%`, done ]
    );
    return rows;
}

/**
 * @param {number} id
 * @returns {Promise<Record<string, unknown> | undefined>}
 */
export async function rawFindById(id) {
    const { rows } = await pool.query('SELECT * FROM tasks WHERE id = $1', [ id ]);
    return rows[0];
}

/**
 * @param {number} id
 * @returns {Promise<Task | undefined>}
 */
export async function findById(id) {
    const { rows } = await pool.query('SELECT id, title, done FROM tasks WHERE id = $1', [ id ]);
    return rows[0] ? rowToTask(rows[0]) : undefined;
}

/**
 * @param {string} title
 * @returns {Promise<Task>}
 */
export async function create(title) {
    const { rows } = await pool.query(
        'INSERT INTO tasks (title, done) VALUES ($1, $2) RETURNING *',
        [ title, false ]
    );
    return /** @type {Task} */ (rowToTask(rows[0]));
}

/**
 * Update one task with a partial patch. Runs a single parameterized statement.
 * Untouched fields keep their current value. Missing id -> undefined (404).
 * @param {number} id
 * @param {{ title?: string, done?: boolean }} patch
 * @returns {Promise<Task | undefined>}
 */
export async function update(id, patch) {
    const existing = await findById(id);
    if (!existing) return undefined;
    const title = typeof patch.title === 'string' ? patch.title : existing.title;
    const done = typeof patch.done === 'boolean' ? patch.done : existing.done;
    const { rows } = await pool.query(
        'UPDATE tasks SET title = $1, done = $2 WHERE id = $3 RETURNING id, title, done',
        [ title, done, id ]
    );
    return rows[0] ? rowToTask(rows[0]) : undefined;
}

/**
 * @param {number} id
 * @returns {Promise<boolean>} true if a row was deleted
 */
export async function remove(id) {
    const { rowCount } = await pool.query('DELETE FROM tasks WHERE id = $1', [ id ]);
    return (rowCount ?? 0) > 0;
}

/** @returns {Promise<void>} */
export async function reset() {
    await pool.query('DELETE FROM tasks');
    await pgFormatInsert(
        pool,
        /** @type {Array<[string, boolean]>} */ ([
            [ 'Learn the repository pattern', false ],
            [ 'Build the service layer', false ],
            [ 'Ship the API', true ]
        ])
    );
}
