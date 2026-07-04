// ============================================================
// AuraCart Frontend - Integrated with Backend API
// Tugas UAS - Frontend + Backend Integration
// ============================================================

// --- API Configuration ---
// Change this to your Railway deployment URL when deployed
const API_BASE_URL = 'https://backend-production-51ea5.up.railway.app/api';
// const API_BASE_URL = 'http://localhost:3000/api'; // Local fallback option

// --- App State ---
let state = {
  products: [],
  cart: [],
  wishlist: [],
  orders: [],
  activePromo: null, // { code: '...', discountPercent: 15 }
  activeFilters: {
    search: '',
    category: 'all',
    priceMax: 5000000,
    rating: 0,
    sort: 'popular'
  },
  currentView: 'home',
  selectedProduct: null,
  selectedVariants: {
    color: '',
    size: '',
    switch: ''
  },
  checkoutStep: 1,
  theme: 'light',
  currentUserRole: null, // 'user' | 'admin' | null
  isLoadingProducts: false,
  categoryCounts: { all: 0, Tech: 0, Fashion: 0, 'Home & Living': 0, Lifestyle: 0 }
};

// --- API Helper Functions ---
async function apiRequest(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers
      },
      ...options
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}`);
    }

    return data;
  } catch (err) {
    // Rethrow with clearer message
    throw new Error(err.message || 'Gagal terhubung ke server');
  }
}

// --- Helper Functions ---
function formatIDR(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount).replace(/,\d+$/, '');
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let icon = 'fa-circle-check';
  if (type === 'error') icon = 'fa-circle-exclamation';
  if (type === 'info') icon = 'fa-circle-info';
  
  toast.innerHTML = `
    <i class="fa-solid ${icon}"></i>
    <span>${message}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => { toast.remove(); }, 300);
  }, 3500);
}

function showLoading(containerId, message = 'Memuat...') {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = `
    <div style="grid-column: 1 / -1; text-align: center; padding: 48px 0; color: var(--text-muted);">
      <i class="fa-solid fa-spinner fa-spin" style="font-size: 36px; margin-bottom: 16px; display: block;"></i>
      <p>${message}</p>
    </div>
  `;
}

// Save persistent items to localStorage
function saveStateToStorage() {
  localStorage.setItem('auracart_cart', JSON.stringify(state.cart));
  localStorage.setItem('auracart_wishlist', JSON.stringify(state.wishlist));
  localStorage.setItem('auracart_orders', JSON.stringify(state.orders));
}

function loadStateFromStorage() {
  // Cart
  const localCart = localStorage.getItem('auracart_cart');
  if (localCart) state.cart = JSON.parse(localCart);

  // Wishlist
  const localWishlist = localStorage.getItem('auracart_wishlist');
  if (localWishlist) state.wishlist = JSON.parse(localWishlist);

  // Orders (from API, not localStorage in integrated mode)
  const localOrders = localStorage.getItem('auracart_orders');
  if (localOrders) state.orders = JSON.parse(localOrders);

  // Theme
  const localTheme = localStorage.getItem('auracart_theme') || 'light';
  state.theme = localTheme;
  document.documentElement.setAttribute('data-theme', localTheme);
  updateThemeTogglerIcon();

  // Role Session
  const localRole = localStorage.getItem('auracart_role');
  if (localRole) state.currentUserRole = localRole;
}

function updateThemeTogglerIcon() {
  const btn = document.getElementById('theme-toggle-btn');
  if (state.theme === 'dark') {
    btn.innerHTML = '<i class="fa-solid fa-sun"></i>';
  } else {
    btn.innerHTML = '<i class="fa-solid fa-moon"></i>';
  }
}

// --- Dynamic Role Navigation Header Controller ---
function updateNavigationHeader() {
  const logoutBtn = document.getElementById('logout-btn');
  if (state.currentUserRole === 'admin') {
    logoutBtn.style.display = 'inline-flex';
  } else {
    logoutBtn.style.display = 'none';
  }
}

// Admin Login - Now integrated with Backend API
async function loginAsAdmin() {
  const email = document.getElementById('admin-email').value.trim();
  const password = document.getElementById('admin-password').value.trim();
  
  try {
    showToast('Memverifikasi kredensial...', 'info');
    const result = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    state.currentUserRole = 'admin';
    localStorage.setItem('auracart_role', 'admin');
    
    updateNavigationHeader();
    showToast(`Selamat datang, ${result.data.name}! Panel Admin aktif.`, 'success');
    switchView('admin');
  } catch (err) {
    showToast(err.message || 'Login gagal. Periksa kredensial Anda.', 'error');
  }
}

function logout() {
  state.currentUserRole = null;
  localStorage.removeItem('auracart_role');
  
  updateNavigationHeader();
  showToast('Sesi Admin berakhir. Kembali ke Mode Pengguna.', 'info');
  switchView('home');
}

function switchView(viewName) {
  if (viewName === 'admin' && state.currentUserRole !== 'admin') {
    viewName = 'login';
  }

  state.currentView = viewName;
  
  const sections = document.querySelectorAll('.view-section');
  sections.forEach(sec => sec.classList.remove('active'));
  
  const targetSec = document.getElementById(`view-sec-${viewName}`) || document.getElementById(`view-${viewName}`);
  if (targetSec) {
    targetSec.classList.add('active');
  }

  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    if (link.getAttribute('data-view') === viewName) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (viewName === 'shop') {
    fetchAndRenderCatalog();
    fetchCategoryCounts();
  } else if (viewName === 'home') {
    fetchAndRenderFeaturedProducts();
  } else if (viewName === 'account') {
    renderWishlist();
    fetchAndRenderOrders();
  } else if (viewName === 'admin') {
    fetchAndRenderAdminDashboard();
  } else if (viewName === 'checkout') {
    state.checkoutStep = 1;
    updateCheckoutStepView();
    renderCheckoutSummary();
  }
}

// ============================================================
// API Data Fetching Functions
// ============================================================

// Fetch all products from API
async function fetchProducts(filters = {}) {
  const params = new URLSearchParams();
  if (filters.category && filters.category !== 'all') params.set('category', filters.category);
  if (filters.search) params.set('search', filters.search);
  if (filters.maxPrice && filters.maxPrice < 5000000) params.set('maxPrice', filters.maxPrice);
  if (filters.rating && filters.rating > 0) params.set('minRating', filters.rating);
  if (filters.sort) params.set('sort', filters.sort);

  const queryString = params.toString();
  const endpoint = `/products${queryString ? '?' + queryString : ''}`;
  
  const result = await apiRequest(endpoint);
  return result.data || [];
}

// Fetch category counts
async function fetchCategoryCounts() {
  try {
    const result = await apiRequest('/categories');
    if (result.success && result.data) {
      const counts = { all: 0, Tech: 0, Fashion: 0, 'Home & Living': 0, Lifestyle: 0 };
      result.data.forEach(cat => {
        if (cat.name in counts) {
          counts[cat.name] = cat.count;
        }
      });
      state.categoryCounts = counts;
      updateCategoryCountsDOM();
    }
  } catch (err) {
    console.warn('Could not fetch category counts:', err.message);
  }
}

function updateCategoryCountsDOM() {
  const c = state.categoryCounts;
  const el = (id) => document.getElementById(id);
  if (el('count-all')) el('count-all').innerText = `(${c.all})`;
  if (el('count-Tech')) el('count-Tech').innerText = `(${c.Tech})`;
  if (el('count-Fashion')) el('count-Fashion').innerText = `(${c.Fashion})`;
  if (el('count-Home')) el('count-Home').innerText = `(${c['Home & Living']})`;
  if (el('count-Lifestyle')) el('count-Lifestyle').innerText = `(${c.Lifestyle})`;
}

