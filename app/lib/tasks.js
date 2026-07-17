const g = globalThis;

export const tasks = (g.__tasksStore ??= [
    { id: 1, title: 'Learn what an API is', done: true },
    { id: 2, title: 'Build a JSON endpoint', done: false },
    { id: 3, title: 'Understand HTTP status codes', done: false }
]);

export function getTaskById(id) {
    return tasks.find((task) => task.id === id);
}

export function addTask(title) {
    const nextId = tasks.reduce((max, task) => Math.max(max, task.id), 0) + 1;
    const task = { id: nextId, title, done: false };
    tasks.push(task);
    return task;
}

export function updateTask(id, patch) {
    const task = getTaskById(id);
    if (!task) return null;
    if (Object.prototype.hasOwnProperty.call(patch, 'title')) task.title = patch.title;
    if (Object.prototype.hasOwnProperty.call(patch, 'done')) task.done = patch.done;
    return task;
}

export function deleteTask(id) {
    const index = tasks.findIndex((task) => task.id === id);
    if (index === -1) return false;
    tasks.splice(index, 1);
    return true;
}
