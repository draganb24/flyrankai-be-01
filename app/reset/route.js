import { resetTasks } from '../lib/tasks';

export const dynamic = 'force-dynamic';

export async function POST() {
    const tasks = resetTasks();
    return Response.json(tasks);
}
