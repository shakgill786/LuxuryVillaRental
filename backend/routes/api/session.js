const express = require('express');
const { setTokenCookie, requireAuth } = require('../../utils/auth');
const { User } = require('../../db/models');

const router = express.Router();

// Login
router.post('/', async (req, res, next) => {
  const { credential, password } = req.body;

  try {
    // Authenticate the user
    const user = await User.login({ credential, password });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Set the token cookie
    const token = setTokenCookie(res, user);

    // Respond with user and session information
    return res.json({
      session_id: token,
      user_id: user.id.toString(),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (err) {
    next(err);
  }
});

// Logout
router.delete('/', (req, res) => {
  if (req.cookies.token) {
    res.clearCookie('token');
    return res.json({ message: 'Logged out successfully' });
  } else {
    return res.status(400).json({ message: 'No active session to log out from' });
  }
});

// Restore Session
router.get('/', requireAuth, (req, res) => {
  if (req.user) {
    return res.json({
      session_id: req.cookies.token, // Include the session token if needed
      user_id: req.user.id.toString(),
      user: {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
      },
    });
  } else {
    return res.status(401).json({ message: 'No active session' });
  }
});

module.exports = router;
