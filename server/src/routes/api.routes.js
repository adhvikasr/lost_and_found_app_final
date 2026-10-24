import { Router } from 'express';
import { getHealth } from '../controllers/health.controller.js';
import { login, getMe, logout } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  getItems,
  getItem,
  createItem,
  claimItem,
  getStats,
  getItemClaims,
  approveClaim,
  rejectClaim,
  getMyClaims
} from '../controllers/items.controller.js';

const router = Router();

// ==========================================
// System & Health Endpoints
// ==========================================
router.get('/health', getHealth);
router.get('/stats', getStats);

// ==========================================
// Authentication Endpoints (Demo Accounts)
// ==========================================
router.post('/auth/login', login);
router.get('/auth/me', getMe);
router.post('/auth/logout', logout);

// ==========================================
// Items Endpoints
// ==========================================
router.get('/items', getItems);
router.get('/items/:id', getItem);
router.post('/items', requireAuth, createItem);
router.post('/items/:id/claim', requireAuth, claimItem);

// ==========================================
// Owner Claim Review Endpoints
// ==========================================
router.get('/items/:id/claims', requireAuth, getItemClaims);
router.post('/claims/:id/approve', requireAuth, approveClaim);
router.post('/claims/:id/reject', requireAuth, rejectClaim);
router.get('/claims/my', requireAuth, getMyClaims);

export default router;
