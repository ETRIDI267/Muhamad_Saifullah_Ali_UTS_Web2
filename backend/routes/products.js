const express = require('express');
const router = express.Router();
const db = require('../config/db');

// ============================================================
// GET /api/products - Get all active products (with filters)
// ============================================================
router.get('/', async (req, res) => {
  try {
    const {
      category,
      search,
      minPrice,
      maxPrice,
      minRating,
      sort = 'popular',
      limit,
      page = 1,
    } = req.query;

    let query = `
      SELECT 
        id, name, category, price, stock, rating, review_count,
        description, image_url, images, options, specs, is_active, created_at
      FROM products
      WHERE is_active = 1
    `;
    const params = [];

    // Category filter
    if (category && category !== 'all') {
      query += ` AND category = ?`;
      params.push(category);
    }

    // Search filter
    if (search) {
      query += ` AND (name LIKE ? OR description LIKE ? OR category LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Price filters
    if (minPrice) {
      query += ` AND price >= ?`;
      params.push(parseInt(minPrice));
    }
    if (maxPrice) {
      query += ` AND price <= ?`;
      params.push(parseInt(maxPrice));
    }

    // Rating filter
    if (minRating) {
      query += ` AND rating >= ?`;
      params.push(parseFloat(minRating));
    }

    // Sorting
    switch (sort) {
      case 'price-asc':
        query += ` ORDER BY price ASC`;
        break;
      case 'price-desc':
        query += ` ORDER BY price DESC`;
        break;
      case 'rating-desc':
        query += ` ORDER BY rating DESC`;
        break;
      case 'newest':
        query += ` ORDER BY created_at DESC`;
        break;
      case 'popular':
      default:
        query += ` ORDER BY (rating * review_count) DESC`;
        break;
    }

    // Pagination
    if (limit) {
      const limitInt = parseInt(limit);
      const offset = (parseInt(page) - 1) * limitInt;
      query += ` LIMIT ? OFFSET ?`;
      params.push(limitInt, offset);
    }

    const [rows] = await db.execute(query, params);

    // Parse JSON fields
    const products = rows.map(formatProduct);

    res.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (err) {
    console.error('GET /products error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil data produk', error: err.message });
  }
});

// ============================================================
// GET /api/products/:id - Get a single product by ID
// ============================================================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [rows] = await db.execute(
      `SELECT id, name, category, price, stock, rating, review_count, description, image_url, images, options, specs, is_active, created_at
       FROM products WHERE id = ? AND is_active = 1`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
    }

    // Also fetch reviews for this product
    const [reviewRows] = await db.execute(
      `SELECT author_name, rating, review_text, review_date FROM product_reviews WHERE product_id = ? ORDER BY review_date DESC`,
      [id]
    );

    const product = formatProduct(rows[0]);
    product.reviews = reviewRows.map(r => ({
      author: r.author_name,
      rating: parseFloat(r.rating),
      text: r.review_text,
      date: r.review_date
    }));

    res.json({ success: true, data: product });
  } catch (err) {
    console.error('GET /products/:id error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil detail produk', error: err.message });
  }
});

// ============================================================
// POST /api/products - Create a new product (Admin only)
// ============================================================
router.post('/', async (req, res) => {
  try {
    const {
      name,
      category,
      price,
      stock,
      description,
      image_url,
      images,
      options,
      specs
    } = req.body;

    // Validation
    if (!name || !category || !price || !stock) {
      return res.status(400).json({ 
        success: false, 
        message: 'Field wajib: name, category, price, stock' 
      });
    }

    // Generate a unique ID
    const id = `p${Date.now()}`;

    // Default image if not provided
    const finalImageUrl = image_url || 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&auto=format&fit=crop&q=80';
    const finalImages = images || [finalImageUrl];

    // Default options by category
    let finalOptions = options || {};
    if (!options) {
      if (category === 'Tech') finalOptions = { colors: ['Carbon Black', 'Silver Gray'] };
      else if (category === 'Fashion') finalOptions = { sizes: ['M', 'L', 'XL'] };
    }

    const finalSpecs = specs || { 'Ketersediaan': 'Stok Toko', 'Kondisi': 'Baru 100%' };

    await db.execute(
      `INSERT INTO products (id, name, category, price, stock, rating, review_count, description, image_url, images, options, specs) 
       VALUES (?, ?, ?, ?, ?, 5.0, 0, ?, ?, ?, ?, ?)`,
      [
        id, name, category, parseInt(price), parseInt(stock),
        description || '',
        finalImageUrl,
        JSON.stringify(finalImages),
        JSON.stringify(finalOptions),
        JSON.stringify(finalSpecs)
      ]
    );

    // Fetch the newly created product
    const [newRows] = await db.execute('SELECT * FROM products WHERE id = ?', [id]);
    const newProduct = formatProduct(newRows[0]);

    res.status(201).json({ 
      success: true, 
      message: `Produk '${name}' berhasil ditambahkan!`,
      data: newProduct 
    });
  } catch (err) {
    console.error('POST /products error:', err);
    res.status(500).json({ success: false, message: 'Gagal menambahkan produk', error: err.message });
  }
});

// ============================================================
// PUT /api/products/:id - Update a product (Admin only)
// ============================================================
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      category,
      price,
      stock,
      description,
      image_url,
      images,
      options,
      specs,
      is_active
    } = req.body;

    // Check if product exists
    const [existing] = await db.execute('SELECT id FROM products WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
    }

    // Build dynamic SET clause
    const updates = [];
    const params = [];

    if (name !== undefined) { updates.push('name = ?'); params.push(name); }
    if (category !== undefined) { updates.push('category = ?'); params.push(category); }
    if (price !== undefined) { updates.push('price = ?'); params.push(parseInt(price)); }
    if (stock !== undefined) { updates.push('stock = ?'); params.push(parseInt(stock)); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description); }
    if (image_url !== undefined) { updates.push('image_url = ?'); params.push(image_url); }
    if (images !== undefined) { updates.push('images = ?'); params.push(JSON.stringify(images)); }
    if (options !== undefined) { updates.push('options = ?'); params.push(JSON.stringify(options)); }
    if (specs !== undefined) { updates.push('specs = ?'); params.push(JSON.stringify(specs)); }
    if (is_active !== undefined) { updates.push('is_active = ?'); params.push(is_active ? 1 : 0); }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'Tidak ada field yang diupdate' });
    }

    params.push(id);
    await db.execute(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`, params);

    // Fetch updated product
    const [updatedRows] = await db.execute('SELECT * FROM products WHERE id = ?', [id]);
    const updatedProduct = formatProduct(updatedRows[0]);

    res.json({ 
      success: true, 
      message: `Produk '${updatedProduct.name}' berhasil diperbarui!`,
      data: updatedProduct 
    });
  } catch (err) {
    console.error('PUT /products/:id error:', err);
    res.status(500).json({ success: false, message: 'Gagal memperbarui produk', error: err.message });
  }
});

