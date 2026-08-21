const reports = new Map();

export const db = {
  create(reportId, topic) {
    reports.set(reportId, {
      id: reportId,
      topic,
      status: 'pending',
      result: null,
      createdAt: new Date().toISOString(),
      doneAt: null,
    });
  },

  get(reportId) {
    return reports.get(reportId) || null;
  },

  setDone(reportId, result) {
    const r = reports.get(reportId);
    if (!r) return;
    r.status = 'done';
    r.result = result;
    r.doneAt = new Date().toISOString();
  },

  stats() {
    let pending = 0;
    let done = 0;
    let failed = 0;
    for (const r of reports.values()) {
      if (r.status === 'pending') pending += 1;
      else if (r.status === 'done') done += 1;
      else if (r.status === 'failed') failed += 1;
    }
    return { pending, done, failed, total: reports.size };
  },
};