// Fetch featured products for homepage
async function fetchAndRenderFeaturedProducts() {
  const container = document.getElementById('featured-products-grid');
  if (!container) return;

  showLoading('featured-products-grid', 'Memuat produk pilihan...');
  
  try {
    const products = await fetchProducts({ sort: 'rating-desc' });
    state.products = products; // Cache locally
    
    const featured = products.slice(0, 4);
    if (featured.length === 0) {
      container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:32px;color:var(--text-muted);">Belum ada produk.</div>';
      return;
    }
    
    container.innerHTML = featured.map(p => createProductCardHTML(p)).join('');
    attachProductCardEventListeners(container);
  } catch (err) {
    // Fallback to localStorage/initial products if API fails
    if (typeof initialProducts !== 'undefined') {
      state.products = [...initialProducts];
      const featured = state.products.slice(0, 4);
      container.innerHTML = featured.map(p => createProductCardHTML(p)).join('');
      attachProductCardEventListeners(container);
      showToast('Mode offline: Data lokal digunakan (API tidak tersedia)', 'info');
    } else {
      container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:32px;color:var(--text-muted);"><i class="fa-solid fa-wifi-slash" style="font-size:36px;display:block;margin-bottom:12px;"></i>Gagal terhubung ke server</div>';
      showToast(`Gagal memuat produk: ${err.message}`, 'error');
    }
  }
}

