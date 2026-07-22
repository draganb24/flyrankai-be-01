import * as repo from '../repositories/taskRepository.js';
import { ValidationError, NotFoundError } from '../errors.js';

function assertValidTitle(title) {
    if (typeof title !== 'string' || title.trim() === '') {
        throw new ValidationError('Title is required and must be a non-empty string');
    }
    return title.trim();
}

function assertValidDone(done) {
    if (typeof done !== 'boolean') {
        throw new ValidationError('Done must be a boolean');
    }
    return done;
}

export function getRawTasks() {
    return repo.rawFindAll();
}

export function getRawTask(id) {
    return repo.rawFindById(id);
}

export function createTask(body) {
    const title = assertValidTitle(body?.title);
    return repo.create(title);
}

export function updateTask(id, body = {}) {
    const hasTitle = Object.prototype.hasOwnProperty.call(body, 'title');
    const hasDone = Object.prototype.hasOwnProperty.call(body, 'done');

    if (!hasTitle && !hasDone) {
        throw new ValidationError('Body must contain a \'title\' or \'done\' field');
    }

    const patch = {};
    if (hasTitle) patch.title = assertValidTitle(body.title);
    if (hasDone) patch.done = assertValidDone(body.done);

    const updated = repo.update(id, patch);
    if (!updated) throw new NotFoundError(`Task ${ id } not found`);
    return (updated);
}

export function deleteTask(id) {
    const removed = repo.remove(id);
    if (!removed) throw new NotFoundError(`Task ${ id } not found`);
    return true;
}

export function getStats() {
    const tasks = repo.findAll();
    const done = tasks.filter((task) => task.done).length;
    return { total: tasks.length, done, open: tasks.length - done };
}

export function resetTasks() {
    return repo.reset();
}
