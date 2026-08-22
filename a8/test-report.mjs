import { getReportData } from './report.mjs';

const report = getReportData();
console.log(JSON.stringify(report, null, 2));

const topRev = Math.max(...report.topProducts.map((p) => p.revenue));
if (topRev > report.totalRevenue + 1e-9) {
  console.error(`\nSANITY FAIL: top product revenue ${topRev} > total ${report.totalRevenue}`);
  process.exit(1);
}
console.error('\nOK: top product revenue <= total revenue');