// Fetch and render catalog with active filters
async function fetchAndRenderCatalog() {
  const container = document.getElementById('catalog-products-grid');
  if (!container) return;

  showLoading('catalog-products-grid', 'Memuat katalog produk...');

  try {
    const products = await fetchProducts(state.activeFilters);
    state.products = products; // Update cache

    if (products.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 48px 0; color: var(--text-muted);">
          <i class="fa-solid fa-magnifying-glass-minus" style="font-size: 48px; margin-bottom: 16px; display: block;"></i>
          <h3>Produk tidak ditemukan</h3>
          <p>Silakan sesuaikan filter pencarian atau kata kunci Anda.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = products.map(p => createProductCardHTML(p)).join('');
    attachProductCardEventListeners(container);
  } catch (err) {
    // API offline fallback
    if (state.products.length > 0) {
      renderCatalogFromCache();
    } else if (typeof initialProducts !== 'undefined') {
      state.products = [...initialProducts];
      renderCatalogFromCache();
      showToast('Mode offline: Data lokal digunakan', 'info');
    } else {
      container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:32px;color:var(--text-muted);">Gagal memuat produk. Periksa koneksi server.</div>';
      showToast(`Error: ${err.message}`, 'error');
    }
  }
}

// Render catalog from cached state (offline fallback)
function renderCatalogFromCache() {
  const container = document.getElementById('catalog-products-grid');
  if (!container) return;

  let filtered = state.products.filter(p => {
    const catMatch = state.activeFilters.category === 'all' || p.category === state.activeFilters.category;
    const priceMatch = p.price <= state.activeFilters.priceMax;
    const ratingMatch = p.rating >= state.activeFilters.rating;
    const searchMatch = p.name.toLowerCase().includes(state.activeFilters.search.toLowerCase()) ||
                        (p.description || '').toLowerCase().includes(state.activeFilters.search.toLowerCase());
    return catMatch && priceMatch && ratingMatch && searchMatch;
  });

  if (state.activeFilters.sort === 'price-asc') filtered.sort((a, b) => a.price - b.price);
  else if (state.activeFilters.sort === 'price-desc') filtered.sort((a, b) => b.price - a.price);
  else if (state.activeFilters.sort === 'rating-desc') filtered.sort((a, b) => b.rating - a.rating);
  else filtered.sort((a, b) => (b.rating * b.reviewCount) - (a.rating * a.reviewCount));

  if (filtered.length === 0) {
    container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:32px;color:var(--text-muted);">Produk tidak ditemukan.</div>';
    return;
  }

  container.innerHTML = filtered.map(p => createProductCardHTML(p)).join('');
  attachProductCardEventListeners(container);
}

// Fetch orders from API
async function fetchAndRenderOrders() {
  const container = document.getElementById('orders-history-table-body');
  if (!container) return;

  container.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:16px;"><i class="fa-solid fa-spinner fa-spin"></i> Memuat pesanan...</td></tr>';

  try {
    const result = await apiRequest('/orders');
    state.orders = result.data || [];
    renderOrders();
  } catch (err) {
    // Use local storage fallback
    renderOrders();
  }
}

// ============================================================
// Product Card Rendering
// ============================================================
function createProductCardHTML(product) {
  const isWishlisted = state.wishlist.includes(product.id);
  const ratingStars = generateRatingStarsHTML(product.rating);
  
  return `
    <div class="product-card" data-id="${product.id}">
      <button class="wishlist-btn ${isWishlisted ? 'active' : ''}" aria-label="Toggle Wishlist" onclick="event.stopPropagation(); toggleWishlist('${product.id}')">
        <i class="${isWishlisted ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
      </button>
      <div class="product-card-img-wrap view-details-trigger">
        <img src="${product.image}" alt="${product.name}" class="product-card-img" loading="lazy">
        <span class="product-card-badge">${product.category}</span>
      </div>
      <div class="product-card-content">
        <span class="product-card-category">${product.category}</span>
        <h3 class="product-card-title view-details-trigger">${product.name}</h3>
        <div class="product-card-rating">
          <span class="rating-stars">${ratingStars}</span>
          <span class="rating-count">(${product.reviewCount || product.review_count || 0})</span>
        </div>
        <div class="product-card-footer">
          <span class="product-card-price">${formatIDR(product.price)}</span>
          <button class="add-cart-btn quick-add-cart" aria-label="Add to Cart" onclick="event.stopPropagation(); quickAdd('${product.id}')">
            <i class="fa-solid fa-cart-plus"></i>
          </button>
        </div>
      </div>
    </div>
  `;
}

function generateRatingStarsHTML(rating) {
  let stars = '';
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;

  for (let i = 1; i <= 5; i++) {
    if (i <= fullStars) {
      stars += '<i class="fa-solid fa-star"></i>';
    } else if (i === fullStars + 1 && hasHalf) {
      stars += '<i class="fa-solid fa-star-half-stroke"></i>';
    } else {
      stars += '<i class="fa-regular fa-star"></i>';
    }
  }
  return stars;
}

function attachProductCardEventListeners(parentContainer) {
  const triggers = parentContainer.querySelectorAll('.view-details-trigger');
  triggers.forEach(element => {
    element.addEventListener('click', () => {
      const card = element.closest('.product-card');
      const productId = card.getAttribute('data-id');
      openProductDetailsModal(productId);
    });
  });
}

// --- Wishlist Management ---
window.toggleWishlist = function(productId) {
  const index = state.wishlist.indexOf(productId);
  if (index > -1) {
    state.wishlist.splice(index, 1);
    showToast('Produk dihapus dari Wishlist.', 'info');
  } else {
    state.wishlist.push(productId);
    showToast('Produk ditambahkan ke Wishlist!', 'success');
  }
  
  saveStateToStorage();
  updateBadges();
  
  if (state.currentView === 'shop') fetchAndRenderCatalog();
  if (state.currentView === 'home') fetchAndRenderFeaturedProducts();
  if (state.currentView === 'account') renderWishlist();
};

function updateBadges() {
  document.getElementById('wishlist-badge').innerText = state.wishlist.length;
  const cartTotalQty = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  document.getElementById('cart-badge').innerText = cartTotalQty;
}

function renderWishlist() {
  const container = document.getElementById('wishlist-products-grid');
  if (!container) return;

  if (state.wishlist.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 32px 0; color: var(--text-muted);">
        <i class="fa-regular fa-heart" style="font-size: 40px; margin-bottom: 12px; display: block;"></i>
        <p>Daftar keinginan Anda masih kosong.</p>
        <button class="btn btn-primary" onclick="switchView('shop')" style="margin-top: 16px; font-size: 13px; padding: 10px 20px;">Belanja Sekarang</button>
      </div>
    `;
    return;
  }

  const wishlistedItems = state.products.filter(p => state.wishlist.includes(p.id));
  container.innerHTML = wishlistedItems.map(p => createProductCardHTML(p)).join('');
  attachProductCardEventListeners(container);
}

// --- Cart Operations ---
window.quickAdd = function(productId) {
  const product = state.products.find(p => p.id === productId);
  if (!product) return;

  const color = product.options && product.options.colors ? product.options.colors[0] : '';
  const size = product.options && product.options.sizes ? product.options.sizes[0] : '';
  const sw = product.options && product.options.switches ? product.options.switches[0] : '';

  addToCart(product, 1, { color, size, switch: sw });
};

function addToCart(product, quantity = 1, variants = {}) {
  const existingIndex = state.cart.findIndex(item => 
    item.product.id === product.id &&
    item.selectedColor === (variants.color || '') &&
    item.selectedSize === (variants.size || '') &&
    item.selectedSwitch === (variants.switch || '')
  );

  if (existingIndex > -1) {
    if (state.cart[existingIndex].quantity + quantity > product.stock) {
      showToast(`Stok tidak mencukupi. Sisa stok: ${product.stock}`, 'error');
      return;
    }
    state.cart[existingIndex].quantity += quantity;
  } else {
    if (quantity > product.stock) {
      showToast(`Stok tidak mencukupi. Sisa stok: ${product.stock}`, 'error');
      return;
    }
    state.cart.push({
      product,
      quantity,
      selectedColor: variants.color || '',
      selectedSize: variants.size || '',
      selectedSwitch: variants.switch || ''
    });
  }

  showToast(`${product.name} dimasukkan ke keranjang.`, 'success');
  saveStateToStorage();
  updateBadges();
  renderCart();
  openCartSidebar();
}

function openCartSidebar() {
  document.getElementById('cart-overlay-element').classList.add('open');
}

function closeCartSidebar() {
  document.getElementById('cart-overlay-element').classList.remove('open');
}

function renderCart() {
  const container = document.getElementById('cart-items-wrapper');
  if (!container) return;

  if (state.cart.length === 0) {
    container.innerHTML = `
      <div class="cart-empty">
        <i class="fa-solid fa-basket-shopping"></i>
        <div class="cart-empty-text">Keranjang Belanja Kosong</div>
        <p style="font-size: 13px; text-align: center; max-width: 240px;">Temukan produk menarik dan tambahkan ke keranjang Anda.</p>
        <button class="btn btn-primary" onclick="closeCartSidebar(); switchView('shop')" style="font-size: 13px; padding: 10px 20px; margin-top: 8px;">Mulai Belanja</button>
      </div>
    `;
    updateCartTotalsDOM(0, 0, 0);
    return;
  }

  let cartHTML = '';
  let subtotal = 0;

  state.cart.forEach((item, index) => {
    const itemTotal = item.product.price * item.quantity;
    subtotal += itemTotal;

    const variantLabels = [];
    if (item.selectedColor) variantLabels.push(item.selectedColor);
    if (item.selectedSize) variantLabels.push(`Size ${item.selectedSize}`);
    if (item.selectedSwitch) variantLabels.push(item.selectedSwitch);
    const variantStr = variantLabels.join(' | ');

    cartHTML += `
      <div class="cart-item">
        <img src="${item.product.image}" alt="${item.product.name}" class="cart-item-img">
        <div class="cart-item-info">
          <h3 class="cart-item-name">${item.product.name}</h3>
          <div class="cart-item-variant">${variantStr || 'Standar'}</div>
          <div class="cart-item-price">${formatIDR(item.product.price)}</div>
        </div>
        <div class="cart-item-actions">
          <div class="quantity-controller">
            <button class="q-btn" aria-label="Decrease Qty" onclick="updateCartItemQty(${index}, -1)">
              <i class="fa-solid fa-minus"></i>
            </button>
            <span class="q-count">${item.quantity}</span>
            <button class="q-btn" aria-label="Increase Qty" onclick="updateCartItemQty(${index}, 1)">
              <i class="fa-solid fa-plus"></i>
            </button>
          </div>
          <button class="cart-item-remove" onclick="removeCartItem(${index})">
            <i class="fa-regular fa-trash-can"></i> Hapus
          </button>
        </div>
      </div>
    `;
  });

  container.innerHTML = cartHTML;

  let discount = 0;
  if (state.activePromo) {
    discount = Math.round(subtotal * (state.activePromo.discountPercent / 100));
  }

  const finalTotal = subtotal - discount;
  updateCartTotalsDOM(subtotal, discount, finalTotal);
}

window.updateCartItemQty = function(index, change) {
  const item = state.cart[index];
  const newQty = item.quantity + change;

  if (newQty <= 0) {
    removeCartItem(index);
    return;
  }

  if (newQty > item.product.stock) {
    showToast(`Batas maksimal stok tercapai (${item.product.stock} unit).`, 'error');
    return;
  }

  item.quantity = newQty;
  saveStateToStorage();
  updateBadges();
  renderCart();
};

window.removeCartItem = function(index) {
  const removedName = state.cart[index].product.name;
  state.cart.splice(index, 1);
  showToast(`${removedName} dihapus dari keranjang.`, 'info');
  saveStateToStorage();
  updateBadges();
  renderCart();
};

function updateCartTotalsDOM(subtotal, discount, total) {
  document.getElementById('cart-subtotal').innerText = formatIDR(subtotal);
  
  const discountRow = document.getElementById('cart-discount-row');
  if (discount > 0) {
    discountRow.style.display = 'flex';
    document.getElementById('cart-discount-val').innerText = `-${formatIDR(discount)}`;
  } else {
    discountRow.style.display = 'none';
  }
  
  document.getElementById('cart-total').innerText = formatIDR(total);
}

// Promo Code Apply - now calls backend API
async function applyPromoCode() {
  const codeInput = document.getElementById('cart-promo-code').value.trim().toUpperCase();
  if (!codeInput) {
    showToast('Masukkan kode promo terlebih dahulu.', 'error');
    return;
  }

  try {
    const result = await apiRequest('/checkout/verify-promo', {
      method: 'POST',
      body: JSON.stringify({ code: codeInput })
    });

    if (result.success) {
      const { code, discountPercent } = result.data;
      state.activePromo = { code, discountPercent };
      showToast(`Kode promo '${code}' berhasil digunakan (Diskon ${discountPercent}%)`, 'success');
      renderCart();
    }
  } catch (err) {
    // Fallback: check local promo codes
    const PROMO_CODES = { 'ANTIGRAVITY': 15, 'DISKON10': 10 };
    if (PROMO_CODES[codeInput]) {
      const percent = PROMO_CODES[codeInput];
      state.activePromo = { code: codeInput, discountPercent: percent };
      showToast(`Kode promo '${codeInput}' berhasil digunakan (Diskon ${percent}%)`, 'success');
      renderCart();
    } else {
      showToast(err.message || 'Kode promo tidak valid atau kadaluwarsa.', 'error');
    }
  }
}

// --- Product Details Modal ---
async function openProductDetailsModal(productId) {
  let product = state.products.find(p => p.id === productId);
  
  // Try to fetch from API for full details with reviews
  try {
    const result = await apiRequest(`/products/${productId}`);
    product = result.data;
  } catch (err) {
    // Use cached product if API fails
    if (!product) return;
  }

  state.selectedProduct = product;
  
  document.getElementById('modal-category').innerText = product.category;
  document.getElementById('modal-title').innerText = product.name;
  document.getElementById('modal-price').innerText = formatIDR(product.price);
  document.getElementById('modal-desc').innerText = product.description;
  document.getElementById('modal-review-count').innerText = `(${product.reviewCount || product.review_count || 0} ulasan)`;
  document.getElementById('modal-stars').innerHTML = generateRatingStarsHTML(product.rating);

  const mainImg = document.getElementById('modal-main-img');
  mainImg.src = product.image;
  mainImg.alt = product.name;

  const thList = document.getElementById('modal-thumbnails');
  thList.innerHTML = '';
  
  const imgArray = product.images || [product.image];
  imgArray.forEach((imgUrl, idx) => {
    const thumb = document.createElement('div');
    thumb.className = `thumbnail-item ${idx === 0 ? 'active' : ''}`;
    thumb.innerHTML = `<img src="${imgUrl}" alt="${product.name} Thumbnail ${idx+1}">`;
    thumb.addEventListener('click', () => {
      mainImg.src = imgUrl;
      thList.querySelectorAll('.thumbnail-item').forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
    });
    thList.appendChild(thumb);
  });

  const varContainer = document.getElementById('modal-variants-container');
  varContainer.innerHTML = '';
  state.selectedVariants = { color: '', size: '', switch: '' };

  if (product.options) {
    if (product.options.colors) {
      state.selectedVariants.color = product.options.colors[0];
      varContainer.appendChild(createVariantSelectorHTML('Pilihan Warna', product.options.colors, 'color'));
    }
    if (product.options.sizes) {
      state.selectedVariants.size = product.options.sizes[0];
      varContainer.appendChild(createVariantSelectorHTML('Pilihan Ukuran', product.options.sizes, 'size'));
    }
    if (product.options.switches) {
      state.selectedVariants.switch = product.options.switches[0];
      varContainer.appendChild(createVariantSelectorHTML('Jenis Switch', product.options.switches, 'switch'));
    }
  }

  const specsTable = document.getElementById('modal-specs-table');
  specsTable.innerHTML = '';
  if (product.specs && Object.keys(product.specs).length > 0) {
    Object.entries(product.specs).forEach(([key, val]) => {
      const row = document.createElement('tr');
      row.innerHTML = `<td class="spec-name">${key}</td><td>${val}</td>`;
      specsTable.appendChild(row);
    });
  } else {
    specsTable.innerHTML = '<tr><td colspan="2" style="text-align: center; color: var(--text-muted);">Tidak ada spesifikasi tambahan.</td></tr>';
  }

  const reviewsList = document.getElementById('modal-reviews-list');
  reviewsList.innerHTML = '';
  const reviews = product.reviews || [];
  if (reviews.length > 0) {
    reviews.forEach(rev => {
      const revCard = document.createElement('div');
      revCard.className = 'review-item';
      revCard.innerHTML = `
        <div class="review-header">
          <span class="review-author">${rev.author}</span>
          <span class="review-date">${rev.date}</span>
        </div>
        <div class="rating-stars" style="font-size: 12px; margin-bottom: 6px;">${generateRatingStarsHTML(rev.rating)}</div>
        <p class="review-text">${rev.text}</p>
      `;
      reviewsList.appendChild(revCard);
    });
  } else {
    reviewsList.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 12px 0;">Belum ada ulasan untuk produk ini.</p>';
  }

  updateModalWishlistBtn();
  switchModalTab('specs');
  document.getElementById('product-details-modal').classList.add('open');
}

function updateModalWishlistBtn() {
  const btn = document.getElementById('modal-add-wishlist');
  const isWishlisted = state.wishlist.includes(state.selectedProduct.id);
  if (isWishlisted) {
    btn.innerHTML = '<i class="fa-solid fa-heart" style="color: var(--danger)"></i> Wishlisted';
  } else {
    btn.innerHTML = '<i class="fa-regular fa-heart"></i> Tambah Wishlist';
  }
}

function closeProductDetailsModal() {
  document.getElementById('product-details-modal').classList.remove('open');
  state.selectedProduct = null;
}

function createVariantSelectorHTML(title, list, variantType) {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = `<h4 class="variant-group-title">${title}</h4>`;
  
  const optionsDiv = document.createElement('div');
  optionsDiv.className = 'variant-options';

  list.forEach((val, idx) => {
    const pill = document.createElement('button');
    pill.className = `variant-pill ${idx === 0 ? 'active' : ''}`;
    pill.innerText = val;
    pill.addEventListener('click', () => {
      optionsDiv.querySelectorAll('.variant-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.selectedVariants[variantType] = val;
    });
    optionsDiv.appendChild(pill);
  });

  wrapper.appendChild(optionsDiv);
  return wrapper;
}

function switchModalTab(tabId) {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.getAttribute('data-tab') === tabId ? btn.classList.add('active') : btn.classList.remove('active');
  });
  document.querySelectorAll('.tab-panel').forEach(panel => {
    panel.getAttribute('id') === `tab-panel-${tabId}` ? panel.classList.add('active') : panel.classList.remove('active');
  });
}

// --- Checkout View ---
function renderCheckoutSummary() {
  const container = document.getElementById('checkout-summary-items');
  if (!container) return;

  if (state.cart.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: var(--text-muted); font-size: 13px;">Tidak ada item untuk di-checkout.</p>';
    document.getElementById('checkout-subtotal').innerText = 'Rp 0';
    document.getElementById('checkout-total').innerText = 'Rp 0';
    return;
  }

  let summaryHTML = '';
  let subtotal = 0;

  state.cart.forEach(item => {
    const itemTotal = item.product.price * item.quantity;
    subtotal += itemTotal;

    const variantLabels = [];
    if (item.selectedColor) variantLabels.push(item.selectedColor);
    if (item.selectedSize) variantLabels.push(`Size ${item.selectedSize}`);
    if (item.selectedSwitch) variantLabels.push(item.selectedSwitch);
    const variantStr = variantLabels.join(' | ');

    summaryHTML += `
      <div class="summary-item">
        <img src="${item.product.image}" alt="${item.product.name}" class="summary-item-img">
        <div class="summary-item-info">
          <h4 class="summary-item-name">${item.product.name}</h4>
          <div class="summary-item-qty-price">
            <span>Kuantitas: ${item.quantity} (${variantStr || 'Standar'})</span>
            <span style="font-weight: 700;">${formatIDR(itemTotal)}</span>
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = summaryHTML;

  let discount = 0;
  const discountRow = document.getElementById('checkout-discount-row');
  if (state.activePromo) {
    discount = Math.round(subtotal * (state.activePromo.discountPercent / 100));
    discountRow.style.display = 'flex';
    document.getElementById('checkout-discount-amount').innerText = `-${formatIDR(discount)}`;
  } else {
    discountRow.style.display = 'none';
  }

  const finalTotal = subtotal - discount;
  document.getElementById('checkout-subtotal').innerText = formatIDR(subtotal);
  document.getElementById('checkout-total').innerText = formatIDR(finalTotal);
}

function updateCheckoutStepView() {
  const step1 = document.getElementById('checkout-step-1-form');
  const step2 = document.getElementById('checkout-step-2-form');
  const step3 = document.getElementById('checkout-step-3-success');
  const summaryPanel = document.getElementById('checkout-summary-panel');

  step1.style.display = 'none';
  step2.style.display = 'none';
  step3.style.display = 'none';
  summaryPanel.style.display = 'block';

  document.querySelectorAll('.step-node').forEach(node => { node.className = 'step-node'; });

  const progressLine = document.getElementById('checkout-progress-line');

  if (state.checkoutStep === 1) {
    step1.style.display = 'block';
    document.getElementById('step-node-1').classList.add('active');
    progressLine.style.width = '0%';
  } else if (state.checkoutStep === 2) {
    step2.style.display = 'block';
    document.getElementById('step-node-1').classList.add('completed');
    document.getElementById('step-node-2').classList.add('active');
    progressLine.style.width = '50%';
  } else if (state.checkoutStep === 3) {
    step3.style.display = 'block';
    summaryPanel.style.display = 'none';
    document.getElementById('step-node-1').classList.add('completed');
    document.getElementById('step-node-2').classList.add('completed');
    document.getElementById('step-node-3').classList.add('active');
    progressLine.style.width = '100%';
  }
}

function bindCreditCardMirrorListeners() {
  const cardNum = document.getElementById('card-num-input');
  const cardName = document.getElementById('card-name-input');
  const cardExp = document.getElementById('card-exp-input');
  const mockNum = document.getElementById('mock-card-number');
  const mockName = document.getElementById('mock-card-name');
  const mockExp = document.getElementById('mock-card-expiry');

  cardNum.addEventListener('input', (e) => {
    let val = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    let matches = val.match(/\d{4,16}/g);
    let match = (matches && matches[0]) || '';
    let parts = [];
    for (let i=0, len=match.length; i<len; i+=4) { parts.push(match.substring(i, i+4)); }
    e.target.value = parts.length > 0 ? parts.join(' ') : val;
    mockNum.innerText = e.target.value || '•••• •••• •••• ••••';
  });

  cardName.addEventListener('input', (e) => {
    mockName.innerText = e.target.value.toUpperCase() || 'NAMA LENGKAP';
  });

  cardExp.addEventListener('input', (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 2) {
      e.target.value = val.substring(0, 2) + '/' + val.substring(2, 4);
    } else {
      e.target.value = val;
    }
    mockExp.innerText = e.target.value || 'MM/YY';
  });
}

// Final order checkout - sends to Backend API
async function completeOrderCheckout() {
  if (state.cart.length === 0) {
    showToast('Keranjang belanja kosong!', 'error');
    return;
  }

  const activePaymentMethod = document.querySelector('.payment-option.active').getAttribute('data-method');
  if (activePaymentMethod === 'card') {
    const cardNum = document.getElementById('card-num-input').value.trim();
    const cardName = document.getElementById('card-name-input').value.trim();
    const cardExp = document.getElementById('card-exp-input').value.trim();
    const cardCvv = document.getElementById('card-cvv-input').value.trim();
    if (!cardNum || !cardName || !cardExp || !cardCvv) {
      showToast('Mohon lengkapi seluruh rincian kartu kredit Anda.', 'error');
      return;
    }
  }

  // Collect shipping data
  const customerName = document.getElementById('ship-name').value;
  const customerPhone = document.getElementById('ship-phone').value;
  const customerAddress = document.getElementById('ship-address').value;
  const customerCity = document.getElementById('ship-city').value;
  const customerZip = document.getElementById('ship-zip').value;

  let subtotal = state.cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  let discount = state.activePromo ? Math.round(subtotal * (state.activePromo.discountPercent / 100)) : 0;
  let finalTotal = subtotal - discount;

  // Prepare items for API
  const items = state.cart.map(item => ({
    productId: item.product.id,
    productName: item.product.name,
    productImage: item.product.image,
    productPrice: item.product.price,
    quantity: item.quantity,
    selectedColor: item.selectedColor || null,
    selectedSize: item.selectedSize || null,
    selectedSwitch: item.selectedSwitch || null
  }));

  const checkoutBtn = document.getElementById('complete-order-btn');
  checkoutBtn.disabled = true;
  checkoutBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memproses...';

  try {
    // Call backend checkout API
    const result = await apiRequest('/checkout', {
      method: 'POST',
      body: JSON.stringify({
        customerName, customerPhone, customerAddress, customerCity, customerZip,
        paymentMethod: activePaymentMethod,
        promoCode: state.activePromo ? state.activePromo.code : null,
        items,
        subtotal,
        discountAmount: discount,
        total: finalTotal
      })
    });

    if (result.success) {
      const orderId = result.data.orderId;
      const orderDate = result.data.date || new Date().toISOString().split('T')[0];

      // Save to local orders for display
      const newOrder = {
        id: orderId,
        date: orderDate,
        total: finalTotal,
        status: 'Menunggu',
        itemsCount: state.cart.reduce((s, i) => s + i.quantity, 0),
        paymentMethod: activePaymentMethod,
        shippingDetails: { name: customerName, phone: customerPhone, address: customerAddress, city: customerCity, zip: customerZip },
        items: [...state.cart]
      };

      state.orders.unshift(newOrder);
      state.cart = [];
      state.activePromo = null;
      document.getElementById('cart-promo-code').value = '';

      saveStateToStorage();
      updateBadges();
      renderCart();
      renderInvoiceDOM(newOrder, subtotal, discount, finalTotal);

      // Open WhatsApp notification for owner
      if (result.data.waNotificationUrl) {
        setTimeout(() => {
          window.open(result.data.waNotificationUrl, '_blank');
        }, 500);
      }

      state.checkoutStep = 3;
      updateCheckoutStepView();
      showToast('🎉 Pesanan berhasil dibuat! Notifikasi WA terkirim ke pemilik toko.', 'success');
    }
  } catch (err) {
    // Fallback: Process locally if API fails
    showToast(`Peringatan: API server tidak tersedia (${err.message}). Pesanan disimpan lokal.`, 'info');
    
    const orderId = `ORD-${Math.floor(10000 + Math.random() * 90000)}`;
    const orderDate = new Date().toISOString().split('T')[0];
    
    const newOrder = {
      id: orderId,
      date: orderDate,
      total: finalTotal,
      status: 'Diproses',
      itemsCount: state.cart.reduce((s, i) => s + i.quantity, 0),
      paymentMethod: activePaymentMethod,
      shippingDetails: { name: customerName, phone: customerPhone, address: customerAddress, city: customerCity, zip: customerZip },
      items: [...state.cart]
    };

    // Build WA message fallback
    const waNumber = '6281234567890';
    const waMsg = buildLocalWAMessage(newOrder, state.cart, subtotal, discount, finalTotal, activePaymentMethod);
    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(waMsg)}`, '_blank');

    state.cart.forEach(item => {
      const prod = state.products.find(p => p.id === item.product.id);
      if (prod) prod.stock = Math.max(0, prod.stock - item.quantity);
    });

    state.orders.unshift(newOrder);
    state.cart = [];
    state.activePromo = null;
    document.getElementById('cart-promo-code').value = '';

    saveStateToStorage();
    updateBadges();
    renderCart();
    renderInvoiceDOM(newOrder, subtotal, discount, finalTotal);

    state.checkoutStep = 3;
    updateCheckoutStepView();
    showToast('Pesanan berhasil dibuat!', 'success');
  } finally {
    checkoutBtn.disabled = false;
    checkoutBtn.innerHTML = 'Konfirmasi & Bayar <i class="fa-solid fa-circle-check"></i>';
  }
}

function buildLocalWAMessage(order, cartItems, subtotal, discount, total, paymentMethod) {
  const itemLines = cartItems.map(item => {
    const variants = [];
    if (item.selectedColor) variants.push(`Warna: ${item.selectedColor}`);
    if (item.selectedSize) variants.push(`Ukuran: ${item.selectedSize}`);
    if (item.selectedSwitch) variants.push(`Switch: ${item.selectedSwitch}`);
    const variantStr = variants.length > 0 ? ` (${variants.join(', ')})` : '';
    return `- ${item.product.name}${variantStr} x${item.quantity} = ${formatIDR(item.product.price * item.quantity)}`;
  }).join('\n');

  return `🛒 *PESANAN BARU MASUK - AuraCart* 🛒\n━━━━━━━━━━━━━━━━━━━━━━\n\n📦 *ID Pesanan:* ${order.id}\n📅 *Tanggal:* ${new Date().toLocaleString('id-ID')}\n\n👤 *Data Pembeli:*\nNama: ${order.shippingDetails.name}\nTelp: ${order.shippingDetails.phone}\nAlamat: ${order.shippingDetails.address}, ${order.shippingDetails.city} - ${order.shippingDetails.zip}\n\n🛍️ *Item Dipesan:*\n${itemLines}\n\n━━━━━━━━━━━━━━━━━━━━━━\n💰 Subtotal: ${formatIDR(subtotal)}\n${discount > 0 ? `🎟️ Diskon: -${formatIDR(discount)}\n` : ''}💳 *Total Bayar: ${formatIDR(total)}*\n💳 Metode: ${paymentMethod === 'card' ? 'Kartu Kredit/Debit' : 'E-Wallet (GoPay/OVO/QRIS)'}\n\n✅ Harap segera diproses!`;
}

function renderInvoiceDOM(order, subtotal, discount, total) {
  const container = document.getElementById('invoice-details-box');
  if (!container) return;

  const paymentStr = order.paymentMethod === 'card' ? 'Kartu Kredit' : 'QRIS E-Wallet';

  let itemsRows = '';
  const items = order.items || [];
  items.forEach(item => {
    const product = item.product || item;
    const name = product.name || item.productName || '';
    const qty = item.quantity || 1;
    const price = (product.price || item.productPrice || 0) * qty;
    itemsRows += `
      <div class="invoice-row" style="margin-bottom: 6px;">
        <span>${name} (x${qty})</span>
        <span>${formatIDR(price)}</span>
      </div>
    `;
  });

  container.innerHTML = `
    <div class="invoice-header">
      <div>
        <div class="invoice-id">${order.id}</div>
        <div class="invoice-date">Tanggal: ${order.date}</div>
      </div>
      <div style="text-align: right;">
        <span class="status-pill processing">Menunggu/Diproses</span>
      </div>
    </div>

    <div class="invoice-details">
      <p style="font-weight: 700; font-size: 14px; margin-bottom: 6px;">Tujuan Pengiriman:</p>
      <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.4;">
        ${order.shippingDetails.name} (${order.shippingDetails.phone})<br>
        ${order.shippingDetails.address}, ${order.shippingDetails.city} - ${order.shippingDetails.zip}
      </p>
    </div>

    <div style="border-top: 1px dashed var(--border-color); padding-top: 12px; margin-bottom: 12px;">
      <p style="font-weight: 700; font-size: 14px; margin-bottom: 8px;">Daftar Item Belanja:</p>
      ${itemsRows}
    </div>

    <div style="border-top: 1px solid var(--border-color); padding-top: 12px; display: flex; flex-direction: column; gap: 6px;">
      <div class="invoice-row">
        <span>Metode Pembayaran:</span>
        <span style="font-weight: 700;">${paymentStr}</span>
      </div>
      <div class="invoice-row">
        <span>Subtotal:</span>
        <span>${formatIDR(subtotal)}</span>
      </div>
      ${discount > 0 ? `
      <div class="invoice-row" style="color: var(--accent);">
        <span>Diskon:</span>
        <span>-${formatIDR(discount)}</span>
      </div>
      ` : ''}
      <div class="invoice-row invoice-total">
        <span>Total Dibayar:</span>
        <span>${formatIDR(total)}</span>
      </div>
    </div>
  `;
}

// --- User Account Dashboard ---
function renderOrders() {
  const container = document.getElementById('orders-history-table-body');
  if (!container) return;

  if (state.orders.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 32px 0;">Belum ada riwayat transaksi belanja.</td>
      </tr>
    `;
    return;
  }

  container.innerHTML = state.orders.map(ord => {
    let statClass = 'processing';
    if (ord.status === 'Selesai') statClass = 'success';
    if (ord.status === 'Menunggu') statClass = 'pending';
    if (ord.status === 'Dibatalkan') statClass = 'cancelled';

    const payMethodStr = ord.paymentMethod === 'card' ? 'Kartu Kredit' : 'E-Wallet';

    return `
      <tr>
        <td style="font-weight: 700;">${ord.id}</td>
        <td>${ord.date}</td>
        <td>${formatIDR(ord.total)}</td>
        <td>${payMethodStr}</td>
        <td><span class="status-pill ${statClass}">${ord.status}</span></td>
      </tr>
    `;
  }).join('');
}

