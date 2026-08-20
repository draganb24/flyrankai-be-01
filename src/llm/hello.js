const MODE = process.env.LLM_MODE ?? 'stub';

if (MODE === 'stub') {
  console.log('ready (stub — no model call, no spend)');
  process.exit(0);
}

const baseURL = process.env.LLM_BASE_URL;
const apiKey = process.env.LLM_API_KEY;
const model = process.env.LLM_MODEL;

if (!baseURL || !apiKey || !model) {
  console.error('Missing LLM_BASE_URL / LLM_API_KEY / LLM_MODEL in .env');
  process.exit(1);
}

const { default: OpenAI } = await import('openai');
const client = new OpenAI({ baseURL, apiKey });

const res = await client.chat.completions.create({
  model,
  messages: [{ role: 'user', content: 'Reply with exactly the word: ready' }],
});

console.log(res.choices[0].message.content);
