import { createTask, getRawTasks } from '../lib/services/taskService.js';
import { mapErrorToResponse } from '../lib/errors.js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    const search = new URL(request.url).searchParams.get('search') ?? undefined;
    return Response.json(getRawTasks(search));
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
