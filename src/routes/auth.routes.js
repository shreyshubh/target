const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');
const User = require('../models/User.model');
const authMiddleware = require('../middleware/auth.middleware');
const config = require('../config');

const router = express.Router();

// ── Rate limiters ────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // 15 attempts per window
  message: { error: 'Too many attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 reset requests per hour
  message: { error: 'Too many reset requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Password strength validation ─────────────────────────────
function validatePassword(password) {
  const errors = [];
  if (password.length < 8) errors.push('Password must be at least 8 characters');
  if (!/[A-Z]/.test(password)) errors.push('Must contain at least one uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('Must contain at least one lowercase letter');
  if (!/[0-9]/.test(password)) errors.push('Must contain at least one digit');
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)) errors.push('Must contain at least one special character');
  return errors;
}

// ── Email validation (uses centralized config) ───────────────
function isValidEmail(email) {
  return config.EMAIL_REGEX.test(email);
}

// ── Generate JWT ─────────────────────────────────────────────
function generateToken(user) {
  return jwt.sign(
    { id: user._id, username: user.username },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN }
  );
}

// ══════════════════════════════════════════════════════════════
// POST /api/auth/register
// ══════════════════════════════════════════════════════════════
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required.' });
    }

    // Validate email
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Please use a valid email from a recognized provider (Gmail, Yahoo, Outlook, etc.).' });
    }

    // Validate password strength
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      return res.status(400).json({ error: 'Weak password.', details: passwordErrors });
    }

    // Check for existing username or email
    const existingUser = await User.findOne({
      $or: [{ username: username.toLowerCase().trim() }, { email: email.toLowerCase().trim() }],
    });
    if (existingUser) {
      if (existingUser.username === username.toLowerCase().trim()) {
        return res.status(409).json({ error: 'Username already taken.' });
      }
      return res.status(409).json({ error: 'Email already registered.' });
    }

    const user = new User({
      username: username.toLowerCase().trim(),
      email: email.toLowerCase().trim(),
      passwordHash: password, // pre-save hook will hash it
    });
    await user.save();

    const token = generateToken(user);
    res.cookie('auth_token', token, config.COOKIE_OPTIONS);
    res.status(201).json({
      user: { id: user._id, username: user.username, email: user.email },
    });
  } catch (err) {
    console.error('Register error:', err);
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Username or email already exists.' });
    }
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

