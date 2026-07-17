export async function GET() {
    return Response.json({
        name: 'Task API',
        version: '1.0',
        endpoints: [ '/tasks' ]
    });
}
