import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, 'report.db');

export function getReportData() {
  const db = new DatabaseSync(dbPath);
  try {
    const { totalOrders } = db.prepare('SELECT COUNT(*) AS totalOrders FROM orders').get();

    const { totalRevenue } = db
      .prepare('SELECT ROUND(SUM(amount), 2) AS totalRevenue FROM orders')
      .get();

    const topProducts = db
      .prepare(
        `SELECT product,
                COUNT(*)              AS orders,
                ROUND(SUM(amount), 2) AS revenue
         FROM orders
         GROUP BY product
         ORDER BY revenue DESC
         LIMIT 5`
      )
      .all();

    const ordersPerDay = db
      .prepare(
        `WITH days AS (
           SELECT date('now', '-6 days') AS day
           UNION ALL
           SELECT date(day, '+1 day') FROM days WHERE day < date('now')
         )
         SELECT d.day,
                COUNT(o.id)                  AS orders,
                ROUND(COALESCE(SUM(o.amount), 0), 2) AS revenue
         FROM days d
         LEFT JOIN orders o ON o.created_at = d.day
         GROUP BY d.day
         ORDER BY d.day`
      )
      .all();

    return {
      generatedAt: new Date().toISOString(),
      totalOrders,
      totalRevenue,
      topProducts,
      ordersPerDay,
    };
  } finally {
    db.close();
  }
}

export function getOrders() {
  const db = new DatabaseSync(dbPath);
  try {
    return db
      .prepare(
        `SELECT id, customer, product, amount, created_at
         FROM orders
         ORDER BY created_at ASC, id ASC`
      )
      .all();
  } finally {
    db.close();
  }
}
