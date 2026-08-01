import { getSupabase } from '../../lib/supabaseClient.js';
import { withAuth } from '../../lib/authGuard.js';

export const dynamic = 'force-dynamic';

export const POST = withAuth(async (request) => {
    const { access_token, refresh_token } = request.tokens;

    const supabase = getSupabase();

    if (refresh_token) {
        await supabase.auth.setSession({ access_token, refresh_token });
    } else {
        await supabase.auth.setSession({ access_token, refresh_token: access_token });
    }

    const { error } = await supabase.auth.signOut();

    if (error) {
        console.error('Supabase sign-out failed:', error);
        return Response.json(
            { error: 'Logout failed' },
            { status: 500 }
        );
    }

    return new Response(null, { status: 204 });
});
