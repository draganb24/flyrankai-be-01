import { tasks } from '../lib/tasks';

export async function GET() {
    return Response.json(tasks);
}
