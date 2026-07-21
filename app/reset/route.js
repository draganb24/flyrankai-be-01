import { resetTasks } from '../lib/services/taskService.js';

export const dynamic = 'force-dynamic';

export async function POST() {
    return Response.json(resetTasks());
}
