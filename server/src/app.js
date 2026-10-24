import express from 'express';
import cors from 'cors';
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
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Centralized error handling
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal Server Error'
  });
});

export default app;
