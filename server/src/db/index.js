const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const dbPath = process.env.DATABASE_PATH || './data/reviews.db';
const resolvedPath = path.resolve(process.cwd(), dbPath);
const dir = path.dirname(resolvedPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const db = new Database(resolvedPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const schemaPath = path.join(__dirname, 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');
db.exec(schema);

// Ensure policy_version column exists (migration for existing databases)
try {
  const result = db.prepare("PRAGMA table_info(responses)").all();
  const hasColumn = result.some(row => row.name === 'policy_version');
  if (!hasColumn) {
    db.exec("ALTER TABLE responses ADD COLUMN policy_version TEXT;");
  }
} catch (err) {
  // Column may already exist, ignore error
}

module.exports = db;
