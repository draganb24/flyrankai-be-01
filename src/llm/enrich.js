import { enrichOutputSchema } from './schema.js';
import { callModel, loadPrompt } from './runtime.js';

export function isStub() {
  return process.env.LLM_STUB === '1' || process.env.LLM_MODE === 'stub';
}

const STUB_OUTPUT = {
  category: 'other',
  summary: 'Stub response: the model was not called.',
  quality_flags: ['none'],
  confidence: 0.5,
  reason: 'Stub mode is on (LLM_STUB=1 or LLM_MODE=stub); set live mode to call the model.',
};

export function extractJson(text) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('No JSON object found in model output');
  }
  return JSON.parse(text.slice(start, end + 1));
}

export async function enrich(input) {
  if (isStub()) return enrichOutputSchema.parse(STUB_OUTPUT);

  const systemPrompt = loadPrompt('enrich-v1.md');
  const raw = await callModel(systemPrompt, input, { temperature: 0 });
  const parsed = extractJson(raw);
  return enrichOutputSchema.parse(parsed);
}
