import { Router } from 'express';
import { getHealth } from '../controllers/health.controller.js';
import { getItems, getItem, createItem } from '../controllers/items.controller.js';

const router = Router();

// Health check endpoint
router.get('/health', getHealth);

// Lost & Found items CRUD
router.get('/items', getItems);
router.post('/items', createItem);
router.get('/items/:id', getItem);

export default router;
