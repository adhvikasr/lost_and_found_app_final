import { getDb } from '../db/sqlite.js';

/**
 * Pre-configured demonstration accounts for Campus Lost & Found.
 * NOTE: These are preset demo credentials for local demonstration and evaluation only.
 * They are initialized both in this module and persisted into the SQLite `accounts` table.
 */
export const DEMO_ACCOUNTS = [
  {
    username: 'student1',
    password: 'demo123',
    studentId: 'STU001',
    fullName: 'Student One'
  },
  {
    username: 'student2',
    password: 'demo123',
    studentId: 'STU002',
    fullName: 'Student Two'
  },
  {
    username: 'student3',
    password: 'demo123',
    studentId: 'STU003',
    fullName: 'Student Three'
  },
  {
    username: 'student4',
    password: 'demo123',
    studentId: 'STU004',
    fullName: 'Student Four'
  },
  {
    username: 'student5',
    password: 'demo123',
    studentId: 'STU005',
    fullName: 'Student Five'
  }
];

/**
 * Verify credentials and return safe user object (excluding password).
 * Checks the SQLite `accounts` table first, falling back to DEMO_ACCOUNTS.
 */
export const findAccountByCredentials = (username, password) => {
  if (!username || !password) return null;

  try {
    const db = getDb();
    if (db) {
      const row = db.prepare(`
        SELECT username, student_id as studentId, full_name as fullName
        FROM accounts
        WHERE LOWER(username) = LOWER(?) AND password = ?
      `).get(username.trim(), password);

      if (row) {
        return {
          username: row.username,
          studentId: row.studentId,
          fullName: row.fullName
        };
      }
    }
  } catch (err) {
    console.warn('[Auth] Database accounts lookup error, using fallback:', err.message);
  }

  const user = DEMO_ACCOUNTS.find(
    acc => acc.username.toLowerCase() === username.trim().toLowerCase() && acc.password === password
  );
  if (!user) return null;
  return {
    username: user.username,
    studentId: user.studentId,
    fullName: user.fullName
  };
};

/**
 * Look up safe user object by Student ID.
 */
export const findAccountByStudentId = (studentId) => {
  if (!studentId) return null;

  try {
    const db = getDb();
    if (db) {
      const row = db.prepare(`
        SELECT username, student_id as studentId, full_name as fullName
        FROM accounts
        WHERE UPPER(student_id) = UPPER(?)
      `).get(studentId.trim());

      if (row) {
        return {
          username: row.username,
          studentId: row.studentId,
          fullName: row.fullName
        };
      }
    }
  } catch (err) {
    console.warn('[Auth] Database accounts lookup error, using fallback:', err.message);
  }

  const user = DEMO_ACCOUNTS.find(
    acc => acc.studentId.toUpperCase() === studentId.trim().toUpperCase()
  );
  if (!user) return null;
  return {
    username: user.username,
    studentId: user.studentId,
    fullName: user.fullName
  };
};
