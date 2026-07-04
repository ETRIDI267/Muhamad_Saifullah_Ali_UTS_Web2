const express = require('express');
const router = express.Router();
const db = require('../config/db');

// ============================================================
// Helper: Build WhatsApp message for order notification
// ============================================================
function buildWhatsAppMessage(order, items) {
  const itemLines = items.map(item => {
    const variants = [];
    if (item.selected_color) variants.push(`Warna: ${item.selected_color}`);
    if (item.selected_size) variants.push(`Ukuran: ${item.selected_size}`);
    if (item.selected_switch) variants.push(`Switch: ${item.selected_switch}`);
    const variantStr = variants.length > 0 ? ` (${variants.join(', ')})` : '';
    return `- ${item.product_name}${variantStr} x${item.quantity} = Rp ${Number(item.item_total).toLocaleString('id-ID')}`;
  }).join('\n');

  const message = `🛒 *PESANAN BARU MASUK - AuraCart* 🛒
━━━━━━━━━━━━━━━━━━━━━━

📦 *ID Pesanan:* ${order.id}
📅 *Tanggal:* ${new Date().toLocaleString('id-ID')}

👤 *Data Pembeli:*
Nama: ${order.customer_name}
Telp: ${order.customer_phone}
Alamat: ${order.customer_address}, ${order.customer_city} - ${order.customer_zip}

🛍️ *Item Dipesan:*
${itemLines}

━━━━━━━━━━━━━━━━━━━━━━
💰 Subtotal: Rp ${Number(order.subtotal).toLocaleString('id-ID')}
${order.discount_amount > 0 ? `🎟️ Diskon (${order.promo_code}): -Rp ${Number(order.discount_amount).toLocaleString('id-ID')}\n` : ''}💳 *Total Bayar: Rp ${Number(order.total).toLocaleString('id-ID')}*
💳 Metode: ${order.payment_method === 'card' ? 'Kartu Kredit/Debit' : 'E-Wallet (GoPay/OVO/QRIS)'}

✅ Harap segera diproses!`;

  return encodeURIComponent(message);
}

