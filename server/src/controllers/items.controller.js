import {
  getAllItems,
  getItemById,
  createItemRecord,
  getItemStats,
  createClaimRecord,
  getClaimsByItemId,
  getPendingClaim,
  approveClaimTransaction,
  rejectClaimTransaction,
  getClaimsByClaimant
} from '../db/sqlite.js';

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
 * Protected: Associates listing with the currently authenticated student session.
 * Body: { name, category, location, status, description, image_url, reporter_name, contact, desk_location }
 */
export const createItem = (req, res) => {
  try {
    const sessionUser = req.session?.user;
    if (!sessionUser) {
      return res.status(401).json({ error: 'Authentication required to report or log an item.' });
    }

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
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Item name is required and must not be empty.' });
    }

    // Validate category
    if (!category || typeof category !== 'string' || !category.trim()) {
      return res.status(400).json({ error: 'Item category is required.' });
    }

    const normalizedCategory = category.trim().toLowerCase();

    // Validate location
    if (!location || typeof location !== 'string' || !location.trim()) {
      return res.status(400).json({ error: 'Item location is required.' });
    }

    // Validate status ('Lost', 'Found', 'Claimed')
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
      return res.status(400).json({ error: "New item status must be 'Lost' or 'Found'." });
    }

    // Derive creator and ownership strictly from authenticated backend session
    const owner_username = sessionUser.username;
    const owner_student_id = sessionUser.studentId;
    const finalReporterName = reporter_name && reporter_name.trim() !== ''
      ? reporter_name.trim()
      : sessionUser.fullName;

    const newItem = createItemRecord({
      name: name.trim(),
      category: normalizedCategory,
      location: location.trim(),
      status: normalizedStatus,
      description: description ? String(description).trim() : null,
      image_url: image_url ? String(image_url).trim() : null,
      reporter_name: finalReporterName,
      contact: contact ? String(contact).trim() : null,
      desk_location: desk_location ? String(desk_location).trim() : null,
      owner_username,
      owner_student_id
    });

    res.status(201).json({
      success: true,
      message: 'Item recorded successfully in SQLite registry.',
      data: newItem
    });
  } catch (error) {
    console.error('[Items Controller Error] Failed to create item:', error);
    res.status(500).json({ error: 'Failed to create item in database.' });
  }
};

/**
 * POST /api/items/:id/claim
 * Protected: Submits a claim verification for an active Found listing.
 * Body: { student_id, claimer_name, verification_detail }
 */
export const claimItem = (req, res) => {
  try {
    const sessionUser = req.session?.user;
    if (!sessionUser) {
      return res.status(401).json({ error: 'Authentication required to submit a claim.' });
    }

    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Item ID must be a valid integer.' });
    }

    const item = getItemById(id);
    if (!item) {
      return res.status(404).json({ error: `Item with ID ${id} not found.` });
    }

    // Only active 'Found' items can be claimed
    if (item.status !== 'Found') {
      return res.status(400).json({
        error: `Claims can only be submitted for active Found items. Current status: ${item.status}`
      });
    }

    // Prevent users from claiming their own listings
    if (item.owner_student_id && item.owner_student_id.toUpperCase() === sessionUser.studentId.toUpperCase()) {
      return res.status(403).json({
        error: 'You cannot submit an ownership claim for your own listing.'
      });
    }

    const { student_id, claimer_name, verification_detail } = req.body || {};

    if (!student_id || typeof student_id !== 'string' || !student_id.trim()) {
      return res.status(400).json({ error: 'Student ID is required for verification.' });
    }

    if (!claimer_name || typeof claimer_name !== 'string' || !claimer_name.trim()) {
      return res.status(400).json({ error: 'Full legal name is required.' });
    }

    if (!verification_detail || typeof verification_detail !== 'string' || !verification_detail.trim()) {
      return res.status(400).json({ error: 'Ownership proof details are required.' });
    }

    // The entered Student ID must match the authenticated student's ID
    if (student_id.trim().toUpperCase() !== sessionUser.studentId.toUpperCase()) {
      return res.status(400).json({
        error: `Entered Student ID (${student_id.trim()}) does not match your signed-in Student ID (${sessionUser.studentId}).`
      });
    }

    // Prevent duplicate pending claims for the same item by the same student
    const existingClaim = getPendingClaim(id, sessionUser.studentId);
    if (existingClaim) {
      return res.status(400).json({
        error: 'You already have an active pending claim submitted for this item. Please wait for the owner to review it.'
      });
    }

    // Save claim in SQLite with persistent ID and 'Pending' status
    const newClaim = createClaimRecord({
      itemId: id,
      claimantUsername: sessionUser.username,
      claimantStudentId: sessionUser.studentId,
      claimantName: claimer_name.trim(),
      verificationDetail: verification_detail.trim()
    });

    res.status(201).json({
      success: true,
      message: 'Claim verification submitted and pending review by listing owner.',
      data: newClaim
    });
  } catch (error) {
    console.error('[Items Controller Error] Failed to submit claim:', error);
    res.status(500).json({ error: 'Failed to process claim verification.' });
  }
};

