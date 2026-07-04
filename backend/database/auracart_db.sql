-- ============================================================
-- AuraCart E-Commerce Database Schema
-- ============================================================
-- Dibuat untuk: Tugas Proyek UAS
-- Nama Toko: AuraCart
-- Author: Muhammad Saif
-- ============================================================

CREATE DATABASE IF NOT EXISTS auracart_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE auracart_db;

-- ============================================================
-- TABLE: products
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(50) PRIMARY KEY NOT NULL,
  name VARCHAR(255) NOT NULL,
  category ENUM('Tech', 'Fashion', 'Home & Living', 'Lifestyle') NOT NULL DEFAULT 'Tech',
  price BIGINT NOT NULL DEFAULT 0,
  stock INT NOT NULL DEFAULT 0,
  rating DECIMAL(3,1) NOT NULL DEFAULT 5.0,
  review_count INT NOT NULL DEFAULT 0,
  description TEXT,
  image_url VARCHAR(500),
  images JSON COMMENT 'Array of image URLs',
  options JSON COMMENT 'Product variants: colors, sizes, switches',
  specs JSON COMMENT 'Product specifications key-value pairs',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: users (Admin)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: orders
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(50) PRIMARY KEY NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(30) NOT NULL,
  customer_address TEXT NOT NULL,
  customer_city VARCHAR(100) NOT NULL,
  customer_zip VARCHAR(20) NOT NULL,
  payment_method ENUM('card', 'ewallet', 'transfer') NOT NULL DEFAULT 'ewallet',
  promo_code VARCHAR(50) NULL,
  subtotal BIGINT NOT NULL DEFAULT 0,
  discount_amount BIGINT NOT NULL DEFAULT 0,
  total BIGINT NOT NULL DEFAULT 0,
  status ENUM('Menunggu', 'Diproses', 'Dikirim', 'Selesai', 'Dibatalkan') NOT NULL DEFAULT 'Menunggu',
  wa_notified TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: order_items
-- ============================================================
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id VARCHAR(50) NOT NULL,
  product_id VARCHAR(50) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  product_image VARCHAR(500),
  product_price BIGINT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  selected_color VARCHAR(100),
  selected_size VARCHAR(50),
  selected_switch VARCHAR(100),
  item_total BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  INDEX idx_order_id (order_id),
  INDEX idx_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: product_reviews
-- ============================================================
CREATE TABLE IF NOT EXISTS product_reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id VARCHAR(50) NOT NULL,
  author_name VARCHAR(255) NOT NULL,
  rating DECIMAL(3,1) NOT NULL DEFAULT 5.0,
  review_text TEXT,
  review_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: promo_codes
-- ============================================================
CREATE TABLE IF NOT EXISTS promo_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  discount_percent INT NOT NULL DEFAULT 10,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SEED DATA: Admin User
-- ============================================================
INSERT IGNORE INTO users (name, email, password, role) VALUES
('Administrator', 'admin@auracart.com', '123456', 'admin');

-- ============================================================
-- SEED DATA: Promo Codes
-- ============================================================
INSERT IGNORE INTO promo_codes (code, discount_percent, is_active) VALUES
('ANTIGRAVITY', 15, 1),
('DISKON10', 10, 1);

-- ============================================================
-- SEED DATA: Products (8 Initial Products)
-- ============================================================
INSERT IGNORE INTO products (id, name, category, price, stock, rating, review_count, description, image_url, images, options, specs) VALUES

('p1', 'AuraSound Max - ANC Headphones', 'Tech', 3499000, 15, 4.8, 124,
 'Nikmati kemurnian suara tanpa gangguan. AuraSound Max menghadirkan Active Noise Cancellation kelas dunia, kenyamanan premium dengan earcup memory foam, dan daya tahan baterai hingga 40 jam.',
 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
 '["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&auto=format&fit=crop&q=80"]',
 '{"colors": ["Midnight Black", "Platinum Silver", "Navy Blue"]}',
 '{"Konektivitas": "Bluetooth 5.2 & Wired (3.5mm)", "Baterai": "Hingga 40 jam (ANC on)", "Pengisian Daya": "USB-C (Fast Charging 10 mnt untuk 5 jam)", "Driver": "40mm Dynamic Driver"}'
),

('p2', 'KeyCraft K2 - Mechanical Keyboard', 'Tech', 1899000, 22, 4.9, 88,
 'Tingkatkan produktivitas dan pengalaman mengetik Anda. Keyboard mekanikal 75% dengan opsi hot-swappable switch, koneksi tri-mode (Wireless, Bluetooth, Wired), dan lampu latar RGB dinamis.',
 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=800&auto=format&fit=crop&q=80',
 '["https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=800&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80"]',
 '{"colors": ["Carbon Grey", "Arctic White"], "switches": ["Red (Linear)", "Brown (Tactile)", "Blue (Clicky)"]}',
 '{"Layout": "75% Compact (84 Keys)", "Koneksi": "2.4Ghz Wireless, Bluetooth 5.1, USB-C", "Switch": "Gateron G Pro Switches", "Kapasitas Baterai": "4000mAh"}'
),