function switchDashboardTab(tabName) {
  document.querySelectorAll('.db-tab-btn').forEach(btn => {
    btn.getAttribute('data-db-tab') === tabName ? btn.classList.add('active') : btn.classList.remove('active');
  });
  document.querySelectorAll('.db-section').forEach(sec => {
    sec.getAttribute('id') === `db-sec-${tabName}` ? sec.classList.add('active') : sec.classList.remove('active');
  });

  if (tabName === 'orders') fetchAndRenderOrders();
  if (tabName === 'wishlist') renderWishlist();
}

// --- Admin Dashboard ---
async function fetchAndRenderAdminDashboard() {
  try {
    // Fetch stats from API
    const statsResult = await apiRequest('/orders/stats/summary');
    if (statsResult.success) {
      const data = statsResult.data;
      document.getElementById('admin-revenue').innerText = formatIDR(data.totalRevenue);
      document.getElementById('admin-orders-count').innerText = data.totalOrders;
      document.getElementById('admin-products-count').innerText = data.totalProducts;
    }
  } catch (err) {
    // Fallback to local stats
    const totalProducts = state.products.length;
    const totalOrders = state.orders.length;
    const revenueTotal = state.orders.reduce((sum, o) => sum + o.total, 0);
    document.getElementById('admin-revenue').innerText = formatIDR(revenueTotal);
    document.getElementById('admin-orders-count').innerText = totalOrders;
    document.getElementById('admin-products-count').innerText = totalProducts;
  }

  // Render management tables
  fetchAndRenderAdminProductsTable();
  fetchAndRenderAdminOrdersTable();
}

