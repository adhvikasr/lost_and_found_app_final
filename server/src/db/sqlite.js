import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Default database path: server/data/campus-find.db
const serverDir = path.resolve(__dirname, '../..');
const defaultDbPath = path.resolve(serverDir, 'data/campus-find.db');

let resolvedDbPath = defaultDbPath;
if (process.env.DB_PATH) {
  resolvedDbPath = path.isAbsolute(process.env.DB_PATH)
    ? process.env.DB_PATH
    : path.resolve(process.cwd(), process.env.DB_PATH);

  if (resolvedDbPath.endsWith('campus-lost-found.db')) {
    resolvedDbPath = path.resolve(path.dirname(resolvedDbPath), 'campus-find.db');
  }
}

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

  // Check if items table exists
  const tableExists = dbInstance.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='items'").get();

  if (!tableExists) {
    dbInstance.exec(`
      CREATE TABLE items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        location TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('Lost', 'Found', 'Claimed')),
        description TEXT,
        image_url TEXT,
        reporter_name TEXT,
        contact TEXT,
        desk_location TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_items_created_at ON items (created_at DESC, id DESC);
      CREATE INDEX IF NOT EXISTS idx_items_category ON items (category);
      CREATE INDEX IF NOT EXISTS idx_items_status ON items (status);
    `);
  } else {
    // Migration: ensure columns and check constraint support
    const tableInfo = dbInstance.pragma('table_info(items)');
    const colNames = tableInfo.map(c => c.name);

    if (!colNames.includes('description')) {
      dbInstance.exec('ALTER TABLE items ADD COLUMN description TEXT;');
    }
    if (!colNames.includes('image_url')) {
      dbInstance.exec('ALTER TABLE items ADD COLUMN image_url TEXT;');
    }
    if (!colNames.includes('reporter_name')) {
      dbInstance.exec('ALTER TABLE items ADD COLUMN reporter_name TEXT;');
    }
    if (!colNames.includes('contact')) {
      dbInstance.exec('ALTER TABLE items ADD COLUMN contact TEXT;');
    }
    if (!colNames.includes('desk_location')) {
      dbInstance.exec('ALTER TABLE items ADD COLUMN desk_location TEXT;');
    }

    const tableSql = dbInstance.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='items'").get()?.sql || '';
    if (!tableSql.includes('Claimed')) {
      dbInstance.exec(`
        PRAGMA foreign_keys = OFF;
        CREATE TABLE items_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          category TEXT NOT NULL,
          location TEXT NOT NULL,
          status TEXT NOT NULL CHECK(status IN ('Lost', 'Found', 'Claimed')),
          description TEXT,
          image_url TEXT,
          reporter_name TEXT,
          contact TEXT,
          desk_location TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        INSERT INTO items_new (id, name, category, location, status, description, image_url, reporter_name, contact, desk_location, created_at)
        SELECT id, name, category, location, status, description, image_url, reporter_name, contact, desk_location, created_at FROM items;
        DROP TABLE items;
        ALTER TABLE items_new RENAME TO items;
        CREATE INDEX IF NOT EXISTS idx_items_created_at ON items (created_at DESC, id DESC);
        CREATE INDEX IF NOT EXISTS idx_items_category ON items (category);
        CREATE INDEX IF NOT EXISTS idx_items_status ON items (status);
        PRAGMA foreign_keys = ON;
      `);
    }
  }

  // Seed sample campus items if not present
  seedInitialCampusData();

  console.info(`[Database] SQLite connected successfully at: ${resolvedDbPath}`);
} catch (error) {
  console.error(`[Database Error] Failed to connect to SQLite at ${resolvedDbPath}:`, error.message);
  throw error;
}

