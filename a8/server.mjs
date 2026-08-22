// A8 · Stage 0 — setup: a server and a printer.
// One endpoint: GET /health -> { "status": "ok" }.
// The full report pipeline (query -> render -> store -> serve) is built in later stages.
import express from 'express';

const app = express();
// Default 3200 so it never clobbers the root Next.js dev server (3000) or a7 (3100).
const port = parseInt(process.env.A8_PORT || '3200', 10);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`A8 API ready on http://localhost:${port}  (try: GET /health)`);
});
