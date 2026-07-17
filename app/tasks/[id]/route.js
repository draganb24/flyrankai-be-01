import { getTaskById } from '../../lib/tasks';

export async function GET(request, { params }) {
    const { id } = await params;
    const taskId = Number(id);
    const task = getTaskById(taskId);

    if (!task) {
        return Response.json({ error: `Task ${ taskId } not found` }, { status: 404 });
    }

    return Response.json(task);
}
