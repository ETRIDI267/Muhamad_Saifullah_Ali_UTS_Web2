// Fungsi Update Angka Keranjang
function updateCartCount() {
    let cart = JSON.parse(localStorage.getItem('ali_ps_cart')) || [];
    const countElement = document.getElementById('cart-count');
    if(countElement) countElement.innerText = cart.length;
}

// Fungsi Tambah ke Keranjang
function addToCart(product) {
    let cart = JSON.parse(localStorage.getItem('ali_ps_cart')) || [];
    cart.push(product);
    localStorage.setItem('ali_ps_cart', JSON.stringify(cart));
    updateCartCount();
    alert(product.name + " berhasil ditambah!");
}

// Jalankan tiap halaman dibuka
document.addEventListener('DOMContentLoaded', updateCartCount);
