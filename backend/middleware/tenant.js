const Tenant = require('../models/Tenant');

/**
 * Middleware to resolve tenant from headers, query, or user context
 */
const resolveTenant = async (req, res, next) => {
  try {
    let tenantIdentifier =
      req.headers['x-tenant-id'] ||
      req.headers['x-tenant-slug'] ||
      req.query.tenant ||
      req.params.tenantSlug;

    // If authenticated user has tenant and no header is given, use user's tenant
    if (!tenantIdentifier && req.user && req.user.tenantId) {
      tenantIdentifier = req.user.tenantId.toString();
    }

    if (tenantIdentifier) {
      let tenant;
      // Check if it looks like a valid Mongo ObjectId
      if (/^[0-9a-fA-F]{24}$/.test(tenantIdentifier)) {
        tenant = await Tenant.findById(tenantIdentifier);
      }
      
      // If not found by ID, try finding by slug
      if (!tenant) {
        tenant = await Tenant.findOne({ slug: tenantIdentifier.toLowerCase() });
      }

      if (tenant) {
        req.tenant = tenant;
        req.tenantId = tenant._id;
      }
    }

    next();
  } catch (error) {
    console.error('Tenant resolution error:', error);
    next(error);
  }
};

/**
 * Middleware that strictly enforces tenant context for tenant-scoped routes
 */
const requireTenant = (req, res, next) => {
  if (!req.tenant && !req.tenantId) {
    return res.status(400).json({
      success: false,
      message: 'Tenant context is required. Please provide x-tenant-id or x-tenant-slug header, or ?tenant query param.'
    });
  }

  // If user is authenticated and belongs to a specific tenant (and isn't superadmin),
  // verify they only access their own tenant
  if (req.user && req.user.role !== 'superadmin' && req.user.tenantId) {
    if (req.user.tenantId.toString() !== req.tenantId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to access data belonging to another tenant store.'
      });
    }
  }

  next();
};

module.exports = { resolveTenant, requireTenant };
