import { isSupabaseConfigured } from '../db/supabase.js';

export const getHealth = (req, res) => {
  res.status(200).json({
    status: 'ok',
    app: 'Campus Lost and Found',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    services: {
      server: 'running',
      database: isSupabaseConfigured() ? 'connected' : 'not_configured'
    }
  });
};
