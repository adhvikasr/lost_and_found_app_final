/**
 * Middleware to require an active authenticated student session.
 * Rejects unauthenticated requests with HTTP 401.
 */
export const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({
      error: 'Authentication required. Please sign in to perform this action.'
    });
  }
  next();
};
