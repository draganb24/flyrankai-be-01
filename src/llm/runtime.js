import OpenAI from 'openai';
import fs from 'node:fs';
import path from 'node:path';
import { logCost } from './costlog.js';

const ROOT = process.cwd();

export function isKillSwitchOn() {
  if (process.env.LLM_KILL_SWITCH === 'true') return true;
  if (process.env.LLM_ENABLED === 'false') return true; // Stage 4 canonical switch
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
      timeout: Number(process.env.LLM_TIMEOUT_MS ?? 30000),
      maxRetries: 0,
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

const MAX_RETRIES = 2;
const BASE_BACKOFF_MS = 1000;
const DEFAULT_TIMEOUT_MS = Number(process.env.LLM_TIMEOUT_MS ?? 30000);

export class TimeoutError extends Error {
  constructor(message) {
    super(message);
    this.name = 'TimeoutError';
  }
}

export async function callModel(systemPrompt, userContent, opts = {}) {
  if (isKillSwitchOn()) throw new Error('kill-switch is on');

  const promptVersion = opts.promptVersion ?? 'enrich-v1';
  const role = opts.role ?? 'initial';
  const model = process.env.LLM_MODEL;
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const temperature = opts.temperature ?? 0;

  let attempt = 0;
  for (;;) {
    const started = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await getClient().chat.completions.create(
        {
          model,
          temperature,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: JSON.stringify(userContent) },
          ],
        },
        { signal: controller.signal },
      );
      const usage = res.usage ?? {};
      logCost({
        promptVersion,
        model,
        role,
        inputTokens: usage.prompt_tokens ?? null,
        outputTokens: usage.completion_tokens ?? null,
        durationMs: Date.now() - started,
        neededRepair: role === 'repair',
        status: 'ok',
      });
      return res.choices[0].message.content ?? '';
    } catch (err) {
      const aborted = err?.name === 'AbortError';
      const isTimeout = aborted || err?.name === 'TimeoutError';
      if (isTimeout) err = new TimeoutError('model call timed out');
      const durationMs = Date.now() - started;
      logCost({
        promptVersion,
        model,
        role,
        inputTokens: null,
        outputTokens: null,
        durationMs,
        neededRepair: role === 'repair',
        status: isTimeout ? 'timeout' : 'error',
        error: err?.message ?? String(err),
        retryable: isRetryable(err),
      });

      if (!isRetryable(err) || attempt >= MAX_RETRIES) {
        if (isTimeout) throw new TimeoutError(`model call timed out after ${timeoutMs}ms`);
        throw err;
      }

      attempt += 1;
      const retryAfter = err?.response?.headers?.get?.('retry-after');
      const base = retryAfter ? Number(retryAfter) * 1000 : BASE_BACKOFF_MS * 2 ** (attempt - 1);
      const jitter = Math.random() * 250;
      const waitMs = Math.max(0, (Number.isFinite(base) ? base : BASE_BACKOFF_MS) + jitter);
      await new Promise((r) => setTimeout(r, waitMs));
    } finally {
      clearTimeout(timer);
    }
  }
}