async function fetchAndRenderAdminProductsTable(searchQuery = '') {
  const container = document.getElementById('admin-products-table-body');
  if (!container) return;

  container.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:16px;"><i class="fa-solid fa-spinner fa-spin"></i> Memuat produk...</td></tr>';

  try {
    const endpoint = searchQuery ? `/products?search=${encodeURIComponent(searchQuery)}` : '/products';
    const result = await apiRequest(endpoint);
    state.products = result.data || state.products;
    renderAdminProductsTable(searchQuery);
  } catch (err) {
    renderAdminProductsTable(searchQuery);
  }
}

function renderAdminProductsTable(searchQuery = '') {
  const container = document.getElementById('admin-products-table-body');
  if (!container) return;

  let products = [...state.products];

  if (searchQuery) {
    products = products.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  if (products.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 32px 0;">
          <i class="fa-solid fa-box-open" style="font-size: 32px; margin-bottom: 8px; display: block;"></i>
          ${searchQuery ? 'Tidak ada produk ditemukan.' : 'Belum ada produk di inventaris.'}
        </td>
      </tr>
    `;
    return;
  }

  container.innerHTML = products.map(p => {
    const stockClass = p.stock <= 5 ? 'color: var(--danger); font-weight: 700;' : (p.stock <= 15 ? 'color: #f59e0b; font-weight: 600;' : '');
    const stockLabel = p.stock <= 0 ? '<span style="color: var(--danger); font-weight: 700;">Habis</span>' : `<span style="${stockClass}">${p.stock}</span>`;

    return `
      <tr>
        <td><img src="${p.image}" alt="${p.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: var(--radius-sm);"></td>
        <td style="font-weight: 600; max-width: 200px;">${p.name}</td>
        <td><span class="status-pill processing" style="font-size: 11px;">${p.category}</span></td>
        <td style="white-space: nowrap;">${formatIDR(p.price)}</td>
        <td>${stockLabel}</td>
        <td>
          <span class="rating-stars-color" style="font-size: 12px;">
            <i class="fa-solid fa-star"></i> ${p.rating}
          </span>
          <span style="color: var(--text-muted); font-size: 11px;">(${p.reviewCount || p.review_count || 0})</span>
        </td>
        <td>
          <div style="display: flex; gap: 6px; flex-wrap: nowrap;">
            <button class="btn btn-secondary admin-action-btn" onclick="openEditProductModal('${p.id}')" style="padding: 6px 10px; font-size: 12px;" title="Edit">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button class="btn btn-secondary admin-action-btn" onclick="confirmDeleteProduct('${p.id}')" style="padding: 6px 10px; font-size: 12px; color: var(--danger);" title="Hapus">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

async function fetchAndRenderAdminOrdersTable() {
  const container = document.getElementById('admin-orders-table-body');
  if (!container) return;

  container.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:16px;"><i class="fa-solid fa-spinner fa-spin"></i> Memuat pesanan...</td></tr>';

  try {
    const result = await apiRequest('/orders');
    state.orders = result.data || state.orders;
    renderAdminOrdersTable();
  } catch (err) {
    renderAdminOrdersTable();
  }
}

function renderAdminOrdersTable() {
  const container = document.getElementById('admin-orders-table-body');
  if (!container) return;

  if (state.orders.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 32px 0;">
          <i class="fa-solid fa-inbox" style="font-size: 32px; margin-bottom: 8px; display: block;"></i>
          Belum ada pesanan masuk.
        </td>
      </tr>
    `;
    return;
  }

  container.innerHTML = state.orders.map((ord, index) => {
    let statClass = 'processing';
    if (ord.status === 'Selesai') statClass = 'success';
    if (ord.status === 'Menunggu') statClass = 'pending';
    if (ord.status === 'Dibatalkan') statClass = 'cancelled';

    const payMethodStr = ord.paymentMethod === 'card' ? 'Kartu Kredit' : 'E-Wallet';

    return `
      <tr>
        <td style="font-weight: 700;">${ord.id}</td>
        <td>${ord.date}</td>
        <td style="text-align: center;">${ord.itemsCount || '-'}</td>
        <td style="white-space: nowrap;">${formatIDR(ord.total)}</td>
        <td>${payMethodStr}</td>
        <td><span class="status-pill ${statClass}">${ord.status}</span></td>
        <td>
          <select class="sort-select admin-status-select" onchange="updateOrderStatus('${ord.id}', ${index}, this.value)" style="padding: 6px 8px; font-size: 12px; min-width: 120px;">
            <option value="Menunggu" ${ord.status === 'Menunggu' ? 'selected' : ''}>Menunggu</option>
            <option value="Diproses" ${ord.status === 'Diproses' ? 'selected' : ''}>Diproses</option>
            <option value="Dikirim" ${ord.status === 'Dikirim' ? 'selected' : ''}>Dikirim</option>
            <option value="Selesai" ${ord.status === 'Selesai' ? 'selected' : ''}>Selesai</option>
            <option value="Dibatalkan" ${ord.status === 'Dibatalkan' ? 'selected' : ''}>Dibatalkan</option>
          </select>
        </td>
      </tr>
    `;
  }).join('');
}

// Update order status - calls API
window.updateOrderStatus = async function(orderId, localIndex, newStatus) {
  try {
    // Call API to update status
    await apiRequest(`/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus })
    });
  } catch (err) {
    // Update locally even if API fails
    console.warn('API update failed, updating locally:', err.message);
  }

  // Update local state
  if (localIndex >= 0 && localIndex < state.orders.length) {
    state.orders[localIndex].status = newStatus;
  }
  
  saveStateToStorage();
  renderAdminOrdersTable();
  fetchAndRenderAdminDashboard();
  showToast(`Status pesanan ${orderId} diubah ke "${newStatus}"`, 'success');
};

