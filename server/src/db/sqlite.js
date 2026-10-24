import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Default database path: server/data/campus-lost-found.db
const defaultDbPath = path.resolve(__dirname, '../../data/campus-lost-found.db');
const resolvedDbPath = process.env.DB_PATH
  ? path.resolve(process.cwd(), process.env.DB_PATH)
  : defaultDbPath;

// Ensure database directory exists
const dbDir = path.dirname(resolvedDbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let dbInstance = null;

try {
  dbInstance = new Database(resolvedDbPath);
  
  // Enable Write-Ahead Logging for better concurrency & performance
  dbInstance.pragma('journal_mode = WAL');
  dbInstance.pragma('foreign_keys = ON');

  // Auto-create items table without dropping or deleting existing records
  dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      location TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('Lost', 'Found')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_items_created_at ON items (created_at DESC, id DESC);
    CREATE INDEX IF NOT EXISTS idx_items_category ON items (category);
    CREATE INDEX IF NOT EXISTS idx_items_status ON items (status);
  `);

  console.info(`[Database] SQLite connected successfully at: ${resolvedDbPath}`);
} catch (error) {
  console.error(`[Database Error] Failed to connect to SQLite at ${resolvedDbPath}:`, error.message);
  throw error;
}

export const getDb = () => dbInstance;
export const getDbPath = () => resolvedDbPath;

export const isDatabaseConnected = () => {
  if (!dbInstance) return false;
  try {
    const result = dbInstance.prepare('SELECT 1 as test').get();
    return result && result.test === 1;
  } catch {
    return false;
  }
};

export const getItemCount = () => {
  try {
    const row = dbInstance.prepare('SELECT count(*) as count FROM items').get();
    return row ? row.count : 0;
  } catch {
    return 0;
  }
};

/**
 * Retrieve items with optional search, category, and status filters.
 * Strictly uses parameterized SQL queries.
 */
export const getAllItems = ({ search, category, status } = {}) => {
  let query = 'SELECT id, name, category, location, status, created_at FROM items WHERE 1=1';
  const params = [];

  if (category && category !== 'all') {
    query += ' AND category = ?';
    params.push(category.trim().toLowerCase());
  }

  if (status && status !== 'all') {
    // Normalize status to 'Lost' or 'Found'
    const normalizedStatus = status.toLowerCase() === 'lost' ? 'Lost' : 'Found';
    query += ' AND status = ?';
    params.push(normalizedStatus);
  }

  if (search && search.trim() !== '') {
    query += ' AND (name LIKE ? OR location LIKE ? OR category LIKE ?)';
    const searchPattern = `%${search.trim()}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }

  query += ' ORDER BY created_at DESC, id DESC';

  const stmt = dbInstance.prepare(query);
  return stmt.all(...params);
};

/**
 * Fetch a single item by its ID.
 */
export const getItemById = (id) => {
  const stmt = dbInstance.prepare('SELECT id, name, category, location, status, created_at FROM items WHERE id = ?');
  return stmt.get(id);
};

/**
 * Insert a new item using a parameterized SQL statement.
 */
export const createItemRecord = ({ name, category, location, status }) => {
  const stmt = dbInstance.prepare(`
    INSERT INTO items (name, category, location, status)
    VALUES (?, ?, ?, ?)
  `);
  const result = stmt.run(name.trim(), category.trim().toLowerCase(), location.trim(), status);
  return getItemById(result.lastInsertRowid);
};
