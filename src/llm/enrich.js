import { enrichOutputSchema } from './schema.js';
import { callModel, loadPrompt, TimeoutError } from './runtime.js';
import { quarantine } from './quarantine.js';
import { isStub } from './stub.js';

export { TimeoutError };

const STUB_OUTPUT = {
  category: 'other',
  summary: 'Stub response: the model was not called.',
  quality_flags: ['none'],
  confidence: 0.5,
  reason: 'Stub mode is on (LLM_STUB=1 or LLM_MODE=stub); set live mode to call the model.',
};

const PROMPT_VERSION = 'enrich-v1';

export function extractJson(text) {
  if (typeof text !== 'string') throw new Error('Model returned no text');
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('No JSON object found in model output');
  }
  return JSON.parse(candidate.slice(start, end + 1));
}

function parseAndValidate(raw) {
  let parsed;
  try {
    parsed = extractJson(raw);
  } catch (e) {
    const err = new Error(`parse failed: ${e.message}`);
    err.raw = raw;
    throw err;
  }
  const result = enrichOutputSchema.safeParse(parsed);
  if (!result.success) {
    const err = new Error(`validation failed: ${result.error.issues[0].message}`);
    err.raw = raw;
    err.issues = result.error.issues;
    throw err;
  }
  return result.data;
}

export async function enrich(input) {
  if (isStub()) return enrichOutputSchema.parse(STUB_OUTPUT);

  const systemPrompt = loadPrompt(`${PROMPT_VERSION}.md`);
  const attempts = [];

  let raw;
  try {
    raw = await callModel(systemPrompt, input, {
      temperature: 0,
      role: 'initial',
      promptVersion: PROMPT_VERSION,
    });
  } catch (e) {
    attempts.push({ role: 'initial', raw: undefined, error: e.message });
    throw e;
  }
  attempts.push({ role: 'initial', raw });

  try {
    return parseAndValidate(raw);
  } catch (firstErr) {
    const repairPrompt = [
      'Your previous answer was rejected for this reason:',
      firstErr.message,
      'Return only corrected JSON matching the schema. No commentary, no code fences.',
    ].join('\n');

    let raw2;
    try {
      raw2 = await callModel(
        systemPrompt,
        { ...input, _repair_note: repairPrompt },
        { temperature: 0, role: 'repair', promptVersion: PROMPT_VERSION },
      );
    } catch (e) {
      attempts.push({ role: 'repair', raw: undefined, error: e.message });
      throw new EnrichError('repair call failed', { attempts, cause: e });
    }
    attempts.push({ role: 'repair', raw: raw2 });

    try {
      return parseAndValidate(raw2);
    } catch (secondErr) {
      throw new EnrichError('could not produce schema-valid output after repair', {
        attempts,
        cause: secondErr,
      });
    }
  }
}

export class EnrichError extends Error {
  constructor(message, { attempts, cause } = {}) {
    super(message);
    this.name = 'EnrichError';
    this.attempts = attempts;
    this.cause = cause;
  }
}

export function failCleanly(input, err) {
  const attempts = err instanceof EnrichError ? err.attempts : undefined;
  quarantine({ input, attempts, error: err, promptVersion: PROMPT_VERSION });
  return Response.json(
    {
      error: 'enrichment failed',
      detail: 'model output could not be validated after one repair attempt',
    },
    { status: 422 },
  );
}
