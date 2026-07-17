import { getTaskById, updateTask, deleteTask } from '../../lib/tasks';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
    const { id } = await params;
    const taskId = Number(id);
    const task = getTaskById(taskId);

    if (!task) {
        return Response.json({ error: `Task ${ taskId } not found` }, { status: 404 });
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

    const patch = {};
    if (Object.prototype.hasOwnProperty.call(body, 'title')) {
        if (typeof body.title !== 'string' || body.title.trim() === '') {
            return Response.json(
                { error: 'Title must be a non-empty string' },
                { status: 400 }
            );
        }
        patch.title = body.title.trim();
    }
    if (Object.prototype.hasOwnProperty.call(body, 'done')) {
        if (typeof body.done !== 'boolean') {
            return Response.json({ error: 'Done must be a boolean' }, { status: 400 });
        }
        patch.done = body.done;
    }

    if (Object.keys(patch).length === 0) {
        return Response.json(
            { error: 'Body must contain a \'title\' or \'done\' field' },
            { status: 400 }
        );
    }

    const updated = updateTask(taskId, patch);
    if (!updated) {
        return Response.json({ error: `Task ${ taskId } not found` }, { status: 404 });
    }

    return Response.json(updated);
}

export async function DELETE(request, { params }) {
    const { id } = await params;
    const taskId = Number(id);

    const removed = deleteTask(taskId);
    if (!removed) {
        return Response.json({ error: `Task ${ taskId } not found` }, { status: 404 });
    }

    return new Response(null, { status: 204 });
}
