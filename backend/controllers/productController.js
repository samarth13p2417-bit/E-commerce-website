const Product = require('../models/Product');
const Category = require('../models/Category');

// @desc    Get all products for the resolved tenant
// @route   GET /api/products
// @access  Public (Tenant-scoped)
const getProducts = async (req, res, next) => {
  try {
    if (!req.tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant context required. Provide x-tenant-id or x-tenant-slug header.'
      });
    }

    const { category, search, sort, isFeatured } = req.query;

    const query = { tenantId: req.tenantId, status: 'active' };

    if (category && category !== 'All') {
      query.category = category;
    }

    if (isFeatured === 'true') {
      query.isFeatured = true;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    let productQuery = Product.find(query);

    if (sort === 'price-asc') {
      productQuery = productQuery.sort({ price: 1 });
    } else if (sort === 'price-desc') {
      productQuery = productQuery.sort({ price: -1 });
    } else if (sort === 'rating') {
      productQuery = productQuery.sort({ rating: -1 });
    } else {
      productQuery = productQuery.sort({ createdAt: -1 });
    }

    const products = await productQuery;

    res.status(200).json({
      success: true,
      count: products.length,
      tenantId: req.tenantId,
      data: products
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Public (Tenant-scoped)
const getProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const query = { _id: id };
    if (req.tenantId) {
      query.tenantId = req.tenantId;
    }

    const product = await Product.findOne(query);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found in this tenant store'
      });
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new product for the tenant
// @route   POST /api/products
// @access  Private (tenant_admin or tenant_staff)
const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      description,
      price,
      comparePrice,
      category,
      stock,
      sku,
      images,
      isFeatured,
      tags
    } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide product name and price'
      });
    }

    const tenantId = req.user.tenantId || req.tenantId;
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant context required to create a product'
      });
    }

    // Generate unique slug for this tenant
    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    let slug = baseSlug;
    let count = 1;
    while (await Product.findOne({ tenantId, slug })) {
      slug = `${baseSlug}-${count++}`;
    }

    const product = await Product.create({
      tenantId,
      name,
      slug,
      description,
      price: Number(price),
      comparePrice: comparePrice ? Number(comparePrice) : null,
      category: category || 'General',
      stock: stock !== undefined ? Number(stock) : 10,
      sku: sku || `SKU-${Date.now().toString().slice(-6)}`,
      images: images && images.length ? images : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80'],
      isFeatured: Boolean(isFeatured),
      tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()) : [])
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (tenant_admin, tenant_staff)
const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId || req.tenantId;

    let product = await Product.findOne({ _id: id, tenantId });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found in this tenant store'
      });
    }

    product = await Product.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (tenant_admin)
const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId || req.tenantId;

    const product = await Product.findOneAndDelete({ _id: id, tenantId });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or already deleted'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get categories for current tenant
// @route   GET /api/categories
// @access  Public (Tenant-scoped)
const getCategories = async (req, res, next) => {
  try {
    if (!req.tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant context required'
      });
    }

    // Get distinct categories from products and category collection
    const categoriesFromProducts = await Product.distinct('category', {
      tenantId: req.tenantId,
      status: 'active'
    });

    const definedCategories = await Category.find({ tenantId: req.tenantId });

    res.status(200).json({
      success: true,
      data: {
        productCategories: categoriesFromProducts,
        categories: definedCategories
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Seed sample products for an empty tenant store
// @route   POST /api/products/seed-starter
// @access  Public (Tenant-scoped)
const seedStarterProducts = async (req, res, next) => {
  try {
    if (!req.tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant context required'
      });
    }

    const Tenant = require('../models/Tenant');
    const tenant = await Tenant.findById(req.tenantId);
    const storeName = tenant ? tenant.name : 'Store';

    const starterItems = [
      {
        tenantId: req.tenantId,
        name: `${storeName} Signature Obsidian Edition`,
        slug: `${storeName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-signature-obsidian-${Date.now()}`,
        description: 'Flagship artisan edition crafted with premium materials, precision finish, and bespoke packaging.',
        price: 14999,
        comparePrice: 18999,
        category: 'Signature',
        stock: 30,
        sku: 'SIG-001',
        isFeatured: true,
        images: [
          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&auto=format&fit=crop&q=80'
        ],
        tags: ['signature', 'limited-edition', 'premium'],
        rating: 4.9,
        reviewsCount: 28
      },
      {
        tenantId: req.tenantId,
        name: `${storeName} Artisan Crafted Essential`,
        slug: `${storeName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-artisan-essential-${Date.now()}`,
        description: 'Handcrafted essential item designed for daily durability, modern ergonomics, and timeless aesthetic.',
        price: 6499,
        comparePrice: 7999,
        category: 'Essentials',
        stock: 45,
        sku: 'ESS-002',
        isFeatured: true,
        images: [
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&auto=format&fit=crop&q=80'
        ],
        tags: ['essential', 'artisan', 'handcrafted'],
        rating: 4.8,
        reviewsCount: 19
      },
      {
        tenantId: req.tenantId,
        name: `${storeName} Heritage Studio Collector Piece`,
        slug: `${storeName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-heritage-collector-${Date.now()}`,
        description: 'Collector series item celebrating artisan craftsmanship with numbered certificates and warranty.',
        price: 24999,
        comparePrice: 29999,
        category: 'Collector',
        stock: 15,
        sku: 'HRT-003',
        isFeatured: false,
        images: [
          'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1590736704728-f4730bb30770?w=800&auto=format&fit=crop&q=80'
        ],
        tags: ['heritage', 'collector', 'luxury'],
        rating: 5.0,
        reviewsCount: 34
      },
      {
        tenantId: req.tenantId,
        name: `${storeName} Minimalist Ergonomic Accessory`,
        slug: `${storeName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-minimalist-accessory-${Date.now()}`,
        description: 'Sleek anodized minimalist everyday accessory tailored for performance, travel, and clean aesthetics.',
        price: 3899,
        comparePrice: 4899,
        category: 'Accessories',
        stock: 60,
        sku: 'ACC-004',
        isFeatured: true,
        images: [
          'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&auto=format&fit=crop&q=80'
        ],
        tags: ['minimalist', 'accessory', 'lifestyle'],
        rating: 4.7,
        reviewsCount: 22
      }
    ];

    const created = await Product.insertMany(starterItems);

    res.status(201).json({
      success: true,
      message: `Seeded ${created.length} starter products for ${storeName}`,
      data: created
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  seedStarterProducts
};
