// A8 dev helper — quick row count + data-shape check (run: node count.mjs).
// Avoids `node -e` quoting pain in PowerShell.
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const db = new DatabaseSync(join(__dirname, 'report.db'));

const { c } = db.prepare('SELECT COUNT(*) AS c FROM orders').get();
console.log('COUNT(*)=', c);

const byProduct = db
  .prepare(
    'SELECT product, COUNT(*) AS n, ROUND(MIN(amount),2) AS min, ROUND(MAX(amount),2) AS max ' +
      'FROM orders GROUP BY product ORDER BY n DESC'
  )
  .all();
console.table(byProduct);
