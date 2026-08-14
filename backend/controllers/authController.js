const Tenant = require('../models/Tenant');
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const {
  validateCustomerRegistration,
  validateVendorRegistration
} = require('../utils/validators');

// @desc    Register a new customer for a specific store/tenant
// @route   POST /api/auth/register-customer
// @access  Public
const registerCustomer = async (req, res, next) => {
  try {
    const { name, email, password, phone, tenantId, tenantSlug, address } = req.body;

    // Validate customer registration payload
    const validation = validateCustomerRegistration({ name, email, password, phone });
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.firstError,
        errors: validation.errors
      });
    }

    // Resolve target tenant
    let targetTenantId = tenantId || req.tenant?._id || req.headers['x-tenant-id'];

    if (!targetTenantId && tenantSlug) {
      const tenant = await Tenant.findOne({ slug: tenantSlug.toLowerCase() });
      if (tenant) {
        targetTenantId = tenant._id;
      }
    }

    if (!targetTenantId) {
      // Pick first active tenant as fallback
      const defaultTenant = await Tenant.findOne({ status: 'active' });
      if (defaultTenant) {
        targetTenantId = defaultTenant._id;
      }
    }

    const tenant = targetTenantId ? await Tenant.findById(targetTenantId) : null;
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Target store/tenant not found. Please select a valid store.'
      });
    }

    // Check if customer already exists for this tenant
    const existingUser = await User.findOne({
      email: email.toLowerCase().trim(),
      tenantId: tenant._id
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: `An account with email '${email}' already exists in ${tenant.name}. Please sign in instead.`
      });
    }

    // Create Customer User
    const addresses = address ? [address] : [];
    const customer = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      phone: phone ? phone.trim() : '',
      role: 'customer',
      tenantId: tenant._id,
      addresses
    });

    // Generate JWT token
    const token = generateToken(customer._id, tenant._id, customer.role);

    res.status(201).json({
      success: true,
      message: `Welcome to ${tenant.name}! Customer account created successfully.`,
      token,
      user: {
        id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        role: customer.role,
        tenantId: customer.tenantId
      },
      tenant: {
        id: tenant._id,
        name: tenant.name,
        slug: tenant.slug,
        branding: tenant.branding,
        plan: tenant.plan,
        tagline: tenant.tagline
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Register a new tenant store and owner/vendor account
// @route   POST /api/auth/register-vendor, POST /api/auth/register-tenant
// @access  Public
const registerVendor = async (req, res, next) => {
  try {
    const {
      storeName,
      storeSlug,
      ownerName,
      email,
      password,
      phone,
      primaryColor,
      tagline
    } = req.body;

    // Validate vendor registration payload
    const validation = validateVendorRegistration({
      storeName,
      ownerName,
      email,
      password,
      phone,
      primaryColor
    });
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.firstError,
        errors: validation.errors
      });
    }

    // Generate clean slug from storeName if not provided
    const slug = (
      storeSlug ||
      storeName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')
    ).replace(/^-|-$/g, '');

    if (slug.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Store slug generated from name must be at least 3 characters long.'
      });
    }

    // Check if tenant slug already exists
    const existingTenant = await Tenant.findOne({ slug });
    if (existingTenant) {
      return res.status(400).json({
        success: false,
        message: `Store slug '${slug}' is already taken. Please pick another store name.`
      });
    }

    // Check if vendor email is already registered
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: `An account with email '${email}' already exists. Please sign in or use another email.`
      });
    }

    // Create Tenant Store
    const tenant = await Tenant.create({
      name: storeName,
      slug,
      tagline: tagline || 'Curated premium products & fast delivery',
      branding: {
        primaryColor: primaryColor || '#6366f1',
        secondaryColor: '#a855f7',
        accentColor: '#ec4899',
        bannerText: `Welcome to ${storeName}! Free express delivery on your first order.`
      },
      plan: 'starter',
      status: 'active',
      currency: 'INR'
    });

    // Create Vendor Owner User (Role: tenant_admin)
    const user = await User.create({
      name: ownerName.trim(),
      email: email.toLowerCase().trim(),
      password,
      phone: phone || '',
      role: 'tenant_admin',
      tenantId: tenant._id
    });

    // Generate JWT token
    const token = generateToken(user._id, tenant._id, user.role);

    res.status(201).json({
      success: true,
      message: `Store '${tenant.name}' and Vendor Owner account created successfully!`,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        tenantId: user.tenantId
      },
      tenant: {
        id: tenant._id,
        name: tenant.name,
        slug: tenant.slug,
        branding: tenant.branding,
        plan: tenant.plan,
        tagline: tenant.tagline
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user (Vendor Owner, Staff, or Customer)
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password, tenantSlug, tenantId } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password'
      });
    }

    let targetTenantId = tenantId || req.tenant?._id || req.headers['x-tenant-id'];

    // If tenantSlug is provided, resolve tenantId
    if (!targetTenantId && tenantSlug) {
      const tenant = await Tenant.findOne({ slug: tenantSlug.toLowerCase() });
      if (tenant) {
        targetTenantId = tenant._id;
      }
    }

    // Search query
    let query = { email: email.toLowerCase().trim() };
    if (targetTenantId) {
      query.tenantId = targetTenantId;
    }

    let user = await User.findOne(query).select('+password').populate('tenantId');

    // If not found in specific tenant, try matching across all tenants (e.g. cross-store login or superadmin)
    if (!user && targetTenantId) {
      user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password').populate('tenantId');
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials or account does not exist'
      });
    }

    // Verify password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Resolve tenant document
    let tenantObj = null;
    if (user.tenantId) {
      tenantObj = typeof user.tenantId === 'object' && user.tenantId.name
        ? user.tenantId
        : await Tenant.findById(user.tenantId);
    }

    const token = generateToken(user._id, tenantObj?._id || user.tenantId, user.role);

    res.status(200).json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        role: user.role,
        avatar: user.avatar || '',
        addresses: user.addresses || [],
        tenantId: tenantObj?._id || user.tenantId
      },
      tenant: tenantObj
        ? {
            id: tenantObj._id,
            name: tenantObj.name,
            slug: tenantObj.slug,
            branding: tenantObj.branding,
            plan: tenantObj.plan,
            tagline: tenantObj.tagline
          }
        : null
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user & tenant details
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const user = req.user || (await User.findById(userId));
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let tenant = null;
    if (user.tenantId) {
      const tId = user.tenantId?._id || user.tenantId;
      tenant = await Tenant.findById(tId);
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        role: user.role,
        avatar: user.avatar || '',
        addresses: user.addresses || [],
        tenantId: user.tenantId ? (user.tenantId._id || user.tenantId) : null
      },
      tenant: tenant
        ? {
            id: tenant._id,
            name: tenant.name,
            slug: tenant.slug,
            branding: tenant.branding,
            plan: tenant.plan,
            tagline: tenant.tagline
          }
        : null
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile & addresses
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { name, phone, avatar, addresses } = req.body;
    const updateData = {};

    if (name) updateData.name = name.trim();
    if (phone !== undefined) updateData.phone = phone;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (addresses !== undefined) updateData.addresses = addresses;

    const user = await User.findByIdAndUpdate(userId, updateData, { new: true });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user?._id || userId,
        name: user?.name,
        email: user?.email,
        phone: user?.phone || '',
        role: user?.role,
        avatar: user?.avatar || '',
        addresses: user?.addresses || [],
        tenantId: user?.tenantId
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerCustomer,
  registerVendor,
  registerTenant: registerVendor, // Alias for backward compatibility
  login,
  getMe,
  updateProfile
};