('p3', 'NeoJacket - Oversized Parka', 'Fashion', 899000, 35, 4.6, 64,
 'Jaket parka bergaya urban dengan bahan tahan air (waterproof) berkualitas tinggi. Potongan oversized yang modern dan fungsional dengan banyak saku praktis.',
 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&auto=format&fit=crop&q=80',
 '["https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=800&auto=format&fit=crop&q=80"]',
 '{"colors": ["Olive Green", "Matte Black", "Desert Sand"], "sizes": ["S", "M", "L", "XL"]}',
 '{"Bahan": "Poliester DWR (Durable Water Repellent)", "Furing": "Mesh breathable", "Kantong": "4 kantong depan, 1 kantong dalam", "Instruksi Cuci": "Cuci tangan dengan air dingin"}'
),

('p4', 'Vera Tote Bag - Full Grain Leather', 'Fashion', 2450000, 8, 4.7, 42,
 'Tas jinjing elegan yang terbuat dari kulit sapi asli full-grain. Didesain secara minimalis untuk menunjang penampilan profesional Anda, dengan kompartemen laptop 14 inci.',
 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop&q=80',
 '["https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&auto=format&fit=crop&q=80"]',
 '{"colors": ["Caramel Brown", "Jet Black", "Cognac"]}',
 '{"Bahan": "Full-Grain Leather (Kulit Sapi Asli)", "Kompartemen": "3 kantong utama + slot kartu", "Kapasitas Laptop": "Hingga 14 inci", "Dimensi": "35 x 28 x 12 cm"}'
),

('p5', 'Zen Desk Organizer Set', 'Home & Living', 649000, 50, 4.5, 33,
 'Set organizer meja minimalis berbahan bambu premium. Terdiri dari 5 kompartemen modular yang dapat disusun sesuai kebutuhan. Ideal untuk rumah bergaya skandinavia atau japandi.',
 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&auto=format&fit=crop&q=80',
 '["https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&auto=format&fit=crop&q=80"]',
 '{"colors": ["Natural Bamboo", "Walnut Dark"]}',
 '{"Bahan": "Bambu Moso Premium Grade A", "Isi Paket": "5 modul organizer + 1 alas", "Dimensi": "30 x 20 x 12 cm (per unit)", "Perawatan": "Lap dengan kain lembab"}'
),

('p6', 'AuraLight S1 - Smart Desk Lamp', 'Home & Living', 1250000, 18, 4.7, 57,
 'Lampu meja pintar dengan 5 mode pencahayaan dan kontrol sentuh. Mendukung wireless charging Qi untuk smartphone Anda, serta fitur pengatur kecerahan tanpa kedip yang ramah mata.',
 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=80',
 '["https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=80"]',
 '{"colors": ["Pearl White", "Matte Black"]}',
 '{"Sumber Cahaya": "LED 12W", "Mode Cahaya": "5 Mode (Baca, Kerja, Bersantai, Tidur, Darurat)", "Wireless Charging": "15W Qi Fast Charging", "Jangkauan Cahaya": "Hingga 500 lux"}'
),

('p7', 'AuraPod - True Wireless Earbuds', 'Lifestyle', 899000, 40, 4.6, 95,
 'TWS Earbuds premium dengan driver 10mm dan teknologi Active Noise Cancellation. Water resistant IPX5 dengan case pengisian yang memberikan total playtime hingga 30 jam.',
 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80',
 '["https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80"]',
 '{"colors": ["Graphite Black", "Lily White", "Rose Gold"]}',
 '{"Driver": "10mm Dynamic Driver", "ANC": "Hybrid Active Noise Cancellation", "Playtime": "8 jam (30 jam dengan case)", "Ketahanan Air": "IPX5", "Konektivitas": "Bluetooth 5.3"}'
),

('p8', 'MinimalistWatch - Series W3', 'Lifestyle', 1750000, 12, 4.8, 78,
 'Jam tangan minimalis dengan case titanium ringan dan tali kulit Italian full-grain yang dapat diganti. Gerakan mekanis Miyota 8215 yang presisi, water resistant 50 meter.',
 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
 '["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80"]',
 '{"colors": ["Silver/Black Dial", "Gold/White Dial", "Gunmetal/Blue Dial"]}',
 '{"Gerakan": "Miyota 8215 Automatic (21 Jewels)", "Ukuran Case": "40mm", "Material Case": "Grade 5 Titanium", "Tali": "Italian Full-Grain Leather", "Ketahanan Air": "50 Meter"}'
);

-- ============================================================
-- SEED DATA: Product Reviews
-- ============================================================
INSERT IGNORE INTO product_reviews (product_id, author_name, rating, review_text, review_date) VALUES
('p1', 'Budi Santoso', 5, 'Suaranya luar biasa jernih, bass-nya pas tidak berlebihan. ANC sangat senyap!', '2026-06-15'),
('p1', 'Siti Rahma', 4, 'Sangat nyaman dipakai berjam-jam saat WFH. Hanya saja box-nya agak penyok saat sampai.', '2026-06-20'),
('p2', 'Rian Aditya', 5, 'Feel mengetik di keyboard ini enak sekali. Suara Gateron Brown switch-nya sangat memuaskan.', '2026-06-18'),
('p3', 'Dimas Pratama', 4, 'Jaketnya tebal dan keren bgt. Pas dipakai waktu motoran malem-malem ga tembus angin.', '2026-06-11'),
('p7', 'Anisa Wijaya', 5, 'ANC-nya lumayan banget buat kerja di cafe yang ramai. Bass kenceng tapi vokal tetap jelas.', '2026-06-22'),
('p8', 'Galih Permana', 5, 'Kualitas jam tangan ini sangat premium untuk harganya. Mekanisnya halus sekali.', '2026-06-19');

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);

SELECT 'AuraCart Database initialized successfully!' AS status;
