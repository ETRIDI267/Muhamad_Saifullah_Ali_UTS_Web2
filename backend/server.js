// ============================================================
// AuraCart Backend API Server
// Tugas UAS - Backend E-Commerce
// Author: Muhammad Saif
// ============================================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================
// MIDDLEWARE
// ============================================================

// CORS - Allow all origins for development (restrict in production)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
}));

// Parse JSON request bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================================
// ROUTES
// ============================================================

// Root health check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🛒 AuraCart Backend API is running!',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      products: '/api/products',
      checkout: '/api/checkout',
      orders: '/api/orders',
      auth: '/api/auth',
      categories: '/api/categories',
    }
  });
});

// Health check endpoint (for Railway & deployment monitoring)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Mount route handlers
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/checkout', require('./routes/checkout'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/categories', require('./routes/categories'));

// ============================================================
// 404 Handler
// ============================================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint '${req.method} ${req.url}' tidak ditemukan`,
    availableEndpoints: [
      'GET    /api/products',
      'GET    /api/products/:id',
      'POST   /api/products',
      'PUT    /api/products/:id',
      'DELETE /api/products/:id',
      'POST   /api/checkout',
      'POST   /api/checkout/verify-promo',
      'GET    /api/checkout/wa-link/:orderId',
      'GET    /api/orders',
      'GET    /api/orders/:id',
      'GET    /api/orders/stats/summary',
      'PATCH  /api/orders/:id/status',
      'POST   /api/auth/login',
      'POST   /api/auth/logout',
      'GET    /api/auth/me',
      'GET    /api/categories',
    ]
  });
});

// ============================================================
// Global Error Handler
// ============================================================
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Terjadi kesalahan pada server'
  });
});

// ============================================================
// START SERVER
// ============================================================
app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║       🛒  AuraCart Backend API Server           ║');
  console.log('╠══════════════════════════════════════════════════╣');
  console.log(`║  Status   : ✅ RUNNING                           ║`);
  console.log(`║  Port     : ${PORT}                               ║`);
  console.log(`║  Mode     : ${(process.env.NODE_ENV || 'development').padEnd(10)}                   ║`);
  console.log('╠══════════════════════════════════════════════════╣');
  console.log('║  API Endpoints:                                  ║');
  console.log(`║  http://localhost:${PORT}/api/products              ║`);
  console.log(`║  http://localhost:${PORT}/api/checkout              ║`);
  console.log(`║  http://localhost:${PORT}/api/orders                ║`);
  console.log(`║  http://localhost:${PORT}/api/auth                  ║`);
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('');
});

module.exports = app;
