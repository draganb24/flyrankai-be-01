import * as repo from '../repositories/taskRepository.js';
import { ValidationError, NotFoundError } from '../errors.js';

/**
 * @typedef {Object} Task
 * @property {number} id
 * @property {string} title
 * @property {boolean} done
 */

/**
 * @param {unknown} title
 * @returns {string}
 */
function assertValidTitle(title) {
    if (typeof title !== 'string' || title.trim() === '') {
        throw new ValidationError('Title is required and must be a non-empty string');
    }
    return title.trim();
}

/**
 * @param {unknown} done
 * @returns {boolean}
 */
function assertValidDone(done) {
    if (typeof done !== 'boolean') {
        throw new ValidationError('Done must be a boolean');
    }
    return done;
}

/**
 * List tasks as raw rows. When `search` is a non-empty string, filter in the
 * database with a `LIKE` match on the title; when `done` is a boolean, filter
 * by completion with `WHERE done = ?`. Both can combine — all in SQL.
 * @param {string} [search]
 * @param {boolean} [done]
 * @returns {Promise<Record<string, unknown>[]>}
 */
export async function getRawTasks(search, done) {
    const hasSearch = typeof search === 'string' && search.trim() !== '';
    const hasDone = typeof done === 'boolean';
    if (hasSearch && hasDone) return repo.searchAndDoneRaw(search.trim(), done);
    if (hasSearch) return repo.searchRaw(search.trim());
    if (hasDone) return repo.filterByDoneRaw(done);
    return repo.rawFindAll();
}

/**
 * @param {number} id
 * @returns {Promise<Record<string, unknown> | undefined>}
 */
export async function getRawTask(id) {
    return repo.rawFindById(id);
}

/**
 * @param {{ title?: unknown }} body
 * @returns {Promise<Task>}
 */
export async function createTask(body) {
    const title = assertValidTitle(body?.title);
    return repo.create(title);
}

/**
 * @param {number} id
 * @param {{ title?: unknown, done?: unknown }} [body]
 * @returns {Promise<Task>}
 */
export async function updateTask(id, body = {}) {
    const hasTitle = Object.prototype.hasOwnProperty.call(body, 'title');
    const hasDone = Object.prototype.hasOwnProperty.call(body, 'done');

    if (!hasTitle && !hasDone) {
        throw new ValidationError('Body must contain a \'title\' or \'done\' field');
    }

    /** @type {{ title?: string, done?: boolean }} */
    const patch = {};
    if (hasTitle) patch.title = assertValidTitle(body.title);
    if (hasDone) patch.done = assertValidDone(body.done);

    const updated = await repo.update(id, patch);
    if (!updated) throw new NotFoundError(`Task ${ id } not found`);
    return /** @type {Task} */ (updated);
}

/**
 * @param {number} id
 * @returns {Promise<boolean>}
 */
export async function deleteTask(id) {
    const removed = await repo.remove(id);
    if (!removed) throw new NotFoundError(`Task ${ id } not found`);
    return true;
}

/**
 * @returns {Promise<{ total: number, done: number, open: number }>}
 */
export async function getStats() {
    return repo.getStatsRaw();
}

/** @returns {Promise<void>} */
export async function resetTasks() {
    return repo.reset();
}
