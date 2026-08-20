import { enrichOutputSchema } from './schema.js';

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

export async function enrich(input) {
  void input;
  if (isStub()) return enrichOutputSchema.parse(STUB_OUTPUT);
  throw new Error('Live mode is not implemented until Stage 2');
}