function switchAdminTab(tabName) {
  document.querySelectorAll('.admin-tab-btn').forEach(btn => {
    if (btn.getAttribute('data-admin-tab') === tabName) {
      btn.classList.remove('btn-secondary');
      btn.classList.add('btn-primary', 'active');
    } else {
      btn.classList.remove('btn-primary', 'active');
      btn.classList.add('btn-secondary');
    }
  });

  document.querySelectorAll('.admin-section').forEach(sec => {
    sec.getAttribute('id') === `admin-sec-${tabName}` ? sec.classList.add('active') : sec.classList.remove('active');
  });

  if (tabName === 'products') fetchAndRenderAdminProductsTable();
  if (tabName === 'orders') fetchAndRenderAdminOrdersTable();
}

// Add new product - calls API
async function addNewProductFromAdmin() {
  const name = document.getElementById('prod-name').value.trim();
  const category = document.getElementById('prod-category').value;
  const price = parseInt(document.getElementById('prod-price').value);
  const stock = parseInt(document.getElementById('prod-stock').value);
  const desc = document.getElementById('prod-desc').value.trim();
  const img = document.getElementById('prod-img').value.trim();

  if (!name || !price || !stock || !desc) {
    showToast('Mohon lengkapi formulir produk.', 'error');
    return;
  }

  try {
    const result = await apiRequest('/products', {
      method: 'POST',
      body: JSON.stringify({
        name, category, price, stock,
        description: desc,
        image_url: img || undefined
      })
    });

    if (result.success) {
      showToast(result.message || `Produk '${name}' sukses dipajang di katalog Toko!`, 'success');
      document.getElementById('add-product-form').reset();
      document.getElementById('prod-img').value = 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&auto=format&fit=crop&q=80';
      await fetchAndRenderAdminDashboard();
      switchAdminTab('products');
    }
  } catch (err) {
    // Fallback: add locally
    const newProduct = {
      id: `p${Date.now()}`,
      name, category, price, rating: 5.0, reviewCount: 0,
      description: desc,
      image: img || 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&auto=format&fit=crop&q=80',
      images: [img || 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&auto=format&fit=crop&q=80'],
      stock,
      options: category === 'Tech' ? { colors: ['Carbon Black', 'Silver Gray'] } : (category === 'Fashion' ? { sizes: ['M', 'L', 'XL'] } : {}),
      specs: { 'Ketersediaan': 'Stok Toko', 'Kondisi': 'Baru 100%' },
      reviews: []
    };
    state.products.push(newProduct);
    document.getElementById('add-product-form').reset();
    showToast(`Produk '${name}' ditambahkan (mode lokal - API tidak tersedia).`, 'info');
    renderAdminProductsTable();
    switchAdminTab('products');
  }
}

// Edit product modal
let pendingDeleteProductId = null;

window.openEditProductModal = function(productId) {
  const product = state.products.find(p => p.id === productId);
  if (!product) return;

  document.getElementById('edit-prod-id').value = product.id;
  document.getElementById('edit-prod-name').value = product.name;
  document.getElementById('edit-prod-category').value = product.category;
  document.getElementById('edit-prod-price').value = product.price;
  document.getElementById('edit-prod-stock').value = product.stock;
  document.getElementById('edit-prod-desc').value = product.description;
  document.getElementById('edit-prod-img').value = product.image;

  document.getElementById('edit-product-modal').classList.add('open');
};

function closeEditProductModal() {
  document.getElementById('edit-product-modal').classList.remove('open');
}

async function saveEditProduct() {
  const id = document.getElementById('edit-prod-id').value;
  const name = document.getElementById('edit-prod-name').value.trim();
  const category = document.getElementById('edit-prod-category').value;
  const price = parseInt(document.getElementById('edit-prod-price').value);
  const stock = parseInt(document.getElementById('edit-prod-stock').value);
  const description = document.getElementById('edit-prod-desc').value.trim();
  const image_url = document.getElementById('edit-prod-img').value.trim();

  try {
    await apiRequest(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name, category, price, stock, description, image_url, images: [image_url] })
    });
    showToast(`Produk '${name}' berhasil diperbarui!`, 'success');
  } catch (err) {
    // Update locally
    const product = state.products.find(p => p.id === id);
    if (product) {
      Object.assign(product, { name, category, price, stock, description, image: image_url, images: [image_url] });
    }
    showToast(`Produk '${name}' diperbarui (lokal).`, 'info');
  }

  closeEditProductModal();
  await fetchAndRenderAdminDashboard();
}

