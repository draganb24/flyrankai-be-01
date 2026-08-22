// Dev helper (Stage 6): screenshot page 1 of the report for the README.
// Renders the exact same HTML the PDF uses, at A4 width, and captures the first viewport.
// Usage: node shot.mjs   ->  reports/page1.png
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { getReportData, getOrders } from './report.mjs';
import { buildHtml } from './render.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPng = join(__dirname, 'reports', 'page1.png');

// A4 at 96 DPI ≈ 794 x 1123 px.
const A4_W = 794;
const A4_H = 1123;

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: A4_W, height: A4_H } });
  const html = buildHtml(getReportData(), getOrders());
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.screenshot({ path: outPng, clip: { x: 0, y: 0, width: A4_W, height: A4_H } });
  console.log(`Wrote screenshot -> ${outPng}`);
} finally {
  await browser.close();
}
