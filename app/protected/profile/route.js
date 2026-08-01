import { getSupabase } from '../../lib/supabaseClient.js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
        return Response.json(
            { error: 'Access token required' },
            { status: 401 }
        );
    }

    const token = authHeader.slice('bearer '.length).trim();

    if (!token) {
        return Response.json(
            { error: 'Access token required' },
            { status: 401 }
        );
    }

    const supabase = getSupabase();

    let data, error;
    try {
        ({ data, error } = await supabase.auth.getUser(token));
    } catch (err) {
        console.error('Supabase token verification failed:', err);
        return Response.json(
            { error: 'Invalid or expired token' },
            { status: 401 }
        );
    }

    if (error || !data.user) {
        return Response.json(
            { error: 'Invalid or expired token' },
            { status: 401 }
        );
    }

    const { id, email, created_at } = data.user;

    return Response.json(
        {
            id,
            email,
            created_at
        },
        { status: 200 }
    );
}