window.confirmDeleteProduct = function(productId) {
  const product = state.products.find(p => p.id === productId);
  if (!product) return;

  pendingDeleteProductId = productId;
  document.getElementById('delete-confirm-text').innerText = 
    `Apakah Anda yakin ingin menghapus "${product.name}"? Tindakan ini tidak dapat dibatalkan.`;
  document.getElementById('delete-confirm-modal').classList.add('open');
};

function closeDeleteModal() {
  document.getElementById('delete-confirm-modal').classList.remove('open');
  pendingDeleteProductId = null;
}

async function executeDeleteProduct() {
  if (!pendingDeleteProductId) return;

  const product = state.products.find(p => p.id === pendingDeleteProductId);
  const productName = product ? product.name : 'Produk';

  try {
    await apiRequest(`/products/${pendingDeleteProductId}`, { method: 'DELETE' });
    showToast(`Produk '${productName}' berhasil dihapus dari toko.`, 'info');
  } catch (err) {
    showToast(`Produk '${productName}' dihapus (lokal).`, 'info');
  }

  state.products = state.products.filter(p => p.id !== pendingDeleteProductId);
  state.wishlist = state.wishlist.filter(wId => wId !== pendingDeleteProductId);
  state.cart = state.cart.filter(item => item.product.id !== pendingDeleteProductId);

  saveStateToStorage();
  updateBadges();
  closeDeleteModal();
  await fetchAndRenderAdminDashboard();
}

