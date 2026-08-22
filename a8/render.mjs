import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { getReportData, getOrders } from './report.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const reportsDir = join(__dirname, 'reports');
const OUT = join(reportsDir, 'test.pdf');

const money = (n) => `$${Number(n).toFixed(2)}`;
const today = new Date().toISOString().slice(0, 10);

export function buildHtml(report, orders) {
  const topRows = report.topProducts
    .map(
      (p, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${p.product}</td>
        <td class="num">${p.orders}</td>
        <td class="num">${money(p.revenue)}</td>
      </tr>`
    )
    .join('');

  const dayRows = report.ordersPerDay
    .map(
      (d) => `
      <tr>
        <td>${d.day}</td>
        <td class="num">${d.orders}</td>
        <td class="num">${money(d.revenue)}</td>
      </tr>`
    )
    .join('');

  const orderRows = orders
    .map(
      (o) => `
      <tr>
        <td>${o.id}</td>
        <td>${o.customer}</td>
        <td>${o.product}</td>
        <td class="num">${money(o.amount)}</td>
        <td>${o.created_at}</td>
      </tr>`
    )
    .join('');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Sales Report ${today}</title>
<style>
  @page { size: A4; margin: 18mm; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
         color: #1a1a1a; font-size: 12px; line-height: 1.4; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  .sub { color: #666; margin: 0 0 20px; }
  .cards { display: flex; gap: 16px; margin-bottom: 24px; }
  .card { flex: 1; border: 1px solid #ddd; border-radius: 8px; padding: 12px 16px; }
  .card .label { color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; }
  .card .value { font-size: 22px; font-weight: 700; margin-top: 4px; }
  h2 { font-size: 15px; margin: 22px 0 8px; border-bottom: 2px solid #222; padding-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #e5e5e5; }
  th { background: #f3f3f3; }
  td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
  thead { display: table-header-group; }
  tr { break-inside: avoid; }
  table.orders { page-break-before: auto; }
</style>
</head>
<body>
  <h1>Sales Report</h1>
  <p class="sub">Generated ${today} · ${report.totalOrders} orders</p>

  <div class="cards">
    <div class="card"><div class="label">Total orders</div><div class="value">${report.totalOrders}</div></div>
    <div class="card"><div class="label">Total revenue</div><div class="value">${money(report.totalRevenue)}</div></div>
    <div class="card"><div class="label">Report sections</div><div class="value">4</div></div>
  </div>

  <h2>Top 5 products by revenue</h2>
  <table>
    <thead><tr><th>#</th><th>Product</th><th class="num">Orders</th><th class="num">Revenue</th></tr></thead>
    <tbody>${topRows}</tbody>
  </table>

  <h2>Orders per day (last 7 days)</h2>
  <table>
    <thead><tr><th>Day</th><th class="num">Orders</th><th class="num">Revenue</th></tr></thead>
    <tbody>${dayRows}</tbody>
  </table>

  <h2>All orders</h2>
  <table class="orders">
    <thead><tr><th>ID</th><th>Customer</th><th>Product</th><th class="num">Amount</th><th>Date</th></tr></thead>
    <tbody>${orderRows}</tbody>
  </table>
</body>
</html>`;
}

export async function renderReport(outPath = OUT) {
  const report = getReportData();
  const orders = getOrders();
  const html = buildHtml(report, orders);

  mkdirSync(reportsDir, { recursive: true });

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.pdf({
      path: outPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '18mm', bottom: '18mm', left: '18mm', right: '18mm' },
    });
  } finally {
    await browser.close();
  }
  return outPath;
}

import { pathToFileURL } from 'node:url';
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  renderReport()
    .then((p) => console.log(`Wrote PDF -> ${p}`))
    .catch((e) => {
      console.error('PDF render failed:', e);
      process.exit(1);
    });
}
