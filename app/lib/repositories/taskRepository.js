const g = globalThis;

const SEED = [
    { id: 1, title: 'Learn what an API is', done: true },
    { id: 2, title: 'Build a JSON endpoint', done: false },
    { id: 3, title: 'Understand HTTP status codes', done: false }
];

const store = (g.__tasksStore ??= SEED.map((task) => ({ ...task })));

export function findAll() {
    return store;
}

export function findById(id) {
    return store.find((task) => task.id === id) ?? null;
}

export function create(title) {
    const nextId = store.reduce((max, task) => Math.max(max, task.id), 0) + 1;
    const task = { id: nextId, title, done: false };
    store.push(task);
    return task;
}

export function update(id, patch) {
    const task = findById(id);
    if (!task) return null;
    if (typeof patch.title === 'string') task.title = patch.title;
    if (typeof patch.done === 'boolean') task.done = patch.done;
    return task;
}

export function remove(id) {
    const index = store.findIndex((task) => task.id === id);
    if (index === -1) return false;
    store.splice(index, 1);
    return true;
}

export function reset() {
    store.length = 0;
    store.push(...SEED.map((task) => ({ ...task })));
    return store;
}