function seedInitialCampusData() {
  const checkStmt = dbInstance.prepare('SELECT COUNT(*) as count FROM items WHERE name = ?');
  const sampleItems = [
    {
      name: 'AirPods Pro in Black Case',
      category: 'electronics',
      location: 'Library 3rd Floor Quiet Pods',
      status: 'Found',
      description: 'Case has a small silver carabiner attached. Audio name starts with "M...".',
      image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA7UAbMxsCJx-222C4ulQp_lWFHU_RXIyV0tP_pQ21JKPtIqSaRkeD2wo1eUnXBnqRPzNVfy_9AjoT1XSOYTAP-won5yo7hICEjmYR_2rj13EwmOgf41qJZBPLfzvCzDZFJG3OoAARHdLI8BCtSY6RUgokjo503CO01pZZ0QPJDa7TU1YP6M3d4n-xafljnAgDCLP6ZW6T6UkmdAZ7evdreDQkNCzje-WIgOBwyH7zhT0ibEe7ACdyJaQ',
      desk_location: 'Main Library Desk #4 (Ref #L-109)',
      reporter_name: 'Marcus (Library Staff)',
      contact: 'library-lost@state.edu'
    },
    {
      name: 'Hydro Flask 32oz (Pacific Blue)',
      category: 'accessories',
      location: 'Student Union Dining Terrace',
      status: 'Lost',
      description: 'Has Yosemite and Zion vinyl stickers with small dent on bottom rim. Reward is a Campus Coffee voucher!',
      image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBIOexeRjq6NqRYwK4xLC2PsoaEBueowU6Qb8LqunfBgY1UZ1AQ-13PIP68z6jkCCAJyMhnn8znT5BM2dhGbjb9y58Ag_30SzUfnorHaYdqArqEicXHfxGRp1o2qG-aHLRPKMuAwcMiWrVLzA8_Ni7o8UfKrK67kzyvH-WvNj3YDGPSzkdxw3XB1Ia4WUq74FnEoQ1rwW12Khq397bKs-BDH0TM2BhTA4B_BppQxTo_iZwhbUMrP0MDaA',
      desk_location: 'Student Union Info Desk',
      reporter_name: 'Sarah K. (Sophomore)',
      contact: 'sarah.k@state.edu'
    },
    {
      name: 'Silver MacBook Air 13"',
      category: 'electronics',
      location: 'Science Hall Room 204',
      status: 'Found',
      description: 'Found after CHEM 102 lecture. Serial number logged. Requires device unlock or university ID to release.',
      image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD-3FJJYZrizcejypAbRcNPaFuOq3f2QXe-kXOO6ZtRZx4dJeMPnEeMr2yfB0tODRt-cBOeoskdalwXaA-oOkk4xx40_2irLNuXAK4PwS2d2jIV1qr96P0Arc-16Tl0RTMmgTWrNnE7mPjtdeqq4F8WN7AMCKyNehrhsOvQbOStZqDoyHbFG4uHCkyIQrtU3UEkKCaTK5ue54nElUSo9MLyudUI1wJLpr0d80eYmYesSQMFrvt26VEiMQ',
      desk_location: 'Campus Safety HQ',
      reporter_name: 'Officer Daniels',
      contact: 'safety-dispatch@state.edu'
    },
    {
      name: 'Blue Lanyard + Dorm Key Fob',
      category: 'bags-keys',
      location: 'North Rec Center Locker Area',
      status: 'Lost',
      description: 'Has 2 brass keys, 1 black RFID dorm fob, and a mini rubber basketball key ring.',
      image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDkOw5l179YIxoPBuGy76JXOxIB_mEqh4to0TOIgTFApWNTUkvzjBDRDfdouhKgML2KMhbVFGK_BrElguC79yI9jxK8vLaLsdUjK3x1UkhpnYAQW_2jstK6qaTdgkPmHsU-QSsJVq_aLf4NGEfVevLFltef0lln3vC1S0eK9mJ04shjs2vxqJLzGttXZmKNf5laOucUM-h6uXB-Uyy6z9TXjsi689_ikrcnGtwZjA8WRUcrkdJflveNDg',
      desk_location: 'North Rec Welcome Center',
      reporter_name: 'Jordan T.',
      contact: 'jordan.t@state.edu'
    },
    {
      name: 'TI-84 Plus CE Graphing Calc',
      category: 'books-supplies',
      location: 'Engineering Hall Room B10',
      status: 'Found',
      description: 'Has metallic rose gold cover with hand-drawn math formulas on the inside slider shell.',
      image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAITCokJ2jRPZzowLq2kacyseCScLYdMznwM2tHCE0euox7FjwCPOyLdcia__ptQMWsxIir64rQs3nGiLmFRDeqiwcA-98xy2BW2RiG_W6dNceNU_Yvx0zOv9MKErovWq9P3__Bfe5xXmhTCSLZo_46MXBhtkXU6MLNjsfMZdGQ7jGs5tIzV_-rNV0Yd3kDQx5KxihTWkx8Bz89DezG8fQP55bGsfb5HLJ6qLt1KSsNLse_fCpiPmQqHg',
      desk_location: 'MechEng Dept Office',
      reporter_name: 'Prof. Miller',
      contact: 'eng-lostfound@state.edu'
    },
    {
      name: 'Sony WH-1000XM4 Headphones',
      category: 'electronics',
      location: 'Returned via Student Union Desk',
      status: 'Claimed',
      description: '"Thanks to Student Desk worker Marcus who tagged it right after my psychology exam!"',
      image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDqaTCVT_0DTlvN3WfWwTJhGfNmMyY80I5CYquJ-WHg-QF5rcpPUBk7TsW2xiqph-phc6VpXvyi3N1dnpiok2Ldy31MN9u9M-NiLVnbZcurlUgSSdQxkc0aaDU4u2Sx4FpUp8QF9t-7ze57f3EcHtrFFkA_EjegHbv5mkWSt2UgH7HkHZVmGsctofka3d4tG4Svel0Cgjfa4VTa2TUcuxLp-_vykd9YfDuB84ksDBD9ep17O5fpsf8Ulw',
      desk_location: 'Student Union Desk',
      reporter_name: 'Alex Rivera (Claimed)',
      contact: 'alex.rivera@state.edu'
    }
  ];

  const insertStmt = dbInstance.prepare(`
    INSERT INTO items (name, category, location, status, description, image_url, desk_location, reporter_name, contact)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const item of sampleItems) {
    const exists = checkStmt.get(item.name);
    if (!exists || exists.count === 0) {
      insertStmt.run(
        item.name,
        item.category,
        item.location,
        item.status,
        item.description,
        item.image_url,
        item.desk_location,
        item.reporter_name,
        item.contact
      );
    }
  }
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

export const getItemStats = () => {
  try {
    const counts = dbInstance.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Found' THEN 1 ELSE 0 END) as foundCount,
        SUM(CASE WHEN status = 'Lost' THEN 1 ELSE 0 END) as lostCount,
        SUM(CASE WHEN status = 'Claimed' THEN 1 ELSE 0 END) as claimedCount
      FROM items
    `).get();
    return {
      total: counts.total || 0,
      found: counts.foundCount || 0,
      lost: counts.lostCount || 0,
      claimed: counts.claimedCount || 0
    };
  } catch {
    return { total: 0, found: 0, lost: 0, claimed: 0 };
  }
};