// ============================================================
// POST /api/checkout - Process a new order & notify via WA
// ============================================================
router.post('/', async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const {
      customerName,
      customerPhone,
      customerAddress,
      customerCity,
      customerZip,
      paymentMethod = 'ewallet',
      promoCode,
      items, // Array of { productId, productName, productImage, productPrice, quantity, selectedColor, selectedSize, selectedSwitch }
      subtotal,
      discountAmount = 0,
      total
    } = req.body;

    // Validation
    if (!customerName || !customerPhone || !customerAddress || !customerCity || !customerZip) {
      await conn.rollback();
      conn.release();
      return res.status(400).json({ success: false, message: 'Data pengiriman tidak lengkap' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      await conn.rollback();
      conn.release();
      return res.status(400).json({ success: false, message: 'Keranjang belanja kosong' });
    }

    // Generate Order ID
    const orderId = `ORD-${Math.floor(10000 + Math.random() * 90000)}`;

    // Validate promo code if provided
    let finalDiscount = parseInt(discountAmount) || 0;
    if (promoCode) {
      const [promo] = await conn.execute(
        'SELECT discount_percent FROM promo_codes WHERE code = ? AND is_active = 1',
        [promoCode.toUpperCase()]
      );
      if (promo.length === 0) {
        await conn.rollback();
        conn.release();
        return res.status(400).json({ success: false, message: 'Kode promo tidak valid' });
      }
    }

    // Check and reduce stock for each item
    for (const item of items) {
      const [productRows] = await conn.execute(
        'SELECT id, name, stock FROM products WHERE id = ? AND is_active = 1',
        [item.productId]
      );

      if (productRows.length === 0) {
        await conn.rollback();
        conn.release();
        return res.status(404).json({ 
          success: false, 
          message: `Produk '${item.productName}' tidak ditemukan atau tidak tersedia` 
        });
      }

      const product = productRows[0];
      if (product.stock < item.quantity) {
        await conn.rollback();
        conn.release();
        return res.status(400).json({ 
          success: false, 
          message: `Stok produk '${product.name}' tidak mencukupi. Tersisa: ${product.stock}` 
        });
      }

      // Reduce stock
      await conn.execute(
        'UPDATE products SET stock = stock - ? WHERE id = ?',
        [item.quantity, item.productId]
      );
    }

    // Save main order
    await conn.execute(
      `INSERT INTO orders (id, customer_name, customer_phone, customer_address, customer_city, customer_zip, 
       payment_method, promo_code, subtotal, discount_amount, total, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Menunggu')`,
      [
        orderId, customerName, customerPhone, customerAddress,
        customerCity, customerZip, paymentMethod,
        promoCode ? promoCode.toUpperCase() : null,
        parseInt(subtotal), finalDiscount, parseInt(total)
      ]
    );

    // Save order items
    for (const item of items) {
      const itemTotal = parseInt(item.productPrice) * parseInt(item.quantity);
      await conn.execute(
        `INSERT INTO order_items (order_id, product_id, product_name, product_image, product_price, quantity, 
         selected_color, selected_size, selected_switch, item_total)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId, item.productId, item.productName, item.productImage || '',
          parseInt(item.productPrice), parseInt(item.quantity),
          item.selectedColor || null, item.selectedSize || null, item.selectedSwitch || null,
          itemTotal
        ]
      );
    }

    await conn.commit();
    conn.release();

    // ----------------------------------------------------------------
    // Build WhatsApp Notification URL for Owner
    // ----------------------------------------------------------------
    const waOwnerNumber = process.env.WA_OWNER_NUMBER || '6281234567890';
    const orderData = {
      id: orderId,
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_address: customerAddress,
      customer_city: customerCity,
      customer_zip: customerZip,
      payment_method: paymentMethod,
      promo_code: promoCode || '',
      subtotal: subtotal,
      discount_amount: finalDiscount,
      total: total
    };

    const waMessage = buildWhatsAppMessage(orderData, items.map(i => ({
      product_name: i.productName,
      selected_color: i.selectedColor,
      selected_size: i.selectedSize,
      selected_switch: i.selectedSwitch,
      quantity: i.quantity,
      item_total: parseInt(i.productPrice) * parseInt(i.quantity)
    })));

    const waUrl = `https://wa.me/${waOwnerNumber}?text=${waMessage}`;

    // Mark as WA notified (URL generated)
    await db.execute('UPDATE orders SET wa_notified = 1 WHERE id = ?', [orderId]);

    res.status(201).json({
      success: true,
      message: 'Pesanan berhasil dibuat! Notifikasi WhatsApp siap dikirim.',
      data: {
        orderId,
        status: 'Menunggu',
        total: parseInt(total),
        waNotificationUrl: waUrl,
        date: new Date().toISOString().split('T')[0]
      }
    });
  } catch (err) {
    await conn.rollback();
    conn.release();
    console.error('POST /checkout error:', err);
    res.status(500).json({ success: false, message: 'Gagal memproses pesanan', error: err.message });
  }
});

// ============================================================
// GET /api/checkout/wa-link/:orderId - Get WA notification link for specific order
// ============================================================
router.get('/wa-link/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    // Get order details
    const [orderRows] = await db.execute('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (orderRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
    }

    const order = orderRows[0];
    const [itemRows] = await db.execute(
      'SELECT * FROM order_items WHERE order_id = ?',
      [orderId]
    );

    const waOwnerNumber = process.env.WA_OWNER_NUMBER || '6281234567890';
    const waMessage = buildWhatsAppMessage(order, itemRows);
    const waUrl = `https://wa.me/${waOwnerNumber}?text=${waMessage}`;

    res.json({ 
      success: true, 
      data: { orderId, waUrl }
    });
  } catch (err) {
    console.error('GET /checkout/wa-link/:orderId error:', err);
    res.status(500).json({ success: false, message: 'Gagal membuat link WhatsApp', error: err.message });
  }
});

// ============================================================
// GET /api/checkout/verify-promo - Validate a promo code
// ============================================================
router.post('/verify-promo', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: 'Masukkan kode promo' });
    }

    const [rows] = await db.execute(
      'SELECT code, discount_percent FROM promo_codes WHERE code = ? AND is_active = 1',
      [code.toUpperCase()]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Kode promo tidak valid atau sudah kadaluwarsa' });
    }

    res.json({ 
      success: true, 
      message: `Kode promo '${rows[0].code}' valid! Diskon ${rows[0].discount_percent}%`,
      data: { 
        code: rows[0].code, 
        discountPercent: rows[0].discount_percent 
      }
    });
  } catch (err) {
    console.error('POST /checkout/verify-promo error:', err);
    res.status(500).json({ success: false, message: 'Gagal memvalidasi kode promo', error: err.message });
  }
});

module.exports = router;
