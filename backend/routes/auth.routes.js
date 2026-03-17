import express   from 'express';
import jwt       from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import User      from '../models/user.model.js';

const router = express.Router();

/* ── Rate limiters ──────────────────────────────────────────────────────────
   Login:    10 attempts / 15 min  (brute-force protection)
   Register: 5  attempts / hour    (account-spam protection)
──────────────────────────────────────────────────────────────────────────── */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts, please try again later.' },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many registration attempts, please try again later.' },
});

/* ── Shared JWT sign options ────────────────────────────────────────────────
   - Algorithm pinned to HS256 (prevents alg-swap / alg:none attacks)
   - 24 h expiry (down from 7 d)
──────────────────────────────────────────────────────────────────────────── */
const JWT_SIGN_OPTS = { algorithm: 'HS256', expiresIn: '24h' };

/* ── Register ────────────────────────────────────────────────────────────── */
router.post('/register', registerLimiter, async (req, res, next) => {
  try {
    const { username, email, password, confirmPassword } = req.body;

    // Presence check
    if (!username || !email || !password || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Password match
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    // Password policy — min 8, max 128 (> 128 chars can DoS bcrypt)
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    if (password.length > 128) {
      return res.status(400).json({ error: 'Password must not exceed 128 characters' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existing = await User.findOne({
      $or: [{ username: username.trim() }, { email: normalizedEmail }],
    });

    if (existing) {
      // 409 Conflict rather than 400 — clients can distinguish duplicate from bad input
      return res.status(409).json({ error: 'Username or email already exists' });
    }

    const user = new User({ username: username.trim(), email: normalizedEmail, password });
    await user.save();

    const token = jwt.sign(
      { id: user._id, username: user.username, email: user.email },
      process.env.JWT_SECRET,
      JWT_SIGN_OPTS,
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: { id: user._id, username: user.username, email: user.email },
    });
  } catch (err) { next(err); }
});

/* ── Login ───────────────────────────────────────────────────────────────── */
router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Hard-cap password length before bcrypt to prevent DoS
    if (password.length > 128) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      // Same error as wrong password — prevents user enumeration
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username, email: user.email },
      process.env.JWT_SECRET,
      JWT_SIGN_OPTS,
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: { id: user._id, username: user.username, email: user.email },
    });
  } catch (err) { next(err); }
});

/* ── Verify token (used by frontend on page load) ────────────────────────── */
router.post('/verify', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
    });

    res.json({ success: true, user: decoded });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    res.status(401).json({ error: 'Token verification failed' });
  }
});

export default router;
