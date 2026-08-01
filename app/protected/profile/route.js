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

    return Response.json({ message: 'Profile access granted' }, { status: 200 });
}
