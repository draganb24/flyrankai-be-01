import { tasks, addTask } from '../lib/tasks';

export const dynamic = 'force-dynamic';

export async function GET() {
    return Response.json(tasks);
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
