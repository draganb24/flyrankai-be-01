export const tasks = [
    { id: 1, title: 'Learn what an API is', done: true },
    { id: 2, title: 'Build a JSON endpoint', done: false },
    { id: 3, title: 'Understand HTTP status codes', done: false }
];

export function getTaskById(id) {
    return tasks.find((task) => task.id === id);
}
