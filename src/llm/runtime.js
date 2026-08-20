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
export function getClient() {
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
