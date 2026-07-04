# AuraCart - Proyek UAS E-Commerce

**Tugas Proyek UAS — Backend + Frontend Integration**  
**Nama:** Muhammad Saif  
**Toko:** AuraCart Premium E-Commerce

---

## 📁 Struktur Project

```
Aliuaspemogarman/
├── backend/                  # Node.js Express API Server
│   ├── config/
│   │   └── db.js             # MySQL connection pool
│   ├── routes/
│   │   ├── products.js       # CRUD API Produk
│   │   ├── checkout.js       # API Checkout + WA Notification
│   │   ├── orders.js         # Manajemen Pesanan
│   │   ├── auth.js           # Login Admin
│   │   └── categories.js     # Kategori & Promo
│   ├── database/
│   │   └── auracart_db.sql   # 🗄️ File SQL (schema + seed data)
│   ├── server.js             # Entry point Express
│   ├── package.json
│   ├── .env.example          # Template konfigurasi
│   └── AuraCart_API_Collection.postman_collection.json  # 📮 Postman
│
└── frontend/                 # AuraCart Online Store (SPA)
    ├── index.html            # Main HTML (SPA)
    ├── style.css             # Stylesheet premium
    ├── app.js                # App logic (API integrated)
    └── products.js           # Fallback product data
```

---

## 🚀 Cara Menjalankan

### Prerequisites
- Node.js v18+ ([download di nodejs.org](https://nodejs.org))
- MySQL 8.0+ (lokal atau XAMPP)

### 1. Setup Database

```sql
-- Di MySQL Workbench atau phpMyAdmin:
source C:\Users\Msaif\Documents\Aliuaspemogarman\backend\database\auracart_db.sql
```

### 2. Setup Backend

```bash
cd C:\Users\Msaif\Documents\Aliuaspemogarman\backend

# Install dependencies
npm install

# Buat file .env dari template
copy .env.example .env

# Edit .env sesuai MySQL kalian:
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=your_password
# DB_NAME=auracart_db
# WA_OWNER_NUMBER=6281234567890  # Nomor WA owner untuk notif pesanan

# Jalankan server
npm run dev     # Development (pakai nodemon)
npm start       # Production
```

Server berjalan di: **http://localhost:3000**

### 3. Setup Frontend

Buka file `frontend/index.html` langsung di browser, atau gunakan Live Server di VS Code.

> ⚠️ **Pastikan backend sudah berjalan** sebelum membuka frontend agar API terintegrasi.

---

## 🔌 API Endpoints

### Base URL
- **Lokal:** `http://localhost:3000/api`
- **Railway (setelah deploy):** `https://your-app.up.railway.app/api`

### Products
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/products` | Ambil semua produk (support filter) |
| GET | `/products/:id` | Detail produk + ulasan |
| POST | `/products` | Tambah produk baru (Admin) |
| PUT | `/products/:id` | Update produk (Admin) |
| DELETE | `/products/:id` | Hapus produk (Admin) |
| GET | `/products/categories/counts` | Jumlah produk per kategori |

**Query filters:** `?category=Tech&search=headphone&maxPrice=2000000&minRating=4.5&sort=price-asc`

### Checkout
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/checkout` | Buat pesanan + notif WA owner |
| POST | `/checkout/verify-promo` | Validasi kode promo |
| GET | `/checkout/wa-link/:orderId` | Buat ulang link WA |

### Orders (Admin)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/orders` | Semua pesanan |
| GET | `/orders/:id` | Detail pesanan + item |
| PATCH | `/orders/:id/status` | Update status pesanan |
| GET | `/orders/stats/summary` | Statistik dashboard admin |

### Auth
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/auth/login` | Login admin |
| POST | `/auth/logout` | Logout |

---

## 📦 Fitur Utama

### Backend
- ✅ **CRUD Produk** - Create, Read, Update, Delete via REST API
- ✅ **Checkout API** - Validasi stok, simpan pesanan, kurangi stok otomatis
- ✅ **WhatsApp Notification** - Link WA otomatis ke owner saat ada pesanan masuk
- ✅ **Admin Auth** - Login/logout sistem
- ✅ **Kode Promo** - Validasi promo lewat API
- ✅ **Dashboard Stats** - Revenue, total pesanan, produk terjual
- ✅ **Filter & Sort** - Produk bisa difilter berdasarkan kategori, harga, rating
- ✅ **Transaction Support** - Checkout menggunakan MySQL transaction

### Frontend
- ✅ **Integrasi API** - Semua data dari backend, dengan offline fallback
- ✅ **Checkout ke WhatsApp** - Notifikasi otomatis ke owner saat order selesai
- ✅ **Admin Panel** - CRUD produk, kelola pesanan, update status
- ✅ **Dark Mode** - Toggle tema gelap/terang
- ✅ **Keranjang Belanja** - Persistent di localStorage
- ✅ **Wishlist** - Simpan produk favorit
- ✅ **Filter Katalog** - Kategori, harga, rating, pencarian

---

## 📱 WhatsApp Notification

Saat checkout berhasil, sistem akan membuka WhatsApp dengan pesan otomatis ke nomor owner:

```
🛒 PESANAN BARU MASUK - AuraCart 🛒
━━━━━━━━━━━━━━━━━━━━━━

📦 ID Pesanan: ORD-12345
📅 Tanggal: 4 Juli 2026

👤 Data Pembeli:
Nama: Muhammad Saif
Telp: 081234567890
Alamat: Jl. Merdeka No. 45, Jakarta Pusat - 10110

🛍️ Item Dipesan:
- KeyCraft K2 Keyboard (Warna: Carbon Grey) x1 = Rp 1.899.000
- AuraPod Earbuds (Warna: Black) x1 = Rp 899.000

━━━━━━━━━━━━━━━━━━━━━━
💰 Total Bayar: Rp 2.798.000
💳 Metode: E-Wallet (GoPay/OVO/QRIS)

✅ Harap segera diproses!
```

---

## 🚂 Deploy ke Railway

### 1. Deploy Database MySQL

1. Buka [railway.app](https://railway.app) dan login
2. New Project → Add Service → Database → MySQL
3. Masuk ke MySQL service, buka `Data` tab
4. Import file `database/auracart_db.sql`

### 2. Deploy API Node.js

1. New Service → Deploy from GitHub Repo
2. Set Environment Variables di Railway:
   ```
   DB_HOST=<your-railway-mysql-host>
   DB_PORT=<port>
   DB_USER=<user>
   DB_PASSWORD=<password>
   DB_NAME=railway
   WA_OWNER_NUMBER=6281234567890
   ADMIN_EMAIL=admin@auracart.com
   ADMIN_PASSWORD=123456
   NODE_ENV=production
   ```
3. Railway akan auto-generate URL seperti `https://auracart-api.up.railway.app`

### 3. Update Frontend Base URL

Di `frontend/app.js`, baris 5:
```javascript
const API_BASE_URL = 'https://auracart-api.up.railway.app/api'; // Ganti dengan URL Railway
```

---

## 🔑 Kredensial Default

| Item | Value |
|------|-------|
| Admin Email | `admin@auracart.com` |
| Admin Password | `123456` |
| Promo Code 1 | `ANTIGRAVITY` (Diskon 15%) |
| Promo Code 2 | `DISKON10` (Diskon 10%) |

---

## 📮 Testing dengan Postman

Import file `AuraCart_API_Collection.postman_collection.json` ke Postman.

Set variable `BASE_URL` ke:
- Lokal: `http://localhost:3000`
- Railway: `https://your-app.up.railway.app`

---

© 2026 AuraCart - Muhammad Saif | Tugas UAS
