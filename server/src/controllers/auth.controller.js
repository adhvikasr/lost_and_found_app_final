import { findAccountByCredentials } from '../auth/accounts.js';

/**
 * POST /api/auth/login
 * Body: { username, password }
 */
export const login = (req, res) => {
  try {
    const { username, password } = req.body || {};

    if (!username || typeof username !== 'string' || !username.trim()) {
      return res.status(400).json({ error: 'Username is required.' });
    }

    if (!password || typeof password !== 'string') {
      return res.status(400).json({ error: 'Password is required.' });
    }

    const account = findAccountByCredentials(username, password);
    if (!account) {
      return res.status(401).json({
        error: 'Invalid username or password. Please check your credentials and try again.'
      });
    }

    // Regenerate session to prevent session fixation attacks
    req.session.regenerate((err) => {
      if (err) {
        console.error('[Auth Error] Session regeneration error:', err);
        return res.status(500).json({ error: 'Failed to initialize session. Please try again.' });
      }

      req.session.user = {
        username: account.username,
        studentId: account.studentId,
        fullName: account.fullName
      };

      res.status(200).json({
        success: true,
        message: 'Signed in successfully.',
        user: req.session.user
      });
    });
  } catch (error) {
    console.error('[Auth Error] Login failure:', error);
    res.status(500).json({ error: 'Internal server error during authentication.' });
  }
};

/**
 * GET /api/auth/me
 * Retrieves the currently authenticated student session.
 */
export const getMe = (req, res) => {
  if (req.session && req.session.user) {
    return res.status(200).json({
      success: true,
      user: req.session.user
    });
  }

  res.status(401).json({
    error: 'Not authenticated. No active session found.'
  });
};

/**
 * POST /api/auth/logout
 * Destroys server-side session and clears session cookie.
 */
export const logout = (req, res) => {
  if (!req.session) {
    res.clearCookie('campus_session');
    return res.status(200).json({ success: true, message: 'Logged out.' });
  }

  req.session.destroy((err) => {
    res.clearCookie('campus_session');
    if (err) {
      console.error('[Auth Error] Session destruction error:', err);
      return res.status(500).json({ error: 'Failed to destroy session.' });
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully.'
    });
  });
};