/**
 * Retrieve items with optional search, category, status, and location filters.
 * Strictly uses parameterized SQL queries.
 */
export const getAllItems = ({ search, category, status, location } = {}) => {
  let query = 'SELECT id, name, category, location, status, description, image_url, reporter_name, contact, desk_location, created_at FROM items WHERE 1=1';
  const params = [];

  if (category && category !== 'all') {
    query += ' AND category = ?';
    params.push(category.trim().toLowerCase());
  }

  if (status && status !== 'all') {
    const lower = status.trim().toLowerCase();
    const normalizedStatus = lower === 'lost' ? 'Lost' : lower === 'found' ? 'Found' : 'Claimed';
    query += ' AND status = ?';
    params.push(normalizedStatus);
  }

  if (location && location !== 'all') {
    query += ' AND location LIKE ?';
    params.push(`%${location.trim()}%`);
  }

  if (search && search.trim() !== '') {
    query += ' AND (name LIKE ? OR location LIKE ? OR category LIKE ? OR description LIKE ?)';
    const searchPattern = `%${search.trim()}%`;
    params.push(searchPattern, searchPattern, searchPattern, searchPattern);
  }

  query += ' ORDER BY created_at DESC, id DESC';

  const stmt = dbInstance.prepare(query);
  return stmt.all(...params);
};

/**
 * Fetch a single item by its ID.
 */
export const getItemById = (id) => {
  const stmt = dbInstance.prepare('SELECT id, name, category, location, status, description, image_url, reporter_name, contact, desk_location, created_at FROM items WHERE id = ?');
  return stmt.get(id);
};

/**
 * Insert a new item using a parameterized SQL statement.
 */
export const createItemRecord = ({ name, category, location, status, description, image_url, reporter_name, contact, desk_location }) => {
  const stmt = dbInstance.prepare(`
    INSERT INTO items (name, category, location, status, description, image_url, reporter_name, contact, desk_location)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    name.trim(),
    category.trim().toLowerCase(),
    location.trim(),
    status,
    description ? description.trim() : null,
    image_url ? image_url.trim() : null,
    reporter_name ? reporter_name.trim() : null,
    contact ? contact.trim() : null,
    desk_location ? desk_location.trim() : null
  );
  return getItemById(result.lastInsertRowid);
};

/**
 * Claim an item or update its status.
 */
export const claimItemRecord = (id, { student_id, verification_detail, claimer_name }) => {
  const current = getItemById(id);
  if (!current) return null;

  const claimNote = `[Claimed: Student ID ${student_id}${verification_detail ? ` - Note: ${verification_detail}` : ''}]`;
  const newDesc = current.description ? `${current.description} ${claimNote}` : claimNote;

  const stmt = dbInstance.prepare(`
    UPDATE items
    SET status = 'Claimed',
        reporter_name = COALESCE(?, reporter_name),
        description = ?
    WHERE id = ?
  `);
  stmt.run(claimer_name || `Student #${student_id}`, newDesc, id);
  return getItemById(id);
};
