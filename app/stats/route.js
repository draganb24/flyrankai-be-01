import { tasks } from '../lib/tasks';

export const dynamic = 'force-dynamic';

export async function GET() {
    const done = tasks.filter((task) => task.done).length;
    return Response.json({
        total: tasks.length,
        done,
        open: tasks.length - done
    });
}
