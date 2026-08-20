import { enrichInputSchema, enrichOutputSchema } from '../../../src/llm/schema.js';
import { enrich } from '../../../src/llm/enrich.js';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = enrichInputSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = issue.path.join('.') || 'body';
    return Response.json(
      { error: `Invalid field: ${field}`, details: issue.message },
      { status: 400 },
    );
  }

  const result = await enrich(parsed.data);

  const output = enrichOutputSchema.parse(result);
  return Response.json(output, { status: 200 });
}