// ============================================================
// DELETE /api/products/:id - Delete (soft delete) a product
// ============================================================
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await db.execute('SELECT id, name FROM products WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
    }

    const productName = existing[0].name;

    // Soft delete (mark as inactive)
    await db.execute('UPDATE products SET is_active = 0 WHERE id = ?', [id]);

    res.json({ 
      success: true, 
      message: `Produk '${productName}' berhasil dihapus dari toko.`,
      data: { id }
    });
  } catch (err) {
    console.error('DELETE /products/:id error:', err);
    res.status(500).json({ success: false, message: 'Gagal menghapus produk', error: err.message });
  }
});

// ============================================================
// GET /api/products/categories/counts - Get category counts
// ============================================================
router.get('/categories/counts', async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT category, COUNT(*) as count FROM products WHERE is_active = 1 GROUP BY category`
    );

    const counts = { all: 0, Tech: 0, Fashion: 0, 'Home & Living': 0, Lifestyle: 0 };
    rows.forEach(row => {
      counts[row.category] = row.count;
      counts.all += row.count;
    });

    res.json({ success: true, data: counts });
  } catch (err) {
    console.error('GET /categories/counts error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil data kategori', error: err.message });
  }
});

// Helper: Format product row from DB to frontend-compatible object
function formatProduct(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    price: parseInt(row.price),
    stock: row.stock,
    rating: parseFloat(row.rating),
    reviewCount: row.review_count,
    description: row.description,
    image: row.image_url,
    images: safeParseJSON(row.images, [row.image_url]),
    options: safeParseJSON(row.options, {}),
    specs: safeParseJSON(row.specs, {}),
    isActive: row.is_active === 1,
    createdAt: row.created_at,
  };
}

function safeParseJSON(val, fallback = null) {
  if (!val) return fallback;
  if (typeof val === 'object') return val; // Already parsed by mysql2
  try {
    return JSON.parse(val);
  } catch (e) {
    return fallback;
  }
}

module.exports = router;
