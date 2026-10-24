import { getAllItems, getItemById, createItemRecord } from '../db/sqlite.js';

const VALID_CATEGORIES = [
  'electronics',
  'id-cards',
  'keys',
  'clothing',
  'stationery',
  'accessories',
  'other'
];

/**
 * GET /api/items
 * Query params: search, category, status
 */
export const getItems = (req, res) => {
  try {
    const { search, category, status } = req.query;

    if (category && category !== 'all' && !VALID_CATEGORIES.includes(category.trim().toLowerCase())) {
      return res.status(400).json({
        error: `Invalid category filter: "${category}". Allowed: all, ${VALID_CATEGORIES.join(', ')}`
      });
    }

    if (status && status !== 'all') {
      const lowerStatus = status.trim().toLowerCase();
      if (lowerStatus !== 'lost' && lowerStatus !== 'found') {
        return res.status(400).json({
          error: `Invalid status filter: "${status}". Allowed: all, Lost, Found`
        });
      }
    }

    const items = getAllItems({ search, category, status });
    res.status(200).json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (error) {
    console.error('[Items Controller Error] Failed to fetch items:', error);
    res.status(500).json({ error: 'Failed to retrieve items from database.' });
  }
};

/**
 * GET /api/items/:id
 */
export const getItem = (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Item ID must be a valid integer.' });
    }

    const item = getItemById(id);
    if (!item) {
      return res.status(404).json({ error: `Item with ID ${id} not found.` });
    }

    res.status(200).json({ success: true, data: item });
  } catch (error) {
    console.error('[Items Controller Error] Failed to get item:', error);
    res.status(500).json({ error: 'Failed to retrieve item from database.' });
  }
};

/**
 * POST /api/items
 * Body: { name, category, location, status }
 */
export const createItem = (req, res) => {
  try {
    const { name, category, location, status } = req.body || {};

    // Validate name
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Item name is required and must not be empty.' });
    }

    // Validate category
    if (!category || typeof category !== 'string' || category.trim() === '') {
      return res.status(400).json({ error: 'Item category is required.' });
    }

    const normalizedCategory = category.trim().toLowerCase();
    if (!VALID_CATEGORIES.includes(normalizedCategory)) {
      return res.status(400).json({
        error: `Invalid category "${category}". Allowed categories: ${VALID_CATEGORIES.join(', ')}`
      });
    }

    // Validate location
    if (!location || typeof location !== 'string' || location.trim() === '') {
      return res.status(400).json({ error: 'Item location is required.' });
    }

    // Validate status ('Lost' or 'Found')
    if (!status || typeof status !== 'string') {
      return res.status(400).json({ error: "Item status is required and must be 'Lost' or 'Found'." });
    }

    const lowerStatus = status.trim().toLowerCase();
    let normalizedStatus;
    if (lowerStatus === 'lost') {
      normalizedStatus = 'Lost';
    } else if (lowerStatus === 'found') {
      normalizedStatus = 'Found';
    } else {
      return res.status(400).json({ error: "Status must be either 'Lost' or 'Found'." });
    }

    const newItem = createItemRecord({
      name: name.trim(),
      category: normalizedCategory,
      location: location.trim(),
      status: normalizedStatus
    });

    res.status(201).json({
      success: true,
      message: 'Item recorded successfully in SQLite database.',
      data: newItem
    });
  } catch (error) {
    console.error('[Items Controller Error] Failed to create item:', error);
    res.status(500).json({ error: 'Failed to create item in database.' });
  }
};
