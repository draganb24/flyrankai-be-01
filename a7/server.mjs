import express from 'express';
import { inngest } from './inngest/client.mjs';
import { functions } from './inngest/functions.mjs';
import { db } from './inngest/store.mjs';
import { serve } from 'inngest/express';

const app = express();
const port = parseInt(process.env.A7PORT || '3100', 10);

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

let seq = 0;
app.post('/reports', async (req, res) => {
  const topic = (req.body && req.body.topic) || 'general';
  const reportId = `rep_${Date.now()}_${(seq += 1)}`;

  db.create(reportId, topic);

  await inngest.send({ name: 'report/requested', data: { reportId, topic } });

  res.status(202).json({ id: reportId, status: 'pending' });
});

app.get('/reports/:id', (req, res) => {
  const report = db.get(req.params.id);
  if (!report) {
    res.status(404).json({ error: 'report not found' });
    return;
  }
  res.json(report);
});

app.use('/api/inngest', serve({ client: inngest, functions }));

app.listen(port, () => {
  console.log(`A7 API ready on http://localhost:${port}  (try: GET /health)`);
});
