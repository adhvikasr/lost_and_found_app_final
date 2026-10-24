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
        owner_username TEXT,
        owner_student_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_items_created_at ON items (created_at DESC, id DESC);
      CREATE INDEX IF NOT EXISTS idx_items_category ON items (category);
      CREATE INDEX IF NOT EXISTS idx_items_status ON items (status);
      CREATE INDEX IF NOT EXISTS idx_items_owner ON items (owner_student_id);

      CREATE TABLE IF NOT EXISTS claims (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_id INTEGER NOT NULL,
        claimant_username TEXT NOT NULL,
        claimant_student_id TEXT NOT NULL,
        claimant_name TEXT NOT NULL,
        verification_detail TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('Pending', 'Approved', 'Rejected')) DEFAULT 'Pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        decided_at DATETIME,
        FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_claims_item_id ON claims (item_id);
      CREATE INDEX IF NOT EXISTS idx_claims_claimant ON claims (claimant_student_id);
      CREATE INDEX IF NOT EXISTS idx_claims_status ON claims (status);

      CREATE TABLE IF NOT EXISTS found_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_id INTEGER NOT NULL,
        finder_username TEXT NOT NULL,
        finder_student_id TEXT NOT NULL,
        finder_name TEXT NOT NULL,
        location TEXT NOT NULL,
        additional_details TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('Pending', 'Confirmed', 'Rejected')) DEFAULT 'Pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        decided_at DATETIME,
        FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_found_reports_item_id ON found_reports (item_id);
      CREATE INDEX IF NOT EXISTS idx_found_reports_finder ON found_reports (finder_student_id);
      CREATE INDEX IF NOT EXISTS idx_found_reports_status ON found_reports (status);

      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recipient_student_id TEXT NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        item_id INTEGER,
        report_id INTEGER,
        is_read INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE SET NULL
      );

      CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications (recipient_student_id, is_read);
      CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications (created_at DESC);

      CREATE TABLE IF NOT EXISTS accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        student_id TEXT UNIQUE NOT NULL,
        full_name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_accounts_username ON accounts (username);
      CREATE INDEX IF NOT EXISTS idx_accounts_student_id ON accounts (student_id);
    `);

    // Initialize the preset demo accounts in SQLite
    const insertAccount = dbInstance.prepare(`
      INSERT OR IGNORE INTO accounts (username, password, student_id, full_name)
      VALUES (?, ?, ?, ?)
    `);
    const initialAccounts = [
      ['student1', 'demo123', 'STU001', 'Student One'],
      ['student2', 'demo123', 'STU002', 'Student Two'],
      ['student3', 'demo123', 'STU003', 'Student Three'],
      ['student4', 'demo123', 'STU004', 'Student Four'],
      ['student5', 'demo123', 'STU005', 'Student Five']
    ];
    for (const [u, p, s, f] of initialAccounts) {
      insertAccount.run(u, p, s, f);
    }
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
    if (!colNames.includes('owner_username')) {
      dbInstance.exec('ALTER TABLE items ADD COLUMN owner_username TEXT;');
    }
    if (!colNames.includes('owner_student_id')) {
      dbInstance.exec('ALTER TABLE items ADD COLUMN owner_student_id TEXT;');
    }

    // Ensure claims table exists
    dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS claims (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_id INTEGER NOT NULL,
        claimant_username TEXT NOT NULL,
        claimant_student_id TEXT NOT NULL,
        claimant_name TEXT NOT NULL,
        verification_detail TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('Pending', 'Approved', 'Rejected')) DEFAULT 'Pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        decided_at DATETIME,
        FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_claims_item_id ON claims (item_id);
      CREATE INDEX IF NOT EXISTS idx_claims_claimant ON claims (claimant_student_id);
      CREATE INDEX IF NOT EXISTS idx_claims_status ON claims (status);

      CREATE TABLE IF NOT EXISTS found_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_id INTEGER NOT NULL,
        finder_username TEXT NOT NULL,
        finder_student_id TEXT NOT NULL,
        finder_name TEXT NOT NULL,
        location TEXT NOT NULL,
        additional_details TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('Pending', 'Confirmed', 'Rejected')) DEFAULT 'Pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        decided_at DATETIME,
        FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_found_reports_item_id ON found_reports (item_id);
      CREATE INDEX IF NOT EXISTS idx_found_reports_finder ON found_reports (finder_student_id);
      CREATE INDEX IF NOT EXISTS idx_found_reports_status ON found_reports (status);

      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recipient_student_id TEXT NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        item_id INTEGER,
        report_id INTEGER,
        is_read INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE SET NULL
      );

      CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications (recipient_student_id, is_read);
      CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications (created_at DESC);

      CREATE TABLE IF NOT EXISTS accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        student_id TEXT UNIQUE NOT NULL,
        full_name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_accounts_username ON accounts (username);
      CREATE INDEX IF NOT EXISTS idx_accounts_student_id ON accounts (student_id);
    `);

    // Initialize the preset demo accounts in SQLite
    const insertAccount = dbInstance.prepare(`
      INSERT OR IGNORE INTO accounts (username, password, student_id, full_name)
      VALUES (?, ?, ?, ?)
    `);
    const initialAccounts = [
      ['student1', 'demo123', 'STU001', 'Student One'],
      ['student2', 'demo123', 'STU002', 'Student Two'],
      ['student3', 'demo123', 'STU003', 'Student Three'],
      ['student4', 'demo123', 'STU004', 'Student Four'],
      ['student5', 'demo123', 'STU005', 'Student Five']
    ];
    for (const [u, p, s, f] of initialAccounts) {
      insertAccount.run(u, p, s, f);
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
          owner_username TEXT,
          owner_student_id TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        INSERT INTO items_new (id, name, category, location, status, description, image_url, reporter_name, contact, desk_location, owner_username, owner_student_id, created_at)
        SELECT id, name, category, location, status, description, image_url, reporter_name, contact, desk_location, owner_username, owner_student_id, created_at FROM items;
        DROP TABLE items;
        ALTER TABLE items_new RENAME TO items;
        CREATE INDEX IF NOT EXISTS idx_items_created_at ON items (created_at DESC, id DESC);
        CREATE INDEX IF NOT EXISTS idx_items_category ON items (category);
        CREATE INDEX IF NOT EXISTS idx_items_status ON items (status);
        CREATE INDEX IF NOT EXISTS idx_items_owner ON items (owner_student_id);
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
 * Returns owner details and pending claims count for each item.
 */
export const getAllItems = ({ search, category, status, location } = {}) => {
  let query = `
    SELECT 
      items.id, 
      items.name, 
      items.category, 
      items.location, 
      items.status, 
      items.description, 
      items.image_url, 
      items.reporter_name, 
      items.contact, 
      items.desk_location, 
      items.owner_username, 
      items.owner_student_id, 
      items.created_at,
      (SELECT COUNT(*) FROM claims WHERE claims.item_id = items.id AND claims.status = 'Pending') as pending_claims_count,
      (SELECT COUNT(*) FROM found_reports WHERE found_reports.item_id = items.id AND found_reports.status = 'Pending') as pending_reports_count
    FROM items 
    WHERE 1=1
  `;
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

  if (location && location !== 'all' && location.trim() !== '') {
    query += ' AND (location LIKE ? OR (desk_location IS NOT NULL AND desk_location LIKE ?))';
    const locPattern = `%${location.trim()}%`;
    params.push(locPattern, locPattern);
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
 * Fetch a single item by its ID with owner details and pending claims count.
 */
export const getItemById = (id) => {
  const stmt = dbInstance.prepare(`
    SELECT 
      items.id, 
      items.name, 
      items.category, 
      items.location, 
      items.status, 
      items.description, 
      items.image_url, 
      items.reporter_name, 
      items.contact, 
      items.desk_location, 
      items.owner_username, 
      items.owner_student_id, 
      items.created_at,
      (SELECT COUNT(*) FROM claims WHERE claims.item_id = items.id AND claims.status = 'Pending') as pending_claims_count,
      (SELECT COUNT(*) FROM found_reports WHERE found_reports.item_id = items.id AND found_reports.status = 'Pending') as pending_reports_count
    FROM items 
    WHERE id = ?
  `);
  return stmt.get(id);
};

/**
 * Insert a new item associated with its creator using a parameterized SQL statement.
 */
export const createItemRecord = ({
  name,
  category,
  location,
  status,
  description,
  image_url,
  reporter_name,
  contact,
  desk_location,
  owner_username,
  owner_student_id
}) => {
  const stmt = dbInstance.prepare(`
    INSERT INTO items (
      name, 
      category, 
      location, 
      status, 
      description, 
      image_url, 
      reporter_name, 
      contact, 
      desk_location,
      owner_username,
      owner_student_id
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    desk_location ? desk_location.trim() : null,
    owner_username ? owner_username.trim() : null,
    owner_student_id ? owner_student_id.trim() : null
  );
  return getItemById(result.lastInsertRowid);
};

// ==========================================
// Claims Management Database Operations
// ==========================================

/**
 * Create a new claim with initial 'Pending' status.
 */
export const createClaimRecord = ({
  itemId,
  claimantUsername,
  claimantStudentId,
  claimantName,
  verificationDetail
}) => {
  const stmt = dbInstance.prepare(`
    INSERT INTO claims (
      item_id, 
      claimant_username, 
      claimant_student_id, 
      claimant_name, 
      verification_detail, 
      status
    )
    VALUES (?, ?, ?, ?, ?, 'Pending')
  `);
  const result = stmt.run(
    itemId,
    claimantUsername.trim(),
    claimantStudentId.trim().toUpperCase(),
    claimantName.trim(),
    verificationDetail.trim()
  );
  return getClaimById(result.lastInsertRowid);
};

/**
 * Retrieve a claim by its ID.
 */
export const getClaimById = (id) => {
  const stmt = dbInstance.prepare('SELECT * FROM claims WHERE id = ?');
  return stmt.get(id);
};

/**
 * Retrieve all claims for a specific item (for owner review).
 */
export const getClaimsByItemId = (itemId) => {
  const stmt = dbInstance.prepare(`
    SELECT * FROM claims 
    WHERE item_id = ? 
    ORDER BY created_at DESC, id DESC
  `);
  return stmt.all(itemId);
};

/**
 * Check if a claimant already has a pending claim on an item.
 */
export const getPendingClaim = (itemId, studentId) => {
  const stmt = dbInstance.prepare(`
    SELECT * FROM claims 
    WHERE item_id = ? AND UPPER(claimant_student_id) = UPPER(?) AND status = 'Pending'
  `);
  return stmt.get(itemId, studentId.trim());
};

/**
 * Approve a claim atomically using SQLite transaction.
 * 1. Sets claim status to 'Approved' with decided_at timestamp.
 * 2. Updates item status to 'Claimed' and records reunion note.
 * 3. Automatically rejects any other pending claims for this item.
 */
export const approveClaimTransaction = (claimId, deciderStudentId) => {
  const tx = dbInstance.transaction(() => {
    const claim = dbInstance.prepare('SELECT * FROM claims WHERE id = ?').get(claimId);
    if (!claim) {
      const err = new Error('Claim not found.');
      err.statusCode = 404;
      throw err;
    }
    if (claim.status !== 'Pending') {
      const err = new Error(`This claim has already been decided (${claim.status}).`);
      err.statusCode = 400;
      throw err;
    }

    const item = dbInstance.prepare('SELECT * FROM items WHERE id = ?').get(claim.item_id);
    if (!item) {
      const err = new Error('Associated item not found.');
      err.statusCode = 404;
      throw err;
    }
    if (!item.owner_student_id || item.owner_student_id.toUpperCase() !== deciderStudentId.toUpperCase()) {
      const err = new Error('Forbidden: Only the listing owner can approve claims for this item.');
      err.statusCode = 403;
      throw err;
    }
    if (item.status !== 'Found') {
      const err = new Error(`Item is no longer available to be claimed (current status: ${item.status}).`);
      err.statusCode = 400;
      throw err;
    }

    // 1. Approve this claim
    dbInstance.prepare(`
      UPDATE claims 
      SET status = 'Approved', decided_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(claim.id);

    // 2. Set item status to 'Claimed'
    const claimNote = `[Reunited with ${claim.claimant_name} (${claim.claimant_student_id})]`;
    const updatedDesc = item.description ? `${item.description} ${claimNote}` : claimNote;
    dbInstance.prepare(`
      UPDATE items 
      SET status = 'Claimed', description = ? 
      WHERE id = ?
    `).run(updatedDesc, item.id);

    // 3. Atomically reject any other pending claims on this item
    dbInstance.prepare(`
      UPDATE claims 
      SET status = 'Rejected', decided_at = CURRENT_TIMESTAMP 
      WHERE item_id = ? AND id != ? AND status = 'Pending'
    `).run(item.id, claim.id);

    return {
      claim: dbInstance.prepare('SELECT * FROM claims WHERE id = ?').get(claimId),
      item: getItemById(item.id)
    };
  });

  return tx();
};

/**
 * Reject a claim for an item.
 * Item remains in Found status.
 */
export const rejectClaimTransaction = (claimId, deciderStudentId) => {
  const tx = dbInstance.transaction(() => {
    const claim = dbInstance.prepare('SELECT * FROM claims WHERE id = ?').get(claimId);
    if (!claim) {
      const err = new Error('Claim not found.');
      err.statusCode = 404;
      throw err;
    }
    if (claim.status !== 'Pending') {
      const err = new Error(`This claim has already been decided (${claim.status}).`);
      err.statusCode = 400;
      throw err;
    }

    const item = dbInstance.prepare('SELECT * FROM items WHERE id = ?').get(claim.item_id);
    if (!item) {
      const err = new Error('Associated item not found.');
      err.statusCode = 404;
      throw err;
    }
    if (!item.owner_student_id || item.owner_student_id.toUpperCase() !== deciderStudentId.toUpperCase()) {
      const err = new Error('Forbidden: Only the listing owner can reject claims for this item.');
      err.statusCode = 403;
      throw err;
    }

    dbInstance.prepare(`
      UPDATE claims 
      SET status = 'Rejected', decided_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(claim.id);

    return dbInstance.prepare('SELECT * FROM claims WHERE id = ?').get(claimId);
  });

  return tx();
};

/**
 * Retrieve claims submitted by a student.
 */
export const getClaimsByClaimant = (studentId) => {
  const stmt = dbInstance.prepare(`
    SELECT 
      claims.*, 
      items.name as item_name, 
      items.category as item_category, 
      items.location as item_location,
      items.status as item_status
    FROM claims 
    JOIN items ON claims.item_id = items.id 
    WHERE UPPER(claims.claimant_student_id) = UPPER(?) 
    ORDER BY claims.created_at DESC
  `);
  return stmt.all(studentId);
};

// ==========================================
// "I Found This" Reports Database Operations
// ==========================================

/**
 * Create a new found report with initial 'Pending' status.
 */
export const createFoundReportRecord = ({
  itemId,
  finderUsername,
  finderStudentId,
  finderName,
  location,
  additionalDetails
}) => {
  const stmt = dbInstance.prepare(`
    INSERT INTO found_reports (
      item_id,
      finder_username,
      finder_student_id,
      finder_name,
      location,
      additional_details,
      status
    )
    VALUES (?, ?, ?, ?, ?, ?, 'Pending')
  `);
  const result = stmt.run(
    itemId,
    finderUsername.trim(),
    finderStudentId.trim().toUpperCase(),
    finderName.trim(),
    location.trim(),
    additionalDetails.trim()
  );
  return getFoundReportById(result.lastInsertRowid);
};

/**
 * Retrieve a found report by its ID with associated item details.
 */
export const getFoundReportById = (id) => {
  const stmt = dbInstance.prepare(`
    SELECT 
      found_reports.*,
      items.name as item_name,
      items.category as item_category,
      items.location as item_lost_location,
      items.image_url as item_image_url,
      items.status as item_status,
      items.owner_student_id as item_owner_student_id,
      items.owner_username as item_owner_username
    FROM found_reports
    JOIN items ON found_reports.item_id = items.id
    WHERE found_reports.id = ?
  `);
  return stmt.get(id);
};

/**
 * Retrieve all found reports for a specific item (for owner review).
 */
export const getFoundReportsByItemId = (itemId) => {
  const stmt = dbInstance.prepare(`
    SELECT 
      found_reports.*,
      items.name as item_name,
      items.category as item_category,
      items.location as item_lost_location,
      items.image_url as item_image_url,
      items.status as item_status
    FROM found_reports
    JOIN items ON found_reports.item_id = items.id
    WHERE found_reports.item_id = ?
    ORDER BY found_reports.created_at DESC, found_reports.id DESC
  `);
  return stmt.all(itemId);
};

/**
 * Check if a finder already has a pending report on an item.
 */
export const getPendingFoundReport = (itemId, studentId) => {
  const stmt = dbInstance.prepare(`
    SELECT * FROM found_reports
    WHERE item_id = ? AND UPPER(finder_student_id) = UPPER(?) AND status = 'Pending'
  `);
  return stmt.get(itemId, studentId.trim());
};

/**
 * Retrieve all found reports submitted for items owned by a specific student.
 */
export const getFoundReportsByOwner = (ownerStudentId) => {
  const stmt = dbInstance.prepare(`
    SELECT 
      found_reports.*,
      items.name as item_name,
      items.category as item_category,
      items.location as item_lost_location,
      items.image_url as item_image_url,
      items.status as item_status
    FROM found_reports
    JOIN items ON found_reports.item_id = items.id
    WHERE UPPER(items.owner_student_id) = UPPER(?)
    ORDER BY found_reports.created_at DESC, found_reports.id DESC
  `);
  return stmt.all(ownerStudentId.trim());
};

/**
 * Retrieve all found reports submitted by a specific student as finder.
 */
export const getFoundReportsByFinder = (finderStudentId) => {
  const stmt = dbInstance.prepare(`
    SELECT 
      found_reports.*,
      items.name as item_name,
      items.category as item_category,
      items.location as item_lost_location,
      items.image_url as item_image_url,
      items.status as item_status,
      items.owner_student_id as item_owner_student_id
    FROM found_reports
    JOIN items ON found_reports.item_id = items.id
    WHERE UPPER(found_reports.finder_student_id) = UPPER(?)
    ORDER BY found_reports.created_at DESC, found_reports.id DESC
  `);
  return stmt.all(finderStudentId.trim());
};

/**
 * Count pending found reports for items owned by a student.
 */
export const getPendingFoundReportsCountForOwner = (ownerStudentId) => {
  const stmt = dbInstance.prepare(`
    SELECT COUNT(*) as count
    FROM found_reports
    JOIN items ON found_reports.item_id = items.id
    WHERE UPPER(items.owner_student_id) = UPPER(?) AND found_reports.status = 'Pending'
  `);
  return stmt.get(ownerStudentId.trim())?.count || 0;
};

/**
 * Confirm a found report atomically using SQLite transaction.
 * 1. Verifies report exists and is 'Pending'.
 * 2. Verifies decider owns the associated Lost item.
 * 3. Verifies item is still active ('Lost') and not already reunited.
 * 4. Marks report as 'Confirmed' with decided_at timestamp.
 * 5. Updates item status to 'Claimed' (Reunited Archive) and records reunion details.
 * 6. Atomically rejects/closes any other Pending reports for this item.
 * 7. Records database notifications for finders and owner.
 */
export const confirmFoundReportTransaction = (reportId, deciderStudentId) => {
  const tx = dbInstance.transaction(() => {
    // 1. Verify report exists
    const report = dbInstance.prepare('SELECT * FROM found_reports WHERE id = ?').get(reportId);
    if (!report) {
      const err = new Error('Found report not found.');
      err.statusCode = 404;
      throw err;
    }
    if (report.status !== 'Pending') {
      const err = new Error(`This report has already been decided (${report.status}).`);
      err.statusCode = 400;
      throw err;
    }

    // 2. Verify associated item exists
    const item = dbInstance.prepare('SELECT * FROM items WHERE id = ?').get(report.item_id);
    if (!item) {
      const err = new Error('Associated item not found.');
      err.statusCode = 404;
      throw err;
    }
    // Verify decider owns the item
    if (!item.owner_student_id || item.owner_student_id.toUpperCase() !== deciderStudentId.toUpperCase()) {
      const err = new Error('Forbidden: Only the listing owner can confirm reports for this item.');
      err.statusCode = 403;
      throw err;
    }
    // Verify item is still active Lost
    if (item.status !== 'Lost') {
      const err = new Error(`Item is no longer available as an active Lost item (current status: ${item.status}).`);
      err.statusCode = 400;
      throw err;
    }

    // 3. Confirm this report
    dbInstance.prepare(`
      UPDATE found_reports
      SET status = 'Confirmed', decided_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(report.id);

    // 4. Update item status to 'Claimed' (Reunited Archive)
    const reunionNote = `[Physically Reunited: Found by ${report.finder_name} (${report.finder_student_id}) at ${report.location}]`;
    const updatedDesc = item.description ? `${item.description} ${reunionNote}` : reunionNote;
    dbInstance.prepare(`
      UPDATE items
      SET status = 'Claimed', description = ?
      WHERE id = ?
    `).run(updatedDesc, item.id);

    // 5. Reject any other pending reports for this item
    const otherPending = dbInstance.prepare(`
      SELECT * FROM found_reports
      WHERE item_id = ? AND id != ? AND status = 'Pending'
    `).all(item.id, report.id);

    if (otherPending.length > 0) {
      dbInstance.prepare(`
        UPDATE found_reports
        SET status = 'Rejected', decided_at = CURRENT_TIMESTAMP
        WHERE item_id = ? AND id != ? AND status = 'Pending'
      `).run(item.id, report.id);
    }

    // 6. Persistent database notifications
    // Notification for confirmed finder
    dbInstance.prepare(`
      INSERT INTO notifications (recipient_student_id, type, title, message, item_id, report_id)
      VALUES (?, 'found_report_confirmed', 'Found Report Confirmed! 🎉', ?, ?, ?)
    `).run(
      report.finder_student_id,
      `Your report for "${item.name}" was confirmed by the owner! The item is now physically reunited.`,
      item.id,
      report.id
    );

    // Notifications for other finders whose reports were closed
    const insertOtherNotif = dbInstance.prepare(`
      INSERT INTO notifications (recipient_student_id, type, title, message, item_id, report_id)
      VALUES (?, 'found_report_closed', 'Listing Reunited', ?, ?, ?)
    `);
    for (const other of otherPending) {
      insertOtherNotif.run(
        other.finder_student_id,
        `Another report for "${item.name}" was confirmed by the owner. This listing has been marked as reunited.`,
        item.id,
        other.id
      );
    }

    return {
      report: getFoundReportById(reportId),
      item: getItemById(item.id)
    };
  });

  return tx();
};

/**
 * Reject a found report for an item.
 * Lost item remains in active 'Lost' status.
 */
export const rejectFoundReportTransaction = (reportId, deciderStudentId) => {
  const tx = dbInstance.transaction(() => {
    // 1. Verify report exists
    const report = dbInstance.prepare('SELECT * FROM found_reports WHERE id = ?').get(reportId);
    if (!report) {
      const err = new Error('Found report not found.');
      err.statusCode = 404;
      throw err;
    }
    if (report.status !== 'Pending') {
      const err = new Error(`This report has already been decided (${report.status}).`);
      err.statusCode = 400;
      throw err;
    }

    // 2. Verify associated item exists and decider ownership
    const item = dbInstance.prepare('SELECT * FROM items WHERE id = ?').get(report.item_id);
    if (!item) {
      const err = new Error('Associated item not found.');
      err.statusCode = 404;
      throw err;
    }
    if (!item.owner_student_id || item.owner_student_id.toUpperCase() !== deciderStudentId.toUpperCase()) {
      const err = new Error('Forbidden: Only the listing owner can reject reports for this item.');
      err.statusCode = 403;
      throw err;
    }

    // 3. Mark report as 'Rejected'
    dbInstance.prepare(`
      UPDATE found_reports
      SET status = 'Rejected', decided_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(report.id);

    // 4. Send persistent notification to finder
    dbInstance.prepare(`
      INSERT INTO notifications (recipient_student_id, type, title, message, item_id, report_id)
      VALUES (?, 'found_report_rejected', 'Found Report Status Update', ?, ?, ?)
    `).run(
      report.finder_student_id,
      `Your found report for "${item.name}" was reviewed and rejected by the owner.`,
      item.id,
      report.id
    );

    return getFoundReportById(reportId);
  });

  return tx();
};

// ==========================================
// Persistent Dashboard Notifications Operations
// ==========================================

export const createNotificationRecord = ({
  recipientStudentId,
  type,
  title,
  message,
  itemId = null,
  reportId = null
}) => {
  const stmt = dbInstance.prepare(`
    INSERT INTO notifications (recipient_student_id, type, title, message, item_id, report_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    recipientStudentId.trim().toUpperCase(),
    type,
    title,
    message,
    itemId,
    reportId
  );
  return dbInstance.prepare('SELECT * FROM notifications WHERE id = ?').get(result.lastInsertRowid);
};

export const getNotificationsByStudent = (studentId) => {
  const stmt = dbInstance.prepare(`
    SELECT * FROM notifications
    WHERE UPPER(recipient_student_id) = UPPER(?)
    ORDER BY created_at DESC, id DESC
    LIMIT 50
  `);
  return stmt.all(studentId.trim());
};

export const getUnreadNotificationCount = (studentId) => {
  const stmt = dbInstance.prepare(`
    SELECT COUNT(*) as count FROM notifications
    WHERE UPPER(recipient_student_id) = UPPER(?) AND is_read = 0
  `);
  return stmt.get(studentId.trim())?.count || 0;
};

export const markNotificationsAsRead = (studentId) => {
  dbInstance.prepare(`
    UPDATE notifications
    SET is_read = 1
    WHERE UPPER(recipient_student_id) = UPPER(?) AND is_read = 0
  `).run(studentId.trim());
};
