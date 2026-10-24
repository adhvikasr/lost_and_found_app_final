import { getAllItems, getItemById, createItemRecord, claimItemRecord, getItemStats } from '../db/sqlite.js';

const VALID_CATEGORIES = [
  'electronics',
  'bags-keys',
  'keys',
  'wallets',
  'ids-cards',
  'id-cards',
  'books-supplies',
  'stationery',
  'clothing',
  'accessories',
  'water-bottle',
  'other'
];

/**
 * GET /api/stats
 */
export const getStats = (req, res) => {
  try {
    const stats = getItemStats();
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    console.error('[Items Controller Error] Failed to get stats:', error);
    res.status(500).json({ error: 'Failed to retrieve stats from database.' });
  }
};

/**
 * GET /api/items
 * Query params: search, category, status, location
 */
export const getItems = (req, res) => {
  try {
    const { search, category, status, location } = req.query;

    if (category && category !== 'all') {
      const normalizedCat = category.trim().toLowerCase();
      // Allow if recognized or fallback safely
    }

    if (status && status !== 'all') {
      const lowerStatus = status.trim().toLowerCase();
      if (lowerStatus !== 'lost' && lowerStatus !== 'found' && lowerStatus !== 'claimed' && lowerStatus !== 'reunited') {
        return res.status(400).json({
          error: `Invalid status filter: "${status}". Allowed: all, Lost, Found, Claimed`
        });
      }
    }

    const items = getAllItems({ search, category, status, location });
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
 * Body: { name, category, location, status, description, image_url, reporter_name, contact, desk_location }
 */
export const createItem = (req, res) => {
  try {
    const {
      name,
      category,
      location,
      status,
      description,
      image_url,
      reporter_name,
      contact,
      desk_location
    } = req.body || {};

    // Validate name
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Item name is required and must not be empty.' });
    }

    // Validate category
    if (!category || typeof category !== 'string' || category.trim() === '') {
      return res.status(400).json({ error: 'Item category is required.' });
    }

    const normalizedCategory = category.trim().toLowerCase();

    // Validate location
    if (!location || typeof location !== 'string' || location.trim() === '') {
      return res.status(400).json({ error: 'Item location is required.' });
    }

    // Validate status ('Lost', 'Found', 'Claimed')
    if (!status || typeof status !== 'string') {
      return res.status(400).json({ error: "Item status is required and must be 'Lost', 'Found', or 'Claimed'." });
    }

    const lowerStatus = status.trim().toLowerCase();
    let normalizedStatus;
    if (lowerStatus === 'lost') {
      normalizedStatus = 'Lost';
    } else if (lowerStatus === 'found') {
      normalizedStatus = 'Found';
    } else if (lowerStatus === 'claimed' || lowerStatus === 'reunited') {
      normalizedStatus = 'Claimed';
    } else {
      return res.status(400).json({ error: "Status must be 'Lost', 'Found', or 'Claimed'." });
    }

    const newItem = createItemRecord({
      name: name.trim(),
      category: normalizedCategory,
      location: location.trim(),
      status: normalizedStatus,
      description: description ? String(description).trim() : null,
      image_url: image_url ? String(image_url).trim() : null,
      reporter_name: reporter_name ? String(reporter_name).trim() : null,
      contact: contact ? String(contact).trim() : null,
      desk_location: desk_location ? String(desk_location).trim() : null
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

/**
 * POST /api/items/:id/claim
 * Body: { student_id, verification_detail, claimer_name }
 */
export const claimItem = (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Item ID must be a valid integer.' });
    }

    const { student_id, verification_detail, claimer_name } = req.body || {};
    if (!student_id) {
      return res.status(400).json({ error: 'Student ID Number is required for claim verification.' });
    }

    const updated = claimItemRecord(id, { student_id, verification_detail, claimer_name });
    if (!updated) {
      return res.status(404).json({ error: `Item with ID ${id} not found.` });
    }

    res.status(200).json({
      success: true,
      message: 'Claim verification submitted and item status updated to Claimed.',
      data: updated
    });
  } catch (error) {
    console.error('[Items Controller Error] Failed to claim item:', error);
    res.status(500).json({ error: 'Failed to process claim verification.' });
  }
};
