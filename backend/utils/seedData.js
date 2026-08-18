const Tenant = require('../models/Tenant');
const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const Coupon = require('../models/Coupon');

const seedData = async () => {
  try {
    const existingCount = await Tenant.countDocuments();
    if (existingCount > 0) {
      console.log('Data already seeded. Skipping initial seeding.');
      return;
    }

    console.log('Seeding curated 5-tenant multi-tenant store dataset...');

    // =========================================================================
    // STORE 1: Gym Store (Titan Gym & Fitness Store)
    // =========================================================================
    const gymStore = await Tenant.create({
      name: 'Titan Gym & Fitness Store',
      slug: 'gym-store',
      domain: 'gym-store.store',
      tagline: 'Heavy-Duty Gym Equipment, Free Weights & Power Racks',
      branding: {
        primaryColor: '#f97316', // Orange
        secondaryColor: '#ea580c',
        accentColor: '#fb923c',
        logoUrl: 'https://images.unsplash.com/photo-1586401100295-7a8096fd231a?w=100&auto=format&fit=crop&q=80',
        bannerText: '🏋️ Massive Gym Sale: Free Standard Assembly & Express Delivery Across India!'
      },
      plan: 'pro',
      status: 'active',
      currency: 'INR'
    });

    await User.create({
      name: 'Vikram Rawat',
      email: 'owner@gymstore.com',
      password: 'Password123!',
      role: 'tenant_admin',
      tenantId: gymStore._id
    });

    await User.create({
      name: 'Aman Sharma',
      email: 'customer@gymstore.com',
      password: 'Password123!',
      phone: '+91 98200 11223',
      role: 'customer',
      tenantId: gymStore._id,
      addresses: [
        {
          street: 'Plot 44, Fitness Enclave, Bandra West',
          city: 'Mumbai',
          state: 'Maharashtra',
          zipCode: '400050',
          country: 'India',
          isDefault: true
        }
      ]
    });

    const gymProducts = [
      {
        tenantId: gymStore._id,
        name: 'Hex Rubber Dumbbell Set (5kg - 25kg Pair)',
        slug: 'hex-rubber-dumbbell-set',
        description: 'Professional commercial-grade hexagonal dumbbells with ergonomic knurled chrome handles and shock-absorbing rubber coating.',
        price: 12999,
        comparePrice: 15999,
        category: 'Free Weights',
        stock: 25,
        sku: 'GYM-DMB-001',
        isFeatured: true,
        images: ['https://images.unsplash.com/photo-1586401100295-7a8096fd231a?w=800&auto=format&fit=crop&q=80'],
        tags: ['gym', 'dumbbells', 'weights', 'fitness', 'strength'],
        rating: 4.9,
        reviewsCount: 52
      },
      {
        tenantId: gymStore._id,
        name: 'Heavy-Duty Multi-Angle Adjustable Bench',
        slug: 'heavy-duty-adjustable-bench',
        description: 'Commercial 7-position incline/flat/decline bench constructed with 11-gauge steel supporting up to 450kg.',
        price: 8499,
        comparePrice: 10999,
        category: 'Benches & Racks',
        stock: 18,
        sku: 'GYM-BNC-002',
        isFeatured: true,
        images: ['https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=800&auto=format&fit=crop&q=80'],
        tags: ['bench', 'gym', 'workout', 'incline'],
        rating: 4.8,
        reviewsCount: 39
      },
      {
        tenantId: gymStore._id,
        name: 'Cast Iron Kettlebell 16kg & 24kg Set',
        slug: 'cast-iron-kettlebell-set',
        description: 'Solid gravity-cast iron kettlebells with wide flat bases and smooth textured grip for swings, snatches and presses.',
        price: 4299,
        comparePrice: 5499,
        category: 'Free Weights',
        stock: 30,
        sku: 'GYM-KTB-003',
        isFeatured: true,
        images: ['https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80'],
        tags: ['kettlebell', 'crossfit', 'iron', 'conditioning'],
        rating: 4.9,
        reviewsCount: 41
      },
      {
        tenantId: gymStore._id,
        name: 'Olympic 20kg Hard Chrome Barbell',
        slug: 'olympic-20kg-barbell',
        description: '7-foot standard Olympic barbell rated for 1500 lbs, featuring 8 needle bearings for smooth spin during power lifts.',
        price: 9999,
        comparePrice: 12999,
        category: 'Bars & Plates',
        stock: 15,
        sku: 'GYM-BAR-004',
        isFeatured: false,
        images: ['https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80'],
        tags: ['barbell', 'olympic', 'powerlifting', 'deadlift'],
        rating: 4.7,
        reviewsCount: 28
      },
      {
        tenantId: gymStore._id,
        name: '100% Pure Whey Isolate Protein 2kg',
        slug: '100-pure-whey-isolate-protein',
        description: 'Ultra-filtered whey isolate delivering 27g protein and 6.2g BCAAs per scoop with zero added sugar in Rich Chocolate flavor.',
        price: 5499,
        comparePrice: 6999,
        category: 'Supplements',
        stock: 45,
        sku: 'GYM-SUP-005',
        isFeatured: true,
        images: ['https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?w=800&auto=format&fit=crop&q=80'],
        tags: ['protein', 'whey', 'isolate', 'nutrition', 'supplements'],
        rating: 4.9,
        reviewsCount: 88
      },
      {
        tenantId: gymStore._id,
        name: 'Latex Heavy Loop Resistance Bands (Set of 5)',
        slug: 'latex-heavy-loop-resistance-bands',
        description: 'Natural Malaysian latex resistance loop bands ranging from 10 lbs to 150 lbs for warmups, mobility and assisted pullups.',
        price: 1499,
        comparePrice: 2199,
        category: 'Accessories',
        stock: 60,
        sku: 'GYM-ACC-006',
        isFeatured: false,
        images: ['https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=800&auto=format&fit=crop&q=80'],
        tags: ['bands', 'mobility', 'latex', 'warmup'],
        rating: 4.8,
        reviewsCount: 65
      }
    ];

    await Product.insertMany(gymProducts);

    // =========================================================================
    // STORE 2: Sports Shop (Velocity Pro Sports Arena)
    // =========================================================================
    const sportsShop = await Tenant.create({
      name: 'Velocity Pro Sports Arena',
      slug: 'sports-shop',
      domain: 'sports-shop.store',
      tagline: 'Championship Gear for Cricket, Football, Badminton & Tennis',
      branding: {
        primaryColor: '#06b6d4', // Cyan
        secondaryColor: '#0891b2',
        accentColor: '#22d3ee',
        logoUrl: 'https://images.unsplash.com/photo-1531415074868-036b1c57e329?w=100&auto=format&fit=crop&q=80',
        bannerText: '⚽ Season Match Ready: Free Pro Bat Knocking & Racquet Stringing with Every Order!'
      },
      plan: 'pro',
      status: 'active',
      currency: 'INR'
    });

    await User.create({
      name: 'Rohan Tendulkar',
      email: 'owner@sportsshop.com',
      password: 'Password123!',
      role: 'tenant_admin',
      tenantId: sportsShop._id
    });

    await User.create({
      name: 'Siddharth Rao',
      email: 'customer@sportsshop.com',
      password: 'Password123!',
      phone: '+91 98300 22334',
      role: 'customer',
      tenantId: sportsShop._id,
      addresses: [
        {
          street: '15 Sports Avenue, Koramangala',
          city: 'Bengaluru',
          state: 'Karnataka',
          zipCode: '560034',
          country: 'India',
          isDefault: true
        }
      ]
    });

    const sportsProducts = [
      {
        tenantId: sportsShop._id,
        name: 'Pro English Willow Grade 1 Cricket Bat',
        slug: 'pro-english-willow-cricket-bat',
        description: 'Handcrafted Grade 1 English Willow cricket bat with huge 40mm edges, massive sweet spot, and premium chevron grip.',
        price: 18499,
        comparePrice: 22999,
        category: 'Cricket',
        stock: 12,
        sku: 'SPT-CRK-001',
        isFeatured: true,
        images: ['https://images.unsplash.com/photo-1531415074868-036b1c57e329?w=800&auto=format&fit=crop&q=80'],
        tags: ['cricket', 'bat', 'willow', 'sports'],
        rating: 4.9,
        reviewsCount: 45
      },
      {
        tenantId: sportsShop._id,
        name: 'FIFA Quality Pro Match Football (Size 5)',
        slug: 'fifa-quality-pro-match-football',
        description: 'Thermally bonded seamless match football with textured polyurethane casing for aerodynamic stability and zero water uptake.',
        price: 3299,
        comparePrice: 4199,
        category: 'Football',
        stock: 28,
        sku: 'SPT-FTB-002',
        isFeatured: true,
        images: ['https://images.unsplash.com/photo-1614632537423-1e6c2e7e0aab?w=800&auto=format&fit=crop&q=80'],
        tags: ['football', 'soccer', 'fifa', 'matchball'],
        rating: 4.8,
        reviewsCount: 37
      },
      {
        tenantId: sportsShop._id,
        name: 'Carbon-Graphite Badminton Racket Set',
        slug: 'carbon-graphite-badminton-racket-set',
        description: 'Ultra-lightweight 4U High Modulus Carbon Graphite badminton rackets with isometric head shape and 28 lbs BG65 strings.',
        price: 4799,
        comparePrice: 5999,
        category: 'Badminton',
        stock: 20,
        sku: 'SPT-BDM-003',
        isFeatured: true,
        images: ['https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&auto=format&fit=crop&q=80'],
        tags: ['badminton', 'racket', 'carbon', 'graphite'],
        rating: 4.8,
        reviewsCount: 31
      },
      {
        tenantId: sportsShop._id,
        name: 'SpeedPro Carbon-Plated Running Shoes',
        slug: 'speedpro-carbon-running-shoes',
        description: 'Marathon racing shoes with full-length curved carbon fiber plate and supercritical nitrogen-infused foam cushioning.',
        price: 8999,
        comparePrice: 11999,
        category: 'Footwear',
        stock: 22,
        sku: 'SPT-SHU-004',
        isFeatured: true,
        images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80'],
        tags: ['running', 'shoes', 'carbon', 'sneakers', 'marathon'],
        rating: 4.9,
        reviewsCount: 76
      },
      {
        tenantId: sportsShop._id,
        name: 'Official Indoor/Outdoor Leather Basketball',
        slug: 'official-leather-basketball',
        description: 'Deep channel composite leather basketball with full-ball pebbled pattern for maximum grip and soft touch control.',
        price: 2799,
        comparePrice: 3499,
        category: 'Basketball',
        stock: 19,
        sku: 'SPT-BSK-005',
        isFeatured: false,
        images: ['https://images.unsplash.com/photo-1519766304817-4f37bda74a29?w=800&auto=format&fit=crop&q=80'],
        tags: ['basketball', 'nba', 'leather', 'hoops'],
        rating: 4.7,
        reviewsCount: 29
      },
      {
        tenantId: sportsShop._id,
        name: 'Pro Tour High-Altitude Tennis Ball Can (3-Pack)',
        slug: 'pro-tour-tennis-ball-can',
        description: 'Pressurized extra-duty felt tennis balls engineered for consistent bounce and durability on hard courts.',
        price: 899,
        comparePrice: 1199,
        category: 'Tennis',
        stock: 50,
        sku: 'SPT-TNS-006',
        isFeatured: false,
        images: ['https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=800&auto=format&fit=crop&q=80'],
        tags: ['tennis', 'balls', 'wimbledon', 'court'],
        rating: 4.8,
        reviewsCount: 42
      }
    ];

    await Product.insertMany(sportsProducts);

    // =========================================================================
    // STORE 3: Fruit Shop (Fresh Orchard Organic Fruit Shop)
    // =========================================================================
    const fruitShop = await Tenant.create({
      name: 'Fresh Orchard Organic Fruit Shop',
      slug: 'fruit-shop',
      domain: 'fruit-shop.store',
      tagline: 'Farm-Fresh Exotic Fruits, Crisp Apples & Organic Harvests',
      branding: {
        primaryColor: '#10b981', // Fresh Green
        secondaryColor: '#059669',
        accentColor: '#34d399',
        logoUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=100&auto=format&fit=crop&q=80',
        bannerText: '🍎 Fresh Morning Harvest: 100% Organic, Pesticide-Free Fruits Delivered Daily in 2 Hours!'
      },
      plan: 'starter',
      status: 'active',
      currency: 'INR'
    });

    await User.create({
      name: 'Karan Patel',
      email: 'owner@fruitshop.com',
      password: 'Password123!',
      role: 'tenant_admin',
      tenantId: fruitShop._id
    });

    await User.create({
      name: 'Meera Joshi',
      email: 'customer@fruitshop.com',
      password: 'Password123!',
      phone: '+91 98400 33445',
      role: 'customer',
      tenantId: fruitShop._id,
      addresses: [
        {
          street: 'Bungalow 7, Orchard Green, Vasant Kunj',
          city: 'New Delhi',
          state: 'Delhi',
          zipCode: '110070',
          country: 'India',
          isDefault: true
        }
      ]
    });

    const fruitProducts = [
      {
        tenantId: fruitShop._id,
        name: 'Royal Gala Red Apples (1kg Box)',
        slug: 'royal-gala-red-apples',
        description: 'Crisp, sweet and aromatic Royal Gala apples freshly picked from Himachal orchards, packed in eco-friendly protective crates.',
        price: 249,
        comparePrice: 299,
        category: 'Apples & Pears',
        stock: 80,
        sku: 'FRT-APL-001',
        isFeatured: true,
        images: ['https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=800&auto=format&fit=crop&q=80'],
        tags: ['apple', 'fruits', 'organic', 'fresh', 'sweet'],
        rating: 4.9,
        reviewsCount: 110
      },
      {
        tenantId: fruitShop._id,
        name: 'Organic Alphonso Ratnagiri Mangoes (1 Dozen)',
        slug: 'organic-alphonso-ratnagiri-mangoes',
        description: 'Naturally ripened GI-tagged Ratnagiri Alphonso mangoes with rich saffron pulp and heavenly aroma.',
        price: 1199,
        comparePrice: 1499,
        category: 'Tropical & Seasonal',
        stock: 35,
        sku: 'FRT-MNG-002',
        isFeatured: true,
        images: ['https://images.unsplash.com/photo-1553279768-865429fa0078?w=800&auto=format&fit=crop&q=80'],
        tags: ['mango', 'alphonso', 'ratnagiri', 'tropical', 'fruits'],
        rating: 5.0,
        reviewsCount: 145
      },
      {
        tenantId: fruitShop._id,
        name: 'Fresh Granny Smith Green Apples (1kg)',
        slug: 'fresh-granny-smith-green-apples',
        description: 'Tangy, firm and extra-crisp green apples rich in dietary fiber and antioxidants, perfect for snacking or juices.',
        price: 289,
        comparePrice: 349,
        category: 'Apples & Pears',
        stock: 60,
        sku: 'FRT-APL-003',
        isFeatured: true,
        images: ['https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?w=800&auto=format&fit=crop&q=80'],
        tags: ['apple', 'green apple', 'tangy', 'organic', 'fruits'],
        rating: 4.8,
        reviewsCount: 68
      },
      {
        tenantId: fruitShop._id,
        name: 'Exotic Red Dragonfruit (Pack of 2)',
        slug: 'exotic-red-dragonfruit',
        description: 'Vibrant magenta flesh dragonfruit loaded with vitamin C, magnesium and prebiotic fiber for natural wellness.',
        price: 349,
        comparePrice: 429,
        category: 'Exotic Berries & Melons',
        stock: 40,
        sku: 'FRT-DRG-004',
        isFeatured: false,
        images: ['https://images.unsplash.com/photo-1527325678964-54921661f888?w=800&auto=format&fit=crop&q=80'],
        tags: ['dragonfruit', 'exotic', 'antioxidants', 'fruits'],
        rating: 4.7,
        reviewsCount: 44
      },
      {
        tenantId: fruitShop._id,
        name: 'Fresh Sweet Strawberries Box (500g)',
        slug: 'fresh-sweet-strawberries-box',
        description: 'Hand-sorted Mahabaleshwar strawberries bursting with natural sweetness and vibrant ruby red color.',
        price: 299,
        comparePrice: 379,
        category: 'Exotic Berries & Melons',
        stock: 50,
        sku: 'FRT-STR-005',
        isFeatured: true,
        images: ['https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=800&auto=format&fit=crop&q=80'],
        tags: ['strawberries', 'berries', 'fresh', 'organic'],
        rating: 4.9,
        reviewsCount: 92
      },
      {
        tenantId: fruitShop._id,
        name: 'Wild Organic Blueberries Punnet (250g)',
        slug: 'wild-organic-blueberries-punnet',
        description: 'Plump and juicy fresh blueberries packed with superfood antioxidants and natural brain-boosting nutrients.',
        price: 449,
        comparePrice: 549,
        category: 'Exotic Berries & Melons',
        stock: 35,
        sku: 'FRT-BLU-006',
        isFeatured: false,
        images: ['https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=800&auto=format&fit=crop&q=80'],
        tags: ['blueberries', 'superfood', 'berries', 'organic'],
        rating: 4.8,
        reviewsCount: 56
      }
    ];

    await Product.insertMany(fruitProducts);

    // =========================================================================
    // STORE 4: Poonam Dresses (Men's Fashion & Ethnic Wear)
    // =========================================================================
    const poonamDresses = await Tenant.create({
      name: 'Poonam Dresses',
      slug: 'poonam-dresses',
      domain: 'poonam-dresses.store',
      tagline: 'Exclusive Men\'s Ethnic Wear, Royal Sherwanis, Kurta Sets & Tuxedos',
      branding: {
        primaryColor: '#8b5cf6', // Royal Violet / Purple
        secondaryColor: '#7c3aed',
        accentColor: '#a78bfa',
        logoUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=100&auto=format&fit=crop&q=80',
        bannerText: '✨ Poonam Men\'s Collection: Royal Sherwanis, Kurta Sets & Tailored Tuxedos with Custom Stitching!'
      },
      plan: 'pro',
      status: 'active',
      currency: 'INR'
    });

    await User.create({
      name: 'Poonam Agarwal',
      email: 'owner@poonamdresses.com',
      password: 'Password123!',
      role: 'tenant_admin',
      tenantId: poonamDresses._id
    });

    await User.create({
      name: 'Rahul Mehra',
      email: 'customer@poonamdresses.com',
      password: 'Password123!',
      phone: '+91 98100 88776',
      role: 'customer',
      tenantId: poonamDresses._id,
      addresses: [
        {
          street: 'C-24, Civil Lines, Near Heritage Palace',
          city: 'Jaipur',
          state: 'Rajasthan',
          zipCode: '302006',
          country: 'India',
          isDefault: true
        }
      ]
    });

    const poonamProducts = [
      {
        tenantId: poonamDresses._id,
        name: 'Royal Ivory Silk Embroidered Groom Sherwani',
        slug: 'royal-ivory-silk-groom-sherwani',
        description: 'Imperial raw silk ivory sherwani crafted with intricate hand-embroidered zardozi and thread work, paired with churidar and royal stole.',
        price: 24999,
        comparePrice: 29999,
        category: 'Men\'s Sherwanis',
        stock: 12,
        sku: 'PNM-SHR-001',
        isFeatured: true,
        images: ['https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&auto=format&fit=crop&q=80'],
        tags: ['men', 'sherwani', 'groom', 'wedding', 'ethnic'],
        rating: 5.0,
        reviewsCount: 42
      },
      {
        tenantId: poonamDresses._id,
        name: 'Midnight Blue Italian Tuxedo 3-Piece Suit',
        slug: 'midnight-blue-italian-tuxedo-suit',
        description: 'Premium wool-blend 3-piece tuxedo with satin shawl lapel, matching waistcoat, and tailored slim-fit trousers.',
        price: 18499,
        comparePrice: 22999,
        category: 'Suits & Tuxedos',
        stock: 16,
        sku: 'PNM-SUT-002',
        isFeatured: true,
        images: ['https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&auto=format&fit=crop&q=80'],
        tags: ['men', 'tuxedo', 'suit', 'formal', 'blazer'],
        rating: 4.9,
        reviewsCount: 38
      },
      {
        tenantId: poonamDresses._id,
        name: 'Pure Cotton Lucknowi Chikankari Kurta Pajama Set',
        slug: 'lucknowi-chikankari-kurta-pajama-set',
        description: 'Breathable pure cotton pastel mint kurta featuring handcrafted Lucknowi Chikankari embroidery, paired with cotton churidar.',
        price: 4499,
        comparePrice: 5999,
        category: 'Kurta Sets',
        stock: 28,
        sku: 'PNM-KRT-003',
        isFeatured: true,
        images: ['https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=800&auto=format&fit=crop&q=80'],
        tags: ['men', 'kurta', 'chikankari', 'cotton', 'ethnic'],
        rating: 4.8,
        reviewsCount: 51
      },
      {
        tenantId: poonamDresses._id,
        name: 'Handcrafted Raw Silk Nehru Jacket / Bandhgala',
        slug: 'handcrafted-raw-silk-nehru-jacket',
        description: 'Structured Banarasi raw silk sleeveless Nehru jacket with metal buttons and chest pocket, ideal over formal kurtas.',
        price: 5999,
        comparePrice: 7499,
        category: 'Nehru Jackets',
        stock: 20,
        sku: 'PNM-JKT-004',
        isFeatured: true,
        images: ['https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=800&auto=format&fit=crop&q=80'],
        tags: ['men', 'nehru jacket', 'bandhgala', 'silk', 'waistcoat'],
        rating: 4.8,
        reviewsCount: 33
      },
      {
        tenantId: poonamDresses._id,
        name: 'Classic Slim-Fit Oxford Formal Shirt (Sky Blue)',
        slug: 'classic-slim-fit-oxford-formal-shirt',
        description: '100% Egyptian Giza long-staple cotton formal shirt with spread collar, mother-of-pearl buttons and wrinkle-resistant weave.',
        price: 2799,
        comparePrice: 3499,
        category: 'Shirts & Formals',
        stock: 35,
        sku: 'PNM-SHT-005',
        isFeatured: false,
        images: ['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80'],
        tags: ['men', 'shirt', 'formal', 'cotton', 'blue shirt'],
        rating: 4.7,
        reviewsCount: 29
      },
      {
        tenantId: poonamDresses._id,
        name: 'Tailored Stretch Chino Formal Trousers (Charcoal)',
        slug: 'tailored-stretch-chino-trousers',
        description: 'Modern tapered flat-front trousers woven with premium stretch-cotton twill for all-day comfort and sharp silhouette.',
        price: 2499,
        comparePrice: 3199,
        category: 'Pants & Trousers',
        stock: 30,
        sku: 'PNM-TRS-006',
        isFeatured: false,
        images: ['https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&auto=format&fit=crop&q=80'],
        tags: ['men', 'trousers', 'pants', 'chinos', 'formal'],
        rating: 4.8,
        reviewsCount: 45
      }
    ];

    await Product.insertMany(poonamProducts);

    // =========================================================================
    // STORE 5: Electronic Shop (Quantum Electronics & Gadgets)
    // =========================================================================
    const electronicShop = await Tenant.create({
      name: 'Quantum Electronics & Gadgets',
      slug: 'electronic-shop',
      domain: 'electronic-shop.store',
      tagline: 'Flagship Smartphones, Laptops, 4K TVs & Smart Audio',
      branding: {
        primaryColor: '#6366f1', // Electric Indigo
        secondaryColor: '#4f46e5',
        accentColor: '#818cf8',
        logoUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=100&auto=format&fit=crop&q=80',
        bannerText: '⚡ Tech Fest: Instant ₹5,000 Off on Laptops & Smartphones with Code TECHFEST!'
      },
      plan: 'enterprise',
      status: 'active',
      currency: 'INR'
    });

    await User.create({
      name: 'Arjun Singhal',
      email: 'owner@electronicshop.com',
      password: 'Password123!',
      role: 'tenant_admin',
      tenantId: electronicShop._id
    });

    await User.create({
      name: 'Tanmay Bhatt',
      email: 'customer@electronicshop.com',
      password: 'Password123!',
      phone: '+91 98700 66554',
      role: 'customer',
      tenantId: electronicShop._id,
      addresses: [
        {
          street: 'Tech Park Tower B, Cyber City',
          city: 'Gurugram',
          state: 'Haryana',
          zipCode: '122002',
          country: 'India',
          isDefault: true
        }
      ]
    });

    const electronicProducts = [
      {
        tenantId: electronicShop._id,
        name: 'Apple iPhone 15 Pro Max 256GB Titanium',
        slug: 'apple-iphone-15-pro-max',
        description: 'A17 Pro chip with 6-core GPU, aerospace-grade titanium design, 48MP main camera system with 5x telephoto optical zoom.',
        price: 134999,
        comparePrice: 149999,
        category: 'Smartphones',
        stock: 16,
        sku: 'ELE-IPH-001',
        isFeatured: true,
        images: ['https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80'],
        tags: ['apple', 'iphone', 'smartphone', 'titanium', 'electronics'],
        rating: 4.9,
        reviewsCount: 124
      },
      {
        tenantId: electronicShop._id,
        name: 'Ultra 4K OLED Smart TV 55" HDR10+',
        slug: 'ultra-4k-oled-smart-tv-55',
        description: 'Self-lit OLED pixels for infinite contrast, 120Hz refresh rate, Dolby Vision IQ, and Dolby Atmos 60W front firing speakers.',
        price: 68999,
        comparePrice: 84999,
        category: 'Smart TVs',
        stock: 10,
        sku: 'ELE-TV-002',
        isFeatured: true,
        images: ['https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&auto=format&fit=crop&q=80'],
        tags: ['tv', 'oled', '4k', 'smart tv', 'dolby'],
        rating: 4.8,
        reviewsCount: 48
      },
      {
        tenantId: electronicShop._id,
        name: 'ANC Wireless Over-Ear Studio Headphones',
        slug: 'anc-wireless-studio-headphones',
        description: 'Hybrid Active Noise Cancellation with 40mm custom drivers, transparency mode, spatial audio, and 45-hour battery life.',
        price: 24999,
        comparePrice: 29999,
        category: 'Audio & Sound',
        stock: 24,
        sku: 'ELE-HDP-003',
        isFeatured: true,
        images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80'],
        tags: ['headphones', 'anc', 'audio', 'wireless', 'music'],
        rating: 4.9,
        reviewsCount: 95
      },
      {
        tenantId: electronicShop._id,
        name: 'Blade 16 Gaming Laptop RTX 4080 (32GB / 1TB)',
        slug: 'blade-16-gaming-laptop-rtx-4080',
        description: 'Intel Core i9-14900HX, NVIDIA GeForce RTX 4080 12GB, 240Hz QHD+ mini-LED display, vapor chamber cooling and per-key RGB.',
        price: 189999,
        comparePrice: 219999,
        category: 'Computers & Laptops',
        stock: 8,
        sku: 'ELE-LPT-004',
        isFeatured: true,
        images: ['https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800&auto=format&fit=crop&q=80'],
        tags: ['laptop', 'gaming', 'rtx4080', 'intel', 'rgb'],
        rating: 4.9,
        reviewsCount: 32
      },
      {
        tenantId: electronicShop._id,
        name: 'Smart Fitness Watch Ultra 2 with Cellular',
        slug: 'smart-fitness-watch-ultra-2',
        description: 'Rugged titanium 49mm case, precision dual-frequency GPS, 3000 nits brightest display, ECG, and 72-hour battery in low power mode.',
        price: 29999,
        comparePrice: 34999,
        category: 'Wearables',
        stock: 20,
        sku: 'ELE-WTC-005',
        isFeatured: false,
        images: ['https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&auto=format&fit=crop&q=80'],
        tags: ['smartwatch', 'watch', 'wearable', 'fitness', 'gps'],
        rating: 4.8,
        reviewsCount: 67
      },
      {
        tenantId: electronicShop._id,
        name: 'RGB Hot-Swappable Mechanical Keyboard',
        slug: 'rgb-hot-swappable-mechanical-keyboard',
        description: '75% gasket mounted custom mechanical keyboard with factory-lubed linear switches, PBT keycaps and South-facing RGB LEDs.',
        price: 6499,
        comparePrice: 7999,
        category: 'Accessories',
        stock: 35,
        sku: 'ELE-KBD-006',
        isFeatured: false,
        images: ['https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80'],
        tags: ['keyboard', 'mechanical', 'rgb', 'gaming', 'gadgets'],
        rating: 4.9,
        reviewsCount: 58
      }
    ];

    await Product.insertMany(electronicProducts);

    // =========================================================================
    // GLOBAL PLATFORM COUPONS
    // =========================================================================
    await Coupon.create({
      code: 'WELCOME10',
      discountType: 'percentage',
      discountValue: 10,
      minPurchase: 500,
      maxDiscount: 2000,
      isActive: true,
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });

    await Coupon.create({
      code: 'POONAM20',
      discountType: 'percentage',
      discountValue: 20,
      minPurchase: 2000,
      maxDiscount: 5000,
      isActive: true,
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });

    await Coupon.create({
      code: 'FLAT500',
      discountType: 'fixed',
      discountValue: 500,
      minPurchase: 2500,
      maxDiscount: 500,
      isActive: true,
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });

    console.log('✅ All 5 requested stores successfully populated with rich catalogs and images!');
  } catch (error) {
    console.error('Error seeding data:', error);
  }
};

module.exports = seedData;
