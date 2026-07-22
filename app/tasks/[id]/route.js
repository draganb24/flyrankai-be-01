import { getRawTask, updateTask, deleteTask } from '../../lib/services/taskService.js';
import { mapErrorToResponse } from '../../lib/errors.js';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
    const { id } = await params;
    const taskId = Number(id);

    const task = getRawTask(taskId);
    if (!task) {
        return Response.json({ error: 'Task not found' }, { status: 404 });
    }
    return Response.json(task);
}

export async function PUT(request, { params }) {
    const { id } = await params;
    const taskId = Number(id);

    let body;
    try {
        body = await request.json();
    } catch {
        return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    try {
        return Response.json(updateTask(taskId, body));
    } catch (error) {
        return mapErrorToResponse(error);
    }
}

export async function DELETE(request, { params }) {
    const { id } = await params;
    const taskId = Number(id);

    try {
        deleteTask(taskId);
        return new Response(null, { status: 204 });
    } catch (error) {
        return mapErrorToResponse(error);
    }
}
