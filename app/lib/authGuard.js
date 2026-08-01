import { getSupabase } from './supabaseClient.js';

const UNAUTHORIZED = 'Access token required';
const INVALID_TOKEN = 'Invalid or expired token';

/**
 * Extracts the Bearer token from the Authorization header.
 * @param {Request} request
 * @returns {string | null}
 */
function extractToken(request) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
        return null;
    }
    const token = authHeader.slice('bearer '.length).trim();
    return token || null;
}

/**
 * Verifies the request's Bearer token against Supabase Auth.
 *
 * `supabase.auth.getUser(token)` makes a network call to Supabase's Auth
 * server, which is the only trustworthy way to confirm the JWT is real and
 * not expired or tampered with.
 *
 * @param {Request} request
 * @returns {Promise<{ user: import('@supabase/supabase-js').User } | { response: Response }>}
 */
async function authenticate(request) {
    const token = extractToken(request);
    if (!token) {
        return { response: Response.json({ error: UNAUTHORIZED }, { status: 401 }) };
    }

    const supabase = getSupabase();

    let data;
    let error;
    try {
        ({ data, error } = await supabase.auth.getUser(token));
    } catch (err) {
        console.error('Supabase token verification failed:', err);
        return { response: Response.json({ error: INVALID_TOKEN }, { status: 401 }) };
    }

    if (error || !data.user) {
        return { response: Response.json({ error: INVALID_TOKEN }, { status: 401 }) };
    }

    return {
        user: data.user,
        tokens: { access_token: token, refresh_token: null }
    };
}

/**
 * Auth middleware for App Router route handlers.
 *
 * Verifies the Bearer token and injects the authenticated user onto the
 * request as `request.user`. The wrapped handler only runs after the token
 * is verified; otherwise a 401 response is returned.
 *
 * @param {(request: Request, context: object) => Response | Promise<Response>} handler
 * @returns {(request: Request, context: object) => Promise<Response>}
 */
export function withAuth(handler) {
    return async function guarded(request, context) {
        const result = await authenticate(request);
        if (result.response) {
            return result.response;
        }

        request.user = result.user;
        request.tokens = { ...result.tokens };

        if (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH') {
            try {
                const body = await request.clone().json().catch(() => ({}));
                if (body && typeof body.refresh_token === 'string' && body.refresh_token) {
                    request.tokens.refresh_token = body.refresh_token;
                }
            } catch {
                // No usable JSON body — leave refresh_token null.
            }
        }

        return handler(request, context);
    };
}
