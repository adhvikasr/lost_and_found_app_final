import express from 'express';
import cors from 'cors';
import session from 'express-session';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import apiRoutes from './routes/api.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const clientDistDirectory = path.resolve(__dirname, '../../client/dist');
const clientSourceDirectory = path.resolve(__dirname, '../../client');
const staticDirectory = fs.existsSync(clientDistDirectory) ? clientDistDirectory : clientSourceDirectory;

const app = express();

// Global Middleware
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Server-managed session configuration for demonstration
app.use(session({
  name: 'campus_session',
  secret: process.env.SESSION_SECRET || 'campus-lost-and-found-demo-secret-key-2026',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false, // false for local HTTP demo environments
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Serve frontend static files (serves built Vue 3 dist if available)
app.use(express.static(staticDirectory));

// API Routes
app.use('/api', apiRoutes);

// Fallback to index.html for any unhandled non-API routes (SPA support)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  const indexPath = path.join(staticDirectory, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  res.sendFile(path.join(clientSourceDirectory, 'index.html'));
});

// Explicit JSON 404 handler for any unhandled /api requests (guarantees JSON output, never HTML)
app.use('/api', (req, res) => {
  res.status(404).json({
    error: `API endpoint not found: ${req.method} ${req.originalUrl}`
  });
});

// Centralized error handling (always returns JSON for API requests)
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  if (res.headersSent) {
    return next(err);
  }
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    error: err.message || 'Internal Server Error'
  });
});

export default app;
