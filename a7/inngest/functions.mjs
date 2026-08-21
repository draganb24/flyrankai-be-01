import { inngest } from './client.mjs';
import { db } from './store.mjs';

export const makeReport = inngest.createFunction(
  { id: 'make-report', retries: 2, triggers: [{ event: 'report/requested' }] },
  async ({ event, step }) => {
    const { reportId, topic } = event.data;

    await step.sleep('do-the-slow-work', '8s');

    const result = await step.run('build-report', () => {
      if (topic === 'fail') {
        throw new Error('The report oven is broken!');
      }
      return {
        topic,
        headline: `Quarterly summary for "${topic}"`,
        sections: 5,
        generatedAt: new Date().toISOString(),
      };
    });

    await step.run('mark-done', () => {
      db.setDone(reportId, result);
      return { marked: true };
    });

    return { reportId, result };
  }
);

let flakyAttempts = 0;
export const flakyTask = inngest.createFunction(
  { id: 'flaky-task', retries: 3, triggers: [{ event: 'demo/flaky' }] },
  async () => {
    flakyAttempts += 1;
    if (flakyAttempts < 3) {
      throw new Error(`Intentional failure #${flakyAttempts} (demo retry)`);
    }
    return { ok: true, succeededOnAttempt: flakyAttempts };
  }
);

export const dailyDigest = inngest.createFunction(
  { id: 'daily-digest', triggers: [{ cron: '0 8 * * *' }] },
  async () => {
    const ranAt = new Date().toISOString();
    console.log(`[cron] daily-digest ran at ${ranAt} (no request triggered this)`);
    return { ranAt };
  }
);

export const sayHello = inngest.createFunction(
  { id: 'say-hello', triggers: [{ event: 'test/hello' }] },
  async ({ step }) => {
    await step.sleep('wait', '5s');
    return 'Hello from the background!';
  }
);

export const heartbeat = inngest.createFunction(
  { id: 'heartbeat', triggers: [{ cron: '* * * * *' }] },
  async () => {
    const { pending, done, failed } = db.stats();
    console.log(`[heartbeat] reports — pending: ${pending}, done: ${done}, failed: ${failed}`);
    return { pending, done, failed };
  }
);

export const functions = [makeReport, flakyTask, dailyDigest, sayHello, heartbeat];
