const initialProducts = [
  {
    id: "p1",
    name: "AuraSound Max - ANC Headphones",
    category: "Tech",
    price: 3499000,
    rating: 4.8,
    reviewCount: 124,
    description: "Nikmati kemurnian suara tanpa gangguan. AuraSound Max menghadirkan Active Noise Cancellation kelas dunia, kenyamanan premium dengan earcup memory foam, dan daya tahan baterai hingga 40 jam.",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&auto=format&fit=crop&q=80"
    ],
    stock: 15,
    options: {
      colors: ["Midnight Black", "Platinum Silver", "Navy Blue"]
    },
    specs: {
      "Konektivitas": "Bluetooth 5.2 & Wired (3.5mm)",
      "Baterai": "Hingga 40 jam (ANC on)",
      "Pengisian Daya": "USB-C (Fast Charging 10 mnt untuk 5 jam)",
      "Driver": "40mm Dynamic Driver"
    },
    reviews: [
      { author: "Budi Santoso", rating: 5, text: "Suaranya luar biasa jernih, bass-nya pas tidak berlebihan. ANC sangat senyap!", date: "2026-06-15" },
      { author: "Siti Rahma", rating: 4, text: "Sangat nyaman dipakai berjam-jam saat WFH. Hanya saja box-nya agak penyok saat sampai.", date: "2026-06-20" }
    ]
  },
  {
    id: "p2",
    name: "KeyCraft K2 - Mechanical Keyboard",
    category: "Tech",
    price: 1899000,
    rating: 4.9,
    reviewCount: 88,
    description: "Tingkatkan produktivitas dan pengalaman mengetik Anda. Keyboard mekanikal 75% dengan opsi hot-swappable switch, koneksi tri-mode (Wireless, Bluetooth, Wired), dan lampu latar RGB dinamis yang dapat disesuaikan.",
    image: "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80"
    ],
    stock: 22,
    options: {
      colors: ["Carbon Grey", "Arctic White"],
      switches: ["Red (Linear)", "Brown (Tactile)", "Blue (Clicky)"]
    },
    specs: {
      "Layout": "75% Compact (84 Keys)",
      "Koneksi": "2.4Ghz Wireless, Bluetooth 5.1, USB-C",
      "Switch": "Gateron G Pro Switches",
      "Kapasitas Baterai": "4000mAh"
    },
    reviews: [
      { author: "Rian Aditya", rating: 5, text: "Feel mengetik di keyboard ini enak sekali. Suara Gateron Brown switch-nya sangat memuaskan.", date: "2026-06-18" }
    ]
  },
  {
    id: "p3",
    name: "NeoJacket - Oversized Parka",
    category: "Fashion",
    price: 899000,
    rating: 4.6,
    reviewCount: 64,
    description: "Jaket parka bergaya urban dengan bahan tahan air (waterproof) berkualitas tinggi. Potongan oversized yang modern dan fungsional dengan banyak saku praktis, cocok untuk cuaca dingin maupun tampilan harian.",
    image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=800&auto=format&fit=crop&q=80"
    ],
    stock: 35,
    options: {
      colors: ["Olive Green", "Matte Black", "Desert Sand"],
      sizes: ["S", "M", "L", "XL"]
    },
    specs: {
      "Bahan": "Poliester DWR (Durable Water Repellent)",
      "Furing": "Mesh breathable",
      "Kantong": "4 kantong depan, 1 kantong dalam",
      "Instruksi Cuci": "Cuci tangan dengan air dingin"
    },
    reviews: [
      { author: "Dimas Pratama", rating: 4, text: "Jaketnya tebal dan keren bgt. Pas dipakai waktu motoran malem-malem ga tembus angin.", date: "2026-06-11" }
    ]
  },
  {
    id: "p4",
    name: "Vera Tote Bag - Full Grain Leather",
    category: "Fashion",
    price: 2450000,
    rating: 4.7,
    reviewCount: 42,
    description: "Tas jinjing elegan yang terbuat dari kulit sapi asli full-grain. Didesain secara minimalis untuk menunjang penampilan profesional Anda, dengan kompartemen laptop 14 inci berlapis beludru pelindung.",
    image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&auto=format&fit=crop&q=80"
    ],
    stock: 8,
    options: {
      colors: ["Tuscan Tan", "Midnight Black", "Burgundy"]
    },
    specs: {
      "Bahan Utama": "100% Genuine Full Grain Leather",
      "Kompartemen Laptop": "Hingga 14 inci",
      "Dimensi": "38cm x 28cm x 12cm",
      "Berat": "0.9 kg"
    },
    reviews: [
      { author: "Nadia Utami", rating: 5, text: "Kulitnya harum sekali dan jahitannya sangat rapi. Muat banyak barang kantor.", date: "2026-06-22" }
    ]
  },
  {
    id: "p5",
    name: "Lumina Sphere - Minimalist Table Lamp",
    category: "Home & Living",
    price: 750000,
    rating: 4.9,
    reviewCount: 110,
    description: "Ciptakan suasana hangat dan estetis di ruangan Anda. Lampu meja minimalis berbentuk bola dengan dudukan kayu oak solid. Dilengkapi kontrol sentuh cerdas untuk meredupkan lampu (stepless dimming).",
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800&auto=format&fit=crop&q=80"
    ],
    stock: 18,
    options: {
      colors: ["Warm Oak", "Dark Walnut"]
    },
    specs: {
      "Sumber Cahaya": "LED 5W (Warm White 2700K)",
      "Bahan": "Kayu Oak Asli & Kaca Frost Opal",
      "Kabel": "1.5m braided cable dengan switch sentuh",
      "Tegangan": "110-240V"
    },
    reviews: [
      { author: "Fajar Nugraha", rating: 5, text: "Lampu tidurnya estetik sekali! Paling suka karena tingkat terangnya bisa diatur sentuh.", date: "2026-06-25" }
    ]
  },
  {
    id: "p6",
    name: "Aura Oasis - Ceramic Essential Oil Diffuser",
    category: "Home & Living",
    price: 620000,
    rating: 4.5,
    reviewCount: 95,
    description: "Ubah rumah Anda menjadi spa pribadi. Diffuser ultrasonik berbahan keramik buatan tangan ini menghasilkan kabut super halus untuk menyebarkan minyak esensial, dilengkapi lampu LED ambient bernuansa hangat.",
    image: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&auto=format&fit=crop&q=80"
    ],
    stock: 25,
    options: {
      colors: ["Terracotta Red", "Stone Grey", "Soft White"]
    },
    specs: {
      "Kapasitas Air": "120 ml",
      "Area Cakupan": "Hingga 25 m²",
      "Waktu Operasi": "3 jam (kontinu) / 6 jam (intermiten)",
      "Teknologi": "Ultrasonik 2.4 MHz"
    },
    reviews: [
      { author: "Lina Marlina", rating: 4, text: "Bagus sekali diffuser keramiknya, terkesan mewah. Sayang kapasitas airnya agak kecil jadi harus sering isi.", date: "2026-06-21" }
    ]
  },
  {
    id: "p7",
    name: "HydroFlow Insulated Flask - 950ml",
    category: "Lifestyle",
    price: 499000,
    rating: 4.8,
    reviewCount: 156,
    description: "Botol minum thermal premium untuk petualangan harian Anda. Menggunakan isolasi vakum dinding ganda yang menjaga minuman tetap dingin hingga 24 jam atau panas hingga 12 jam. Bebas BPA dan anti bocor.",
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1523362628745-0c100150b504?w=800&auto=format&fit=crop&q=80"
    ],
    stock: 40,
    options: {
      colors: ["Cobalt Blue", "Forest Green", "Obsidian Black", "Sakura Pink"]
    },
    specs: {
      "Bahan": "18/8 Pro-Grade Stainless Steel",
      "Isolasi": "Double-Wall Vacuum Insulation",
      "Kapasitas": "950 ml / 32 oz",
      "BPA Free": "Ya"
    },
    reviews: [
      { author: "Hendra Wijaya", rating: 5, text: "Dinginnya awet banget seharian di mobil terjemur matahari air esnya masih ada es batunya.", date: "2026-06-26" }
    ]
  },
  {
    id: "p8",
    name: "Serene Garden - Soy Wax Scented Candle Set",
    category: "Lifestyle",
    price: 299000,
    rating: 4.7,
    reviewCount: 78,
    description: "Set lilin aromaterapi dari 100% natural soy wax dengan sumbu katun organik. Hadir dalam 3 aroma menenangkan: Lavender Fields, Sandalwood Forest, dan Citrus Splash. Sempurna untuk meditasi atau bersantai.",
    image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1508669232496-137b159c1cdb?w=800&auto=format&fit=crop&q=80"
    ],
    stock: 50,
    options: {
      sizes: ["Standard Set (3 x 70g)", "Luxury Set (3 x 150g)"]
    },
    specs: {
      "Bahan Lilin": "100% Premium Soy Wax",
      "Waktu Pembakaran": "20 jam per lilin (Total 60 jam)",
      "Sumbu": "Katun Organik Bebas Timbal",
      "Essential Oil": "Premium Essential Oil blend"
    },
    reviews: [
      { author: "Indah Permata", rating: 5, text: "Aromanya wangi sekali dan menyebar ke seluruh ruangan, tidak bikin pusing.", date: "2026-06-19" }
    ]
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { initialProducts };
}
