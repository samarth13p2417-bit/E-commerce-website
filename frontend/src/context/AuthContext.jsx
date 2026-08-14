import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // Load current user profile if token exists
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.user);
          }
        } catch (err) {
          console.error('Auth verification failed:', err);
          logout();
        }
      }
      setLoading(false);
    };

    loadUser();
  }, [token]);

  // Login handler
  const login = async (email, password, tenantSlug, tenantId) => {
    try {
      const res = await api.post('/auth/login', { email, password, tenantSlug, tenantId });
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);

        // If user belongs to a tenant, set active tenant ID as well
        if (res.data.user?.tenantId) {
          localStorage.setItem('activeTenantId', res.data.user.tenantId);
        }
        return { success: true, user: res.data.user, tenant: res.data.tenant, message: res.data.message };
      }
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Login failed. Please check credentials.'
      };
    }
  };

  // Register Customer handler (Shopper account for active store)
  const registerCustomer = async (formData) => {
    try {
      const res = await api.post('/auth/register-customer', formData);
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
        return { success: true, user: res.data.user, tenant: res.data.tenant, message: res.data.message };
      }
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Customer registration failed'
      };
    }
  };

  // Register Vendor / Tenant Store handler
  const registerVendor = async (formData) => {
    try {
      const res = await api.post('/auth/register-vendor', formData);
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
        if (res.data.tenant?.id) {
          localStorage.setItem('activeTenantId', res.data.tenant.id);
          localStorage.setItem('activeTenantSlug', res.data.tenant.slug);
        }
        return { success: true, user: res.data.user, tenant: res.data.tenant, message: res.data.message };
      }
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Vendor store registration failed'
      };
    }
  };

  // Update profile handler
  const updateProfile = async (profileData) => {
    try {
      const res = await api.put('/auth/profile', profileData);
      if (res.data.success) {
        setUser(res.data.user);
        return { success: true, user: res.data.user };
      }
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to update profile'
      };
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const isCustomer = user?.role === 'customer';
  const isTenantAdmin = user?.role === 'tenant_admin' || user?.role === 'superadmin';
  const isVendor = isTenantAdmin;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        registerCustomer,
        registerVendor,
        registerTenant: registerVendor, // backward compatible alias
        updateProfile,
        logout,
        isAuthenticated: !!user,
        isCustomer,
        isVendor,
        isTenantAdmin
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
