const Tenant = require('../models/Tenant');

// @desc    Get all tenants (for platform overview / store directory / demo picker)
// @route   GET /api/tenants
// @access  Public
const getTenants = async (req, res, next) => {
  try {
    const tenants = await Tenant.find({ status: 'active' })
      .select('-settings.secretKey')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tenants.length,
      data: tenants
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single tenant by slug or ID
// @route   GET /api/tenants/:identifier
// @access  Public
const getTenant = async (req, res, next) => {
  try {
    const { identifier } = req.params;
    let tenant;

    if (/^[0-9a-fA-F]{24}$/.test(identifier)) {
      tenant = await Tenant.findById(identifier);
    }

    if (!tenant) {
      tenant = await Tenant.findOne({ slug: identifier.toLowerCase() });
    }

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: `Tenant '${identifier}' not found`
      });
    }

    res.status(200).json({
      success: true,
      data: tenant
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update tenant branding & settings
// @route   PUT /api/tenants/:id
// @access  Private (tenant_admin or superadmin)
const updateTenant = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, tagline, branding, currency, settings } = req.body;

    // Check authorization: must be superadmin or the tenant owner
    if (
      req.user.role !== 'superadmin' &&
      req.user.tenantId?.toString() !== id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this store settings'
      });
    }

    let tenant = await Tenant.findById(id);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    if (name) tenant.name = name;
    if (tagline) tenant.tagline = tagline;
    if (currency) tenant.currency = currency;
    if (branding) {
      const existingBranding = typeof tenant.branding?.toObject === 'function'
        ? tenant.branding.toObject()
        : (tenant.branding || {});
      tenant.branding = {
        ...existingBranding,
        ...branding
      };
    }
    if (settings) {
      const existingSettings = typeof tenant.settings?.toObject === 'function'
        ? tenant.settings.toObject()
        : (tenant.settings || {});
      tenant.settings = {
        ...existingSettings,
        ...settings
      };
    }

    await tenant.save();

    res.status(200).json({
      success: true,
      message: 'Store settings updated successfully',
      data: tenant
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getTenants, getTenant, updateTenant };
