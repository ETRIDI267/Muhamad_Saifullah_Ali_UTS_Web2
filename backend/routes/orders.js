const express = require('express');
const router = express.Router();
const db = require('../config/db');

// ============================================================
// GET /api/orders - Get all orders (Admin view)
// ============================================================
router.get('/', async (req, res) => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;
    
    let query = `
      SELECT o.*, 
        COUNT(oi.id) as items_count_rows,
        SUM(oi.quantity) as total_items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
    `;
    const params = [];
    const conditions = [];

    if (status && status !== 'all') {
      conditions.push('o.status = ?');
      params.push(status);
    }

    if (search) {
      conditions.push('(o.id LIKE ? OR o.customer_name LIKE ? OR o.customer_phone LIKE ?)');
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` GROUP BY o.id ORDER BY o.created_at DESC`;

    // Pagination
    const limitInt = parseInt(limit);
    const offset = (parseInt(page) - 1) * limitInt;
    query += ` LIMIT ? OFFSET ?`;
    params.push(limitInt, offset);

    const [rows] = await db.execute(query, params);

    const orders = rows.map(o => ({
      id: o.id,
      date: o.created_at.toISOString().split('T')[0],
      customerName: o.customer_name,
      customerPhone: o.customer_phone,
      customerAddress: o.customer_address,
      customerCity: o.customer_city,
      customerZip: o.customer_zip,
      paymentMethod: o.payment_method,
      promoCode: o.promo_code,
      subtotal: parseInt(o.subtotal),
      discountAmount: parseInt(o.discount_amount),
      total: parseInt(o.total),
      status: o.status,
      itemsCount: parseInt(o.total_items || 0),
      waNotified: o.wa_notified === 1
    }));

    // Get total count for pagination
    const [countRows] = await db.execute('SELECT COUNT(*) as total FROM orders');
    const totalOrders = countRows[0].total;

    res.json({ 
      success: true, 
      count: orders.length,
      total: totalOrders,
      page: parseInt(page),
      data: orders 
    });
  } catch (err) {
    console.error('GET /orders error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil data pesanan', error: err.message });
  }
});

// ============================================================
// GET /api/orders/:id - Get single order with items
// ============================================================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [orderRows] = await db.execute('SELECT * FROM orders WHERE id = ?', [id]);
    if (orderRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
    }

    const order = orderRows[0];

    // Get order items
    const [itemRows] = await db.execute(
      'SELECT * FROM order_items WHERE order_id = ? ORDER BY id ASC',
      [id]
    );

    const orderDetail = {
      id: order.id,
      date: order.created_at.toISOString().split('T')[0],
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      customerAddress: order.customer_address,
      customerCity: order.customer_city,
      customerZip: order.customer_zip,
      paymentMethod: order.payment_method,
      promoCode: order.promo_code,
      subtotal: parseInt(order.subtotal),
      discountAmount: parseInt(order.discount_amount),
      total: parseInt(order.total),
      status: order.status,
      waNotified: order.wa_notified === 1,
      shippingDetails: {
        name: order.customer_name,
        phone: order.customer_phone,
        address: order.customer_address,
        city: order.customer_city,
        zip: order.customer_zip
      },
      items: itemRows.map(item => ({
        id: item.id,
        productId: item.product_id,
        productName: item.product_name,
        productImage: item.product_image,
        productPrice: parseInt(item.product_price),
        quantity: item.quantity,
        selectedColor: item.selected_color,
        selectedSize: item.selected_size,
        selectedSwitch: item.selected_switch,
        itemTotal: parseInt(item.item_total)
      }))
    };

    res.json({ success: true, data: orderDetail });
  } catch (err) {
    console.error('GET /orders/:id error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil detail pesanan', error: err.message });
  }
});

// ============================================================
// PATCH /api/orders/:id/status - Update order status (Admin)
// ============================================================
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['Menunggu', 'Diproses', 'Dikirim', 'Selesai', 'Dibatalkan'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: `Status tidak valid. Pilih: ${validStatuses.join(', ')}` 
      });
    }

    const [existing] = await db.execute('SELECT id FROM orders WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
    }

    await db.execute('UPDATE orders SET status = ? WHERE id = ?', [status, id]);

    res.json({ 
      success: true, 
      message: `Status pesanan ${id} diubah ke "${status}"`,
      data: { id, status }
    });
  } catch (err) {
    console.error('PATCH /orders/:id/status error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengubah status pesanan', error: err.message });
  }
});

// ============================================================
// GET /api/orders/stats/summary - Admin Dashboard Stats
// ============================================================
router.get('/stats/summary', async (req, res) => {
  try {
    // Total orders and revenue
    const [stats] = await db.execute(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(total) as total_revenue,
        SUM(CASE WHEN status = 'Selesai' THEN total ELSE 0 END) as completed_revenue,
        SUM(CASE WHEN status = 'Diproses' THEN 1 ELSE 0 END) as processing_orders,
        SUM(CASE WHEN status = 'Menunggu' THEN 1 ELSE 0 END) as pending_orders,
        SUM(CASE WHEN status = 'Selesai' THEN 1 ELSE 0 END) as completed_orders,
        SUM(CASE WHEN status = 'Dibatalkan' THEN 1 ELSE 0 END) as cancelled_orders
      FROM orders
    `);

    // Total active products
    const [productStats] = await db.execute(
      'SELECT COUNT(*) as total_products FROM products WHERE is_active = 1'
    );

    // Recent orders (last 5)
    const [recentOrders] = await db.execute(`
      SELECT id, customer_name, total, status, created_at 
      FROM orders ORDER BY created_at DESC LIMIT 5
    `);

    // Weekly sales trend (last 7 days)
    const [weeklyTrend] = await db.execute(`
      SELECT 
        DATE(created_at) as sale_date,
        COUNT(*) as order_count,
        SUM(total) as daily_revenue
      FROM orders
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(created_at)
      ORDER BY sale_date ASC
    `);

    res.json({ 
      success: true, 
      data: {
        totalOrders: stats[0].total_orders,
        totalRevenue: parseInt(stats[0].total_revenue || 0),
        completedRevenue: parseInt(stats[0].completed_revenue || 0),
        processingOrders: stats[0].processing_orders,
        pendingOrders: stats[0].pending_orders,
        completedOrders: stats[0].completed_orders,
        cancelledOrders: stats[0].cancelled_orders,
        totalProducts: productStats[0].total_products,
        recentOrders: recentOrders.map(o => ({
          id: o.id,
          customerName: o.customer_name,
          total: parseInt(o.total),
          status: o.status,
          date: o.created_at.toISOString().split('T')[0]
        })),
        weeklyTrend: weeklyTrend.map(w => ({
          date: w.sale_date,
          orderCount: w.order_count,
          revenue: parseInt(w.daily_revenue || 0)
        }))
      }
    });
  } catch (err) {
    console.error('GET /orders/stats/summary error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil statistik', error: err.message });
  }
});

module.exports = router;
