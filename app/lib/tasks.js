export const tasks = [
    { id: 1, title: 'Learn what an API is', done: true },
    { id: 2, title: 'Build a JSON endpoint', done: false },
    { id: 3, title: 'Understand HTTP status codes', done: false }
];

export function getTaskById(id) {
    return tasks.find((task) => task.id === id);
}

export function addTask(title) {
    const nextId = tasks.reduce((max, task) => Math.max(max, task.id), 0) + 1;
    const task = { id: nextId, title, done: false };
    tasks.push(task);
    return task;
}