// --- App Event Listeners Registration ---
function registerEventListeners() {
  // Admin Login Form Submit
  document.getElementById('admin-login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    loginAsAdmin();
  });
  
  document.getElementById('logout-btn').addEventListener('click', logout);

  document.getElementById('theme-toggle-btn').addEventListener('click', () => {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('auracart_theme', state.theme);
    document.documentElement.setAttribute('data-theme', state.theme);
    updateThemeTogglerIcon();
    showToast(`Tema diubah ke Mode ${state.theme === 'light' ? 'Terang' : 'Gelap'}.`, 'info');
  });

  document.querySelectorAll('nav a, #nav-logo').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const view = link.getAttribute('data-view');
      if (view) switchView(view);
      else switchView('home');
    });
  });

  document.getElementById('hero-shop-btn').addEventListener('click', () => switchView('shop'));
  document.getElementById('home-view-all-btn').addEventListener('click', () => switchView('shop'));
  document.getElementById('hero-learn-btn').addEventListener('click', () => {
    window.scrollTo({ top: 750, behavior: 'smooth' });
  });

  document.querySelectorAll('#category-filter-list .category-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('#category-filter-list .category-item').forEach(li => li.classList.remove('active'));
      item.classList.add('active');
      state.activeFilters.category = item.getAttribute('data-category');
      fetchAndRenderCatalog();
    });
  });

  document.querySelectorAll('.footer-link[data-category-link]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const category = link.getAttribute('data-category-link');
      state.activeFilters.category = category;
      document.querySelectorAll('#category-filter-list .category-item').forEach(li => {
        li.getAttribute('data-category') === category ? li.classList.add('active') : li.classList.remove('active');
      });
      switchView('shop');
    });
  });

  const priceSlider = document.getElementById('price-slider');
  const priceMaxInput = document.getElementById('price-max');
  const priceMinInput = document.getElementById('price-min');
  const priceLabel = document.getElementById('price-slider-label');

  priceSlider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    priceLabel.innerText = formatIDR(val);
    priceMaxInput.value = val;
    state.activeFilters.priceMax = val;
    fetchAndRenderCatalog();
  });

  priceMaxInput.addEventListener('change', (e) => {
    let val = parseInt(e.target.value) || 5000000;
    val = Math.max(0, Math.min(val, 5000000));
    priceMaxInput.value = val;
    priceSlider.value = val;
    priceLabel.innerText = formatIDR(val);
    state.activeFilters.priceMax = val;
    fetchAndRenderCatalog();
  });

  priceMinInput.addEventListener('change', () => fetchAndRenderCatalog());

  document.querySelectorAll('input[name="rating-filter"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      state.activeFilters.rating = parseFloat(e.target.value);
      fetchAndRenderCatalog();
    });
  });

  document.getElementById('reset-filters-btn').addEventListener('click', () => {
    state.activeFilters = { search: '', category: 'all', priceMax: 5000000, rating: 0, sort: 'popular' };
    document.getElementById('catalog-search').value = '';
    document.getElementById('catalog-sort').value = 'popular';
    priceSlider.value = 5000000;
    priceLabel.innerText = formatIDR(5000000);
    priceMaxInput.value = 5000000;
    priceMinInput.value = 0;
    document.querySelectorAll('#category-filter-list .category-item').forEach(li => {
      li.getAttribute('data-category') === 'all' ? li.classList.add('active') : li.classList.remove('active');
    });
    document.querySelectorAll('input[name="rating-filter"]').forEach(radio => { radio.checked = radio.value === '0'; });
    fetchAndRenderCatalog();
    showToast('Filter diatur ulang.', 'info');
  });

  document.getElementById('catalog-search').addEventListener('input', (e) => {
    state.activeFilters.search = e.target.value;
    clearTimeout(window.searchDebounce);
    window.searchDebounce = setTimeout(() => fetchAndRenderCatalog(), 400);
  });

  document.getElementById('catalog-sort').addEventListener('change', (e) => {
    state.activeFilters.sort = e.target.value;
    fetchAndRenderCatalog();
  });

  document.getElementById('cart-toggle-btn').addEventListener('click', () => {
    renderCart();
    openCartSidebar();
  });

  document.getElementById('wishlist-btn-header').addEventListener('click', () => {
    switchView('account');
    switchDashboardTab('wishlist');
  });

  document.getElementById('cart-close-btn').addEventListener('click', closeCartSidebar);
  document.getElementById('cart-overlay-element').addEventListener('click', (e) => {
    if (e.target === document.getElementById('cart-overlay-element')) closeCartSidebar();
  });

  document.getElementById('cart-apply-promo').addEventListener('click', applyPromoCode);

  document.getElementById('cart-checkout-btn-action').addEventListener('click', () => {
    if (state.cart.length === 0) {
      showToast('Keranjang Anda masih kosong!', 'error');
      return;
    }
    closeCartSidebar();
    switchView('checkout');
  });

  document.getElementById('tab-btn-specs').addEventListener('click', () => switchModalTab('specs'));
  document.getElementById('tab-btn-reviews').addEventListener('click', () => switchModalTab('reviews'));

  document.getElementById('modal-add-cart').addEventListener('click', () => {
    if (!state.selectedProduct) return;
    addToCart(state.selectedProduct, 1, state.selectedVariants);
    closeProductDetailsModal();
  });

  document.getElementById('modal-add-wishlist').addEventListener('click', () => {
    if (!state.selectedProduct) return;
    toggleWishlist(state.selectedProduct.id);
    updateModalWishlistBtn();
  });

  document.getElementById('modal-close-btn').addEventListener('click', closeProductDetailsModal);
  document.getElementById('product-details-modal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('product-details-modal')) closeProductDetailsModal();
  });

  document.getElementById('shipping-form').addEventListener('submit', (e) => {
    e.preventDefault();
    state.checkoutStep = 2;
    updateCheckoutStepView();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  document.getElementById('back-to-shipping-btn').addEventListener('click', () => {
    state.checkoutStep = 1;
    updateCheckoutStepView();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  document.querySelectorAll('.payment-option').forEach(option => {
    option.addEventListener('click', () => {
      document.querySelectorAll('.payment-option').forEach(opt => opt.classList.remove('active'));
      option.classList.add('active');
      option.querySelector('input[type="radio"]').checked = true;
      const method = option.getAttribute('data-method');
      document.getElementById('card-payment-details').style.display = method === 'card' ? 'block' : 'none';
      document.getElementById('ewallet-payment-details').style.display = method === 'card' ? 'none' : 'block';
    });
  });

  document.getElementById('complete-order-btn').addEventListener('click', completeOrderCheckout);

  document.getElementById('success-home-btn').addEventListener('click', () => switchView('home'));
  document.getElementById('success-orders-btn').addEventListener('click', () => {
    switchView('account');
    switchDashboardTab('orders');
  });

  document.querySelectorAll('.db-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-db-tab');
      switchDashboardTab(tab);
    });
  });

  document.getElementById('add-product-form').addEventListener('submit', (e) => {
    e.preventDefault();
    addNewProductFromAdmin();
  });

  document.querySelectorAll('.admin-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-admin-tab');
      switchAdminTab(tab);
    });
  });

  const adminSearchInput = document.getElementById('admin-product-search');
  if (adminSearchInput) {
    adminSearchInput.addEventListener('input', (e) => {
      clearTimeout(window.adminSearchDebounce);
      window.adminSearchDebounce = setTimeout(() => fetchAndRenderAdminProductsTable(e.target.value), 400);
    });
  }

  document.getElementById('edit-modal-close-btn').addEventListener('click', closeEditProductModal);
  document.getElementById('edit-cancel-btn').addEventListener('click', closeEditProductModal);
  document.getElementById('edit-product-modal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('edit-product-modal')) closeEditProductModal();
  });
  document.getElementById('edit-product-form').addEventListener('submit', (e) => {
    e.preventDefault();
    saveEditProduct();
  });

  document.getElementById('delete-cancel-btn').addEventListener('click', closeDeleteModal);
  document.getElementById('delete-confirm-btn').addEventListener('click', executeDeleteProduct);
  document.getElementById('delete-confirm-modal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('delete-confirm-modal')) closeDeleteModal();
  });
}

// --- App Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
  loadStateFromStorage();
  registerEventListeners();
  bindCreditCardMirrorListeners();
  updateBadges();
  renderCart();
  updateNavigationHeader();

  // Initial route
  if (state.currentUserRole === 'admin') {
    switchView('admin');
  } else {
    // Load initial products from API or fallback
    await fetchAndRenderFeaturedProducts();
    switchView('home');
  }
});
