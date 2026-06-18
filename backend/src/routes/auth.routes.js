const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

const COOKIE_OPTIONS = {
  httpOnly: true,                                    // JS cannot read this cookie
  secure: process.env.NODE_ENV === 'production',     // HTTPS only in prod
  sameSite: 'strict',                                // CSRF protection
  maxAge: 7 * 24 * 60 * 60 * 1000,                  // 7 days in ms
};

function issueToken(userId, role) {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    // passwordHash field triggers bcrypt via pre-save hook in User model
    const user = await User.create({ email, passwordHash: password });

    const token = issueToken(user._id, user.role);
    res.cookie('token', token, COOKIE_OPTIONS);

    return res.status(201).json({ user });
  } catch (err) {
    console.error('[Auth] Register error:', err);
    return res.status(500).json({ message: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    // Deliberately vague error — don't reveal whether email exists
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const valid = await user.comparePassword(password);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = issueToken(user._id, user.role);
    res.cookie('token', token, COOKIE_OPTIONS);

    return res.status(200).json({ user });
  } catch (err) {
    console.error('[Auth] Login error:', err);
    return res.status(500).json({ message: 'Login failed' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('token', { ...COOKIE_OPTIONS, maxAge: 0 });
  return res.status(200).json({ message: 'Logged out successfully' });
});

// GET /api/auth/me — returns current user from cookie
router.get('/me', auth, (req, res) => {
  return res.status(200).json({ user: req.user });
});

module.exports = router;
