export function isStub() {
  return process.env.LLM_STUB === '1' || process.env.LLM_MODE === 'stub';
}
