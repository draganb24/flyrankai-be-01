import { getStats } from '../lib/services/taskService.js';

export const dynamic = 'force-dynamic';

export async function GET() {
    return Response.json(getStats());
}
