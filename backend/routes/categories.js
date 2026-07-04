const express = require('express');
const router = express.Router();
const db = require('../config/db');

// ============================================================
// GET /api/categories - Get all product categories with counts
// ============================================================
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        category,
        COUNT(*) as product_count,
        MIN(price) as min_price,
        MAX(price) as max_price,
        AVG(rating) as avg_rating
      FROM products 
      WHERE is_active = 1 
      GROUP BY category
      ORDER BY product_count DESC
    `);

    const totalProducts = rows.reduce((sum, r) => sum + parseInt(r.product_count), 0);

    const categories = [
      { name: 'all', label: 'Semua Produk', count: totalProducts },
      ...rows.map(r => ({
        name: r.category,
        label: r.category,
        count: parseInt(r.product_count),
        minPrice: parseInt(r.min_price),
        maxPrice: parseInt(r.max_price),
        avgRating: parseFloat(parseFloat(r.avg_rating).toFixed(1))
      }))
    ];

    res.json({ success: true, data: categories });
  } catch (err) {
    console.error('GET /categories error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil data kategori', error: err.message });
  }
});

// ============================================================
// GET /api/promo/codes - Get all active promo codes
// ============================================================
router.get('/promo/codes', async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT code, discount_percent FROM promo_codes WHERE is_active = 1'
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
