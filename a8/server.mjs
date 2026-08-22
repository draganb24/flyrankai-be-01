import express from 'express';
import { DatabaseSync } from 'node:sqlite';
import { chromium } from 'playwright';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdirSync } from 'node:fs';
import { getReportData, getOrders } from './report.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, 'report.db');
const reportsDir = join(__dirname, 'reports');

const app = express();
app.use(express.json()); // parse { "force": true } on POST /reports
const port = parseInt(process.env.A8_PORT || '3200', 10);

mkdirSync(reportsDir, { recursive: true });
const db = new DatabaseSync(dbPath);
db.exec(
  `CREATE TABLE IF NOT EXISTS reports (
     id         TEXT PRIMARY KEY,
     path       TEXT NOT NULL,
     created_at TEXT NOT NULL DEFAULT (datetime('now'))
   )`
);

const money = (n) => `$${Number(n).toFixed(2)}`;

function buildHtml(report, orders) {
  const topRows = report.topProducts
    .map(
      (p, i) => `<tr><td>${i + 1}</td><td>${p.product}</td><td class="num">${p.orders}</td><td class="num">${money(p.revenue)}</td></tr>`
    )
    .join('');
  const dayRows = report.ordersPerDay
    .map((d) => `<tr><td>${d.day}</td><td class="num">${d.orders}</td><td class="num">${money(d.revenue)}</td></tr>`)
    .join('');
  const orderRows = orders
    .map((o) => `<tr><td>${o.id}</td><td>${o.customer}</td><td>${o.product}</td><td class="num">${money(o.amount)}</td><td>${o.created_at}</td></tr>`)
    .join('');

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Sales Report</title><style>
    @page { size: A4; margin: 18mm; }
    * { box-sizing: border-box; }
    body { font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color:#1a1a1a; font-size:12px; line-height:1.4; }
    h1 { font-size:22px; margin:0 0 4px; }
    .sub { color:#666; margin:0 0 20px; }
    .cards { display:flex; gap:16px; margin-bottom:24px; }
    .card { flex:1; border:1px solid #ddd; border-radius:8px; padding:12px 16px; }
    .card .label { color:#888; font-size:11px; text-transform:uppercase; letter-spacing:.04em; }
    .card .value { font-size:22px; font-weight:700; margin-top:4px; }
    h2 { font-size:15px; margin:22px 0 8px; border-bottom:2px solid #222; padding-bottom:4px; }
    table { width:100%; border-collapse:collapse; }
    th, td { text-align:left; padding:6px 8px; border-bottom:1px solid #e5e5e5; }
    th { background:#f3f3f3; }
    td.num, th.num { text-align:right; font-variant-numeric:tabular-nums; }
    thead { display: table-header-group; }
    tr { break-inside: avoid; }
  </style></head><body>
    <h1>Sales Report</h1>
    <p class="sub">Generated ${new Date().toISOString().slice(0, 10)} · ${report.totalOrders} orders</p>
    <div class="cards">
      <div class="card"><div class="label">Total orders</div><div class="value">${report.totalOrders}</div></div>
      <div class="card"><div class="label">Total revenue</div><div class="value">${money(report.totalRevenue)}</div></div>
      <div class="card"><div class="label">Report sections</div><div class="value">4</div></div>
    </div>
    <h2>Top 5 products by revenue</h2>
    <table><thead><tr><th>#</th><th>Product</th><th class="num">Orders</th><th class="num">Revenue</th></tr></thead><tbody>${topRows}</tbody></table>
    <h2>Orders per day (last 7 days)</h2>
    <table><thead><tr><th>Day</th><th class="num">Orders</th><th class="num">Revenue</th></tr></thead><tbody>${dayRows}</tbody></table>
    <h2>All orders</h2>
    <table class="orders"><thead><tr><th>ID</th><th>Customer</th><th>Product</th><th class="num">Amount</th><th>Date</th></tr></thead><tbody>${orderRows}</tbody></table>
  </body></html>`;
}

function findToday() {
  return db
    .prepare(
      `SELECT id, path, created_at FROM reports
       WHERE date(created_at) = date('now') AND path IS NOT NULL
       ORDER BY created_at DESC LIMIT 1`
    )
    .get();
}

async function generateReport() {
  const report = getReportData();
  const orders = getOrders();
  const html = buildHtml(report, orders);

  const id = randomUUID();
  const pdfPath = join(reportsDir, `${id}.pdf`);

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.pdf({ path: pdfPath, format: 'A4', printBackground: true, margin: { top: '18mm', bottom: '18mm', left: '18mm', right: '18mm' } });
  } finally {
    await browser.close();
  }

  db.prepare('INSERT INTO reports (id, path) VALUES (?, ?)').run(id, pdfPath);
  return id;
}

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.post('/reports', async (req, res) => {
  try {
    const force = req.body && req.body.force === true;
    if (!force) {
      const existing = findToday();
      if (existing) {
        return res.status(200).json({ id: existing.id, file: `/reports/${existing.id}/file` });
      }
    }

    const id = await generateReport();
    res.status(201).json({ id, file: `/reports/${id}/file` });
  } catch (err) {
    console.error('generateReport failed:', err);
    res.status(500).json({ error: 'report generation failed' });
  }
});

app.get('/reports/:id', (req, res) => {
  const row = db.prepare('SELECT id, path, created_at FROM reports WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'report not found' });
  res.json({ id: row.id, file: `/reports/${row.id}/file`, created_at: row.created_at });
});

app.get('/reports/:id/file', (req, res) => {
  const row = db.prepare('SELECT path FROM reports WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'report not found' });
  res.sendFile(row.path, (err) => {
    if (err) {
      console.error('sendFile failed:', err);
      if (!res.headersSent) res.status(500).json({ error: 'file send failed' });
    }
  });
});

app.listen(port, () => {
  console.log(`A8 API ready on http://localhost:${port}  (try: GET /health · POST /reports)`);
});
