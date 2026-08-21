// FlyRank Internship · W4 · A7
// Stage 0 — hello server.
// A background-job system always starts life as a plain request/response API.
// This file grows across the stages; for now it is just a health endpoint.

import express from 'express';

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

// GET /health -> { "status": "ok" }
// Used by Stage 0's checkpoint and by the Inngest dev server's health probe.
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`A7 API ready on http://localhost:${port}  (try: GET /health)`);
});
