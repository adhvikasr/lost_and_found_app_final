import { isDatabaseConnected, getItemCount, getDbPath } from '../db/sqlite.js';

export const getHealth = (req, res) => {
  const dbConnected = isDatabaseConnected();
  const count = getItemCount();

  res.status(200).json({
    status: 'ok',
    app: 'Campus Lost and Found',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    services: {
      server: 'running',
      database: dbConnected ? 'connected' : 'disconnected',
      engine: 'sqlite (better-sqlite3)',
      databaseFile: getDbPath(),
      totalItems: count
    }
  });
};
