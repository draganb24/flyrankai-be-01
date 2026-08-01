import { withAuth } from '../../lib/authGuard.js';

export const dynamic = 'force-dynamic';

export const GET = withAuth(async (request) => {
    const { id, email } = request.user;

    return Response.json(
        {
            message: 'Welcome to your dashboard',
            user: { id, email }
        },
        { status: 200 }
    );
});
