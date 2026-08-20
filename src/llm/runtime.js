import OpenAI from 'openai';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

export function isKillSwitchOn() {
  if (process.env.LLM_KILL_SWITCH === 'true') return true;
  try {
    return fs.existsSync(path.join(ROOT, 'data', 'kill-switch'));
  } catch {
    return false;
  }
}

let _client;
export let __testClient = null;
export function __setTestClient(c) {
  __testClient = c;
}
export function getClient() {
  if (__testClient) return __testClient;
  if (process.env.LLM_STUB_CLIENT === '1') {
    return {
      chat: {
        completions: {
          create: async () => ({
            choices: [{ message: { content: process.env.LLM_STUB_CLIENT_OUTPUT ?? '{}' } }],
          }),
        },
      },
    };
  }
  if (!_client) {
    _client = new OpenAI({
      baseURL: process.env.LLM_BASE_URL,
      apiKey: process.env.LLM_API_KEY,
    });
  }
  return _client;
}

export function loadPrompt(file = 'enrich-v1.md') {
  const p = path.join(ROOT, 'prompts', file);
  return fs.readFileSync(p, 'utf8');
}

const RETRYABLE_STATUS = new Set([408, 409, 425, 429, 500, 502, 503, 504]);
export function isRetryable(err) {
  if (err?.name === 'AbortError' || err?.name === 'TimeoutError') return true;
  const status =
    err?.status ??
    err?.response?.status ??
    err?.error?.status ??
    (typeof err?.code === 'number' ? err.code : undefined);
  if (status && RETRYABLE_STATUS.has(status)) return true;
  if (/rate.?limit|timeout|try again|server error/i.test(err?.message ?? '')) return true;
  return false;
}

const DEFAULT_TIMEOUT_MS = Number(process.env.LLM_TIMEOUT_MS ?? 12000);

export async function callModel(systemPrompt, userContent, opts = {}) {
  if (isKillSwitchOn()) throw new Error('kill-switch is on');
  const client = getClient();
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const temperature = opts.temperature ?? 0; // low: same input -> same answer, not creativity

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await client.chat.completions.create(
      {
        model: process.env.LLM_MODEL,
        temperature,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: JSON.stringify(userContent) },
        ],
      },
      { signal: controller.signal },
    );
    return res.choices[0].message.content ?? '';
  } finally {
    clearTimeout(timer);
  }
}
