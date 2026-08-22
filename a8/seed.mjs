import { DatabaseSync } from 'node:sqlite';
import { randomInt } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, 'report.db');

const db = new DatabaseSync(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id          INTEGER PRIMARY KEY,
    customer    TEXT NOT NULL,
    product     TEXT NOT NULL,
    amount      REAL NOT NULL,
    created_at  TEXT NOT NULL
  )
`);

db.exec('DELETE FROM orders');

const PRODUCTS = ['Coffee Mug', 'T-Shirt', 'Notebook', 'Pen Set', 'Water Bottle', 'Desk Lamp'];
const CUSTOMERS = ['Alice', 'Bob', 'Carol', 'Dave', 'Eve', 'Frank', 'Grace', 'Heidi'];
const COUNT = 200;

const insert = db.prepare(
  'INSERT INTO orders (customer, product, amount, created_at) VALUES (?, ?, ?, ?)'
);

db.exec('BEGIN');
for (let i = 0; i < COUNT; i++) {
  const customer = CUSTOMERS[randomInt(0, CUSTOMERS.length)];
  const product = PRODUCTS[randomInt(0, PRODUCTS.length)];
  const amount = Math.round((5 + Math.random() * 195) * 100) / 100;
  const daysAgo = randomInt(0, 31);
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const created_at = d.toISOString().slice(0, 10);
  insert.run(customer, product, amount, created_at);
}
db.exec('COMMIT');

const [{ count }] = db.prepare('SELECT COUNT(*) AS count FROM orders').all();
console.log(`Seeded ${count} orders into ${dbPath}`);
