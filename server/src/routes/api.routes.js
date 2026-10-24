import { Router } from 'express';
import { getHealth } from '../controllers/health.controller.js';
import { getItems, getItem, createItem, claimItem, getStats } from '../controllers/items.controller.js';

const router = Router();

// Health check endpoint
router.get('/health', getHealth);

// Item statistics (counts for found, lost, claimed)
router.get('/stats', getStats);

// Lost & Found items CRUD
router.get('/items', getItems);
router.post('/items', createItem);
router.get('/items/:id', getItem);
router.post('/items/:id/claim', claimItem);

export default router;
