const express = require('express');
const router = express.Router();
const db = require('../config/db');
require('dotenv').config();

// ============================================================
// POST /api/auth/login - Admin Login
// ============================================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email dan password diperlukan' });
    }

    // Check against DB (simple password check - not hashed for simplicity)
    const [rows] = await db.execute(
      'SELECT id, name, email, role FROM users WHERE email = ? AND password = ? AND role = ?',
      [email, password, 'admin']
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Email atau password tidak valid' });
    }

    const user = rows[0];

    res.json({
      success: true,
      message: 'Login berhasil',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('POST /auth/login error:', err);
    res.status(500).json({ success: false, message: 'Gagal melakukan login', error: err.message });
  }
});

// ============================================================
// POST /api/auth/logout - Logout (stateless - just acknowledgment)
// ============================================================
router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logout berhasil. Sesi dihapus di sisi klien.' });
});

// ============================================================
// GET /api/auth/me - Check current session (for frontend validation)
// ============================================================
router.get('/me', async (req, res) => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@auracart.com';
    const [rows] = await db.execute(
      'SELECT id, name, email, role FROM users WHERE email = ? AND role = ?',
      [adminEmail, 'admin']
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Admin tidak ditemukan' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
