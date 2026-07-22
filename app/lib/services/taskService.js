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
 * database with a `LIKE` match on the title; otherwise return everything.
 * @param {string} [search]
 * @returns {Record<string, unknown>[]}
 */
export function getRawTasks(search) {
    if (typeof search === 'string' && search.trim() !== '') {
        return repo.searchRaw(search.trim());
    }
    return repo.rawFindAll();
}

/**
 * @param {number} id
 * @returns {Record<string, unknown> | undefined}
 */
export function getRawTask(id) {
    return repo.rawFindById(id);
}

/**
 * @param {{ title?: unknown }} body
 * @returns {Task}
 */
export function createTask(body) {
    const title = assertValidTitle(body?.title);
    return repo.create(title);
}

/**
 * @param {number} id
 * @returns {Task}
 */
export function getTask(id) {
    const task = repo.findById(id);
    if (!task) throw new NotFoundError(`Task ${ id } not found`);
    return task;
}

/**
 * @param {number} id
 * @param {{ title?: unknown, done?: unknown }} [body]
 * @returns {Task}
 */
export function updateTask(id, body = {}) {
    const hasTitle = Object.prototype.hasOwnProperty.call(body, 'title');
    const hasDone = Object.prototype.hasOwnProperty.call(body, 'done');

    if (!hasTitle && !hasDone) {
        throw new ValidationError('Body must contain a \'title\' or \'done\' field');
    }

    /** @type {{ title?: string, done?: boolean }} */
    const patch = {};
    if (hasTitle) patch.title = assertValidTitle(body.title);
    if (hasDone) patch.done = assertValidDone(body.done);

    const updated = repo.update(id, patch);
    if (!updated) throw new NotFoundError(`Task ${ id } not found`);
    return /** @type {Task} */ (updated);
}

/**
 * @param {number} id
 * @returns {boolean}
 */
export function deleteTask(id) {
    const removed = repo.remove(id);
    if (!removed) throw new NotFoundError(`Task ${ id } not found`);
    return true;
}

/**
 * @returns {{ total: number, done: number, open: number }}
 */
export function getStats() {
    const tasks = repo.findAll();
    const done = tasks.filter((task) => task.done).length;
    return { total: tasks.length, done, open: tasks.length - done };
}

/** @returns {void} */
export function resetTasks() {
    return repo.reset();
}
