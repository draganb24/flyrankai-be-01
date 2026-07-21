import { listTasks, createTask } from '../lib/services/taskService.js';
import { mapErrorToResponse } from '../lib/errors.js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    const { searchParams } = request.nextUrl;
    const rawDone = searchParams.get('done');
    const search = searchParams.get('search') ?? undefined;

    let done;
    if (rawDone === 'true') done = true;
    else if (rawDone === 'false') done = false;

    return Response.json(listTasks({ done, search }));
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
