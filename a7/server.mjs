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
app.post('/report', async (req, res) => {
  const topic = (req.body && req.body.topic) || 'general';
  const reportId = `rep_${Date.now()}_${(seq += 1)}`;

  db.create(reportId, topic);

  await inngest.send({ name: 'report/requested', data: { reportId, topic } });

  res.status(202).json({
    reportId,
    status: 'pending',
    statusUrl: `/report/${reportId}`,
  });
});

app.use('/api/inngest', serve({ client: inngest, functions }));

app.listen(port, () => {
  console.log(`A7 API ready on http://localhost:${port}  (try: GET /health)`);
});
