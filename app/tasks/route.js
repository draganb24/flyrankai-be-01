import { tasks, addTask } from '../lib/tasks';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    const { searchParams } = request.nextUrl;
    const rawDone = searchParams.get('done');
    const search = searchParams.get('search');

    let result = tasks;

    if (rawDone === 'true' || rawDone === 'false') {
        const done = rawDone === 'true';
        result = result.filter((task) => task.done === done);
    }

    if (search) {
        const needle = search.toLowerCase();
        result = result.filter((task) =>
            task.title.toLowerCase().includes(needle)
        );
    }

    return Response.json(result);
}

export async function POST(request) {
    let body;
    try {
        body = await request.json();
    } catch {
        return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const title = body?.title;
    if (typeof title !== 'string' || title.trim() === '') {
        return Response.json(
            { error: 'Title is required and must be a non-empty string' },
            { status: 400 }
        );
    }

    const task = addTask(title.trim());
    return Response.json(task, { status: 201 });
}
