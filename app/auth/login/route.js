import { getSupabase } from '../../lib/supabaseClient.js';
import { ValidationError } from '../../lib/errors.js';

export const dynamic = 'force-dynamic';

export async function POST(request) {
    const supabase = getSupabase();
    let body;
    try {
        body = await request.json();
    } catch {
        return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { email, password } = body ?? {};

    if (!email || !password) {
        throw new ValidationError('Email and password are required.');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        return Response.json(
            { error: 'Invalid login credentials' },
            { status: 401 }
        );
    }

    return Response.json(
        {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
        },
        { status: 200 }
    );
}
