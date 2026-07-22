import { createTask, getRawTasks } from '../lib/services/taskService.js';
import { mapErrorToResponse } from '../lib/errors.js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    const params = new URL(request.url).searchParams;
    const search = params.get('search') ?? undefined;
    const doneParam = params.get('done');
    const done =
        doneParam === 'true' ? true : doneParam === 'false' ? false : undefined;
    return Response.json(getRawTasks(search, done));
}

export async function POST(request) {
    let body;
    try {
        body = await request.json();
    } catch {
        return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    try {
        const task = createTask(body);
        return Response.json(task, { status: 201 });
    } catch (error) {
        return mapErrorToResponse(error);
    }
}