// ══════════════════════════════════════════════════════════════
// POST /api/auth/login
// ══════════════════════════════════════════════════════════════
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const user = await User.findOne({ username: username.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const token = generateToken(user);
    res.cookie('auth_token', token, config.COOKIE_OPTIONS);
    res.json({
      user: { id: user._id, username: user.username, email: user.email },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// ══════════════════════════════════════════════════════════════
// POST /api/auth/forgot-password
// ══════════════════════════════════════════════════════════════
router.post('/forgot-password', forgotPasswordLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      // Don't reveal if the email exists or not (security)
      return res.json({ message: 'If a matching account exists, a reset code has been sent.' });
    }

    // Generate a 6-digit code
    const code = crypto.randomInt(100000, 999999).toString();
    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');

    user.resetCode = hashedCode;
    user.resetCodeExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    user.resetAttempts = 0; // Reset attempt counter
    user.resetAttemptsExpiry = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    // Send email
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (emailUser && emailPass) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: emailUser, pass: emailPass },
      });

      await transporter.sendMail({
        from: `"Syllabus Tracker" <${emailUser}>`,
        to: user.email,
        subject: 'Password Reset Code',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 400px; margin: 0 auto;">
            <h2 style="color: #6c5ce7;">Password Reset</h2>
            <p>Your verification code is:</p>
            <div style="background: #f0f0f0; padding: 15px; border-radius: 8px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #2d3436;">
              ${code}
            </div>
            <p style="color: #636e72; margin-top: 15px;">This code expires in 15 minutes.</p>
          </div>
        `,
      });
    } else {
      // Dev mode: log the code
      console.log(`🔑 Password reset code for ${user.email}: ${code}`);
    }

    res.json({ message: 'If a matching account exists, a reset code has been sent.' });
  } catch (err) {
    console.error('Forgot-password error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ══════════════════════════════════════════════════════════════
// POST /api/auth/reset-password
// ══════════════════════════════════════════════════════════════
router.post('/reset-password', authLimiter, async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: 'Email, code, and new password are all required.' });
    }

    // Validate new password
    const passwordErrors = validatePassword(newPassword);
    if (passwordErrors.length > 0) {
      return res.status(400).json({ error: 'Weak password.', details: passwordErrors });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !user.resetCode || !user.resetCodeExpiry) {
      return res.status(400).json({ error: 'Invalid or expired reset code.' });
    }

    // Check expiry
    if (new Date() > user.resetCodeExpiry) {
      user.resetCode = null;
      user.resetCodeExpiry = null;
      user.resetAttempts = 0;
      await user.save();
      return res.status(400).json({ error: 'Reset code has expired. Please request a new one.' });
    }

    // Brute-force protection: max 5 attempts per code
    if (user.resetAttempts >= 5) {
      user.resetCode = null;
      user.resetCodeExpiry = null;
      user.resetAttempts = 0;
      await user.save();
      return res.status(429).json({ error: 'Too many incorrect attempts. Please request a new code.' });
    }

    // Verify code
    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');
    if (hashedCode !== user.resetCode) {
      user.resetAttempts = (user.resetAttempts || 0) + 1;
      await user.save();
      return res.status(400).json({ error: 'Invalid reset code.' });
    }

    // Update password
    user.passwordHash = newPassword; // pre-save hook will hash it
    user.resetCode = null;
    user.resetCodeExpiry = null;
    user.resetAttempts = 0;
    await user.save();

    res.json({ message: 'Password has been reset successfully.' });
  } catch (err) {
    console.error('Reset-password error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ══════════════════════════════════════════════════════════════
// GET /api/auth/me — Get current user info (protected)
// ══════════════════════════════════════════════════════════════
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash -resetCode -resetCodeExpiry -resetAttempts -resetAttemptsExpiry');
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ id: user._id, username: user.username, email: user.email });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// ══════════════════════════════════════════════════════════════
// PUT /api/auth/change-password (protected) — Feature #1
// ══════════════════════════════════════════════════════════════
router.put('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required.' });
    }

    const passwordErrors = validatePassword(newPassword);
    if (passwordErrors.length > 0) {
      return res.status(400).json({ error: 'Weak password.', details: passwordErrors });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    user.passwordHash = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    console.error('Change-password error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ══════════════════════════════════════════════════════════════
// PUT /api/auth/profile (protected) — Feature #2
// ══════════════════════════════════════════════════════════════
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { username, email } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    if (username && username.toLowerCase().trim() !== user.username) {
      if (username.trim().length < 3) {
        return res.status(400).json({ error: 'Username must be at least 3 characters.' });
      }
      const existing = await User.findOne({ username: username.toLowerCase().trim() });
      if (existing) return res.status(409).json({ error: 'Username already taken.' });
      user.username = username.toLowerCase().trim();
    }

    if (email && email.toLowerCase().trim() !== user.email) {
      if (!isValidEmail(email)) {
        return res.status(400).json({ error: 'Please use a valid email from a recognized provider.' });
      }
      const existing = await User.findOne({ email: email.toLowerCase().trim() });
      if (existing) return res.status(409).json({ error: 'Email already registered.' });
      user.email = email.toLowerCase().trim();
    }

    await user.save();

    const token = generateToken(user);
    res.cookie('auth_token', token, config.COOKIE_OPTIONS);
    res.json({
      user: { id: user._id, username: user.username, email: user.email },
    });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ══════════════════════════════════════════════════════════════
// DELETE /api/auth/account (protected) — Feature #11
// ══════════════════════════════════════════════════════════════
router.delete('/account', authMiddleware, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: 'Password is required to delete account.' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ error: 'Incorrect password.' });

    // Delete all user data
    const mongoose = require('mongoose');
    const Attendance = require('../models/Attendance.model');
    const Todo = require('../models/Todo.model');
    const Progress = require('../models/Progress.model');
    const Syllabus = require('../models/Syllabus.model');

    await Promise.all([
      Attendance.deleteMany({ userId: user._id }),
      Todo.deleteMany({ userId: user._id }),
      Progress.deleteMany({ userId: user._id }),
      Syllabus.deleteMany({ userId: user._id }),
      User.findByIdAndDelete(user._id),
    ]);

    res.json({ message: 'Account and all data deleted successfully.' });
  } catch (err) {
    console.error('Delete account error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ══════════════════════════════════════════════════════════════
// POST /api/auth/logout — Clear auth cookie
// ══════════════════════════════════════════════════════════════
router.post('/logout', (req, res) => {
  res.clearCookie('auth_token', { path: '/' });
  res.json({ message: 'Logged out successfully.' });
});

module.exports = router;