/**
 * GET /api/items/:id/claims
 * Protected: Allows listing owner to view claims submitted for their listing.
 */
export const getItemClaims = (req, res) => {
  try {
    const sessionUser = req.session?.user;
    if (!sessionUser) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Item ID must be a valid integer.' });
    }

    const item = getItemById(id);
    if (!item) {
      return res.status(404).json({ error: `Item with ID ${id} not found.` });
    }

    // Verify listing owner
    if (!item.owner_student_id || item.owner_student_id.toUpperCase() !== sessionUser.studentId.toUpperCase()) {
      return res.status(403).json({
        error: 'Forbidden: Only the owner who created this listing can review its claims.'
      });
    }

    const claims = getClaimsByItemId(id);
    res.status(200).json({
      success: true,
      data: claims
    });
  } catch (error) {
    console.error('[Items Controller Error] Failed to retrieve claims:', error);
    res.status(500).json({ error: 'Failed to retrieve claims from database.' });
  }
};

/**
 * POST /api/claims/:id/approve
 * Protected: Listing owner approves a pending claim.
 * Atomically transitions claim to Approved and item to Claimed (Reunited Archive).
 */
export const approveClaim = (req, res) => {
  try {
    const sessionUser = req.session?.user;
    if (!sessionUser) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const claimId = parseInt(req.params.id, 10);
    if (isNaN(claimId)) {
      return res.status(400).json({ error: 'Claim ID must be a valid integer.' });
    }

    const result = approveClaimTransaction(claimId, sessionUser.studentId);

    res.status(200).json({
      success: true,
      message: 'Claim approved successfully. Item marked as reunited in the archive.',
      data: result
    });
  } catch (error) {
    console.error('[Items Controller Error] Failed to approve claim:', error.message);
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ error: error.message || 'Failed to approve claim.' });
  }
};

/**
 * POST /api/claims/:id/reject
 * Protected: Listing owner rejects a pending claim.
 * Claim transitions to Rejected; item remains in active Found listings.
 */
export const rejectClaim = (req, res) => {
  try {
    const sessionUser = req.session?.user;
    if (!sessionUser) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const claimId = parseInt(req.params.id, 10);
    if (isNaN(claimId)) {
      return res.status(400).json({ error: 'Claim ID must be a valid integer.' });
    }

    const updatedClaim = rejectClaimTransaction(claimId, sessionUser.studentId);

    res.status(200).json({
      success: true,
      message: 'Claim rejected. Item remains in active Found listings.',
      data: updatedClaim
    });
  } catch (error) {
    console.error('[Items Controller Error] Failed to reject claim:', error.message);
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ error: error.message || 'Failed to reject claim.' });
  }
};

/**
 * GET /api/claims/my
 * Protected: Returns claims submitted by the current user.
 */
export const getMyClaims = (req, res) => {
  try {
    const sessionUser = req.session?.user;
    if (!sessionUser) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const claims = getClaimsByClaimant(sessionUser.studentId);
    res.status(200).json({
      success: true,
      data: claims
    });
  } catch (error) {
    console.error('[Items Controller Error] Failed to get user claims:', error);
    res.status(500).json({ error: 'Failed to retrieve your claims.' });
  }
};
